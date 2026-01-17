from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import os
from dotenv import load_dotenv
import httpx
from jose import JWTError, jwt
from datetime import datetime, timedelta
import logging

from database.mongodb import MongoDB, init_db, close_db
from services.gemini import gemini_service
from services.github import get_github_service
from services.cline import cline_service

load_dotenv()

app = FastAPI(title="Architex API", version="1.0.0")

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    await init_db()
    logging.info("Database connected")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    await close_db()
    logging.info("Database connection closed")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_CALLBACK_URL = os.getenv("GITHUB_CALLBACK_URL")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

logger = logging.getLogger(__name__)

# Models
class ArchitectureSpec(BaseModel):
    """Architecture specification for job processing"""
    description: str = Field(..., description="Natural language description of the architecture")
    requirements: Optional[List[str]] = Field(default=None, description="Specific requirements")
    tech_stack: Optional[List[str]] = Field(default=None, description="Preferred technology stack")
    project_id: Optional[str] = Field(default=None, description="Associated project ID")

class JobResponse(BaseModel):
    """Response model for job submission"""
    job_id: str
    status: str
    message: str

class Project(BaseModel):
    """Project model"""
    id: str
    name: str
    description: str
    status: str
    created_at: datetime
    updated_at: datetime

class User(BaseModel):
    """User model"""
    id: str
    github_id: str
    username: str
    email: Optional[str]
    avatar_url: Optional[str]

# Database placeholder
class Database:
    def __init__(self):
        # In-memory storage for development
        self.users = {}
        self.projects = {}
        self.jobs = {}

db = Database()

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
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Background task for job processing
async def process_architecture_job(job_id: str, spec: ArchitectureSpec, user_id: str, github_token: str):
    """
    Process architecture specification job asynchronously
    This integrates with Cline, Gemini AI, and GitHub as shown in the architecture diagram
    """
    logger.info(f"Processing job {job_id}")
    
    try:
        # Update job status to processing
        jobs_collection = MongoDB.get_collection("jobs")
        await jobs_collection.update_one(
            {"_id": job_id},
            {"$set": {"status": "processing", "updated_at": datetime.utcnow()}}
        )
        
        # Step 1: Authorize operation via Cline (Authorized Mlink)
        await cline_service.authorize_operation(
            "generate_architecture",
            {"job_id": job_id, "user_id": user_id}
        )
        
        # Step 2: Use Gemini AI to generate architecture
        architecture_result = await gemini_service.generate_architecture(
            description=spec.description,
            requirements=spec.requirements,
            tech_stack=spec.tech_stack
        )
        
        # Step 3: Create GitHub repository if needed
        github_service = get_github_service(github_token)
        
        if spec.project_id:
            # Get project details
            projects_collection = MongoDB.get_collection("projects")
            project = await projects_collection.find_one({"_id": spec.project_id})
            
            if project and not project.get("repository_url"):
                # Create GitHub repository
                repo_result = await github_service.create_repository(
                    name=project["name"],
                    description=project["description"],
                    private=True
                )
                
                # Update project with repository URL
                await projects_collection.update_one(
                    {"_id": spec.project_id},
                    {"$set": {
                        "repository_url": repo_result["repository"]["url"],
                        "updated_at": datetime.utcnow()
                    }}
                )
        
        # Step 4: Update job with results
        await jobs_collection.update_one(
            {"_id": job_id},
            {"$set": {
                "status": "completed",
                "result": architecture_result,
                "completed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        logger.info(f"Job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Error processing job {job_id}: {str(e)}")
        
        # Update job status to failed
        jobs_collection = MongoDB.get_collection("jobs")
        await jobs_collection.update_one(
            {"_id": job_id},
            {"$set": {
                "status": "failed",
                "error": str(e),
                "updated_at": datetime.utcnow()
            }}
        )

# Routes

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Architex API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/auth/github")
async def github_auth():
    """Initiate GitHub OAuth flow"""
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
    
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={GITHUB_CALLBACK_URL}"
        f"&scope=user,repo"
    )
    
    return RedirectResponse(url=github_auth_url)

@app.get("/api/auth/callback")
async def github_callback(code: str):
    """Handle GitHub OAuth callback"""
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not provided")
    
    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        token_data = response.json()
        github_access_token = token_data.get("access_token")
        
        if not github_access_token:
            raise HTTPException(status_code=400, detail="Access token not received")
        
        # Get user info from GitHub
        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {github_access_token}",
                "Accept": "application/json",
            },
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        github_user = user_response.json()
        
        # Create or update user in database
        user_id = str(github_user["id"])
        db.users[user_id] = {
            "id": user_id,
            "github_id": github_user["id"],
            "username": github_user["login"],
            "email": github_user.get("email"),
            "avatar_url": github_user.get("avatar_url"),
            "github_access_token": github_access_token,
        }
        
        # Create JWT token
        jwt_token = create_access_token(
            data={"sub": user_id, "username": github_user["login"]}
        )
        
        # Redirect to frontend with token
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(url=f"{frontend_url}/auth/callback?token={jwt_token}")

async def get_current_user(authorization: str = Header(None)):
    """Get current user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Get user from database
    users_collection = MongoDB.get_collection("users")
    user = await users_collection.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@app.post("/api/jobs", response_model=JobResponse)
async def create_job(
    spec: ArchitectureSpec,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """
    Submit an architecture specification job
    This endpoint processes the architecture spec in the background
    Requires authentication via JWT token in Authorization header
    """
    import uuid
    
    job_id = str(uuid.uuid4())
    user_id = user["_id"]
    github_token = user.get("github_access_token")
    
    if not github_token:
        raise HTTPException(status_code=400, detail="GitHub token not found")
    
    # Create job in database
    jobs_collection = MongoDB.get_collection("jobs")
    job_data = {
        "_id": job_id,
        "user_id": user_id,
        "project_id": spec.project_id,
        "architecture_spec": spec.dict(),
        "status": "queued",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await jobs_collection.insert_one(job_data)
    
    # Add job to background tasks
    background_tasks.add_task(
        process_architecture_job, 
        job_id, 
        spec, 
        user_id, 
        github_token
    )
    
    return JobResponse(
        job_id=job_id,
        status="queued",
        message="Job submitted successfully and is being processed"
    )

@app.get("/api/jobs/{job_id}")
async def get_job_status(job_id: str, user: dict = Depends(get_current_user)):
    """Get status of a job"""
    jobs_collection = MongoDB.get_collection("jobs")
    job = await jobs_collection.find_one({"_id": job_id})
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Verify user owns this job
    if job["user_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return job

@app.get("/api/projects", response_model=List[Project])
async def get_projects(user: dict = Depends(get_current_user)):
    """Get all projects for the authenticated user"""
    projects_collection = MongoDB.get_collection("projects")
    cursor = projects_collection.find({"user_id": user["_id"]})
    projects = await cursor.to_list(length=100)
    
    return [
        Project(
            id=p["_id"],
            name=p["name"],
            description=p["description"],
            status=p["status"],
            created_at=p["created_at"],
            updated_at=p["updated_at"]
        )
        for p in projects
    ]

@app.post("/api/projects")
async def create_project(
    name: str, 
    description: str,
    user: dict = Depends(get_current_user)
):
    """Create a new project"""
    import uuid
    
    project_id = str(uuid.uuid4())
    project_data = {
        "_id": project_id,
        "user_id": user["_id"],
        "name": name,
        "description": description,
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    projects_collection = MongoDB.get_collection("projects")
    await projects_collection.insert_one(project_data)
    
    return project_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
