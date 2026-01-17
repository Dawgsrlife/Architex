"""Data models for agent runner"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class JobModel(BaseModel):
    """Job model matching MongoDB schema"""
    _id: str
    projectId: Optional[str] = None
    status: str = "pending"  # pending, running, done, failed
    architecture_spec: Dict[str, Any] = Field(default_factory=dict)
    logs: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    createdAt: datetime
    startedAt: Optional[datetime] = None
    finishedAt: Optional[datetime] = None


class ProjectModel(BaseModel):
    """Project model matching MongoDB schema"""
    _id: str
    ownerId: Optional[str] = None
    user_id: Optional[str] = None  # Alias for ownerId
    name: str
    githubRepoUrl: Optional[str] = None
    repository_url: Optional[str] = None  # Alias for githubRepoUrl
    lastUpdated: Optional[datetime] = None
    jobIds: List[str] = Field(default_factory=list)


class UserModel(BaseModel):
    """User model matching MongoDB schema"""
    _id: str
    githubId: Optional[int] = None
    username: str
    email: Optional[str] = None
    github_access_token: Optional[str] = None
