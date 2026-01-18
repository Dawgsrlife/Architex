"""
API Router Package
Clean separation of API routes from main.py
"""
from api.auth import router as auth_router
from api.users import router as users_router
from api.projects import router as projects_router
from api.jobs import router as jobs_router

__all__ = ["auth_router", "users_router", "projects_router", "jobs_router"]
