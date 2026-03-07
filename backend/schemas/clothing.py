"""
Pydantic schemas for request/response validation.
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


# ============== Clothing Schemas ==============

class ClothingBase(BaseModel):
    """Base schema for clothing items."""
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., description="shirt, pant, jacket, kurta, saree, dress, etc.")
    occasion: str = Field(..., description="business, casual, party, date")
    style: str = Field(..., description="classic, modern, minimalist, bohemian")
    gender: str = Field(..., description="male, female, unisex")
    description: Optional[str] = None
    price: Optional[str] = None


class ClothingCreate(ClothingBase):
    """Schema for creating a new clothing item."""
    garment_image: str = Field(..., description="Base64 encoded garment image or URL")
    preview_image: str = Field(..., description="Base64 encoded preview image or URL")


class ClothingUpdate(BaseModel):
    """Schema for updating a clothing item."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = None
    occasion: Optional[str] = None
    style: Optional[str] = None
    gender: Optional[str] = None
    garment_image: Optional[str] = None
    preview_image: Optional[str] = None
    description: Optional[str] = None
    price: Optional[str] = None


class ClothingResponse(ClothingBase):
    """Schema for clothing item response."""
    id: str
    garment_image: str
    preview_image: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ClothingListResponse(BaseModel):
    """Schema for list of clothing items."""
    items: List[ClothingResponse]
    total: int


# ============== Try-On Schemas ==============

class TryOnRequest(BaseModel):
    """Schema for try-on request."""
    person_image: str = Field(..., description="Base64 encoded person image")
    garment_image: str = Field(..., description="Base64 encoded garment image or URL")
    session_id: Optional[str] = Field(None, description="Session ID for tracking")

    # Optional clothing metadata — used for dynamic prompt injection
    clothing_name: Optional[str] = Field(None, description="Name of the clothing item")
    clothing_category: Optional[str] = Field(None, description="Category, e.g. shirt, pant, dress")
    clothing_style: Optional[str] = Field(None, description="Style, e.g. classic, modern, minimalist")
    gender_target: Optional[str] = Field(None, description="Intended gender audience: male, female, unisex")


class TryOnResponse(BaseModel):
    """Schema for try-on response."""
    success: bool
    tryon_result_image: Optional[str] = Field(None, description="Base64 encoded result image")
    error: Optional[str] = None
    processing_time_ms: Optional[int] = None
