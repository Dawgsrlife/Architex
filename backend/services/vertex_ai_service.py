"""
Vertex AI Service - Google Cloud Gemini API via Vertex AI

This service uses the Vertex AI API (aiplatform.googleapis.com) which supports
Google Cloud API keys that start with "AQ.A...".

Unlike the Google AI Studio SDK (generativelanguage.googleapis.com) which uses
AIza... keys, Vertex AI keys require direct REST API calls.
"""

import os
import logging
import json
import re
import httpx
from typing import Dict, Any, Optional, List

from services.llm_interface import LLMInterface

logger = logging.getLogger(__name__)


class VertexAIService(LLMInterface):
    """
    Service for Google Cloud Vertex AI Gemini API.
    
    Supports API keys from:
    https://console.cloud.google.com/vertex-ai/studio/settings/api-keys
    
    These keys start with "AQ.A..." instead of "AIza...".
    """
    
    # Vertex AI endpoint for Gemini
    BASE_URL = "https://aiplatform.googleapis.com/v1/publishers/google/models"
    
    def __init__(self, model_name: str = "gemini-2.5-flash-lite"):
        self.model_name = model_name
        # Check for VERTEX_AI_API_KEY or fallback to GOOGLE_GEMINI_API_KEY
        self.api_key = os.getenv("VERTEX_AI_API_KEY") or os.getenv("GOOGLE_GEMINI_API_KEY")
        
        if self.api_key:
            # Check if this looks like a Vertex AI key (starts with AQ. or is long)
            if self.api_key.startswith("AQ.") or len(self.api_key) > 100:
                logger.info(f"Vertex AI configured with {model_name}")
            else:
                logger.info(f"API key may be AI Studio format, using Vertex AI endpoint anyway")
        else:
            logger.warning("No API key found for Vertex AI")
    
    @property
    def is_configured(self) -> bool:
        return self.api_key is not None and len(self.api_key) > 10
    
    @property
    def provider_name(self) -> str:
        return f"Vertex AI ({self.model_name})"
    
    async def _call_api(
        self, 
        contents: List[Dict], 
        system_instruction: Optional[str] = None,
        stream: bool = False
    ) -> str:
        """
        Make a direct API call to Vertex AI.
        
        Args:
            contents: List of content objects with role and parts
            system_instruction: Optional system prompt
            stream: Whether to use streaming (for faster first response)
            
        Returns:
            Generated text response
        """
        endpoint = "streamGenerateContent" if stream else "generateContent"
        url = f"{self.BASE_URL}/{self.model_name}:{endpoint}"
        
        # Build request body
        body: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 8192,
                "topP": 0.95,
            }
        }
        
        if system_instruction:
            body["systemInstruction"] = {
                "role": "user",
                "parts": [{"text": system_instruction}]
            }
        
        headers = {
            "Content-Type": "application/json",
        }
        
        # Add API key as query parameter
        params = {"key": self.api_key}
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(url, json=body, headers=headers, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                # Handle streaming response (array of chunks)
                if isinstance(data, list):
                    # Concatenate all text parts from streamed response
                    full_text = ""
                    for chunk in data:
                        if "candidates" in chunk:
                            for candidate in chunk["candidates"]:
                                if "content" in candidate and "parts" in candidate["content"]:
                                    for part in candidate["content"]["parts"]:
                                        if "text" in part:
                                            full_text += part["text"]
                    return full_text
                else:
                    # Non-streaming response
                    if "candidates" in data and len(data["candidates"]) > 0:
                        candidate = data["candidates"][0]
                        if "content" in candidate and "parts" in candidate["content"]:
                            parts = candidate["content"]["parts"]
                            return "".join(p.get("text", "") for p in parts)
                    
                    logger.warning(f"Unexpected response format: {data}")
                    return ""
                    
            except httpx.HTTPStatusError as e:
                error_body = e.response.text
                logger.error(f"Vertex AI API error ({e.response.status_code}): {error_body}")
                
                # Handle rate limiting
                if e.response.status_code == 429:
                    raise Exception(f"Rate limit exceeded. Please wait and retry. Details: {error_body}")
                
                raise Exception(f"Vertex AI API error: {e.response.status_code} - {error_body}")
            except Exception as e:
                logger.error(f"Error calling Vertex AI: {e}")
                raise
    
    async def generate_architecture(
        self, 
        description: str, 
        requirements: Optional[List] = None,
        tech_stack: Optional[List] = None
    ) -> Dict[str, Any]:
        """
        Generate architecture from natural language description.
        """
        if not self.is_configured:
            raise ValueError("Vertex AI API not configured")
        
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
        
        Do not wrap the JSON in markdown code blocks. Return ONLY valid JSON.
        """
        
        try:
            contents = [{"role": "user", "parts": [{"text": prompt}]}]
            response_text = await self._call_api(contents, stream=True)
            
            return {
                "architecture": response_text,
                "success": True
            }
        except Exception as e:
            logger.error(f"Error generating architecture: {str(e)}")
            raise
    
    async def generate_agent_response(
        self,
        history: List[Dict],
        tools: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Generate a response in an agentic loop, supporting tools.
        """
        if not self.is_configured:
            raise ValueError("Vertex AI API not configured")
        
        system_instruction = """
        You are an expert coding agent. You can read files, write files, and run commands.
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
        
        If you want to just speak or explain, wrap it in:
        {
            "tool": "speak",
            "params": { "message": "..." }
        }
        
        IMPORTANT: Always make progress by writing files. Don't just explain - write the actual code.
        """
        
        try:
            # Convert history to Vertex AI format
            contents = []
            for msg in history:
                role = msg.get("role", "user")
                # Vertex AI uses "user" and "model" roles
                if role == "assistant":
                    role = "model"
                
                parts = msg.get("parts", [])
                if isinstance(parts, str):
                    parts = [{"text": parts}]
                elif isinstance(parts, list) and len(parts) > 0 and isinstance(parts[0], str):
                    parts = [{"text": p} for p in parts]
                
                contents.append({"role": role, "parts": parts})
            
            response_text = await self._call_api(contents, system_instruction=system_instruction, stream=True)
            
            # Parse tool response
            try:
                # Look for JSON in the response
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    tool_call = json.loads(json_match.group(0))
                    return {
                        "type": "tool_use",
                        "tool": tool_call.get("tool"),
                        "params": tool_call.get("params", {})
                    }
                else:
                    return {
                        "type": "text",
                        "content": response_text
                    }
            except json.JSONDecodeError:
                return {
                    "type": "text",
                    "content": response_text
                }
                
        except Exception as e:
            logger.error(f"Error in agent generation: {str(e)}")
            raise


# Global instance
vertex_ai_service = VertexAIService()
