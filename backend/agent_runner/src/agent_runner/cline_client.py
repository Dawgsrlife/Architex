"""Cline CLI adapter for headless code generation"""
import os
import subprocess
import shutil
from pathlib import Path
from typing import Callable, Optional, Dict
import logging

from .config import Config

logger = logging.getLogger(__name__)


class ClineNotFoundError(Exception):
    """Raised when Cline executable is not found"""
    pass


class ClineClient:
    """Adapter for running Cline CLI in headless mode"""
    
    def __init__(self):
        self.cmd = Config.CLINE_CMD
        self.enabled = Config.CLINE_ENABLED
    
    def is_available(self) -> bool:
        """Check if Cline is available"""
        if not self.enabled:
            return False
        
        return shutil.which(self.cmd) is not None
    
    def run_cline(
        self,
        repo_dir: Path,
        instructions_path: Path,
        env: Optional[Dict[str, str]] = None,
        on_line: Optional[Callable[[str], None]] = None
    ) -> int:
        """
        Run Cline CLI to generate code.
        
        Args:
            repo_dir: Directory containing the repository
            instructions_path: Path to instructions.md file
            env: Additional environment variables
            on_line: Callback for stdout/stderr lines
        
        Returns:
            Exit code (0 for success)
        
        Raises:
            ClineNotFoundError: If Cline executable is not found
        """
        if not self.is_available():
            raise ClineNotFoundError(f"Cline command '{self.cmd}' not found")
        
        # Build command
        # Note: Cline headless usage may vary. Adjust command format as needed.
        # Common pattern: cline generate --repo <dir> --instructions <file>
        cmd_args = [
            self.cmd,
            "generate",
            "--repo", str(repo_dir),
            "--instructions", str(instructions_path),
        ]
        
        # Merge environment
        process_env = dict(os.environ) if env is None else {**os.environ, **env}
        
        on_line(f"Running: {' '.join(cmd_args)}")
        
        try:
            process = subprocess.Popen(
                cmd_args,
                cwd=str(repo_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                env=process_env,
            )
            
            # Stream output
            if on_line:
                for line in process.stdout:
                    line = line.rstrip()
                    if line:
                        on_line(line)
            
            exit_code = process.wait()
            return exit_code
            
        except FileNotFoundError:
            raise ClineNotFoundError(f"Cline executable not found: {self.cmd}")
        except Exception as e:
            logger.error(f"Cline execution failed: {e}")
            on_line(f"Cline error: {str(e)}")
            raise


# Module-level convenience function
def run_cline(
    repo_dir: Path,
    instructions_path: Path,
    env: Optional[Dict[str, str]] = None,
    on_line: Optional[Callable[[str], None]] = None
) -> int:
    """
    Run Cline CLI (convenience function).
    
    Args:
        repo_dir: Directory containing the repository
        instructions_path: Path to instructions.md file
        env: Additional environment variables
        on_line: Callback for stdout/stderr lines
    
    Returns:
        Exit code (0 for success)
    
    Raises:
        ClineNotFoundError: If Cline executable is not found
    """
    client = ClineClient()
    return client.run_cline(repo_dir, instructions_path, env, on_line)
