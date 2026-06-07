"""
FastAPI Backend for Virtual Try-On Kiosk
Main application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from config import settings
from database import init_db, get_db, ClothingItem
from routes import clothing_router, tryon_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("🚀 Starting Virtual Try-On Backend...")
    init_db()
    print("✅ Database initialized")
    print(f"📁 Storage directory: {settings.STORAGE_DIR}")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title="Virtual Try-On Kiosk API",
    description="Backend API for the virtual try-on kiosk application",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(clothing_router, prefix=settings.API_PREFIX)
app.include_router(tryon_router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Virtual Try-On Kiosk API",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
        "storage": str(settings.STORAGE_DIR),
    }

@app.get("/api/garments/{item_id}/vton-params")
async def get_garment_vton_params(item_id: str, db: Session = Depends(get_db)):
    """
    Get the specific ComfyUI IDM-VTON payload parameters for this garment.
    Called by the kiosk at runtime to feed parameters directly.
    """
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Garment not found")
        
    return {
        "dino_prompt": item.dino_prompt,
        "garment_description": item.garment_description
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
    # trigger reload 2
