import logging
import os
import json
from pathlib import Path
from typing import Dict, Any, Optional, Callable, Awaitable, List
from datetime import datetime
from services.llm_interface import get_default_llm_service, LLMInterface
from services.architecture_translator import translate_architecture

logger = logging.getLogger(__name__)


# Type for progress callback
ProgressCallback = Callable[[str, Optional[List[str]], Optional[int], Optional[str]], Awaitable[None]]


class ClineService:
    """
    Cline Agent Service
    Orchestrates the agentic coding loop using LLM providers.
    
    Uses dependency inversion - depends on LLMInterface abstraction,
    not concrete implementations (Gemini, Groq, etc.)
    
    LAYER 2 INTEGRATION:
    Uses ArchitectureTranslator to convert node graphs into explicit instructions.
    This ensures deterministic, testable translation before LLM sees anything.
    
    LAYER 4 INTEGRATION:
    Accepts a progress_callback to emit logs for observability.
    """
    
    def __init__(self, llm_service: Optional[LLMInterface] = None):
        """
        Initialize with optional explicit LLM service.
        If not provided, auto-selects based on available API keys.
        """
        self._llm_service = llm_service
        
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
        architecture_spec: Dict[str, Any],
        progress_callback: Optional[ProgressCallback] = None
    ):
        """
        Run the Agentic Loop to generate code.
        
        Args:
            job_id: Job identifier
            workspace_path: Path to write files
            architecture_spec: The architecture specification
            progress_callback: Optional callback for progress updates
                Signature: async def callback(current_step, files_created, iteration, translated_spec)
        """
        # Get LLM service (lazy initialization)
        if self._llm_service is None:
            self._llm_service = get_default_llm_service()
        
        llm = self._llm_service
        logger.info(f"Starting Agent Loop for Job {job_id} using {llm.provider_name}")
        
        # Track files created for observability
        files_created: List[str] = []
        
        # =====================================================================
        # LAYER 2: Semantic Translation (DETERMINISTIC)
        # =====================================================================
        # Convert the node graph into explicit instructions.
        # This step is testable, deterministic, and does not involve LLM.
        translated_instructions = translate_architecture(architecture_spec)
        logger.info(f"Translated architecture:\n{translated_instructions[:500]}...")
        
        # Emit initial progress
        if progress_callback:
            await progress_callback(
                "Translating architecture specification",
                None,
                0,
                translated_instructions
            )
        
        # Initial System Prompt - Uses translated instructions
        history = [
            {
                "role": "user",
                "parts": [f"""You are an expert software architect and developer. Build a complete, production-ready project.

{translated_instructions}

## YOUR TASK
1. First, plan the complete file structure
2. Write each file using the write_file tool
3. Include: package.json/requirements.txt, source code, configs, Dockerfile, README.md
4. Ensure code is production-ready and follows best practices
5. When completely done, call task_complete()

You are working in the root of the project directory. Start now.
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
                # Emit progress before LLM call
                if progress_callback:
                    await progress_callback(
                        f"Iteration {iteration}: Calling LLM",
                        files_created if files_created else None,
                        iteration,
                        None
                    )
                
                # 1. Get Response from LLM (Groq, Gemini, etc.)
                response = await llm.generate_agent_response(history)
                
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
                        
                        # Track file for observability
                        files_created.append(path)
                        
                        # Emit progress
                        if progress_callback:
                            await progress_callback(
                                f"Wrote file: {path}",
                                files_created,
                                iteration,
                                None
                            )
                        
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
                        
                        # Emit final progress
                        if progress_callback:
                            await progress_callback(
                                f"Task complete! Created {len(files_created)} files",
                                files_created,
                                iteration,
                                None
                            )
                        
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

