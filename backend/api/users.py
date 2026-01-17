"""
Users Routes
User profile and management endpoints
"""
from fastapi import APIRouter, Depends
from api.deps import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current authenticated user profile"""
    return {
        "id": user["_id"],
        "username": user.get("username", ""),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "avatar_url": user.get("avatar_url", ""),
        "role": user.get("role", "free"),
        "credits": user.get("credits", 0),
        "created_at": user.get("created_at", "").isoformat() if user.get("created_at") else None,
    }
