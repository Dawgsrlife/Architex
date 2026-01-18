"""
Project schemas for MongoDB
Based on system design: Projects have current_nodes (state), prompts_history (list), and github_repo_url
One project -> many jobs relationship
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from schemas.common import get_utc_now


class ProjectCreateRequest(BaseModel):
    """Request to create a project"""
    name: str
    description: Optional[str] = None
    repository_url: Optional[str] = None


class ProjectUpdateRequest(BaseModel):
    """Request to update a project"""
    name: Optional[str] = None
    description: Optional[str] = None
    repository_url: Optional[str] = None
    current_nodes: Optional[List[Dict[str, Any]]] = None


class ProjectInDB(BaseModel):
    """
    Project document in MongoDB
    
    Schema per system design:
    - projectId: UUID string (unique per user)
    - userId: owner's user ID
    - project_name: human readable name
    - description: optional description
    - github_repo_url: URL once repo is created/linked
    - current_nodes: List of node objects (current state of the architecture)
    - prompts_history: List of prompts user has given for this project
    - last_updated: timestamp for sorting
    """
    _id: Optional[str] = None
    projectId: str
    userId: str
    project_name: str
    description: Optional[str] = None
    github_repo_url: Optional[str] = None
    current_nodes: List[Dict[str, Any]] = Field(default_factory=list)
    prompts_history: List[Dict[str, Any]] = Field(default_factory=list)
    latest_successful_job_id: Optional[str] = None
    last_updated: datetime = Field(default_factory=get_utc_now)
    createdAt: datetime = Field(default_factory=get_utc_now)
    updatedAt: datetime = Field(default_factory=get_utc_now)
    
    class Config:
        populate_by_name = True


class ProjectResponse(BaseModel):
    """Project response model for API"""
    projectId: str
    userId: str
    name: str
    description: Optional[str] = None
    github_repo_url: Optional[str] = None
    current_nodes: List[Dict[str, Any]] = []
    prompts_history: List[Dict[str, Any]] = []
    latest_successful_job_id: Optional[str] = None
    last_updated: datetime
    createdAt: datetime
    updatedAt: datetime
