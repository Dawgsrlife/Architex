"""
Groq AI Service
Fast inference using Groq's LPU for Llama and Mixtral models

Implements LLMInterface for interchangeability with Gemini and other providers.
"""

import os
import logging
import json
import re
from typing import Dict, Any, Optional, List

from groq import Groq

from services.llm_interface import LLMInterface

logger = logging.getLogger(__name__)


# System prompt for agentic tool use
AGENT_SYSTEM_PROMPT = """You are an expert coding agent. You can read files, write files, and run commands.
To use a tool, you MUST respond with a JSON object in the following format ONLY, and no other text:

{
    "tool": "tool_name",
    "params": { ... }
}

Available tools:
1. write_file(path: str, content: str) - Write code to a file. Create directories if needed.
2. read_file(path: str) - Read a file's content.
3. list_files(path: str) - List files in a directory.
4. task_complete(message: str) - Signal that the architecture generation is finished.

If you want to just speak to the user or explain your thought process, wrap it in:
{
    "tool": "speak",
    "params": { "message": "..." }
}

IMPORTANT: Always respond with ONLY valid JSON. No markdown, no explanation outside JSON."""


class GroqService(LLMInterface):
    """
    Service for Groq AI integration.
    
    Uses Llama 3.3 70B for high-quality code generation with fast inference.
    """
    
    # Available Groq models (in preference order)
    MODELS = [
        "llama-3.3-70b-versatile",  # Best for coding
        "llama-3.1-70b-versatile",  # Fallback
        "mixtral-8x7b-32768",       # Good alternative
    ]
    
    def __init__(self, model: Optional[str] = None):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = model or self.MODELS[0]
        
        if self.api_key:
            self.client = Groq(api_key=self.api_key)
        else:
            logger.warning("GROQ_API_KEY not set")
            self.client = None
    
    @property
    def is_configured(self) -> bool:
        return self.client is not None
    
    @property
    def provider_name(self) -> str:
        return f"Groq ({self.model})"
    
    async def generate_agent_response(
        self,
        history: List[Dict],
        tools: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Generate a response in an agentic loop.
        
        Converts history to Groq format and parses tool calls from response.
        """
        if not self.client:
            raise ValueError("Groq API not configured")
        
        try:
            # Convert history to Groq/OpenAI format
            messages = self._convert_history(history)
            
            # Add system prompt
            messages.insert(0, {
                "role": "system",
                "content": AGENT_SYSTEM_PROMPT
            })
            
            # Call Groq API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=4096,
            )
            
            text_response = response.choices[0].message.content
            
            # Parse tool call from response
            return self._parse_tool_response(text_response)
            
        except Exception as e:
            logger.error(f"Error in Groq agent generation: {str(e)}")
            raise
    
    async def generate_architecture(
        self, 
        description: str, 
        requirements: Optional[List] = None,
        tech_stack: Optional[List] = None
    ) -> Dict[str, Any]:
        """Generate architecture from natural language description."""
        if not self.client:
            raise ValueError("Groq API not configured")
        
        # Build prompt
        prompt = f"""As an expert software architect, design a comprehensive architecture for:

Description: {description}
"""
        
        if requirements:
            prompt += "\n\nRequirements:\n" + "\n".join(f"- {req}" for req in requirements)
        
        if tech_stack:
            prompt += "\n\nPreferred Tech Stack:\n" + "\n".join(f"- {tech}" for tech in tech_stack)
        
        prompt += """

Please provide a detailed implementation plan and file structure.

CRITICAL: Your response must be a valid JSON object with a single key "files".
The "files" key should contain a dictionary where:
- Keys are file paths (e.g., "src/main.py", "package.json")
- Values are the full content of the file

Example format:
{
    "files": {
        "README.md": "# Project...",
        "src/main.py": "print('hello')"
    }
}

Do not wrap the JSON in markdown code blocks. Return ONLY valid JSON."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert software architect. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=8192,
            )
            
            return {
                "architecture": response.choices[0].message.content,
                "success": True
            }
        except Exception as e:
            logger.error(f"Error generating architecture: {str(e)}")
            raise
    
    def _convert_history(self, history: List[Dict]) -> List[Dict]:
        """
        Convert history from Gemini format to OpenAI/Groq format.
        
        Gemini format: {"role": "user"|"model", "parts": ["..."]}
        OpenAI format: {"role": "user"|"assistant", "content": "..."}
        """
        messages = []
        for msg in history:
            role = msg.get("role", "user")
            # Convert Gemini's "model" to "assistant"
            if role == "model":
                role = "assistant"
            
            # Extract content from parts array or content field
            parts = msg.get("parts", [])
            content = msg.get("content", "")
            
            if parts:
                content = parts[0] if isinstance(parts[0], str) else str(parts[0])
            
            messages.append({
                "role": role,
                "content": content
            })
        
        return messages
    
    def _parse_tool_response(self, text_response: str) -> Dict[str, Any]:
        """
        Parse tool call from LLM response.
        
        Looks for JSON with tool and params fields.
        """
        try:
            # Try to find JSON in the response
            json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
            if json_match:
                tool_call = json.loads(json_match.group(0))
                if "tool" in tool_call:
                    return {
                        "type": "tool_use",
                        "tool": tool_call.get("tool"),
                        "params": tool_call.get("params", {})
                    }
            
            # No valid tool call found
            return {
                "type": "text",
                "content": text_response
            }
        except json.JSONDecodeError:
            # Fallback to text if parsing fails
            return {
                "type": "text",
                "content": text_response
            }


# Global instance for backwards compatibility
groq_service = GroqService()
