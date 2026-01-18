"""Configuration management for agent runner"""
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Agent runner configuration"""
    
    # MongoDB settings
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "architex")
    
    # Gemini settings
    GOOGLE_GEMINI_API_KEY: Optional[str] = os.getenv("GOOGLE_GEMINI_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")
    
    # GitHub settings
    GITHUB_TOKEN: Optional[str] = os.getenv("GITHUB_TOKEN")
    
    # Runner settings
    RUNNER_POLL_SECONDS: int = int(os.getenv("RUNNER_POLL_SECONDS", "2"))
    WORKDIR_ROOT: Path = Path(os.getenv("WORKDIR_ROOT", "/tmp"))
    
    # Git settings
    GIT_AUTHOR_NAME: str = os.getenv("GIT_AUTHOR_NAME", "Architex Bot")
    GIT_AUTHOR_EMAIL: str = os.getenv("GIT_AUTHOR_EMAIL", "bot@architex.local")
    CLONE_DEFAULT_BRANCH: str = os.getenv("CLONE_DEFAULT_BRANCH", "main")
    CLONE_REMOTE_NAME: str = os.getenv("CLONE_REMOTE_NAME", "origin")
    
    # Cline settings
    CLINE_ENABLED: bool = os.getenv("CLINE_ENABLED", "true").lower() == "true"
    CLINE_CMD: str = os.getenv("CLINE_CMD", "cline")
    
    @classmethod
    def validate(cls) -> list[str]:
        """Validate required configuration"""
        errors = []
        
        if not cls.MONGODB_URI:
            errors.append("MONGODB_URI is required")
        
        return errors
    
    @classmethod
    def get_workdir(cls, job_id: str) -> Path:
        """Get working directory for a job"""
        return cls.WORKDIR_ROOT / job_id
