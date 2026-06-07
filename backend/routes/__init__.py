"""Routes module."""
from .clothing import router as clothing_router
from .tryon import router as tryon_router

__all__ = ["clothing_router", "tryon_router"]
