"""
SQLAlchemy ORM models for the database.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def generate_uuid() -> str:
    """Generate a UUID string."""
    return str(uuid.uuid4())


class ClothingItem(Base):
    """Model for clothing items in the catalog."""
    
    __tablename__ = "clothing_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)  # shirt, pant, jacket, kurta, saree, dress, etc.
    occasion = Column(String(50), nullable=False)  # business, casual, party, date
    style = Column(String(50), nullable=False)     # classic, modern, minimalist, bohemian
    gender = Column(String(20), nullable=False)    # male, female, unisex
    garment_image = Column(String(500), nullable=False)  # Path/URL for try-on
    preview_image = Column(String(500), nullable=False)  # Path/URL for UI display
    description = Column(Text, nullable=True)
    price = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> dict:
        """Convert model to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "occasion": self.occasion,
            "style": self.style,
            "gender": self.gender,
            "garment_image": self.garment_image,
            "preview_image": self.preview_image,
            "description": self.description,
            "price": self.price,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
