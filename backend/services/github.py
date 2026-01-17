"""
GitHub API Service
Handles GitHub operations
"""

import os
import logging
from typing import Dict, Any, Optional, List
from github import Github, GithubException

logger = logging.getLogger(__name__)

class GitHubService:
    """Service for GitHub API integration"""
    
    def __init__(self, access_token: Optional[str] = None):
        self.access_token = access_token
        if access_token:
            self.client = Github(access_token)
        else:
            self.client = None
    
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
