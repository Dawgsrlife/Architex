"""
Architex Backend Configuration
Centralized environment configuration with validation
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration from environment variables"""
    
    # GitHub OAuth (using GITHUB_OAUTH_ prefix as per user setup)
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_OAUTH_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_OAUTH_CLIENT_SECRET", "")
    GITHUB_CALLBACK_URL: str = os.getenv("GITHUB_CALLBACK_URL", "http://localhost:8000/api/auth/callback")
    
    # GitHub OAuth Scopes - full repo access for code generation
    GITHUB_SCOPES: str = "repo,user:email,read:user,write:repo_hook"
    
    # Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-change-me-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # Database
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    
    # AI
    GOOGLE_GEMINI_API_KEY: str = os.getenv("GOOGLE_GEMINI_API_KEY", "")
    
    @classmethod
    def validate(cls) -> list[str]:
        """Validate required configuration. Returns list of missing vars."""
        missing = []
        
        if not cls.GITHUB_CLIENT_ID:
            missing.append("GITHUB_CLIENT_ID")
        if not cls.GITHUB_CLIENT_SECRET:
            missing.append("GITHUB_CLIENT_SECRET")
        if not cls.MONGODB_URI:
            missing.append("MONGODB_URI")
        if cls.JWT_SECRET == "dev-secret-change-me-in-production":
            missing.append("JWT_SECRET (using default - change in production)")
            
        return missing
    
    @classmethod
    def print_status(cls):
        """Print configuration status for debugging"""
        print("=" * 50)
        print("Architex Configuration Status")
        print("=" * 50)
        print(f"GitHub Client ID: {'✓ Set' if cls.GITHUB_CLIENT_ID else '✗ Missing'}")
        print(f"GitHub Secret: {'✓ Set' if cls.GITHUB_CLIENT_SECRET else '✗ Missing'}")
        print(f"MongoDB URI: {'✓ Set' if cls.MONGODB_URI else '✗ Missing'}")
        print(f"Gemini API Key: {'✓ Set' if cls.GOOGLE_GEMINI_API_KEY else '✗ Missing'}")
        print(f"JWT Secret: {'✓ Custom' if cls.JWT_SECRET != 'dev-secret-change-me-in-production' else '⚠ Using default'}")
        print(f"Frontend URL: {cls.FRONTEND_URL}")
        print("=" * 50)


# Singleton instance
config = Config()
