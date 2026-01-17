"""
Architex Backend API
Main FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import logging
from pathlib import Path

from config import config
from database.mongodb import init_db, close_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    config.print_status()
    missing = config.validate()
    if missing:
        logger.warning(f"Missing config: {', '.join(missing)}")
    
    await init_db()
    logger.info("Database connected")
    
    yield
    
    # Shutdown
    await close_db()
    logger.info("Database closed")


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
        config.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from api.auth import router as auth_router
from api.users import router as users_router
from api.projects import router as projects_router
from api.jobs import router as jobs_router

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(projects_router)
app.include_router(jobs_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Architex API",
        "version": "1.0.0",
        "docs": "/docs",
        "test_auth": "/test-auth"
    }


@app.get("/api/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/test-auth")
async def test_auth_page():
    """Serve the test auth page"""
    static_path = Path(__file__).parent / "static" / "auth_test.html"
    return FileResponse(static_path)


# Mount static files
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
