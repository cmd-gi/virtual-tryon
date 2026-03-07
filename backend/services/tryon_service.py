"""
Virtual Try-On Service using Google Gemini 2.0 Flash Image model.
Extracted and refactored from the prototype implementation.
Uses raw HTTP requests to avoid SDK validation issues.
"""
import os
import base64
import time
import re
import json
from typing import Optional, Tuple
import httpx

import google.auth
import google.auth.transport.requests
from google.oauth2 import service_account

from config import settings


class TryOnService:
    """Service for generating virtual try-on images using Gemini AI."""
    
    # Comprehensive prompt for virtual try-on (preserved from prototype)
    TRYON_PROMPT = """You are an expert AI virtual try-on specialist with deep understanding of fashion, body proportions, and garment fitting. Generate a photorealistic image of the person in the FIRST image wearing the clothing from the SECOND image.

## GARMENT CLASSIFICATION (Analyze the clothing image first):
1. **Garment Type**: Identify if it's a TOP (shirt, blouse, jacket, sweater), BOTTOM (pants, skirt, shorts), or FULL OUTFIT (dress, jumpsuit, romper)
2. **Sleeve Style**: Detect sleeveless, tank top, cap sleeve, short sleeve, 3/4 sleeve, long sleeve, or no sleeves applicable
3. **Neckline**: Identify crew neck, V-neck, scoop neck, off-shoulder, halter, turtleneck, etc.
4. **Coverage Level**: Note low-cut, modest, cropped, full-length, etc.

## CRITICAL REQUIREMENTS:

### Face & Identity Preservation (HIGHEST PRIORITY):
- Keep the EXACT same face, facial features, expression, and skin tone
- Preserve the exact same hair style, color, and position
- Maintain identical makeup if present
- Keep any jewelry, piercings, or accessories on the face/ears/neck

### Pose & Body Position (DO NOT ALTER):
- Preserve the EXACT same body pose, angle, and positioning
- Keep arms, hands, and legs in the identical position
- Maintain the same body proportions and silhouette
- Do not change the camera angle or perspective

### Accurate Clothing Fit:
- Fit the garment naturally to the person's body shape and size
- Account for body curves, shoulder width, bust, waist, and hips
- Ensure realistic fabric draping based on pose and body contours
- Sleeves should follow arm positions accurately
- For tops: proper fit around shoulders, chest, and torso
- For bottoms: proper fit around waist, hips, and legs
- For dresses: unified fit from shoulders to hem

### Skin Exposure Handling:
- For SLEEVELESS garments: Show natural skin on arms matching person's skin tone
- For tank tops/halter necks: Properly expose shoulders and upper arms
- For low necklines: Show appropriate skin on chest/décolletage area
- Match exposed skin texture, tone, and any visible freckles/moles consistently
- Ensure seamless transition between garment edges and exposed skin

### Realistic Rendering:
- Apply lighting and shadows consistent with the original photo
- Create natural fabric texture, wrinkles, and folds
- Ensure colors appear as they would in real-world lighting
- Add proper garment shadows on the body

### Background & Environment:
- Keep the EXACT same background, unchanged
- Maintain all environmental elements

## OUTPUT:
Generate ONLY the final photorealistic try-on image with no text, watermarks, or annotations."""

    def __init__(self):
        """Initialize the try-on service with Google AI credentials."""
        self._credentials = None
        self._api_endpoint = None
    
    def _get_credentials(self):
        """Get or refresh Google Cloud credentials."""
        if self._credentials is None:
            self._credentials = service_account.Credentials.from_service_account_file(
                str(settings.GOOGLE_CREDENTIALS_PATH),
                scopes=["https://www.googleapis.com/auth/cloud-platform"],
            )
        
        # Refresh if needed
        if self._credentials.expired:
            request = google.auth.transport.requests.Request()
            self._credentials.refresh(request)
        
        return self._credentials
    
    def _get_api_endpoint(self) -> str:
        """Get the Vertex AI endpoint URL."""
        if self._api_endpoint is None:
            self._api_endpoint = (
                f"https://{settings.GOOGLE_LOCATION}-aiplatform.googleapis.com/v1/"
                f"projects/{settings.GOOGLE_PROJECT_ID}/locations/{settings.GOOGLE_LOCATION}/"
                f"publishers/google/models/gemini-2.0-flash-exp:generateContent"
            )
        return self._api_endpoint
    
    def _decode_base64_image(self, data: str) -> Tuple[bytes, str]:
        """
        Decode a base64 image string to bytes and mime type.
        Handles both data URLs and raw base64.
        """
        # Check if it's a data URL
        if data.startswith("data:"):
            # Extract mime type and base64 data
            match = re.match(r"data:([^;]+);base64,(.+)", data)
            if match:
                mime_type = match.group(1)
                base64_data = match.group(2)
                return base64.b64decode(base64_data), mime_type
        
        # Assume raw base64, default to JPEG
        return base64.b64decode(data), "image/jpeg"
    
    async def _fetch_image_from_url(self, url: str) -> Tuple[bytes, str]:
        """Fetch an image from a URL and return bytes and mime type."""
        async with httpx.AsyncClient() as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()
            
            # Get mime type from content-type header or default to JPEG
            content_type = response.headers.get("content-type", "image/jpeg")
            mime_type = content_type.split(";")[0].strip()
            
            return response.content, mime_type
    
    async def _prepare_image(self, image_data: str) -> Tuple[bytes, str]:
        """
        Prepare an image for the API, handling both base64 and URLs.
        Returns (image_bytes, mime_type).
        """
        # Check if it's a URL
        if image_data.startswith(("http://", "https://")):
            return await self._fetch_image_from_url(image_data)
        
        # Otherwise, treat as base64
        return self._decode_base64_image(image_data)
    
    async def generate_tryon(
        self,
        person_image: str,
        garment_image: str,
        session_id: Optional[str] = None,
        clothing_name: Optional[str] = None,
        clothing_category: Optional[str] = None,
        clothing_style: Optional[str] = None,
        gender_target: Optional[str] = None,
    ) -> dict:
        """
        Generate a virtual try-on image.
        
        Args:
            person_image: Base64 encoded person image or data URL
            garment_image: Base64 encoded garment image, data URL, or URL
            session_id: Optional session ID for logging
        
        Returns:
            dict with 'success', 'tryon_result_image', 'error', 'processing_time_ms'
        """
        start_time = time.time()

        # Build dynamic prompt from clothing metadata if provided
        style_label = clothing_style or "stylish"
        category_label = clothing_category or "garment"
        name_label = clothing_name or "the selected item"
        gender_label = gender_target or "the wearer"

        metadata_context = (
            f"\n\n## CLOTHING DETAILS:\n"
            f"- Item: {name_label}\n"
            f"- Category: {category_label}\n"
            f"- Style: {style_label}\n"
            f"- Gender Target: {gender_label}\n"
        )

        strict_constraints = (
            f"\n\n## Strict Constraints:\n"
            f"1. User identity, facial features, and skin tone MUST remain strictly unchanged.\n"
            f"2. Keep the exact same body pose, camera angle, and background.\n"
            f"3. Drape the {style_label} {category_label} naturally over the subject."
        )

        dynamic_prompt = self.TRYON_PROMPT + metadata_context + strict_constraints

        try:
            # Prepare images
            person_bytes, person_mime = await self._prepare_image(person_image)
            garment_bytes, garment_mime = await self._prepare_image(garment_image)
            
            # Get credentials and endpoint
            credentials = self._get_credentials()
            endpoint = self._get_api_endpoint()
            
            # Build request body
            request_body = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": dynamic_prompt},
                            {
                                "inlineData": {
                                    "mimeType": person_mime,
                                    "data": base64.b64encode(person_bytes).decode("utf-8"),
                                }
                            },
                            {
                                "inlineData": {
                                    "mimeType": garment_mime,
                                    "data": base64.b64encode(garment_bytes).decode("utf-8"),
                                }
                            },
                        ],
                    }
                ],
                "generationConfig": {
                    "responseModalities": ["TEXT", "IMAGE"],
                },
            }
            
            # Make request
            async with httpx.AsyncClient(timeout=120.0) as client:
                # Refresh credentials
                request = google.auth.transport.requests.Request()
                self._credentials.refresh(request)
                
                response = await client.post(
                    endpoint,
                    headers={
                        "Authorization": f"Bearer {credentials.token}",
                        "Content-Type": "application/json",
                    },
                    json=request_body,
                )
            
            processing_time = int((time.time() - start_time) * 1000)
            
            if response.status_code != 200:
                error_detail = response.text
                print(f"[TryOnService] API Error: {response.status_code} - {error_detail}")
                return {
                    "success": False,
                    "tryon_result_image": None,
                    "error": f"API Error: {response.status_code}",
                    "processing_time_ms": processing_time,
                }
            
            # Parse response
            result = response.json()
            
            # Extract generated image
            generated_image = None
            
            if "candidates" in result and len(result["candidates"]) > 0:
                candidate = result["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    for part in candidate["content"]["parts"]:
                        if "inlineData" in part:
                            inline_data = part["inlineData"]
                            mime_type = inline_data.get("mimeType", "image/png")
                            image_data = inline_data.get("data", "")
                            generated_image = f"data:{mime_type};base64,{image_data}"
                            break
            
            if not generated_image:
                # Try to get text response for debugging
                text_response = "No response generated"
                if "candidates" in result and len(result["candidates"]) > 0:
                    candidate = result["candidates"][0]
                    if "content" in candidate and "parts" in candidate["content"]:
                        for part in candidate["content"]["parts"]:
                            if "text" in part:
                                text_response = part["text"]
                                break
                
                print(f"[TryOnService] No image generated. Text response: {text_response}")
                
                return {
                    "success": False,
                    "tryon_result_image": None,
                    "error": f"Model returned text instead of image: {text_response[:200]}",
                    "processing_time_ms": processing_time,
                }
            
            # Log usage
            if "usageMetadata" in result:
                usage = result["usageMetadata"]
                print(f"\n=== 💰 USAGE & COST ESTIMATE ===")
                print(f"Session: {session_id}")
                print(f"Input tokens: {usage.get('promptTokenCount', 0)}")
                print(f"Output tokens: {usage.get('candidatesTokenCount', 0)}")
                print(f"Processing time: {processing_time}ms")
                print(f"================================\n")
            
            return {
                "success": True,
                "tryon_result_image": generated_image,
                "error": None,
                "processing_time_ms": processing_time,
            }
            
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            error_message = str(e)
            
            print(f"[TryOnService] Error: {error_message}")
            
            # Handle specific errors
            if "PERMISSION_DENIED" in error_message:
                error_message = "Permission denied. Make sure the service account has 'Vertex AI User' role."
            elif "SAFETY" in error_message:
                error_message = "Request blocked by safety filters. Please try different images."
            elif "NOT_FOUND" in error_message:
                error_message = "Model not found. Make sure Vertex AI API is enabled."
            
            return {
                "success": False,
                "tryon_result_image": None,
                "error": error_message,
                "processing_time_ms": processing_time,
            }


# Singleton instance
tryon_service = TryOnService()
