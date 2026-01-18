"""
Architex Backend Configuration
Centralized environment configuration using pydantic-settings
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # MongoDB
    mongodb_uri: str = ""
    mongodb_db_name: str = "architex"
    
    # Token encryption (optional)
    token_encryption_key: Optional[str] = None
    
    # GitHub OAuth (using GITHUB_OAUTH_ prefix as set up by user)
    github_oauth_client_id: str = ""
    github_oauth_client_secret: str = ""
    github_callback_url: str = "http://localhost:8000/api/auth/callback"
    
    # GitHub OAuth Scopes - full repo access for code generation
    github_scopes: str = "repo,user:email,read:user"
    
    # Frontend
    frontend_url: str = "http://localhost:3000"
    
    # JWT
    jwt_secret: str = "dev-secret-change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # AI
    google_gemini_api_key: str = ""
    
    # Aliases for backwards compat
    @property
    def github_client_id(self) -> str:
        return self.github_oauth_client_id
    
    @property
    def github_client_secret(self) -> str:
        return self.github_oauth_client_secret
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra env vars
    
    def print_status(self):
        """Print configuration status for debugging"""
        print("=" * 50)
        print("Architex Configuration Status")
        print("=" * 50)
        print(f"GitHub Client ID: {'✓ Set' if self.github_client_id else '✗ Missing'}")
        print(f"GitHub Secret: {'✓ Set' if self.github_client_secret else '✗ Missing'}")
        print(f"MongoDB URI: {'✓ Set' if self.mongodb_uri else '✗ Missing (using mock)'}")
        print(f"Gemini API Key: {'✓ Set' if self.google_gemini_api_key else '✗ Missing'}")
        print(f"JWT Secret: {'✓ Custom' if self.jwt_secret != 'dev-secret-change-me-in-production' else '⚠ Using default'}")
        print(f"Frontend URL: {self.frontend_url}")
        print("=" * 50)


# Global settings instance
settings = Settings()
