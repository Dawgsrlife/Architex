"""Gemini fallback code generation when Cline is unavailable"""
import json
from pathlib import Path
from typing import Dict, Any, Optional, Callable
import logging

from .config import Config

logger = logging.getLogger(__name__)


class GeminiFallback:
    """Fallback code generator using Gemini API"""
    
    def __init__(self):
        self.api_key = Config.GOOGLE_GEMINI_API_KEY
        self.model = Config.GEMINI_MODEL
    
    async def generate_code(
        self,
        repo_dir: Path,
        spec_path: Path,
        instructions_path: Path,
        on_log_line: Callable[[str], None]
    ) -> bool:
        """
        Generate code using Gemini API as fallback.
        
        Args:
            repo_dir: Directory to generate code into
            spec_path: Path to spec.json
            instructions_path: Path to instructions.md
            on_log_line: Callback for log messages
        
        Returns:
            True if generation succeeded, False otherwise
        """
        on_log_line("Using Gemini fallback for code generation...")
        
        if not self.api_key:
            on_log_line("No Gemini API key available, using minimal stub generation")
            return self._generate_stub(repo_dir)
        
        try:
            # Read spec and instructions
            with open(spec_path, "r") as f:
                spec = json.load(f)
            
            with open(instructions_path, "r") as f:
                instructions = f.read()
            
            # Build prompt
            prompt = self._build_prompt(spec, instructions)
            
            # Call Gemini API
            on_log_line(f"Calling {self.model} API...")
            files_map = await self._call_gemini(prompt, on_log_line)
            
            if not files_map:
                on_log_line("Gemini generation failed, falling back to stub")
                return self._generate_stub(repo_dir)
            
            # Write generated files
            self._write_files(repo_dir, files_map, on_log_line)
            
            on_log_line("Gemini code generation completed")
            return True
            
        except Exception as e:
            logger.error(f"Gemini fallback failed: {e}")
            on_log_line(f"Gemini generation error: {str(e)}, using stub")
            return self._generate_stub(repo_dir)
    
    def _build_prompt(self, spec: Dict[str, Any], instructions: str) -> str:
        """Build prompt for Gemini"""
        project_name = spec.get("project", {}).get("name", "Project")
        stack = spec.get("stack", [])
        
        prompt = f"""You are generating code for a project: {project_name}

Stack: {', '.join(stack)}

Instructions:
{instructions}

Generate a complete, working codebase. Return ONLY a JSON object with this exact structure:
{{
  "files": {{
    "README.md": "# Project Name\\n\\nDescription and setup instructions...",
    "path/to/file.ext": "file content here"
  }}
}}

Generate at minimum:
1. README.md with setup and run instructions
2. A working application entry point
3. Configuration files (package.json, requirements.txt, etc.)

Return only the JSON, no markdown code blocks, no explanation.
"""
        return prompt
    
    async def _call_gemini(self, prompt: str, on_log_line: Callable[[str], None]) -> Optional[Dict[str, str]]:
        """Call Gemini API to generate code"""
        try:
            import google.generativeai as genai
            
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.model)
            
            response = await model.generate_content_async(prompt)
            text = response.text.strip()
            
            # Remove markdown code blocks if present
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            
            result = json.loads(text)
            return result.get("files", {})
            
        except ImportError:
            on_log_line("google-generativeai not installed, using stub")
            return None
        except json.JSONDecodeError as e:
            on_log_line(f"Failed to parse Gemini response: {e}")
            return None
        except Exception as e:
            on_log_line(f"Gemini API error: {e}")
            return None
    
    def _write_files(self, repo_dir: Path, files_map: Dict[str, str], on_log_line: Callable[[str], None]) -> None:
        """Write generated files to repository"""
        for file_path, content in files_map.items():
            full_path = repo_dir / file_path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content, encoding="utf-8")
            on_log_line(f"Generated: {file_path}")
    
    def _generate_stub(self, repo_dir: Path) -> bool:
        """Generate minimal stub code when no API is available"""
        logger.info("Generating minimal stub code")
        
        # README.md
        readme = """# Generated Project

This project was generated by Architex Agent Runner.

## Setup

1. Install dependencies (if applicable)
2. Configure environment variables
3. Run the application

## Status

This is a minimal stub. Full code generation requires:
- Cline CLI, or
- Google Gemini API key
"""
        (repo_dir / "README.md").write_text(readme, encoding="utf-8")
        
        # Minimal web page
        index_html = """<!DOCTYPE html>
<html>
<head>
    <title>Generated Project</title>
</head>
<body>
    <h1>Generated Project</h1>
    <p>This is a minimal stub generated by Architex Agent Runner.</p>
</body>
</html>
"""
        (repo_dir / "generated" / "index.html").mkdir(parents=True, exist_ok=True)
        (repo_dir / "generated" / "index.html").write_text(index_html, encoding="utf-8")
        
        return True
