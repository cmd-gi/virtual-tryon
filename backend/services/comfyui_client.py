"""
ComfyUI client service for FLUX.2 Klein 9B cloth swapping on Vast.ai.

HOW IT WORKS (end-to-end):
  1. Frontend captures a photo → sends it as a base64 data-URL to FastAPI.
  2. FastAPI looks up the selected garment's image path from SQLite.
  3. This client reads both images from disk (garment) / decodes from base64 (person).
  4. It HTTP-POSTs both as multipart uploads to the remote ComfyUI server
     (your cloud GPU instance).  ComfyUI saves them in its local /input folder.
  5. The workflow JSON is loaded, the two LoadImage nodes (76 & 81) are patched
     with the just-uploaded filenames, and the full workflow is submitted to
     ComfyUI's POST /prompt endpoint.
  6. We poll GET /history/{prompt_id} every 2 s until ComfyUI marks the job done.
  7. We download the output image via GET /view, encode it as base64, and return
     it to FastAPI which returns it to the frontend.
  8. The frontend decodes the base64 string and renders it as an <img> tag.

NOTHING needs to change in the ComfyUI workflow — the default prompt already
baked into Node 160 handles the cloth swap perfectly.
"""
import io
import json
import uuid
import time
import asyncio
import base64
from pathlib import Path
from typing import Tuple, Dict, Any, Optional
import httpx
try:
    from PIL import Image as PILImage
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

from config import settings


class ComfyUIClient:
    """Client for communicating with the external ComfyUI server (FLUX.2 Klein)."""

    def __init__(self):
        self.base_url = settings.COMFYUI_URL.rstrip("/")
        self.client_id = str(uuid.uuid4())
        # workflow_api.json lives in the project root (one level above /backend)
        self.workflow_path = settings.BASE_DIR.parent / "workflow_api.json"
        self.headers = {"Authorization": f"Bearer {settings.COMFYUI_TOKEN}"} if settings.COMFYUI_TOKEN else {}
        # Cache: local garment filename → ComfyUI uploaded filename (avoids re-uploading on every request)
        self._garment_cache: Dict[str, str] = {}

    # ------------------------------------------------------------------
    # Image helpers
    # ------------------------------------------------------------------

    def _read_image(self, image_data: str) -> Tuple[bytes, str]:
        """Convert a path, base64 data-URL, or raw base64 into (bytes, mime_type)."""
        if image_data.startswith("data:"):
            header, b64 = image_data.split(",", 1)
            mime = header.split(":")[1].split(";")[0]
            return base64.b64decode(b64), mime

        # DB-stored local path like /api/clothing/images/garment_xxxx.jpg
        if image_data.startswith("/api/clothing/images/"):
            filepath = settings.GARMENTS_DIR / image_data.split("/")[-1]
        elif image_data.startswith("/") or (len(image_data) > 2 and image_data[1] == ":"):
            filepath = Path(image_data)
        else:
            # Assume raw base64
            try:
                return base64.b64decode(image_data), "image/jpeg"
            except Exception:
                raise ValueError("Invalid image format provided")

        if filepath.exists():
            raw = filepath.read_bytes()
            mime = "image/png" if str(filepath).endswith(".png") else "image/jpeg"
            return raw, mime

        raise FileNotFoundError(f"Garment image not found on disk: {filepath}")

    def _compress_person_image(self, img_bytes: bytes, mime: str, max_dim: int = 768, quality: int = 85) -> Tuple[bytes, str]:
        """Resize + compress the webcam photo to reduce upload time over the tunnel."""
        if not PIL_AVAILABLE:
            return img_bytes, mime
        try:
            img = PILImage.open(io.BytesIO(img_bytes))
            # Downscale if larger than max_dim on either side
            w, h = img.size
            if max(w, h) > max_dim:
                scale = max_dim / max(w, h)
                img = img.resize((int(w * scale), int(h * scale)), PILImage.LANCZOS)
            buf = io.BytesIO()
            img.convert("RGB").save(buf, format="JPEG", quality=quality, optimize=True)
            compressed = buf.getvalue()
            ratio = len(img_bytes) / max(len(compressed), 1)
            print(f"  📦 Person image compressed {len(img_bytes)//1024}KB → {len(compressed)//1024}KB ({ratio:.1f}x)")
            return compressed, "image/jpeg"
        except Exception as e:
            print(f"  ⚠️ Compression skipped: {e}")
            return img_bytes, mime

    async def _upload_image(self, image_data: str, filename_prefix: str, compress: bool = False) -> str:
        """
        Upload an image to the remote ComfyUI server via POST /upload/image.
        ComfyUI saves it in its own /input folder and returns the filename.
        We use that filename when patching the LoadImage nodes in the workflow.
        """
        img_bytes, mime_type = self._read_image(image_data)
        if compress:
            img_bytes, mime_type = self._compress_person_image(img_bytes, mime_type)
        ext_map = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
        ext = ext_map.get(mime_type, ".jpg")
        filename = f"{filename_prefix}_{uuid.uuid4().hex[:8]}{ext}"

        async with httpx.AsyncClient(timeout=60.0, verify=False, headers=self.headers) as client:
            resp = await client.post(
                f"{self.base_url}/upload/image",
                data={"overwrite": "true"},
                files={"image": (filename, img_bytes, mime_type)},
            )
            resp.raise_for_status()
            return resp.json()["name"]

    async def _upload_garment_cached(self, garment_image: str) -> str:
        """Upload garment image only once; return cached ComfyUI filename on subsequent calls."""
        if garment_image in self._garment_cache:
            cached = self._garment_cache[garment_image]
            print(f"  ✅ Garment (cached) → {cached}")
            return cached
        fn = await self._upload_image(garment_image, "garment")
        self._garment_cache[garment_image] = fn
        print(f"  ✅ Garment (uploaded) → {fn}")
        return fn

    async def _download_image(self, filename: str, subfolder: str = "", img_type: str = "output") -> str:
        """
        Download the finished image from ComfyUI via GET /view.
        Returns a base64 Data-URL so the frontend can display it instantly
        without needing direct access to the GPU server.
        """
        async with httpx.AsyncClient(timeout=60.0, verify=False, headers=self.headers) as client:
            resp = await client.get(
                f"{self.base_url}/view",
                params={"filename": filename, "type": img_type, "subfolder": subfolder},
            )
            resp.raise_for_status()

        # Save a local copy for logging / history
        ext = ".jpg" if resp.content[:2] == b"\xff\xd8" else ".png"
        local_name = f"result_{uuid.uuid4().hex[:8]}{ext}"
        (settings.GARMENTS_DIR / local_name).write_bytes(resp.content)

        mime = "image/jpeg" if ext == ".jpg" else "image/png"
        b64 = base64.b64encode(resp.content).decode("utf-8")
        return f"data:{mime};base64,{b64}"

    # ------------------------------------------------------------------
    # Workflow conversion (UI graph → API prompt)
    # ------------------------------------------------------------------

    def _build_api_prompt(self, workflow_data: dict) -> dict:
        """
        Convert the ComfyUI *UI graph* JSON into the *API prompt* dict that
        POST /prompt expects:  { "<node_id>": { "class_type": "...", "inputs": {...} } }

        Wired connections become [src_node_id_str, output_slot_index].
        Widget values are embedded directly.
        """
        # Build link_id → (src_node_id, src_slot) lookup
        links_map: Dict[int, Tuple[int, int]] = {
            link[0]: (link[1], link[2])
            for link in workflow_data.get("links", [])
        }

        SKIP_TYPES = {"Note", "Label (rgthree)", "Image Comparer (rgthree)"}
        api_prompt: Dict[str, Any] = {}

        for node in workflow_data.get("nodes", []):
            if node.get("mode") == 4:           # disabled node
                continue
            class_type = node.get("type", "")
            if class_type in SKIP_TYPES:
                continue

            inputs: Dict[str, Any] = {}
            widget_values = node.get("widgets_values", [])
            widget_idx = 0

            for inp in node.get("inputs", []):
                name = inp.get("name", "")
                link_id = inp.get("link")
                if link_id is not None and link_id in links_map:
                    src_id, src_slot = links_map[link_id]
                    inputs[name] = [str(src_id), src_slot]
                elif "widget" in inp:
                    if widget_idx < len(widget_values):
                        inputs[name] = widget_values[widget_idx]
                        widget_idx += 1

            # Any remaining widget values (not covered by named inputs)
            for i, val in enumerate(widget_values[widget_idx:], start=widget_idx):
                inputs[f"__widget_{i}"] = val

            api_prompt[str(node["id"])] = {
                "class_type": class_type,
                "inputs": inputs,
                "_meta": {"title": node.get("title", class_type)},
            }

        return api_prompt

    # ------------------------------------------------------------------
    # Main entry point
    # ------------------------------------------------------------------

    async def generate_tryon(self, person_image: str, garment_image: str) -> dict:
        """
        Full FLUX.2 Klein cloth swap pipeline:
          upload images → patch workflow → submit → poll → download → return base64
        """
        start = time.time()

        try:
            # 1. Upload both images in PARALLEL to the remote ComfyUI GPU server
            print("\n" + "=" * 50)
            print("🚀 FLUX.2 Klein — uploading images to GPU server (parallel)...")
            t_upload = time.time()
            person_fn, garment_fn = await asyncio.gather(
                self._upload_image(person_image, "human", compress=True),
                self._upload_garment_cached(garment_image),
            )
            print(f"  ✅ Person  → {person_fn}")
            print(f"  ⏱️ Uploads done in {time.time() - t_upload:.1f}s")

            # 2. Load the API-format workflow
            with open(self.workflow_path, "r", encoding="utf-8") as f:
                api_prompt = json.load(f)

            # 3. Patch the pipeline with the uploaded filenames
            # Node 76 = Target Image (person)
            if "76" in api_prompt:
                api_prompt["76"]["inputs"]["image"] = person_fn

            # Node 81 = Clothing Reference Image (garment)
            if "81" in api_prompt:
                api_prompt["81"]["inputs"]["image"] = garment_fn

            # Randomise seed on every run (Node 145 = Seed Generator)
            if "145" in api_prompt:
                inputs_145 = api_prompt["145"]["inputs"]
                current_time = int(time.time() * 1000) % (2 ** 32)
                if "noise_seed" in inputs_145:
                    inputs_145["noise_seed"] = current_time
                elif "seed" in inputs_145:
                    inputs_145["seed"] = current_time

            print("  ✅ Workflow patched (nodes 76, 81, 145)")
            
            # Auto-detect ANY node that saves an image and use its ID for polling
            output_node_ids = []
            for nid, ndata in api_prompt.items():
                ctype = ndata.get("class_type", "")
                if ctype in ["SaveImage", "Image Saver Simple", "PreviewImage"]:
                    output_node_ids.append(str(nid))
            
            # If no output node found, inject a standard one connected to Node 103 (VAEDecode) to prevent errors
            if not output_node_ids and "103" in api_prompt:
                api_prompt["9999"] = {
                    "class_type": "SaveImage",
                    "inputs": {
                        "filename_prefix": "vton_result",
                        "images": ["103", 0]
                    }
                }
                output_node_ids.append("9999")
                print("  ⚠️ Injected standard SaveImage node (9999) to prevent 'no outputs' error")

            print("=" * 50 + "\n")

            # 4. Submit directly (already in API format)
            async with httpx.AsyncClient(timeout=30.0, verify=False, headers=self.headers) as client:
                submit_resp = await client.post(
                    f"{self.base_url}/prompt",
                    json={"prompt": api_prompt, "client_id": self.client_id},
                )
                if not submit_resp.is_success:
                    err = submit_resp.text
                    print(f"[ComfyUI] Prompt rejected: {err}")
                    return {"success": False, "error": f"ComfyUI rejected prompt: {err}", "tryon_result_image": None}

                prompt_id = submit_resp.json()["prompt_id"]
                print(f"[ComfyUI] Job queued — prompt_id: {prompt_id}")

            # 5. Poll /history every 2 s (max 3 min = 90 attempts)
            output_filename = output_subfolder = ""
            output_type = "output"

            async with httpx.AsyncClient(timeout=15.0, verify=False, headers=self.headers) as client:  # poll every 1s
                for attempt in range(90):
                    await asyncio.sleep(1)  # ⚡ reduced from 2s → 1s
                    try:
                        hist = (await client.get(f"{self.base_url}/history/{prompt_id}")).json()
                        if prompt_id in hist:
                            outputs = hist[prompt_id].get("outputs", {})
                            print(f"[ComfyUI] Output nodes in history: {list(outputs.keys())}")
                            for node_id in output_node_ids:
                                imgs = outputs.get(node_id, {}).get("images", [])
                                if imgs:
                                    output_filename = imgs[0]["filename"]
                                    output_subfolder = imgs[0].get("subfolder", "")
                                    output_type = imgs[0].get("type", "output")
                                    break
                            if output_filename:
                                break
                    except Exception as poll_err:
                        print(f"[ComfyUI] Poll {attempt + 1} error: {poll_err}")

            if not output_filename:
                return {
                    "success": False,
                    "error": "Timed out waiting for ComfyUI (3 min). Check your GPU instance.",
                    "tryon_result_image": None,
                }

            print(f"[ComfyUI] ✅ Output ready: {output_filename}")

            # 6. Download from GPU server → encode as base64 → return to frontend
            result_b64 = await self._download_image(output_filename, output_subfolder, output_type)
            elapsed = int((time.time() - start) * 1000)
            print(f"[ComfyUI] 🎉 Done in {elapsed / 1000:.1f}s")

            return {
                "success": True,
                "tryon_result_image": result_b64,
                "error": None,
                "processing_time_ms": elapsed,
            }

        except Exception as exc:
            elapsed = int((time.time() - start) * 1000)
            print(f"[ComfyUI] ❌ Error: {exc}")
            return {
                "success": False,
                "error": str(exc),
                "tryon_result_image": None,
                "processing_time_ms": elapsed,
            }


comfyui_client = ComfyUIClient()
