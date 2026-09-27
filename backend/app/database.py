import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.config import settings
from backend.app.utils.logger import logger

db_url = settings.DATABASE_URL

# For SQLite compatibility in local environments without Postgres running
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(db_url, connect_args=connect_args)
    # Test connection
    with engine.connect() as conn:
        logger.info(f"Connected to database: {db_url.split('@')[-1] if '@' in db_url else db_url}")
except Exception as e:
    # If postgres is not running locally and not explicitly in production, fallback to SQLite
    if "postgresql" in db_url and settings.ENVIRONMENT != "production":
        fallback_url = "sqlite:///./cloudvault.db"
        logger.warning(
            f"Could not connect to PostgreSQL at {db_url}. "
            f"Falling back to local SQLite ({fallback_url}) for local development: {e}"
        )
        engine = create_engine(fallback_url, connect_args={"check_same_thread": False})
    else:
        logger.error(f"Database connection failed: {e}")
        raise e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency that provides a database session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
