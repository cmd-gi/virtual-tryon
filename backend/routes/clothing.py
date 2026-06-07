"""
Clothing management API routes.
"""
import os
import base64
import uuid
from typing import Optional, List
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, ClothingItem
from schemas import (
    ClothingCreate,
    ClothingUpdate,
    ClothingResponse,
    ClothingListResponse,
)
from config import settings

router = APIRouter(prefix="/clothing", tags=["Clothing"])


def _save_image(image_data: str, prefix: str) -> str:
    """
    Save a base64 image to storage and return the relative path.
    If already a URL or path, return as-is.
    """
    # If it's a URL, return as-is
    if image_data.startswith(("http://", "https://")):
        return image_data
    
    # If it's already a path, return as-is
    if not image_data.startswith("data:"):
        return image_data
    
    # Extract base64 data and mime type
    try:
        header, base64_data = image_data.split(",", 1)
        mime_type = header.split(":")[1].split(";")[0]
        
        # Determine extension
        ext_map = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
        }
        ext = ext_map.get(mime_type, ".jpg")
        
        # Generate unique filename
        filename = f"{prefix}_{uuid.uuid4().hex[:8]}{ext}"
        filepath = settings.GARMENTS_DIR / filename
        
        # Decode and save
        image_bytes = base64.b64decode(base64_data)
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        
        return f"/api/clothing/images/{filename}"
        
    except Exception as e:
        print(f"Error saving image: {e}")
        return image_data


def _delete_image(image_path: str) -> None:
    """Delete an image file if it's a local path."""
    if image_path.startswith("/api/clothing/images/"):
        filename = image_path.split("/")[-1]
        filepath = settings.GARMENTS_DIR / filename
        if filepath.exists():
            filepath.unlink()


@router.get("/images/{filename}")
async def get_image(filename: str):
    """Serve a garment image file."""
    filepath = settings.GARMENTS_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(filepath)


@router.get("", response_model=ClothingListResponse)
async def list_clothing(
    occasion: Optional[str] = None,
    style: Optional[str] = None,
    gender: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
) -> ClothingListResponse:
    """
    List all clothing items with optional filters.
    
    - **occasion**: Filter by occasion (business, casual, party, date)
    - **style**: Filter by style (classic, modern, minimalist, bohemian)
    - **gender**: Filter by gender (male, female, unisex)
    - **category**: Filter by category (shirt, pant, jacket, etc.)
    """
    query = db.query(ClothingItem)
    
    if occasion:
        query = query.filter(ClothingItem.occasion == occasion)
    if style:
        query = query.filter(ClothingItem.style == style)
    if gender:
        query = query.filter(func.lower(ClothingItem.gender).in_([gender.lower(), "unisex"]))
    if category:
        query = query.filter(ClothingItem.category == category)
    
    items = query.all()
    
    return ClothingListResponse(
        items=[ClothingResponse.model_validate(item) for item in items],
        total=len(items),
    )


@router.get("/recommendations")
async def get_recommendations(
    occasion: Optional[str] = None,
    style: Optional[str] = None,
    gender: Optional[str] = None,
    limit: int = 6,
    db: Session = Depends(get_db),
) -> ClothingListResponse:
    """
    Get clothing recommendations based on occasion, style, and gender.
    Used by the kiosk to show curated outfits.
    """
    query = db.query(ClothingItem)
    
    if occasion:
        query = query.filter(ClothingItem.occasion == occasion)
    if style:
        query = query.filter(ClothingItem.style == style)
    if gender:
        query = query.filter(func.lower(ClothingItem.gender).in_([gender.lower(), "unisex"]))
    
    # If no exact matches, get similar items
    items = query.limit(limit).all()
    
    if len(items) < limit:
        # Fallback: get any items to fill the list (deduplicated)
        existing_ids = {item.id for item in items}
        fallback_query = db.query(ClothingItem)
        if gender:
            fallback_query = fallback_query.filter(func.lower(ClothingItem.gender).in_([gender.lower(), "unisex"]))

        if occasion:
            fallback_query = fallback_query.filter(ClothingItem.occasion == occasion)
        elif style:
            fallback_query = fallback_query.filter(ClothingItem.style == style)

        for fb_item in fallback_query.limit(limit * 2).all():
            if fb_item.id not in existing_ids and len(items) < limit:
                items.append(fb_item)
                existing_ids.add(fb_item.id)

    # Still not enough? Get any items of matched gender (deduplicated)
    if len(items) < limit:
        existing_ids = {item.id for item in items}
        more_query = db.query(ClothingItem)
        if gender:
            more_query = more_query.filter(func.lower(ClothingItem.gender).in_([gender.lower(), "unisex"]))

        for more_item in more_query.limit(limit * 2).all():
            if more_item.id not in existing_ids and len(items) < limit:
                items.append(more_item)
                existing_ids.add(more_item.id)
    
    return ClothingListResponse(
        items=[ClothingResponse.model_validate(item) for item in items],
        total=len(items),
    )


@router.get("/{item_id}", response_model=ClothingResponse)
async def get_clothing(
    item_id: str,
    db: Session = Depends(get_db),
) -> ClothingResponse:
    """Get a single clothing item by ID."""
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    return ClothingResponse.model_validate(item)


@router.post("", response_model=ClothingResponse)
async def create_clothing(
    clothing: ClothingCreate,
    db: Session = Depends(get_db),
) -> ClothingResponse:
    """Create a new clothing item."""
    # Save images
    garment_path = _save_image(clothing.garment_image, "garment")
    preview_path = _save_image(clothing.preview_image, "preview")
    
    # Create item
    item = ClothingItem(
        name=clothing.name,
        category=clothing.category,
        occasion=clothing.occasion,
        style=clothing.style,
        gender=clothing.gender,
        garment_image=garment_path,
        preview_image=preview_path,
        description=clothing.description,
        price=clothing.price,
    )
    
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return ClothingResponse.model_validate(item)


@router.put("/{item_id}", response_model=ClothingResponse)
async def update_clothing(
    item_id: str,
    clothing: ClothingUpdate,
    db: Session = Depends(get_db),
) -> ClothingResponse:
    """Update a clothing item."""
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    
    # Update fields
    update_data = clothing.model_dump(exclude_unset=True)
    
    # Handle image updates
    if "garment_image" in update_data and update_data["garment_image"]:
        _delete_image(item.garment_image)
        update_data["garment_image"] = _save_image(update_data["garment_image"], "garment")
    
    if "preview_image" in update_data and update_data["preview_image"]:
        _delete_image(item.preview_image)
        update_data["preview_image"] = _save_image(update_data["preview_image"], "preview")
    
    if "category" in update_data:
        # Remove dino_prompt from update if accidentally included
        update_data.pop("dino_prompt", None)
    
    for key, value in update_data.items():
        setattr(item, key, value)
    
    db.commit()
    db.refresh(item)
    
    return ClothingResponse.model_validate(item)


@router.delete("/{item_id}")
async def delete_clothing(
    item_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Delete a clothing item."""
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    
    # Delete images
    _delete_image(item.garment_image)
    _delete_image(item.preview_image)
    
    # Delete from database
    db.delete(item)
    db.commit()
    
    return {"success": True, "message": "Clothing item deleted"}

