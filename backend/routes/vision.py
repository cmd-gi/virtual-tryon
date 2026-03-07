"""
Vision API routes — real-time demographic detection from the kiosk camera.
"""
import base64
import re
import json
from typing import Literal

import httpx
import google.auth
import google.auth.transport.requests
from google.oauth2 import service_account
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from config import settings

router = APIRouter(prefix="/vision", tags=["Vision"])


# ── Request / Response schemas ──────────────────────────────────────────────

class GenderDetectRequest(BaseModel):
    """Accepts a base64-encoded (or data-URL) image from the kiosk camera."""
    image: str = Field(..., description="Base64 encoded image or data URL from the kiosk camera")


class GenderDetectResponse(BaseModel):
    """Strict gender detection result."""
    detected_gender: Literal["Male", "Female", "Unisex"]


# ── Helpers ──────────────────────────────────────────────────────────────────

def _extract_base64(data: str):
    """Return (base64_str, mime_type) from a data URL or raw base64 string."""
    if data.startswith("data:"):
        match = re.match(r"data:([^;]+);base64,(.+)", data)
        if match:
            return match.group(2), match.group(1)
    return data, "image/jpeg"


def _get_credentials():
    """Load and refresh Google Cloud service-account credentials."""
    creds = service_account.Credentials.from_service_account_file(
        str(settings.GOOGLE_CREDENTIALS_PATH),
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )
    request = google.auth.transport.requests.Request()
    creds.refresh(request)
    return creds


def _build_endpoint() -> str:
    return (
        f"https://{settings.GOOGLE_LOCATION}-aiplatform.googleapis.com/v1/"
        f"projects/{settings.GOOGLE_PROJECT_ID}/locations/{settings.GOOGLE_LOCATION}/"
        f"publishers/google/models/gemini-2.0-flash-exp:generateContent"
    )


# ── Endpoint ─────────────────────────────────────────────────────────────────

GENDER_PROMPT = (
    "Analyze the person in this image and determine their apparent gender presentation. "
    "Reply with ONLY a valid JSON object — no markdown, no explanation, no extra text. "
    'The JSON must be exactly one of these three: {"detected_gender": "Male"}, '
    '{"detected_gender": "Female"}, or {"detected_gender": "Unisex"}.'
)


@router.post("/gender", response_model=GenderDetectResponse)
async def detect_gender(request: GenderDetectRequest) -> GenderDetectResponse:
    """
    Detect the apparent gender of the person captured by the kiosk camera.

    - **image**: Base64 encoded image or data URL.

    Returns `{"detected_gender": "Male" | "Female" | "Unisex"}`.
    """
    b64_data, mime_type = _extract_base64(request.image)

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": GENDER_PROMPT},
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": b64_data,
                        }
                    },
                ],
            }
        ],
        "generationConfig": {
            "responseModalities": ["TEXT"],
        },
    }

    try:
        creds = _get_credentials()
        endpoint = _build_endpoint()

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                endpoint,
                headers={
                    "Authorization": f"Bearer {creds.token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        if response.status_code != 200:
            print(f"[Vision Route] Upstream API Error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=502,
                detail=f"Vision API error: {response.status_code} — {response.text[:300]}",
            )

        result = response.json()

        # Extract text from the first candidate
        raw_text = ""
        candidates = result.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            for part in parts:
                if "text" in part:
                    raw_text = part["text"].strip()
                    break

        # Parse the JSON the model returned
        parsed = json.loads(raw_text)
        detected = parsed.get("detected_gender", "Unisex")

        # Normalise to one of the three allowed values
        if detected not in ("Male", "Female", "Unisex"):
            detected = "Unisex"

        return GenderDetectResponse(detected_gender=detected)

    except json.JSONDecodeError:
        # If the model didn't return valid JSON, default to Unisex
        return GenderDetectResponse(detected_gender="Unisex")
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[Vision Route] Raw upstream exception: {repr(exc)}")
        raise HTTPException(status_code=500, detail=f"Gender detection failed: {str(exc)}")
