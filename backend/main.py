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
from datetime import datetime, timedelta, timezone
import logging
import uuid

from config import settings
from database.mongo import init_mongo, close_mongo, get_db
from database.indexes import ensure_indexes
from repos import users_repo, projects_repo, jobs_repo
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
    await init_mongo()
    await ensure_indexes()
    logger.info("Database connected and indexes ensured")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    await close_mongo()
    logger.info("Database connection closed")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3005", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration - use settings from config module
GITHUB_CLIENT_ID = settings.github_client_id
GITHUB_CLIENT_SECRET = settings.github_client_secret
GITHUB_CALLBACK_URL = settings.github_callback_url
FRONTEND_URL = settings.frontend_url
JWT_SECRET = settings.jwt_secret
JWT_ALGORITHM = settings.jwt_algorithm
JWT_EXPIRATION_HOURS = settings.jwt_expiration_hours

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
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
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
    
    # Use repo to get user
    user = await users_repo.get_user(user_id)
    
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
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

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
        
        # Store user in database using repo
        user_id = str(user_data["id"])
        await users_repo.upsert_user(
            userId=user_id,
            github_access_token=access_token,
            email=user_data.get("email"),
            name=user_data.get("name")
        )
        
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
        
        # Store user in database using repo
        user_id = str(user_data["id"])
        await users_repo.upsert_user(
            userId=user_id,
            github_access_token=access_token,
            email=user_data.get("email"),
            name=user_data.get("name")
        )
        
        # Create JWT token
        jwt_token = create_access_token(data={"sub": user_id})
        
        return {"token": jwt_token, "user": {
            "id": user_id,
            "username": user_data["login"],
            "name": user_data.get("name", ""),
            "avatar_url": user_data.get("avatar_url", "")
        }}

# Project endpoints
@app.get("/api/projects")
async def get_projects(user: dict = Depends(get_current_user)):
    """Get all projects for the current user"""
    userId = user.get("userId") or user.get("_id")
    projects = await projects_repo.list_projects(userId)
    
    return [
        {
            "projectId": p["projectId"],
            "name": p["project_name"],
            "description": p.get("description"),
            "repository_url": p.get("repository_url"),
            "last_updated": p["last_updated"].isoformat() if isinstance(p["last_updated"], datetime) else p["last_updated"],
            "createdAt": p["createdAt"].isoformat() if isinstance(p["createdAt"], datetime) else p["createdAt"],
            "updatedAt": p["updatedAt"].isoformat() if isinstance(p["updatedAt"], datetime) else p["updatedAt"],
        }
        for p in projects
    ]

@app.post("/api/projects")
async def create_project(
    project: ProjectCreate,
    user: dict = Depends(get_current_user)
):
    """Create a new project"""
    userId = user.get("userId") or user.get("_id")
    
    project_doc = await projects_repo.create_project(
        userId=userId,
        project_name=project.name,
        description=project.description,
        repository_url=project.repository_url
    )
    
    return {
        "projectId": project_doc["projectId"],
        "name": project_doc["project_name"],
        "description": project_doc.get("description"),
        "repository_url": project_doc.get("repository_url"),
        "last_updated": project_doc["last_updated"].isoformat() if isinstance(project_doc["last_updated"], datetime) else project_doc["last_updated"],
        "createdAt": project_doc["createdAt"].isoformat() if isinstance(project_doc["createdAt"], datetime) else project_doc["createdAt"],
    }

@app.get("/api/projects/{project_id}")
async def get_project(
    project_id: str,
    user: dict = Depends(get_current_user)
):
    """Get a specific project"""
    userId = user.get("userId") or user.get("_id")
    project = await projects_repo.get_project(userId, project_id)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {
        "projectId": project["projectId"],
        "name": project["project_name"],
        "description": project.get("description"),
        "repository_url": project.get("repository_url"),
        "last_updated": project["last_updated"].isoformat() if isinstance(project["last_updated"], datetime) else project["last_updated"],
        "createdAt": project["createdAt"].isoformat() if isinstance(project["createdAt"], datetime) else project["createdAt"],
        "updatedAt": project["updatedAt"].isoformat() if isinstance(project["updatedAt"], datetime) else project["updatedAt"],
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
    userId = user.get("userId") or user.get("_id")
    
    # Create job using repo
    job_doc = await jobs_repo.create_job(
        userId=userId,
        projectId=job_request.project_id,
        architecture_spec=job_request.architecture_spec.dict()
    )
    
    job_id = job_doc["jobId"]
    db = get_db()
    
    # Queue background job processing
    background_tasks.add_task(job_worker.process_job, job_id, db)
    
    return {
        "jobId": job_id,
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
    userId = user.get("userId") or user.get("_id")
    job = await jobs_repo.get_job(userId, job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    response = {
        "jobId": job["jobId"],
        "status": job["status"],
        "createdAt": job["createdAt"].isoformat() if isinstance(job["createdAt"], datetime) else job["createdAt"],
        "updatedAt": job["updatedAt"].isoformat() if isinstance(job["updatedAt"], datetime) else job["updatedAt"],
    }
    
    if job.get("completedAt"):
        response["completedAt"] = job["completedAt"].isoformat() if isinstance(job["completedAt"], datetime) else job["completedAt"]
    
    if job.get("result"):
        response["result"] = job["result"]
    
    if job.get("error"):
        response["error"] = job["error"]
    
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
    userId = user.get("userId") or user.get("_id")
    job = await jobs_repo.get_job(userId, job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job["status"] != "waiting_review":
        raise HTTPException(status_code=400, detail="Job is not waiting for review")
    
    db = get_db()
    # Queue background execution
    background_tasks.add_task(job_worker.execute_plan, job_id, db)
    
    return {"message": "Job approved for execution"}

@app.get("/api/jobs")
async def get_jobs(
    user: dict = Depends(get_current_user),
    project_id: Optional[str] = None
):
    """Get all jobs for the current user, optionally filtered by project"""
    userId = user.get("userId") or user.get("_id")
    
    if project_id:
        jobs = await jobs_repo.list_jobs_for_project(userId, project_id)
    else:
        # List all jobs for user - need to add this function or use direct query
        db = get_db()
        jobs = []
        async for job in db.jobs.find({"userId": userId}).sort("createdAt", -1):
            jobs.append(job)
    
    return [
        {
            "jobId": j["jobId"],
            "projectId": j.get("projectId"),
            "status": j["status"],
            "createdAt": j["createdAt"].isoformat() if isinstance(j["createdAt"], datetime) else j["createdAt"],
            "updatedAt": j["updatedAt"].isoformat() if isinstance(j["updatedAt"], datetime) else j["updatedAt"],
        }
        for j in jobs
    ]

@app.get("/api/projects/{project_id}/jobs")
async def get_project_jobs(
    project_id: str,
    user: dict = Depends(get_current_user)
):
    """Get all jobs for a specific project"""
    userId = user.get("userId") or user.get("_id")
    jobs = await jobs_repo.list_jobs_for_project(userId, project_id)
    
    return [
        {
            "jobId": j["jobId"],
            "status": j["status"],
            "createdAt": j["createdAt"].isoformat() if isinstance(j["createdAt"], datetime) else j["createdAt"],
            "updatedAt": j["updatedAt"].isoformat() if isinstance(j["updatedAt"], datetime) else j["updatedAt"],
        }
        for j in jobs
    ]

if __name__ == "__main__":
    import uvicorn
    from services.socket_manager import socket_manager
    
    # Wrap FastAPI app with SocketIO
    app_with_socket = socketio.ASGIApp(socket_manager.sio, app)
    
    uvicorn.run(app_with_socket, host="0.0.0.0", port=8000)
