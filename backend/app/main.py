from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.routes.records import router as records_router
from backend.app.routes.health import router as health_router
from backend.app.utils.logger import logger

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CloudVault API",
    description=(
        "Cloud-Based Data Redundancy Removal and Data Validation System. "
        "Intelligent duplicate detection, Levenshtein fuzzy similarity scoring, "
        "false-positive mitigation, and manual review workflow."
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(health_router)
app.include_router(records_router)


@app.get("/", tags=["Root"])
def read_root():
    """Returns application overview and documentation links."""
    return {
        "title": "CloudVault – Cloud-Based Data Redundancy Removal System",
        "description": "High-performance data validation and redundancy elimination API",
        "version": settings.VERSION,
        "author": "CodeAlpha Cloud Computing Internship",
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
