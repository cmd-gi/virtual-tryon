"""
Database connection and session management.
"""
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from config import settings

# Ensure database directory exists
db_path = Path(settings.DATABASE_URL.replace("sqlite:///", ""))
db_path.parent.mkdir(parents=True, exist_ok=True)

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite specific
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize the database by creating all tables."""
    from .models import Base
    Base.metadata.create_all(bind=engine)
