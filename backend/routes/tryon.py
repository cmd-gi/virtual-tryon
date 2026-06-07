"""
Try-On API routes — FLUX.2 Klein 9B cloth swap.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db, ClothingItem
from services.comfyui_client import comfyui_client

router = APIRouter(prefix="/try-on", tags=["Try-On"])


class TryOnRequest(BaseModel):
    person_image: str = Field(..., description="Base64 encoded person image from frontend")
    garment_id: str = Field(..., description="ID of the selected garment from the database")


class TryOnResponse(BaseModel):
    success: bool
    tryon_result_image: str | None = Field(None, description="Base64 encoded result image")
    error: str | None = None
    processing_time_ms: int | None = None


@router.post("", response_model=TryOnResponse)
async def generate_tryon(
    request: TryOnRequest,
    db: Session = Depends(get_db)
) -> TryOnResponse:
    """
    Generate a virtual try-on image using FLUX.2 Klein via ComfyUI.
    Only needs the person image (from webcam) and the garment ID (from DB).
    """

    # 1. Fetch garment image path from DB
    garment = db.query(ClothingItem).filter(ClothingItem.id == request.garment_id).first()
    if not garment:
        raise HTTPException(status_code=404, detail="Selected garment not found in database")

    garment_image_path = garment.garment_image

    print("\n" + "=" * 50)
    print(f"👕 FLUX.2 Klein TRYON REQUEST")
    print(f"Garment ID    : {request.garment_id}")
    print(f"Garment Image : {garment_image_path}")
    print(f"Person Image  : {len(request.person_image)} chars (base64)")
    print("=" * 50 + "\n")

    # 2. Send to ComfyUI — just the two images, no extra prompts needed
    result = await comfyui_client.generate_tryon(
        person_image=request.person_image,
        garment_image=garment_image_path,
    )

    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "ComfyUI generation failed"),
        )

    return TryOnResponse(
        success=result["success"],
        tryon_result_image=result["tryon_result_image"],
        error=result.get("error"),
        processing_time_ms=result.get("processing_time_ms"),
    )
