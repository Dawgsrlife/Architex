"""Git operations for committing and pushing code"""
import subprocess
from pathlib import Path
from typing import Optional
import logging
import re

from .config import Config
from .utils import sanitize_log_line

logger = logging.getLogger(__name__)


class GitClient:
    """Client for Git operations"""
    
    def __init__(self, repo_dir: Path):
        self.repo_dir = repo_dir
        self.author_name = Config.GIT_AUTHOR_NAME
        self.author_email = Config.GIT_AUTHOR_EMAIL
        self.default_branch = Config.CLONE_DEFAULT_BRANCH
        self.remote_name = Config.CLONE_REMOTE_NAME
    
    def init_repo(self) -> None:
        """Initialize Git repository"""
        subprocess.run(
            ["git", "init"],
            cwd=str(self.repo_dir),
            check=True,
            capture_output=True,
        )
        
        subprocess.run(
            ["git", "config", "user.name", self.author_name],
            cwd=str(self.repo_dir),
            check=True,
            capture_output=True,
        )
        
        subprocess.run(
            ["git", "config", "user.email", self.author_email],
            cwd=str(self.repo_dir),
            check=True,
            capture_output=True,
        )
        
        logger.info(f"Initialized Git repository at {self.repo_dir}")
    
    def set_remote(self, repo_url: str, token: Optional[str] = None) -> None:
        """Set Git remote URL with optional authentication"""
        # Sanitize URL for logging
        safe_url = sanitize_log_line(repo_url)
        logger.info(f"Setting remote '{self.remote_name}' to {safe_url}")
        
        # Build authenticated URL if token provided
        auth_url = self._build_auth_url(repo_url, token)
        
        # Remove existing remote if present
        subprocess.run(
            ["git", "remote", "remove", self.remote_name],
            cwd=str(self.repo_dir),
            capture_output=True,
        )
        
        # Add remote
        subprocess.run(
            ["git", "remote", "add", self.remote_name, auth_url],
            cwd=str(self.repo_dir),
            check=True,
            capture_output=True,
        )
    
    def _build_auth_url(self, repo_url: str, token: Optional[str]) -> str:
        """Build authenticated URL for GitHub"""
        if not token:
            return repo_url
        
        # Convert https://github.com/user/repo to https://token@github.com/user/repo
        if repo_url.startswith("https://github.com/"):
            # Remove existing auth if present
            clean_url = re.sub(r'https://[^@]+@github\.com/', 'https://github.com/', repo_url)
            return clean_url.replace("https://github.com/", f"https://{token}@github.com/")
        
        return repo_url
    
    def commit_all(self, message: str) -> str:
        """
        Commit all changes in repository.
        
        Returns:
            Commit SHA
        """
        subprocess.run(
            ["git", "add", "."],
            cwd=str(self.repo_dir),
            check=True,
            capture_output=True,
        )
        
        subprocess.run(
            ["git", "commit", "-m", message],
            cwd=str(self.repo_dir),
            check=True,
            capture_output=True,
        )
        
        # Get commit SHA
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=str(self.repo_dir),
            check=True,
            capture_output=True,
            text=True,
        )
        
        commit_sha = result.stdout.strip()
        logger.info(f"Committed changes: {commit_sha}")
        return commit_sha
    
    def push(self, branch: Optional[str] = None) -> bool:
        """
        Push to remote repository.
        
        Args:
            branch: Branch name (defaults to CLONE_DEFAULT_BRANCH)
        
        Returns:
            True if push succeeded, False otherwise
        """
        branch = branch or self.default_branch
        
        try:
            subprocess.run(
                ["git", "push", "-u", self.remote_name, branch],
                cwd=str(self.repo_dir),
                check=True,
                capture_output=True,
            )
            logger.info(f"Pushed to {self.remote_name}/{branch}")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Git push failed: {e}")
            return False
    
    def has_remote(self) -> bool:
        """Check if remote is configured"""
        result = subprocess.run(
            ["git", "remote", "get-url", self.remote_name],
            cwd=str(self.repo_dir),
            capture_output=True,
        )
        return result.returncode == 0
