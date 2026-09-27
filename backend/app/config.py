import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "CloudVault – Cloud-Based Data Redundancy Removal System"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    # Database Settings
    # Supports PostgreSQL as standard, and SQLite for lightweight local dev/testing
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/cloudvault_db"
    )
    
    # Redundancy & Similarity Thresholds (Configurable)
    # Score >= 90: NEAR DUPLICATE (Reject)
    # Score 70 - 89: REVIEW REQUIRED (Manual Review Queue)
    # Score < 70: UNIQUE (Store)
    NEAR_DUPLICATE_THRESHOLD: float = 90.0
    REVIEW_THRESHOLD: float = 70.0
    
    # Security & CORS
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cloudvault-secure-random-secret-key-2026")
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
