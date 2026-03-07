"""
Try-On API routes.
"""
from fastapi import APIRouter, HTTPException
from schemas import TryOnRequest, TryOnResponse
from services import TryOnService

router = APIRouter(prefix="/tryon", tags=["Try-On"])

# Service instance
tryon_service = TryOnService()


@router.post("", response_model=TryOnResponse)
async def generate_tryon(request: TryOnRequest) -> TryOnResponse:
    """
    Generate a virtual try-on image.
    
    Takes a person image and a garment image, returns the person
    wearing the garment.
    
    - **person_image**: Base64 encoded person image
    - **garment_image**: Base64 encoded garment image or URL
    - **session_id**: Optional session ID for tracking
    """
    result = await tryon_service.generate_tryon(
        person_image=request.person_image,
        garment_image=request.garment_image,
        session_id=request.session_id,
        clothing_name=request.clothing_name,
        clothing_category=request.clothing_category,
        clothing_style=request.clothing_style,
        gender_target=request.gender_target,
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Failed to generate try-on image"),
        )
    
    return TryOnResponse(
        success=result["success"],
        tryon_result_image=result["tryon_result_image"],
        error=result.get("error"),
        processing_time_ms=result.get("processing_time_ms"),
    )
