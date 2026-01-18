"""
Shared Dependencies for API Routes
Authentication, database access, etc.
"""
from fastapi import Header, HTTPException, Depends
from jose import JWTError, jwt
from typing import Optional

from config import settings
from repos import users_repo


async def get_current_user(authorization: str = Header(None)) -> dict:
    """
    FastAPI dependency to get current authenticated user from JWT.
    
    Usage:
        @router.get("/protected")
        async def protected_route(user: dict = Depends(get_current_user)):
            ...
    """
    import logging
    logger = logging.getLogger(__name__)
    
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
    except JWTError:
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
    
    # Debug logging - check if GitHub token is present
    has_token = "github_access_token" in user and user["github_access_token"] is not None
    logger.debug(f"[AUTH_DEP] User {user_id} retrieved. Has GitHub token: {has_token}")
    
    return user


def get_user_id(user: dict) -> str:
    """Extract userId from user dict (helper for repos)"""
    return user.get("userId") or user.get("_id")
