"""Routes module."""
from .tryon import router as tryon_router
from .clothing import router as clothing_router
from .vision import router as vision_router

__all__ = ["tryon_router", "clothing_router", "vision_router"]
