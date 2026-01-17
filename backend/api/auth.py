"""
Auth Routes
GitHub OAuth authentication with JWT tokens
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
import httpx
import logging

from jose import jwt
from database.mongodb import MongoDB
from config import config

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)


class GitHubAuthRequest(BaseModel):
    """GitHub OAuth code exchange request"""
    code: str


def create_access_token(user_id: str) -> str:
    """Create JWT token for user"""
    expire = datetime.utcnow() + timedelta(hours=config.JWT_EXPIRATION_HOURS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


async def _exchange_github_code(code: str) -> tuple[str, dict]:
    """
    Exchange GitHub OAuth code for access token and user data.
    
    Flow:
    1. Exchange code for GitHub access token
    2. Fetch GitHub user info
    3. Upsert user in database
    4. Create JWT token
    
    Returns:
        (jwt_token, user_info_dict)
    """
    logger.info("Starting GitHub OAuth exchange")
    
    async with httpx.AsyncClient() as client:
        # Step 1: Exchange code for GitHub access token
        logger.debug("Exchanging code for access token")
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": config.GITHUB_CLIENT_ID,
                "client_secret": config.GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
            timeout=10.0,
        )
        
        if token_resp.status_code != 200:
            logger.error(f"GitHub token exchange failed: {token_resp.status_code}")
            raise HTTPException(400, "Failed to exchange code with GitHub")
        
        token_data = token_resp.json()
        
        # Check for GitHub error response
        if "error" in token_data:
            error_desc = token_data.get("error_description", token_data.get("error"))
            logger.error(f"GitHub OAuth error: {error_desc}")
            raise HTTPException(400, f"GitHub OAuth error: {error_desc}")
        
        access_token = token_data.get("access_token")
        if not access_token:
            logger.error("No access token in GitHub response")
            raise HTTPException(400, "No access token received from GitHub")
        
        # Step 2: Get GitHub user info
        logger.debug("Fetching GitHub user info")
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github.v3+json",
            },
            timeout=10.0,
        )
        
        if user_resp.status_code != 200:
            logger.error(f"GitHub user fetch failed: {user_resp.status_code}")
            raise HTTPException(400, "Failed to get user info from GitHub")
        
        gh_user = user_resp.json()
        user_id = str(gh_user["id"])
        
        logger.info(f"GitHub user authenticated: {gh_user['login']} (ID: {user_id})")
        
        # Step 3: Upsert user in database
        db = MongoDB.get_database()
        user_doc = {
            "_id": user_id,
            "github_id": gh_user["id"],
            "username": gh_user["login"],
            "name": gh_user.get("name") or gh_user["login"],
            "email": gh_user.get("email") or "",
            "avatar_url": gh_user.get("avatar_url") or "",
            "github_access_token": access_token,
            "updated_at": datetime.utcnow(),
        }
        
        existing = await db.users.find_one({"_id": user_id})
        if existing:
            await db.users.update_one({"_id": user_id}, {"$set": user_doc})
            logger.debug(f"Updated existing user: {user_id}")
        else:
            user_doc["created_at"] = datetime.utcnow()
            user_doc["role"] = "free"  # Default role
            user_doc["credits"] = 100  # Starting credits
            await db.users.insert_one(user_doc)
            logger.info(f"Created new user: {user_id}")
        
        # Step 4: Create JWT
        jwt_token = create_access_token(user_id)
        
        user_info = {
            "id": user_id,
            "username": gh_user["login"],
            "name": gh_user.get("name") or gh_user["login"],
            "email": gh_user.get("email") or "",
            "avatar_url": gh_user.get("avatar_url") or "",
            "role": existing.get("role", "free") if existing else "free",
            "credits": existing.get("credits", 100) if existing else 100,
        }
        
        return jwt_token, user_info


@router.get("/github")
async def github_oauth_init():
    """
    Redirect user to GitHub OAuth authorization page.
    
    Scopes requested:
    - repo: Full control of private and public repositories
    - user:email: Read user email addresses
    - read:user: Read user profile data
    
    This enables Architex to:
    - Create new repositories
    - Push commits to repositories
    - Access user profile for authentication
    """
    if not config.GITHUB_CLIENT_ID:
        raise HTTPException(500, "GitHub OAuth not configured (missing GITHUB_OAUTH_CLIENT_ID)")
    
    # Full repo access scopes
    scopes = "repo,user:email,read:user"
    
    # Let GitHub use the callback URL configured in the OAuth App settings
    # This avoids redirect_uri mismatch errors
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={config.GITHUB_CLIENT_ID}"
        f"&scope={scopes}"
    )
    logger.info(f"Redirecting to GitHub OAuth with scopes: {scopes}")
    return RedirectResponse(url=url)


@router.get("/callback")
async def github_oauth_callback(code: str):
    """
    Handle GitHub OAuth callback (browser redirect flow).
    
    GitHub redirects here with ?code=xxx after user authorizes.
    We exchange the code, then redirect to frontend with JWT token.
    
    Frontend should have a page at /auth/callback that:
    1. Extracts token from URL params
    2. Stores it in localStorage
    3. Redirects to dashboard/projects page
    """
    logger.info("Received GitHub OAuth callback")
    jwt_token, _ = await _exchange_github_code(code)
    redirect_url = f"{config.FRONTEND_URL}/auth/callback?token={jwt_token}"
    logger.info(f"Redirecting to frontend: {redirect_url}")
    return RedirectResponse(url=redirect_url)


@router.post("/github")
async def github_auth_exchange(request: GitHubAuthRequest):
    """
    Exchange GitHub code for JWT (SPA flow).
    
    For SPAs that handle the OAuth redirect themselves
    and just need to exchange the code for a token.
    """
    jwt_token, user_info = await _exchange_github_code(request.code)
    return {"token": jwt_token, "user": user_info}


@router.get("/me")
async def get_current_user_info():
    """
    Get current authenticated user info.
    
    Note: This requires the Authorization header, handled by deps.get_current_user.
    For now, this is a simple endpoint that returns user data from the token.
    """
    from api.deps import get_current_user
    from fastapi import Depends
    
    # This is a workaround - in practice, add Depends(get_current_user) to route
    raise HTTPException(501, "Use GET /api/users/me with Authorization header")
