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
            # Use gemini-2.0-flash for fast, cost-effective generation
            self.model = genai.GenerativeModel('gemini-2.0-flash')
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
        
        Do not look for external documentation. Use your internal knowledge to generate the best possible code.
        Do not wrap the JSON in markdown code blocks. Return ONLY valid JSON.
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
    
    async def generate_agent_response(
        self,
        history: list[dict],
        tools: Optional[list[dict]] = None
    ) -> Dict[str, Any]:
        """
        Generate a response in an agentic loop, supporting tools.
        
        Args:
            history: List of message dicts (e.g. [{"role": "user", "parts": ["..."]}])
            tools: List of tool definitions (schema) - currently unused as we simulate tools via prompt, 
                   but kept for future native tool integration.
                   
        Returns:
            Dict containing:
            - type: "text" or "tool_use"
            - content: Message content or Tool call details
        """
        if not self.model:
            raise ValueError("Gemini API not configured")
        
        # Convert history to Gemini format if needed, implementation depends on library version
        # For now, we'll construct a chat session
        try:
            chat = self.model.start_chat(history=history[:-1])
            last_message = history[-1]["parts"][0]
            
            # We append a system instruction to the last message to enforce tool usage format
            # This is a "simulated" tool use approach for reliability across model versions
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
            
            If you want to just speak to the user or explain your thought process, use the "text" tool (conceptual):
            Just respond with normal text if you are not using a tool, but prefer using tools to make progress.
            However, since I need to parse your output, if you want to say something, wrap it in:
            {
                "tool": "speak",
                "params": { "message": "..." }
            }
            """
            
            full_prompt = f"{system_instruction}\n\nUser Message: {last_message}"
            
            response = chat.send_message(full_prompt)
            text_response = response.text
            
            # Simple parsing logic
            import json
            import re
            
            # Try to find JSON in the response
            try:
                # Look for { ... } structure
                json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
                if json_match:
                    tool_call = json.loads(json_match.group(0))
                    return {
                        "type": "tool_use",
                        "tool": tool_call.get("tool"),
                        "params": tool_call.get("params")
                    }
                else:
                    return {
                        "type": "text",
                        "content": text_response
                    }
            except:
                # Fallback to text if parsing fails
                return {
                    "type": "text",
                    "content": text_response
                }
                
        except Exception as e:
            logger.error(f"Error in agent generation: {str(e)}")
            raise

# Global instance
gemini_service = GeminiService()
