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
    category: str = Field(..., description="upper_half_sleeve, upper_full_sleeve, lower_body, full_body, outerwear")
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

