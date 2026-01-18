"""
GitHub API Service
Handles GitHub operations
"""

import os
import logging
import re
from typing import Dict, Any, Optional, List
from github import Github, GithubException

logger = logging.getLogger(__name__)


def slugify_repo_name(name: str) -> str:
    """
    Convert a project name to a valid GitHub repository name.
    GitHub repo names can only contain alphanumeric characters, hyphens, and underscores.
    """
    # Convert to lowercase and replace spaces with hyphens
    slug = name.lower().strip()
    slug = re.sub(r'\s+', '-', slug)
    # Remove invalid characters (keep alphanumeric, hyphens, underscores)
    slug = re.sub(r'[^a-z0-9\-_]', '', slug)
    # Remove consecutive hyphens
    slug = re.sub(r'-+', '-', slug)
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    # Ensure it's not empty
    if not slug:
        slug = 'project'
    return slug


class GitHubService:
    """Service for GitHub API integration"""
    
    def __init__(self, access_token: Optional[str] = None):
        self.access_token = access_token
        if access_token:
            self.client = Github(access_token)
        else:
            self.client = None
    
    def get_username(self) -> str:
        """Get the authenticated user's GitHub username"""
        if not self.client:
            raise ValueError("GitHub client not initialized")
        return self.client.get_user().login
    
    def repo_exists(self, repo_name: str) -> bool:
        """Check if a repository with the given name exists for the authenticated user"""
        if not self.client:
            raise ValueError("GitHub client not initialized")
        
        try:
            user = self.client.get_user()
            user.get_repo(repo_name)
            return True
        except GithubException as e:
            if e.status == 404:
                return False
            # Re-raise other errors
            raise
    
    async def create_repository(
        self, 
        name: str, 
        description: str,
        private: bool = False
    ) -> Dict[str, Any]:
        """Create a new GitHub repository"""
        if not self.client:
            raise ValueError("GitHub client not initialized")
        
        try:
            user = self.client.get_user()
            repo = user.create_repo(
                name=name,
                description=description,
                private=private,
                auto_init=True
            )
            
            return {
                "success": True,
                "repository": {
                    "name": repo.name,
                    "full_name": repo.full_name,
                    "url": repo.html_url,
                    "clone_url": repo.clone_url
                }
            }
        except GithubException as e:
            logger.error(f"Error creating repository: {str(e)}")
            raise
    
    async def create_file(
        self,
        repo_name: str,
        path: str,
        content: str,
        message: str
    ) -> Dict[str, Any]:
        """Create or update a file in repository"""
        if not self.client:
            raise ValueError("GitHub client not initialized")
        
        try:
            user = self.client.get_user()
            repo = user.get_repo(repo_name)
            
            # Try to get existing file
            try:
                existing_file = repo.get_contents(path)
                # Update existing file
                result = repo.update_file(
                    path=path,
                    message=message,
                    content=content,
                    sha=existing_file.sha
                )
            except GithubException:
                # Create new file
                result = repo.create_file(
                    path=path,
                    message=message,
                    content=content
                )
            
            return {
                "success": True,
                "commit": result['commit'].sha
            }
        except GithubException as e:
            logger.error(f"Error creating/updating file: {str(e)}")
            raise
    
    async def list_repositories(self) -> List[Dict[str, Any]]:
        """List user repositories"""
        if not self.client:
            raise ValueError("GitHub client not initialized")
        
        try:
            user = self.client.get_user()
            repos = user.get_repos()
            
            return [
                {
                    "name": repo.name,
                    "full_name": repo.full_name,
                    "description": repo.description,
                    "url": repo.html_url,
                    "private": repo.private,
                    "language": repo.language
                }
                for repo in repos
            ]
        except GithubException as e:
            logger.error(f"Error listing repositories: {str(e)}")
            raise

def get_github_service(access_token: str) -> GitHubService:
    """Factory function to create GitHubService instance"""
    return GitHubService(access_token=access_token)
