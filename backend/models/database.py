from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class UserModel(BaseModel):
    """User database model"""
    id: str = Field(..., alias="_id")
    github_id: int
    username: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    github_access_token: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class ProjectModel(BaseModel):
    """Project database model"""
    id: str = Field(..., alias="_id")
    user_id: str
    name: str
    description: str
    repository_url: Optional[str] = None
    status: str = "pending"  # pending, running, done, failed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class WorkflowModel(BaseModel):
    """Workflow database model"""
    id: str = Field(..., alias="_id")
    project_id: str
    name: str
    nodes: List[dict] = []
    edges: List[dict] = []
    status: str = "draft"  # draft, active, completed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class JobModel(BaseModel):
    """Job database model"""
    id: str = Field(..., alias="_id")
    user_id: str
    project_id: Optional[str] = None
    architecture_spec: dict
    status: str = "queued"  # queued, processing, completed, failed
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
