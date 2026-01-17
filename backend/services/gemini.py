"""
Gemini AI Service
Handles AI code generation and architecture suggestions
"""

import os
import logging
from typing import Dict, Any, Optional
import google.generativeai as genai

logger = logging.getLogger(__name__)

class GeminiService:
    """Service for Google Gemini AI integration"""
    
    def __init__(self):
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            logger.warning("GOOGLE_GEMINI_API_KEY not set")
            self.model = None
    
    async def generate_architecture(
        self, 
        description: str, 
        requirements: Optional[list] = None,
        tech_stack: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Generate architecture from natural language description
        """
        if not self.model:
            raise ValueError("Gemini API not configured")
        
        # Build prompt
        prompt = f"""
        As an expert software architect, design a comprehensive architecture for:
        
        Description: {description}
        """
        
        if requirements:
            prompt += f"\n\nRequirements:\n" + "\n".join(f"- {req}" for req in requirements)
        
        if tech_stack:
            prompt += f"\n\nPreferred Tech Stack:\n" + "\n".join(f"- {tech}" for tech in tech_stack)
        
        prompt += """
        
        Please provide:
        1. High-level system architecture
        2. Component breakdown
        3. Data flow
        4. API design
        5. Database schema
        6. Deployment strategy
        
        Format the response as a structured JSON document.
        """
        
        try:
            response = self.model.generate_content(prompt)
            
            return {
                "architecture": response.text,
                "success": True
            }
        except Exception as e:
            logger.error(f"Error generating architecture: {str(e)}")
            raise
    
    async def generate_code(
        self, 
        prompt: str, 
        context: Optional[str] = None,
        language: str = "typescript"
    ) -> Dict[str, Any]:
        """Generate code from natural language prompt"""
        if not self.model:
            raise ValueError("Gemini API not configured")
        
        full_prompt = f"""
        Generate {language} code for the following:
        
        {prompt}
        """
        
        if context:
            full_prompt += f"\n\nContext: {context}"
        
        full_prompt += "\n\nProvide production-ready code with comments."
        
        try:
            response = self.model.generate_content(full_prompt)
            
            return {
                "code": response.text,
                "success": True
            }
        except Exception as e:
            logger.error(f"Error generating code: {str(e)}")
            raise

# Global instance
gemini_service = GeminiService()
