import logging
import os
import json
from pathlib import Path
from typing import Dict, Any, Optional, Callable, Awaitable, List
from datetime import datetime
from services.llm_interface import get_default_llm_service, LLMInterface
from services.architecture_translator import translate_architecture
from services.architecture_critic import critique_architecture, CriticResult
from services.constrained_plan import build_generation_plan, ConstrainedGenerationPlan

logger = logging.getLogger(__name__)


# Type for progress callback
ProgressCallback = Callable[[str, Optional[List[str]], Optional[int], Optional[str]], Awaitable[None]]


class ClineService:
    """
    Cline Agent Service - CONSTRAINED CODE GENERATION
    
    Cline is NOT a creative agent. It is a COMPILER.
    It executes explicit instructions from the ConstrainedGenerationPlan.
    
    KEY DESIGN:
    1. Architecture Critic runs FIRST (can block generation)
    2. Domain Interpreter extracts entities, pages, routes
    3. ConstrainedGenerationPlan creates explicit file instructions
    4. Cline executes the plan EXACTLY (no freestyling)
    
    "Cline isn't smart here. Architex is."
    """
    
    def __init__(self, llm_service: Optional[LLMInterface] = None):
        """
        Initialize with optional explicit LLM service.
        If not provided, auto-selects based on available API keys.
        """
        self._llm_service = llm_service
    
    async def critique_and_validate(
        self,
        architecture_spec: Dict[str, Any],
        skip_llm: bool = False,
    ) -> CriticResult:
        """
        Run architecture criticism BEFORE generation.
        
        This is the GATING step. If blocking=True, generation MUST NOT proceed.
        
        Args:
            architecture_spec: Raw spec from frontend
            skip_llm: If True, only run deterministic checks (faster)
            
        Returns:
            CriticResult with issues and blocking status
        """
        return await critique_architecture(architecture_spec, skip_llm)
    
    async def run_agent_constrained(
        self, 
        job_id: str, 
        workspace_path: Path, 
        architecture_spec: Dict[str, Any],
        progress_callback: Optional[ProgressCallback] = None,
        skip_critic: bool = False,
    ) -> tuple[bool, Optional[CriticResult], List[str]]:
        """
        Run CONSTRAINED code generation.
        
        This is the NEW pipeline:
        1. Critique architecture (can block)
        2. Build constrained generation plan
        3. Execute plan via LLM (no freestyling)
        
        Args:
            job_id: Job identifier
            workspace_path: Path to write files
            architecture_spec: The architecture specification
            progress_callback: Optional callback for progress updates
            skip_critic: If True, skip architecture criticism (dangerous!)
            
        Returns:
            Tuple of (success, critic_result, files_created)
        """
        # Get LLM service
        if self._llm_service is None:
            self._llm_service = get_default_llm_service()
        
        llm = self._llm_service
        logger.info(f"Starting CONSTRAINED Agent for Job {job_id} using {llm.provider_name}")
        
        files_created: List[str] = []
        critic_result: Optional[CriticResult] = None
        
        # =====================================================================
        # STEP 1: Architecture Criticism (GATING)
        # =====================================================================
        if not skip_critic:
            if progress_callback:
                await progress_callback("Running architecture critic...", None, 0, None)
            
            critic_result = await self.critique_and_validate(architecture_spec)
            
            if progress_callback:
                await progress_callback(
                    f"Critic: {len(critic_result.issues)} issues found",
                    None,
                    1,
                    critic_result.to_json()
                )
            
            if critic_result.blocking:
                logger.warning(f"Architecture has blocking issues - generation blocked")
                if progress_callback:
                    await progress_callback(
                        "BLOCKED: Architecture has critical issues",
                        None,
                        1,
                        critic_result.to_json()
                    )
                return False, critic_result, []
        
        # =====================================================================
        # STEP 2: Build Constrained Generation Plan
        # =====================================================================
        if progress_callback:
            await progress_callback("Building generation plan...", None, 2, None)
        
        plan = build_generation_plan(architecture_spec)
        
        logger.info(f"Generation plan: {len(plan.files)} files to create")
        
        if progress_callback:
            await progress_callback(
                f"Plan: {len(plan.files)} files to generate",
                None,
                2,
                plan.to_json()
            )
        
        # =====================================================================
        # STEP 3: Execute Plan via Cline (CONSTRAINED)
        # =====================================================================
        cline_prompt = plan.to_cline_prompt()
        
        if progress_callback:
            await progress_callback(
                "Starting constrained generation...",
                None,
                3,
                cline_prompt[:2000]  # Truncate for progress
            )
        
        # Run the constrained agent loop
        success = await self._execute_constrained_plan(
            llm=llm,
            plan=plan,
            cline_prompt=cline_prompt,
            workspace_path=workspace_path,
            files_created=files_created,
            progress_callback=progress_callback,
        )
        
        if progress_callback:
            await progress_callback(
                f"Generation {'complete' if success else 'failed'}: {len(files_created)} files",
                files_created,
                99,
                None
            )
        
        return success, critic_result, files_created
    
    async def _execute_constrained_plan(
        self,
        llm: LLMInterface,
        plan: ConstrainedGenerationPlan,
        cline_prompt: str,
        workspace_path: Path,
        files_created: List[str],
        progress_callback: Optional[ProgressCallback] = None,
    ) -> bool:
        """
        Execute the constrained generation plan.
        
        This is the actual LLM loop, but CONSTRAINED to the plan.
        """
        # Build history with the constrained prompt
        history = [
            {
                "role": "user",
                "parts": [cline_prompt]
            }
        ]
        
        # Expected files from plan
        expected_files = {f.path for f in plan.files}
        
        # Safety limit
        MAX_ITERATIONS = 30
        iteration = 0
        
        while iteration < MAX_ITERATIONS:
            iteration += 1
            logger.info(f"Constrained Agent Iteration {iteration}")
            
            try:
                if progress_callback:
                    await progress_callback(
                        f"Iteration {iteration}: Generating files...",
                        files_created if files_created else None,
                        iteration + 10,
                        None,
                    )
                
                # Get response from LLM
                response = await llm.generate_agent_response(history)
                
                # Handle response
                if response["type"] == "tool_use":
                    tool = response["tool"]
                    params = response["params"]
                    
                    result = ""
                    
                    if tool == "write_file":
                        path = params.get("path")
                        content = params.get("content")
                        
                        # CONSTRAINT: Only allow files in the plan
                        if path not in expected_files:
                            logger.warning(f"Rejecting file not in plan: {path}")
                            # Check if it's close enough (subdirectory of expected)
                            is_allowed = any(
                                path.startswith(str(Path(exp).parent)) 
                                for exp in expected_files
                            )
                            if not is_allowed:
                                result = f"REJECTED: {path} is not in the generation plan. Only generate files from the plan."
                                history.append({"role": "model", "parts": [json.dumps({"tool": tool, "params": params})]})
                                history.append({"role": "user", "parts": [f"Tool Result ({tool}): {result}"]})
                                continue
                        
                        full_path = workspace_path / path
                        full_path.parent.mkdir(parents=True, exist_ok=True)
                        full_path.write_text(content, encoding="utf-8")
                        result = f"Successfully wrote file: {path}"
                        
                        files_created.append(path)
                        
                        if progress_callback:
                            await progress_callback(
                                f"Created: {path}",
                                files_created,
                                iteration + 10,
                                None,
                            )
                    
                    elif tool == "task_complete":
                        logger.info(f"Constrained generation complete: {len(files_created)} files")
                        
                        if progress_callback:
                            await progress_callback(
                                f"Complete: {len(files_created)} files created",
                                files_created,
                                99,
                                None,
                            )
                        
                        return True
                    
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
                            result = "\n".join(files[:50])
                        else:
                            result = "Directory not found."
                    
                    elif tool == "speak":
                        logger.info(f"Agent speaks: {params.get('message')}")
                        result = "Acknowledged. Continue with the plan."
                    
                    else:
                        result = f"Error: Unknown tool {tool}"
                    
                    # Add to history
                    history.append({"role": "model", "parts": [json.dumps({"tool": tool, "params": params})]})
                    history.append({"role": "user", "parts": [f"Tool Result ({tool}): {result}"]})
                
                else:
                    # Text response - remind to use tools
                    history.append({"role": "model", "parts": [response.get("content", "")]})
                    history.append({"role": "user", "parts": ["Use the write_file tool to generate files. Follow the plan."]})
            
            except Exception as e:
                logger.error(f"Error in constrained agent loop: {e}")
                history.append({"role": "user", "parts": [f"System Error: {str(e)}. Continue with remaining files."]})
        
        logger.warning("Constrained agent reached max iterations")
        return len(files_created) > 0  # Partial success if any files created
        
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

