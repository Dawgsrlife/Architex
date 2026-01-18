from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Header
import socketio
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
import httpx
from jose import JWTError, jwt
from datetime import datetime, timedelta
import logging
import uuid

from database.mongodb import MongoDB, init_db, close_db
from services.gemini import gemini_service
from services.github import get_github_service
from services.cline import cline_service
from services.job_worker import job_worker

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Architex API", version="1.0.0")

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    await init_db()
    logger.info("Database connected")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    await close_db()
    logger.info("Database connection closed")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3005", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_CALLBACK_URL = os.getenv("GITHUB_CALLBACK_URL")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Pydantic models
class ArchitectureSpec(BaseModel):
    """Architecture specification for code generation"""
    name: str = "New Architecture"
    description: str = "Generated via Visual Editor"
    # We now accept full graph data
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    components: List[str] = [] # Kept for backward compatibility/easy access
    frameworks: List[str] = [] # Kept for backward compatibility/easy access
    metadata: Dict[str, Any] = {}

class JobCreate(BaseModel):
    """Create job request"""
    architecture_spec: ArchitectureSpec
    project_id: Optional[str] = None

class ProjectCreate(BaseModel):
    """Create project request"""
    name: str
    description: str
    repository_url: Optional[str] = None

class GitHubAuthRequest(BaseModel):
    """GitHub OAuth request"""
    code: str

# JWT utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

async def get_current_user(authorization: str = Header(None)):
    """Get current user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    db = MongoDB.get_database()
    user = await db.users.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user
    
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    db = MongoDB.get_database()
    user = await db.users.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

# Routes
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Architex API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Authentication endpoints
@app.get("/api/auth/github")
async def github_oauth_init():
    """Initiate GitHub OAuth flow"""
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={GITHUB_CALLBACK_URL}"
        f"&scope=repo,user:email"
    )
    return RedirectResponse(url=github_auth_url)

@app.get("/api/auth/callback")
async def github_oauth_callback(code: str):
    """Handle GitHub OAuth callback"""
    
    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token in response")
        
        # Get user information
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user information")
        
        user_data = user_response.json()
        
        # Store user in database
        db = MongoDB.get_database()
        user_id = str(user_data["id"])
        
        user_doc = {
            "_id": user_id,
            "github_id": user_data["id"],
            "username": user_data["login"],
            "name": user_data.get("name", ""),
            "email": user_data.get("email", ""),
            "avatar_url": user_data.get("avatar_url", ""),
            "github_access_token": access_token,
            "updated_at": datetime.utcnow(),
        }
        
        existing_user = await db.users.find_one({"_id": user_id})
        if existing_user:
            await db.users.update_one({"_id": user_id}, {"$set": user_doc})
        else:
            user_doc["created_at"] = datetime.utcnow()
            await db.users.insert_one(user_doc)
        
        # Create JWT token
        jwt_token = create_access_token(data={"sub": user_id})
        
        # Redirect to frontend with token
        redirect_url = f"{FRONTEND_URL}/auth/callback?token={jwt_token}"
        return RedirectResponse(url=redirect_url)

@app.post("/api/auth/github")
async def github_auth_exchange(request: GitHubAuthRequest):
    """Exchange GitHub OAuth code for session token"""
    
    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": request.code,
            },
            headers={"Accept": "application/json"},
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token in response")
        
        # Get user information
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user information")
        
        user_data = user_response.json()
        
        # Store user in database
        db = MongoDB.get_database()
        user_id = str(user_data["id"])
        
        user_doc = {
            "_id": user_id,
            "github_id": user_data["id"],
            "username": user_data["login"],
            "name": user_data.get("name", ""),
            "email": user_data.get("email", ""),
            "avatar_url": user_data.get("avatar_url", ""),
            "github_access_token": access_token,
            "updated_at": datetime.utcnow(),
        }
        
        existing_user = await db.users.find_one({"_id": user_id})
        if existing_user:
            await db.users.update_one({"_id": user_id}, {"$set": user_doc})
        else:
            user_doc["created_at"] = datetime.utcnow()
            await db.users.insert_one(user_doc)
        
        # Create JWT token
        jwt_token = create_access_token(data={"sub": user_id})
        
        return {"token": jwt_token, "user": {
            "id": user_id,
            "username": user_data["login"],
            "name": user_data.get("name", ""),
            "avatar_url": user_data.get("avatar_url", "")
        }}

@app.get("/api/auth/me")
async def get_current_user_info(user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": user["_id"],
        "username": user["username"],
        "name": user.get("name", ""),
        "avatar_url": user.get("avatar_url", ""),
        "email": user.get("email", "")
    }

# Project endpoints
@app.get("/api/projects")
async def get_projects(user: dict = Depends(get_current_user)):
    """Get all projects for the current user"""
    db = MongoDB.get_database()
    projects = []
    
    async for project in db.projects.find({"user_id": user["_id"]}):
        projects.append({
            "id": project["_id"],
            "name": project["name"],
            "description": project["description"],
            "repository_url": project.get("repository_url"),
            "status": project.get("status", "pending"),
            "last_updated": project.get("last_updated", project.get("updated_at")).isoformat(),
            "created_at": project["created_at"].isoformat(),
        })
    
    return projects

@app.post("/api/projects")
async def create_project(
    project: ProjectCreate,
    user: dict = Depends(get_current_user)
):
    """Create a new project"""
    db = MongoDB.get_database()
    project_id = str(uuid.uuid4())
    
    project_doc = {
        "_id": project_id,
        "user_id": user["_id"],
        "name": project.name,
        "description": project.description,
        "repository_url": project.repository_url,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    await db.projects.insert_one(project_doc)
    
    return {
        "id": project_id,
        "name": project.name,
        "description": project.description,
        "status": "pending"
    }

# Job endpoints
@app.post("/api/jobs")
async def create_job(
    job_request: JobCreate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """
    Create a new architecture generation job
    Job is queued and processed asynchronously in background
    """
    db = MongoDB.get_database()
    job_id = str(uuid.uuid4())
    
    # Create job document
    job_doc = {
        "_id": job_id,
        "user_id": user["_id"],
        "project_id": job_request.project_id,
        "architecture_spec": job_request.architecture_spec.dict(),
        "status": "pending",
        "logs": [], # Initialize empty logs array
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    await db.jobs.insert_one(job_doc)
    
    # Queue background job processing
    background_tasks.add_task(job_worker.process_job, job_id, db)
    
    return {
        "job_id": job_id,
        "status": "pending",
        "message": "Job queued for processing"
    }

@app.get("/api/jobs/{job_id}")
async def get_job_status(
    job_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Get job status (for polling)
    Frontend polls this endpoint every 2-5 seconds to check status
    """
    db = MongoDB.get_database()
    job = await db.jobs.find_one({"_id": job_id, "user_id": user["_id"]})
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    response = {
        "job_id": job["_id"],
        "status": job["status"],
        "created_at": job["created_at"].isoformat(),
        "updated_at": job["updated_at"].isoformat(),
    }
    
    if job.get("completed_at"):
        response["completed_at"] = job["completed_at"].isoformat()
    
    if job.get("result"):
        response["result"] = job["result"]
    
    if job.get("error"):
        response["error"] = job["error"]
    
    if job.get("metadata"):
        response["metadata"] = job["metadata"]
        
    if job.get("logs"):
        response["logs"] = job["logs"]
    
    return response

@app.post("/api/jobs/{job_id}/approve")
async def approve_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """
    Approve a pending job for execution
    """
    db = MongoDB.get_database()
    job = await db.jobs.find_one({"_id": job_id, "user_id": user["_id"]})
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job["status"] != "waiting_review":
        raise HTTPException(status_code=400, detail="Job is not waiting for review")
    
    # Queue background execution
    background_tasks.add_task(job_worker.execute_plan, job_id, db)
    
    return {"message": "Job approved for execution"}

@app.get("/api/jobs")
async def get_jobs(
    user: dict = Depends(get_current_user),
    project_id: Optional[str] = None
):
    """Get all jobs for the current user, optionally filtered by project"""
    db = MongoDB.get_database()
    
    query = {"user_id": user["_id"]}
    if project_id:
        query["project_id"] = project_id
    
    jobs = []
    async for job in db.jobs.find(query).sort("created_at", -1):
        jobs.append({
            "job_id": job["_id"],
            "project_id": job.get("project_id"),
            "status": job["status"],
            "created_at": job["created_at"].isoformat(),
            "updated_at": job["updated_at"].isoformat(),
        })
    
    return jobs

if __name__ == "__main__":
    import uvicorn
    from services.socket_manager import socket_manager
    
    # Wrap FastAPI app with SocketIO
    app_with_socket = socketio.ASGIApp(socket_manager.sio, app)
    
    uvicorn.run(app_with_socket, host="0.0.0.0", port=8000)
