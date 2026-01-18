"""
Architex Backend API
Main FastAPI application entry point

This is the application factory. All routes are in api/ folder.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging
from pathlib import Path

from config import settings
from database.mongo import init_mongo, close_mongo, is_connected
from database.indexes import ensure_indexes

# Import routers
from api import auth_router, users_router, projects_router, jobs_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


# ============================================================================
# App Lifespan
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    settings.print_status()
    
    if settings.mongodb_uri:
        await init_mongo()
        await ensure_indexes()
        logger.info("Database connected and indexes ensured")
    else:
        logger.warning("MONGODB_URI not set - running without database")
    
    yield
    
    # Shutdown
    if settings.mongodb_uri:
        await close_mongo()
        logger.info("Database closed")


# ============================================================================
# App Factory
# ============================================================================

app = FastAPI(
    title="Architex API",
    version="1.0.0",
    description="AI-powered architecture generation backend",
    lifespan=lifespan
)

# CORS - allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Include Routers
# ============================================================================

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(projects_router)
app.include_router(jobs_router)


# ============================================================================
# Core Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "name": "Architex API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }


@app.get("/api/health")
async def health():
    """Health check endpoint with database status"""
    db_connected = await is_connected()
    
    return {
        "status": "healthy" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/test-auth")
async def test_auth_page():
    """Serve the test auth page for development"""
    static_path = Path(__file__).parent / "static" / "auth_test.html"
    if static_path.exists():
        return FileResponse(static_path)
    return {"error": "Test page not found"}


# ============================================================================
# Static Files
# ============================================================================

static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
