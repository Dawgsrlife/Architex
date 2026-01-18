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
from services.architecture_critic import critique_architecture, quick_critique, CriticResult
from services.domain_interpreter import interpret_architecture
from services.constrained_plan import build_generation_plan

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
    """Get current user from JWT token.
    
    Validates JWT and returns user from database.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    # Validate JWT
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


# ============================================================================
# Architecture Critique Endpoints
# ============================================================================

class CritiqueRequest(BaseModel):
    """Request to critique an architecture"""
    architecture_spec: ArchitectureSpec
    skip_llm: bool = False  # If True, only run fast deterministic checks


class CritiqueResponse(BaseModel):
    """Response from architecture critique"""
    summary: str
    issues: List[Dict[str, Any]]
    blocking: bool
    issue_count: int
    high_severity_count: int


@app.post("/api/architecture/critique", response_model=CritiqueResponse)
async def critique_architecture_endpoint(
    request: CritiqueRequest,
    user: dict = Depends(get_current_user)
):
    """
    Critique an architecture specification.
    
    This is the GATING step before code generation.
    If blocking=True, code generation should NOT proceed.
    
    Returns structured feedback:
    - Security issues
    - Missing components
    - Anti-patterns
    - Scalability concerns
    
    Use skip_llm=True for fast real-time feedback while editing.
    """
    try:
        # Convert to dict for critique
        spec_dict = request.architecture_spec.dict()
        
        # Run critique
        result = await critique_architecture(spec_dict, skip_llm=request.skip_llm)
        
        return CritiqueResponse(
            summary=result.summary,
            issues=[issue.to_dict() for issue in result.issues],
            blocking=result.blocking,
            issue_count=len(result.issues),
            high_severity_count=sum(1 for i in result.issues if i.severity.value in ["high", "critical"]),
        )
    except Exception as e:
        logger.error(f"Critique failed: {e}")
        raise HTTPException(status_code=500, detail=f"Critique failed: {str(e)}")


@app.post("/api/architecture/critique/quick")
async def quick_critique_endpoint(
    request: CritiqueRequest,
):
    """
    Quick architecture critique - NO AUTH REQUIRED.
    
    Only runs deterministic rule checks (no LLM).
    Use for real-time feedback while user is editing canvas.
    
    Fast, cheap, and can be called frequently.
    """
    try:
        spec_dict = request.architecture_spec.dict()
        result = await quick_critique(spec_dict)
        
        return {
            "summary": result.summary,
            "issues": [issue.to_dict() for issue in result.issues],
            "blocking": result.blocking,
            "issue_count": len(result.issues),
        }
    except Exception as e:
        logger.error(f"Quick critique failed: {e}")
        raise HTTPException(status_code=500, detail=f"Quick critique failed: {str(e)}")


@app.post("/api/architecture/interpret")
async def interpret_architecture_endpoint(
    request: CritiqueRequest,
    user: dict = Depends(get_current_user)
):
    """
    Interpret architecture into domain model.
    
    Returns:
    - Extracted entities with fields
    - Generated pages
    - API routes
    - Tech stack mapping
    
    This shows what will be generated BEFORE running the job.
    """
    try:
        spec_dict = request.architecture_spec.dict()
        domain_model = interpret_architecture(spec_dict)
        
        return domain_model.to_dict()
    except Exception as e:
        logger.error(f"Interpretation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Interpretation failed: {str(e)}")


@app.post("/api/architecture/plan")
async def preview_generation_plan(
    request: CritiqueRequest,
    user: dict = Depends(get_current_user)
):
    """
    Preview the generation plan for an architecture.
    
    Returns:
    - List of files that will be generated
    - File types and purposes
    - Architecture → code mapping
    
    This shows EXACTLY what Cline will generate.
    """
    try:
        spec_dict = request.architecture_spec.dict()
        plan = build_generation_plan(spec_dict)
        
        return {
            "app_name": plan.app_name,
            "app_type": plan.app_type.value,
            "file_count": len(plan.files),
            "files": [
                {
                    "path": f.path,
                    "type": f.file_type.value,
                    "purpose": f.purpose,
                    "entity": f.entity,
                }
                for f in plan.files
            ],
            "entities": [e.name for e in plan.domain_model.entities],
            "readme_mapping": plan.readme_mapping,
        }
    except Exception as e:
        logger.error(f"Plan generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {str(e)}")


# Authentication endpoints
@app.get("/api/auth/github")
async def github_oauth_init():
    """Initiate GitHub OAuth flow"""
    logger.info(f"Initiating GitHub OAuth with client_id={GITHUB_CLIENT_ID}")
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={GITHUB_CALLBACK_URL}"
        f"&scope=repo%20user"
        f"&allow_signup=true"
    )
    logger.info(f"Redirecting to: {github_auth_url}")
    return RedirectResponse(url=github_auth_url)

@app.get("/api/auth/callback")
async def github_oauth_callback(code: str):
    """Handle GitHub OAuth callback"""
    logger.info(f"Received OAuth callback with code: {code[:8]}...")
    
    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        logger.info("Exchanging code for access token...")
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
        
        # Get user email (GitHub may not include it in /user response)
        user_email = user_data.get("email")
        if not user_email:
            # Fetch emails separately
            emails_response = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if emails_response.status_code == 200:
                emails = emails_response.json()
                # Find primary email
                for email_obj in emails:
                    if email_obj.get("primary"):
                        user_email = email_obj.get("email")
                        break
                # Fallback to first email if no primary
                if not user_email and emails:
                    user_email = emails[0].get("email")
        
        # Use GitHub username as fallback email if still none
        if not user_email:
            user_email = f"{user_data['login']}@users.noreply.github.com"
        
        # Store user in database
        db = MongoDB.get_database()
        user_id = str(user_data["id"])
        logger.info(f"Storing/updating user {user_id} ({user_data['login']}) with email {user_email}")
        
        user_doc = {
            "userId": user_id,  # Required by existing index
            "github_id": user_data["id"],
            "username": user_data["login"],
            "name": user_data.get("name", ""),
            "email": user_email,  # Use fetched email
            "avatar_url": user_data.get("avatar_url", ""),
            "github_access_token": access_token,
            "updated_at": datetime.utcnow(),
        }
        
        # Use upsert to handle both new and existing users
        await db.users.update_one(
            {"_id": user_id},
            {"$set": user_doc, "$setOnInsert": {"_id": user_id, "created_at": datetime.utcnow()}},
            upsert=True
        )
        logger.info(f"User {user_id} saved successfully")
        
        # Create JWT token
        jwt_token = create_access_token(data={"sub": user_id})
        logger.info(f"Created JWT for user {user_id}, redirecting to frontend")
        
        # Redirect to frontend with token
        redirect_url = f"{FRONTEND_URL}/auth/callback?token={jwt_token}"
        logger.info(f"Redirecting to: {redirect_url[:50]}...")
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
        
        # Get user email (GitHub may not include it in /user response)
        user_email = user_data.get("email")
        if not user_email:
            # Fetch emails separately
            emails_response = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if emails_response.status_code == 200:
                emails = emails_response.json()
                for email_obj in emails:
                    if email_obj.get("primary"):
                        user_email = email_obj.get("email")
                        break
                if not user_email and emails:
                    user_email = emails[0].get("email")
        
        if not user_email:
            user_email = f"{user_data['login']}@users.noreply.github.com"
        
        # Store user in database
        db = MongoDB.get_database()
        user_id = str(user_data["id"])
        
        user_doc = {
            "userId": user_id,  # Required by existing index
            "github_id": user_data["id"],
            "username": user_data["login"],
            "name": user_data.get("name", ""),
            "email": user_email,  # Use fetched email
            "avatar_url": user_data.get("avatar_url", ""),
            "github_access_token": access_token,
            "updated_at": datetime.utcnow(),
        }
        
        # Use upsert to handle both new and existing users
        await db.users.update_one(
            {"_id": user_id},
            {"$set": user_doc, "$setOnInsert": {"_id": user_id, "created_at": datetime.utcnow()}},
            upsert=True
        )
        
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
            "description": project.get("description", ""),
            "repository_url": project.get("repository_url"),
            "status": project.get("status", "draft"),
            "nodes_count": project.get("nodes_count", 0),
            "last_updated": (project.get("updated_at") or project.get("created_at")).isoformat(),
            "created_at": project["created_at"].isoformat(),
        })
    
    return projects


@app.get("/api/projects/{project_id}")
async def get_project(
    project_id: str,
    user: dict = Depends(get_current_user)
):
    """Get a single project by ID"""
    db = MongoDB.get_database()
    project = await db.projects.find_one({"_id": project_id, "user_id": user["_id"]})
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {
        "id": project["_id"],
        "name": project["name"],
        "description": project.get("description", ""),
        "repository_url": project.get("repository_url"),
        "status": project.get("status", "draft"),
        "nodes_count": project.get("nodes_count", 0),
        "architecture_spec": project.get("architecture_spec"),
        "last_updated": (project.get("updated_at") or project.get("created_at")).isoformat(),
        "created_at": project["created_at"].isoformat(),
    }


@app.post("/api/projects")
async def create_project(
    project: ProjectCreate,
    user: dict = Depends(get_current_user)
):
    """Create a new project and create a GitHub repo"""
    import re
    from datetime import timezone
    
    # =========================================================================
    # AGGRESSIVE DEBUGGING - Print to terminal so we see EXACTLY where it fails
    # =========================================================================
    
    print("\n" + "=" * 70)
    print(f"🚀 STARTING PROJECT CREATION for '{project.name}'")
    print("=" * 70)
    
    db = MongoDB.get_database()
    project_id = str(uuid.uuid4())
    
    print(f"📋 Project ID: {project_id}")
    print(f"📋 User ID: {user.get('_id')}")
    print(f"📋 User keys: {list(user.keys())}")
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 1: Check GitHub Token (REQUIRED - no silent failures!)
    # ─────────────────────────────────────────────────────────────────────────
    print("\n🔍 Checking user token...")
    
    github_token = user.get("github_access_token")
    
    if not github_token:
        print("❌ ERROR: No GitHub token found for user!")
        print(f"   User document has these keys: {list(user.keys())}")
        raise HTTPException(
            status_code=400,
            detail="No GitHub token found. Please re-login via GitHub OAuth at /login."
        )
    
    print(f"✅ Token found (length: {len(github_token)})")
    print(f"   Token preview: {github_token[:8]}...{github_token[-4:]}")
    
    username = user.get("username")
    print(f"📋 GitHub username: {username}")
    
    if not username:
        print("❌ ERROR: No GitHub username found!")
        raise HTTPException(
            status_code=400,
            detail="No GitHub username found. Please re-login via GitHub OAuth."
        )
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 2: Sanitize repo name
    # ─────────────────────────────────────────────────────────────────────────
    # Convert to valid GitHub repo name
    repo_name = project.name.lower().strip()
    repo_name = re.sub(r'\s+', '-', repo_name)
    repo_name = re.sub(r'[^a-z0-9\-_]', '', repo_name)
    repo_name = re.sub(r'-+', '-', repo_name).strip('-')
    if not repo_name:
        repo_name = 'project'
    
    print(f"\n📝 Repo name: '{project.name}' → '{repo_name}'")
    
    repository_url = None
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 3: Create GitHub Repository (with httpx)
    # ─────────────────────────────────────────────────────────────────────────
    print(f"\n🌐 Calling GitHub API to create repo '{repo_name}'...")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # First check if repo already exists
        print(f"   Checking if repo exists: {username}/{repo_name}")
        
        check_response = await client.get(
            f"https://api.github.com/repos/{username}/{repo_name}",
            headers={"Authorization": f"Bearer {github_token}"},
        )
        
        print(f"   Check response status: {check_response.status_code}")
        
        if check_response.status_code == 200:
            # Repo exists, use it
            repo_data = check_response.json()
            repository_url = repo_data["html_url"]
            print(f"✅ Repo already exists: {repository_url}")
        else:
            # Create new repo
            print(f"   Repo doesn't exist, creating...")
            
            create_response = await client.post(
                "https://api.github.com/user/repos",
                headers={
                    "Authorization": f"Bearer {github_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
                json={
                    "name": repo_name,
                    "description": project.description or f"Created by Architex: {project.name}",
                    "private": False,
                    "auto_init": True,
                },
            )
            
            print(f"   Create response status: {create_response.status_code}")
            
            if create_response.status_code == 201:
                repo_data = create_response.json()
                repository_url = repo_data["html_url"]
                print(f"✅ GitHub Repo Created: {repository_url}")
            elif create_response.status_code == 422:
                # Name conflict - try with suffix
                error_data = create_response.json()
                print(f"⚠️  Name conflict: {error_data}")
                
                suffix = str(uuid.uuid4())[:6]
                new_repo_name = f"{repo_name}-{suffix}"
                print(f"   Retrying with: {new_repo_name}")
                
                retry_response = await client.post(
                    "https://api.github.com/user/repos",
                    headers={
                        "Authorization": f"Bearer {github_token}",
                        "Accept": "application/vnd.github.v3+json",
                    },
                    json={
                        "name": new_repo_name,
                        "description": project.description or f"Created by Architex: {project.name}",
                        "private": False,
                        "auto_init": True,
                    },
                )
                
                if retry_response.status_code == 201:
                    repo_data = retry_response.json()
                    repository_url = repo_data["html_url"]
                    print(f"✅ GitHub Repo Created (with suffix): {repository_url}")
                else:
                    error_data = retry_response.json()
                    print(f"❌ GITHUB API FAILED (retry)!")
                    print(f"   Status: {retry_response.status_code}")
                    print(f"   Response: {error_data}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"GitHub API error: {error_data.get('message', 'Unknown error')}"
                    )
            else:
                error_data = create_response.json()
                print(f"❌ GITHUB API FAILED!")
                print(f"   Status: {create_response.status_code}")
                print(f"   Response: {error_data}")
                raise HTTPException(
                    status_code=500,
                    detail=f"GitHub API error ({create_response.status_code}): {error_data.get('message', 'Unknown error')}"
                )
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 4: Save to Database
    # ─────────────────────────────────────────────────────────────────────────
    print(f"\n💾 Storing project in database...")
    
    # Get user_id - try multiple possible field names
    user_id = user.get("_id") or user.get("userId") or user.get("user_id")
    print(f"   User ID for DB: {user_id}")
    print(f"   Project ID for DB: {project_id}")
    
    project_doc = {
        "_id": project_id,
        "projectId": project_id,          # Required by index
        "userId": str(user_id),           # Required by index (camelCase!)
        "user_id": str(user_id),          # Also include snake_case for compat
        "project_name": project.name,     # Match schema used elsewhere
        "name": project.name,             # Also include for compat
        "description": project.description or "",
        "repository_url": repository_url,
        "github_repo_url": repository_url,  # Also include for compat
        "status": "draft",
        "nodes_count": 0,
        "current_nodes": [],
        "prompts_history": [],
        "latest_successful_job_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
        "last_updated": datetime.now(timezone.utc),
    }
    
    print(f"   Document keys: {list(project_doc.keys())}")
    
    await db.projects.insert_one(project_doc)
    print(f"✅ Project saved to database")
    
    # ─────────────────────────────────────────────────────────────────────────
    # SUCCESS!
    # ─────────────────────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print(f"🎉 SUCCESS! Project '{project.name}' created")
    print(f"   Project ID: {project_id}")
    print(f"   GitHub URL: {repository_url}")
    print("=" * 70 + "\n")
    
    logger.info(f"Created project {project_id} with repo {repository_url}")
    
    return {
        "id": project_id,
        "projectId": project_id,  # Include both for frontend compat
        "name": project.name,
        "description": project.description or "",
        "repository_url": repository_url,
        "github_repo_url": repository_url,  # Include both for frontend compat
        "status": "draft",
    }


class ProjectUpdate(BaseModel):
    """Update project request"""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    architecture_spec: Optional[Dict[str, Any]] = None
    nodes_count: Optional[int] = None


@app.patch("/api/projects/{project_id}")
async def update_project(
    project_id: str,
    update: ProjectUpdate,
    user: dict = Depends(get_current_user)
):
    """Update a project"""
    db = MongoDB.get_database()
    
    # Check project exists and belongs to user
    project = await db.projects.find_one({"_id": project_id, "user_id": user["_id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Build update dict from non-None fields
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.projects.update_one(
        {"_id": project_id},
        {"$set": update_dict}
    )
    
    # Return updated project
    updated = await db.projects.find_one({"_id": project_id})
    return {
        "id": updated["_id"],
        "name": updated["name"],
        "description": updated.get("description", ""),
        "repository_url": updated.get("repository_url"),
        "status": updated.get("status", "draft"),
        "nodes_count": updated.get("nodes_count", 0),
    }


@app.delete("/api/projects/{project_id}")
async def delete_project(
    project_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a project"""
    db = MongoDB.get_database()
    
    # Check project exists and belongs to user
    project = await db.projects.find_one({"_id": project_id, "user_id": user["_id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete the project
    await db.projects.delete_one({"_id": project_id})
    
    # Also delete associated jobs
    await db.jobs.delete_many({"project_id": project_id})
    
    logger.info(f"Deleted project {project_id}")
    return {"message": "Project deleted successfully"}

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
        "jobId": job_id,  # For MongoDB index compatibility
        "user_id": user["_id"],
        "userId": user["_id"],  # For MongoDB index compatibility
        "project_id": job_request.project_id,
        "architecture_spec": job_request.architecture_spec.dict(),
        "status": "pending",
        "logs": [], # Initialize empty logs array
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    await db.jobs.insert_one(job_doc)
    
    # Queue background job processing
    background_tasks.add_task(job_worker.process_job, job_id)
    
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
        "jobId": job["_id"],  # Frontend expects camelCase
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
    
    if job.get("warnings"):
        response["warnings"] = job["warnings"]
    
    if job.get("current_step"):
        response["current_step"] = job["current_step"]
    
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
