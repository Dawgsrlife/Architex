"""Workspace management for job execution"""
from pathlib import Path
from typing import Optional
import shutil
import logging

from .config import Config

logger = logging.getLogger(__name__)


class Workspace:
    """Manages workspace directories for job execution"""
    
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.base_path = Config.get_workdir(job_id)
        self.input_dir = self.base_path / "input"
        self.repo_dir = self.base_path / "repo"
    
    def create(self) -> None:
        """Create workspace directories"""
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.input_dir.mkdir(parents=True, exist_ok=True)
        self.repo_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Created workspace: {self.base_path}")
    
    def cleanup(self) -> None:
        """Clean up workspace directory"""
        if self.base_path.exists():
            try:
                shutil.rmtree(self.base_path)
                logger.info(f"Cleaned up workspace: {self.base_path}")
            except Exception as e:
                logger.warning(f"Failed to cleanup workspace {self.base_path}: {e}")
    
    def exists(self) -> bool:
        """Check if workspace exists"""
        return self.base_path.exists()
    
    def get_architecture_spec_path(self) -> Path:
        """Get path to architecture_spec.json"""
        return self.input_dir / "architecture_spec.json"
    
    def get_spec_path(self) -> Path:
        """Get path to spec.json"""
        return self.input_dir / "spec.json"
    
    def get_instructions_path(self) -> Path:
        """Get path to instructions.md"""
        return self.input_dir / "instructions.md"
    
    def get_repo_path(self) -> Path:
        """Get path to repo directory"""
        return self.repo_dir
