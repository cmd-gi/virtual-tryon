"""
Configuration settings for the backend application.
"""
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Base paths
    BASE_DIR: Path = Path(__file__).parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    GARMENTS_DIR: Path = STORAGE_DIR / "garments"
    
    # Database
    DATABASE_URL: str = "sqlite:///./database/kiosk.db"
    
    # ComfyUI Integration (Vast.ai)
    COMFYUI_URL: str = "http://127.0.0.1:8188"
    COMFYUI_TOKEN: str = ""
    
    # API Settings
    API_PREFIX: str = "/api"
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # File upload limits
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Ensure directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.GARMENTS_DIR.mkdir(parents=True, exist_ok=True)
