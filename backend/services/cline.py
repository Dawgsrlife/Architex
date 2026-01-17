import logging
import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
from services.gemini import gemini_service

logger = logging.getLogger(__name__)

class ClineService:
    """
    Cline Agent Service
    Orchestrates the agentic coding loop using Gemini
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        
    async def authorize_operation(self, operation: str, params: Dict[str, Any]) -> bool:
        """
        Authorize an operation via Cline
        Authorization layer for secure operations
        """
        # In a real scenario, this would check permissions
        # For this demo/MVP, we auto-authorize
        return True
    
    async def run_agent(
        self, 
        job_id: str, 
        workspace_path: Path, 
        architecture_spec: Dict[str, Any]
    ):
        """
        Run the Agentic Loop to generate code
        """
        logger.info(f"Starting Agent Loop for Job {job_id}")
        
        # Initial System Prompt
        history = [
            {
                "role": "user",
                "parts": [f"""
                You are tasked with building a complete software project based on the following architecture:
                
                Name: {architecture_spec.get('name')}
                Description: {architecture_spec.get('description')}
                
                Nodes (Components):
                {json.dumps(architecture_spec.get('nodes'), indent=2)}
                
                Edges (Connections):
                {json.dumps(architecture_spec.get('edges'), indent=2)}
                
                Your Goal:
                1. Plan the file structure.
                2. iteratively write files (package.json, requirements.txt, source code, Dockerfile, etc.).
                3. Ensure the code is production-ready.
                4. When done, call task_complete().
                
                You are working in the root of the project directory.
                """]
            }
        ]
        
        # Safety limit
        MAX_ITERATIONS = 20
        iteration = 0
        
        while iteration < MAX_ITERATIONS:
            iteration += 1
            logger.info(f"Agent Loop Iteration {iteration}")
            
            try:
                # 1. Get Response from Gemini
                response = await gemini_service.generate_agent_response(history)
                
                # 2. Add Assistant Message to History
                assistant_msg = ""
                if response["type"] == "tool_use":
                    assistant_msg = json.dumps({
                        "tool": response["tool"],
                        "params": response["params"]
                    })
                else:
                    assistant_msg = json.dumps({
                        "tool": "speak",
                        "params": {"message": response["content"]}
                    })
                    
                history.append({
                    "role": "model",
                    "parts": [assistant_msg]
                })
                
                # 3. Handle Response
                if response["type"] == "tool_use":
                    tool = response["tool"]
                    params = response["params"]
                    
                    logger.info(f"Tool Call: {tool}")
                    
                    result = ""
                    
                    if tool == "write_file":
                        path = params.get("path")
                        content = params.get("content")
                        full_path = workspace_path / path
                        full_path.parent.mkdir(parents=True, exist_ok=True)
                        full_path.write_text(content, encoding="utf-8")
                        result = f"Successfully wrote file: {path}"
                        
                    elif tool == "read_file":
                        path = params.get("path")
                        full_path = workspace_path / path
                        if full_path.exists():
                            result = full_path.read_text(encoding="utf-8")
                        else:
                            result = f"Error: File {path} does not exist."
                            
                    elif tool == "list_files":
                        path = params.get("path", ".")
                        target_dir = workspace_path / path
                        if target_dir.exists():
                            files = [str(p.relative_to(workspace_path)) for p in target_dir.rglob("*")]
                            result = "\n".join(files[:50]) # Limit output
                        else:
                            result = "Directory not found."
                            
                    elif tool == "task_complete":
                        logger.info("Agent signaled task completion.")
                        return True
                        
                    elif tool == "speak":
                         # Just logging the message
                         logger.info(f"Agent speaks: {params.get('message')}")
                         result = "Acknowledged."
                    
                    else:
                        result = f"Error: Unknown tool {tool}"
                    
                    # 4. Add Tool Result to History (as User message)
                    history.append({
                        "role": "user",
                        "parts": [f"Tool Result ({tool}): {result}"]
                    })
                    
                else:
                    # Pure text response (should be handled via speak tool, but just in case)
                    logger.info(f"Agent Text: {response['content']}")
                    history.append({
                        "role": "user",
                        "parts": ["Please use the JSON tool format to proceed."]
                    })
            
            except Exception as e:
                logger.error(f"Error in Agent Loop: {e}")
                history.append({
                    "role": "user",
                    "parts": [f"System Error: {str(e)}"]
                })
                
        logger.warning("Agent reached max iterations without completion.")
        return False

# Global instance
cline_service = ClineService()

