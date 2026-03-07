"""
FastAPI Backend for Virtual Try-On Kiosk
Main application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from routes import tryon_router, clothing_router, vision_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("🚀 Starting Virtual Try-On Backend...")
    init_db()
    print("✅ Database initialized")
    print(f"📁 Storage directory: {settings.STORAGE_DIR}")
    print(f"🔑 Credentials path: {settings.GOOGLE_CREDENTIALS_PATH}")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title="Virtual Try-On Kiosk API",
    description="Backend API for the AI-powered virtual try-on kiosk application",
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
app.include_router(tryon_router, prefix=settings.API_PREFIX)
app.include_router(clothing_router, prefix=settings.API_PREFIX)
app.include_router(vision_router, prefix=settings.API_PREFIX)


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
