"""
Authentication Routes
GitHub OAuth flow for user authentication
"""
from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import httpx
import logging
from jose import jwt

from config import settings
from repos import users_repo

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)


class GitHubAuthRequest(BaseModel):
    """GitHub OAuth code exchange request (SPA flow)"""
    code: str


def create_access_token(user_id: str) -> str:
    """Create JWT access token for user"""
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expiration_hours)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


async def exchange_github_code(code: str) -> tuple[str, dict]:
    """
    Exchange GitHub OAuth code for access token and user data.
    
    Returns:
        tuple: (jwt_token, user_data_dict)
    """
    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        
        if token_response.status_code != 200:
            logger.error(f"GitHub token exchange failed: {token_response.status_code}")
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            error = token_data.get("error_description", "Unknown error")
            logger.error(f"GitHub error: {error}")
            raise HTTPException(status_code=400, detail=f"GitHub error: {error}")
        
        # Get user information
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user information")
        
        github_user = user_response.json()
        user_id = str(github_user["id"])
        
        # Upsert user in database
        logger.info(f"[AUTH] Storing user {user_id} with GitHub token (length: {len(access_token)})")
        await users_repo.upsert_user(
            userId=user_id,
            github_access_token=access_token,
            email=github_user.get("email"),
            name=github_user.get("name") or github_user.get("login"),
            username=github_user.get("login"),
            avatar_url=github_user.get("avatar_url")
        )
        logger.info(f"[AUTH] User {user_id} upserted successfully with GitHub token")
        
        # Create JWT token
        jwt_token = create_access_token(user_id)
        
        user_data = {
            "id": user_id,
            "username": github_user["login"],
            "name": github_user.get("name", ""),
            "avatar_url": github_user.get("avatar_url", ""),
            "email": github_user.get("email", ""),
        }
        
        return jwt_token, user_data


@router.get("/github")
async def github_oauth_init():
    """
    Redirect to GitHub OAuth authorization page.
    Frontend should navigate here to start login flow.
    """
    if not settings.github_client_id:
        raise HTTPException(500, "GitHub OAuth not configured")
    
    scopes = settings.github_scopes
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.github_client_id}"
        f"&scope={scopes}"
    )
    logger.info(f"Redirecting to GitHub OAuth with scopes: {scopes}")
    return RedirectResponse(url=url)


@router.get("/callback")
async def github_oauth_callback(code: str):
    """
    Handle GitHub OAuth callback (browser redirect flow).
    Redirects to frontend with JWT token.
    """
    logger.info("Received GitHub OAuth callback")
    jwt_token, user_data = await exchange_github_code(code)
    
    redirect_url = f"{settings.frontend_url}/auth/callback?token={jwt_token}"
    logger.info(f"OAuth complete for {user_data['username']}, redirecting to frontend")
    return RedirectResponse(url=redirect_url)


@router.post("/github")
async def github_auth_exchange(request: GitHubAuthRequest):
    """
    Exchange GitHub OAuth code for JWT (SPA/AJAX flow).
    Returns token directly instead of redirect.
    """
    jwt_token, user_data = await exchange_github_code(request.code)
    
    return {
        "token": jwt_token,
        "user": user_data
    }


@router.get("/me")
async def get_current_user_info(authorization: str = Header(None)):
    """
    Get current authenticated user info.
    Frontend calls this on page load to validate token and get user data.
    """
    from api.deps import get_current_user
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(
            token, 
            settings.jwt_secret, 
            algorithms=[settings.jwt_algorithm]
        )
    except Exception:
        raise HTTPException(
            status_code=401, 
            detail="Invalid authentication credentials"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user = await users_repo.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return user info in the format frontend expects
    return {
        "id": user.get("userId"),
        "username": user.get("username") or user.get("name", "").split()[0] if user.get("name") else user.get("userId"),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "avatar_url": user.get("avatar_url") or f"https://avatars.githubusercontent.com/u/{user.get('userId')}",
    }
