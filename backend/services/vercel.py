"""
Vercel Deployment Service - Automatic deployment to Vercel from GitHub

This service deploys generated repositories to Vercel automatically,
providing a live URL for the demo.

Usage:
    from services.vercel import deploy_to_vercel
    
    url = await deploy_to_vercel(
        github_repo_url="https://github.com/user/repo",
        project_name="my-project"
    )
"""

import os
import logging
import httpx
import re
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class VercelService:
    """Service for deploying to Vercel via API."""
    
    BASE_URL = "https://api.vercel.com"
    
    def __init__(self):
        self.api_token = os.getenv("VERCEL_API_TOKEN")
        if self.api_token:
            logger.info("Vercel API token configured")
        else:
            logger.warning("VERCEL_API_TOKEN not set - deployment will be skipped")
    
    @property
    def is_configured(self) -> bool:
        return self.api_token is not None and len(self.api_token) > 10
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }
    
    def _parse_github_url(self, github_repo_url: str) -> tuple[str, str]:
        """
        Parse GitHub URL to extract owner and repo name.
        
        Examples:
            https://github.com/user/repo -> (user, repo)
            https://github.com/user/repo.git -> (user, repo)
        """
        # Remove .git suffix if present
        url = github_repo_url.rstrip("/").replace(".git", "")
        
        # Extract owner/repo from URL
        match = re.search(r"github\.com/([^/]+)/([^/]+)", url)
        if match:
            return match.group(1), match.group(2)
        
        raise ValueError(f"Invalid GitHub URL: {github_repo_url}")
    
    async def create_project(
        self,
        github_repo_url: str,
        project_name: str,
        framework: str = "nextjs",
        env_vars: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Create a new Vercel project linked to a GitHub repository.
        
        Args:
            github_repo_url: Full GitHub repository URL
            project_name: Name for the Vercel project
            framework: Framework preset (nextjs, vite, etc.)
            env_vars: Optional environment variables to set
            
        Returns:
            Dict with project info including deployment URL
        """
        if not self.is_configured:
            return {
                "success": False,
                "error": "Vercel API token not configured",
            }
        
        try:
            owner, repo = self._parse_github_url(github_repo_url)
        except ValueError as e:
            return {"success": False, "error": str(e)}
        
        # Sanitize project name (Vercel requirements)
        safe_name = re.sub(r"[^a-z0-9-]", "-", project_name.lower())[:50]
        
        # Create project payload
        payload = {
            "name": safe_name,
            "framework": framework,
            "gitRepository": {
                "type": "github",
                "repo": f"{owner}/{repo}",
            },
            "buildCommand": "npm run build",
            "outputDirectory": ".next",
            "installCommand": "npm install",
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                # Step 1: Create the project
                logger.info(f"Creating Vercel project: {safe_name} from {owner}/{repo}")
                
                response = await client.post(
                    f"{self.BASE_URL}/v9/projects",
                    json=payload,
                    headers=self._get_headers(),
                )
                
                if response.status_code == 409:
                    # Project already exists - try to get it
                    logger.info(f"Project {safe_name} already exists, fetching...")
                    response = await client.get(
                        f"{self.BASE_URL}/v9/projects/{safe_name}",
                        headers=self._get_headers(),
                    )
                
                if response.status_code not in [200, 201]:
                    error_text = response.text
                    logger.error(f"Vercel API error ({response.status_code}): {error_text}")
                    return {
                        "success": False,
                        "error": f"Vercel API error: {response.status_code}",
                        "details": error_text,
                    }
                
                project_data = response.json()
                project_id = project_data.get("id")
                
                # Step 2: Set environment variables if provided
                if env_vars:
                    await self._set_env_vars(client, project_id, env_vars)
                
                # Step 3: Trigger deployment
                deploy_result = await self._trigger_deployment(client, safe_name, owner, repo)
                
                # Construct the deployment URL
                deployment_url = f"https://{safe_name}.vercel.app"
                
                return {
                    "success": True,
                    "project_id": project_id,
                    "project_name": safe_name,
                    "deployment_url": deployment_url,
                    "github_repo": f"{owner}/{repo}",
                    "deployment_triggered": deploy_result.get("success", False),
                }
                
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error deploying to Vercel: {e}")
                return {"success": False, "error": str(e)}
            except Exception as e:
                logger.error(f"Error deploying to Vercel: {e}")
                return {"success": False, "error": str(e)}
    
    async def _set_env_vars(
        self,
        client: httpx.AsyncClient,
        project_id: str,
        env_vars: Dict[str, str],
    ):
        """Set environment variables for a project."""
        for key, value in env_vars.items():
            payload = {
                "key": key,
                "value": value,
                "type": "plain",
                "target": ["production", "preview", "development"],
            }
            
            try:
                response = await client.post(
                    f"{self.BASE_URL}/v9/projects/{project_id}/env",
                    json=payload,
                    headers=self._get_headers(),
                )
                if response.status_code in [200, 201]:
                    logger.info(f"Set env var: {key}")
                else:
                    logger.warning(f"Failed to set env var {key}: {response.text}")
            except Exception as e:
                logger.warning(f"Error setting env var {key}: {e}")
    
    async def _trigger_deployment(
        self,
        client: httpx.AsyncClient,
        project_name: str,
        owner: str,
        repo: str,
    ) -> Dict[str, Any]:
        """Trigger a new deployment for the project."""
        try:
            # Create a deployment via the deployments API
            payload = {
                "name": project_name,
                "gitSource": {
                    "type": "github",
                    "ref": "main",
                    "repoId": f"{owner}/{repo}",
                },
            }
            
            response = await client.post(
                f"{self.BASE_URL}/v13/deployments",
                json=payload,
                headers=self._get_headers(),
            )
            
            if response.status_code in [200, 201]:
                deploy_data = response.json()
                return {
                    "success": True,
                    "deployment_id": deploy_data.get("id"),
                    "url": deploy_data.get("url"),
                }
            else:
                # Deployment will happen automatically when project is linked to GitHub
                logger.info("Deployment will be triggered automatically by GitHub webhook")
                return {"success": True, "auto_deploy": True}
                
        except Exception as e:
            logger.warning(f"Could not trigger deployment: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_deployment_status(self, project_name: str) -> Dict[str, Any]:
        """Get the latest deployment status for a project."""
        if not self.is_configured:
            return {"success": False, "error": "Not configured"}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/v6/deployments",
                    params={"projectId": project_name, "limit": 1},
                    headers=self._get_headers(),
                )
                
                if response.status_code == 200:
                    data = response.json()
                    deployments = data.get("deployments", [])
                    if deployments:
                        latest = deployments[0]
                        return {
                            "success": True,
                            "status": latest.get("state"),
                            "url": latest.get("url"),
                            "created": latest.get("created"),
                        }
                
                return {"success": False, "error": "No deployments found"}
                
            except Exception as e:
                return {"success": False, "error": str(e)}


# Global instance
_vercel_service: Optional[VercelService] = None


def get_vercel_service() -> VercelService:
    """Get the Vercel service singleton."""
    global _vercel_service
    if _vercel_service is None:
        _vercel_service = VercelService()
    return _vercel_service


async def deploy_to_vercel(
    github_repo_url: str,
    project_name: str,
    env_vars: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """
    Deploy a GitHub repository to Vercel.
    
    Args:
        github_repo_url: Full GitHub repository URL
        project_name: Name for the Vercel project
        env_vars: Optional environment variables
        
    Returns:
        Dict with deployment result including URL
    """
    service = get_vercel_service()
    
    # Default env vars for Next.js apps
    default_env = {
        "NEXT_PUBLIC_API_URL": "http://localhost:8000",
        "NEXT_PUBLIC_APP_NAME": project_name,
    }
    
    if env_vars:
        default_env.update(env_vars)
    
    return await service.create_project(
        github_repo_url=github_repo_url,
        project_name=project_name,
        framework="nextjs",
        env_vars=default_env,
    )
