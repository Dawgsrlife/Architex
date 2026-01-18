"""
LLM Interface - Abstract Base Class for LLM Providers

Dependency Inversion: High-level modules (cline.py) depend on this abstraction,
not on concrete implementations (Gemini, Groq, etc.)

To add a new provider:
1. Create a new service file (e.g., openai_service.py)
2. Implement LLMInterface
3. Register in get_llm_service() below
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
import os
import logging

logger = logging.getLogger(__name__)


class LLMInterface(ABC):
    """
    Abstract interface for LLM providers.
    
    All LLM services must implement these methods to be interchangeable.
    """
    
    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """Check if the LLM service is properly configured."""
        pass
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the provider name for logging."""
        pass
    
    @abstractmethod
    async def generate_agent_response(
        self,
        history: List[Dict],
        tools: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Generate a response in an agentic loop.
        
        Args:
            history: List of message dicts with role and content
            tools: Optional tool definitions
            
        Returns:
            Dict with:
            - type: "text" or "tool_use"
            - tool: tool name (if tool_use)
            - params: tool parameters (if tool_use)
            - content: text content (if text)
        """
        pass
    
    @abstractmethod
    async def generate_architecture(
        self, 
        description: str, 
        requirements: Optional[List] = None,
        tech_stack: Optional[List] = None
    ) -> Dict[str, Any]:
        """
        Generate architecture from natural language.
        
        Returns:
            Dict with architecture details and success status
        """
        pass


# ============================================================================
# Provider Registry
# ============================================================================

def get_llm_service(provider: Optional[str] = None) -> LLMInterface:
    """
    Factory function to get an LLM service instance.
    
    Args:
        provider: Explicit provider name ("groq", "gemini", "fake"). 
                  If None, auto-selects based on available API keys.
    
    Returns:
        Configured LLM service instance
        
    Priority (if provider not specified):
        1. FakeLLM (if FAKE_LLM=true)
        2. Groq (if GROQ_API_KEY is set)
        3. Gemini (if GOOGLE_GEMINI_API_KEY is set)
    """
    # Import here to avoid circular imports
    from services.groq_service import GroqService
    from services.gemini import GeminiService
    from services.fake_llm_service import FakeLLMService
    
    # Check for fake mode first
    fake_mode = os.getenv("FAKE_LLM", "").lower() in ("true", "1", "yes")
    
    if fake_mode or provider == "fake":
        logger.info("Using FakeLLM (deterministic mock) - NO API CALLS")
        return FakeLLMService()
    
    if provider:
        provider = provider.lower()
        if provider == "groq":
            service = GroqService()
            if not service.is_configured:
                raise ValueError("Groq API key not configured")
            return service
        elif provider == "gemini":
            service = GeminiService()
            if not service.is_configured:
                raise ValueError("Gemini API key not configured")
            return service
        else:
            raise ValueError(f"Unknown LLM provider: {provider}")
    
    # Auto-select based on available keys (Groq preferred)
    if os.getenv("GROQ_API_KEY"):
        service = GroqService()
        if service.is_configured:
            logger.info(f"Using LLM provider: {service.provider_name}")
            return service
    
    if os.getenv("GOOGLE_GEMINI_API_KEY"):
        service = GeminiService()
        if service.is_configured:
            logger.info(f"Using LLM provider: {service.provider_name}")
            return service
    
    raise ValueError("No LLM API key configured. Set FAKE_LLM=true, GROQ_API_KEY, or GOOGLE_GEMINI_API_KEY")


# Global instance - initialized lazily
_llm_service: Optional[LLMInterface] = None


def get_default_llm_service() -> LLMInterface:
    """Get the default LLM service (singleton)."""
    global _llm_service
    if _llm_service is None:
        _llm_service = get_llm_service()
    return _llm_service
