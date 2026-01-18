"""
Code Generator - Layer 3: Intelligent Code Generation

This is where the REAL MAGIC happens.

Unlike mock_app_generator (templates), this uses ACTUAL LLM intelligence
to produce connected, working code from architecture specifications.

Key differences from mock:
1. LLM generates code based on spec semantics
2. Components are connected (frontend calls backend, backend queries DB)
3. Code is production-quality with proper patterns
4. Each file is generated with context of the whole system

The workflow:
1. ArchitectureTranslator → Semantic DSL
2. This module → Intelligent prompts per file
3. LLM → Actual code
4. Write files → Git → GitHub
"""

import logging
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field

from services.architecture_translator import (
    ArchitectureTranslator,
    TranslatedArchitecture,
    TranslatedComponent,
    ComponentType,
    COMPONENT_SEMANTICS,
    get_translator,
)
from services.llm_interface import LLMInterface, get_default_llm_service

logger = logging.getLogger(__name__)


# ============================================================================
# FILE GENERATION PLAN
# ============================================================================

@dataclass
class FilePlan:
    """A planned file to generate."""
    path: str
    purpose: str
    component_id: str
    dependencies: List[str] = field(default_factory=list)  # Other files this depends on
    context: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GenerationPlan:
    """Complete plan for generating a codebase."""
    project_name: str
    files: List[FilePlan]
    architecture: TranslatedArchitecture


# ============================================================================
# INTELLIGENT PROMPT BUILDER
# ============================================================================

class PromptBuilder:
    """
    Builds intelligent prompts for code generation.
    
    Unlike templates, these prompts describe WHAT the code should do,
    and let the LLM figure out HOW to do it well.
    """
    
    def __init__(self, architecture: TranslatedArchitecture):
        self.arch = architecture
        self.component_map = {c.id: c for c in architecture.components}
    
    def build_system_prompt(self) -> str:
        """Build the system prompt establishing context."""
        return f"""You are an expert full-stack developer building a production-ready application.

PROJECT: {self.arch.project_name}
USER REQUEST: {self.arch.user_prompt}

ARCHITECTURE:
{self._describe_architecture()}

INTERACTIONS:
{self._describe_interactions()}

CODING STANDARDS:
- Write clean, maintainable, production-ready code
- Use TypeScript for frontend, Python for FastAPI backends
- Include proper error handling and logging
- Follow security best practices
- Make components actually work together (real API calls, real DB queries)
- Use environment variables for secrets
- Include proper types/interfaces

CRITICAL: This must be REAL, WORKING code, not templates or placeholders.
Every API route should do something. Every DB call should work.
Every frontend page should actually call the backend.
"""

    def _describe_architecture(self) -> str:
        """Describe the architecture in natural language."""
        lines = []
        for comp in self.arch.components:
            lines.append(f"- {comp.name}: {comp.description}")
            if comp.features:
                lines.append(f"  Features: {', '.join(comp.features)}")
        return "\n".join(lines)
    
    def _describe_interactions(self) -> str:
        """Describe how components interact."""
        lines = []
        for interaction in self.arch.interactions:
            lines.append(f"- {interaction.description}")
        return "\n".join(lines) if lines else "- Components work together as a unified system"
    
    def build_file_prompt(self, file_plan: FilePlan, existing_files: Dict[str, str]) -> str:
        """
        Build a prompt for generating a specific file.
        
        Args:
            file_plan: The file to generate
            existing_files: Already generated files (for context)
        """
        component = self.component_map.get(file_plan.component_id)
        
        # Build context from existing files
        context_str = ""
        if file_plan.dependencies:
            context_str = "\n\nRELEVANT EXISTING FILES:\n"
            for dep_path in file_plan.dependencies[:5]:  # Limit context size
                if dep_path in existing_files:
                    content = existing_files[dep_path]
                    # Truncate very long files
                    if len(content) > 2000:
                        content = content[:2000] + "\n... (truncated)"
                    context_str += f"\n--- {dep_path} ---\n{content}\n"
        
        prompt = f"""Generate the file: {file_plan.path}

PURPOSE: {file_plan.purpose}

COMPONENT: {component.name if component else 'General'} ({component.component_type.value if component else 'utility'})
{context_str}

REQUIREMENTS:
1. Write complete, production-ready code
2. Include all imports and dependencies
3. Add proper TypeScript types / Python type hints
4. Include error handling
5. Make it actually functional, not placeholder code
6. Integrate with other components in the architecture

Return ONLY the file content, no markdown code blocks or explanations.
Start the file now:
"""
        return prompt


# ============================================================================
# GENERATION PLANNER
# ============================================================================

class GenerationPlanner:
    """
    Creates a plan for which files to generate and in what order.
    
    Order matters because some files depend on others:
    - Types/interfaces first
    - Then utilities
    - Then core logic
    - Then pages/routes
    """
    
    def __init__(self, architecture: TranslatedArchitecture):
        self.arch = architecture
        self.component_map = {c.id: c for c in architecture.components}
    
    def create_plan(self) -> GenerationPlan:
        """Create a complete generation plan."""
        files: List[FilePlan] = []
        
        # Collect component types for conditional generation
        comp_types = {c.component_type for c in self.arch.components}
        
        # Always generate root files
        files.extend(self._plan_root_files())
        
        # Generate per-component files
        for comp in self.arch.components:
            files.extend(self._plan_component_files(comp))
        
        # Generate integration files (where components meet)
        files.extend(self._plan_integration_files())
        
        return GenerationPlan(
            project_name=self.arch.project_name,
            files=files,
            architecture=self.arch,
        )
    
    def _plan_root_files(self) -> List[FilePlan]:
        """Plan root configuration files."""
        comp_types = {c.component_type for c in self.arch.components}
        files = []
        
        # Determine if this is a frontend or backend project
        has_frontend = any(ct in comp_types for ct in [ComponentType.NEXTJS, ComponentType.REACT, ComponentType.VITE])
        has_backend = any(ct in comp_types for ct in [ComponentType.FASTAPI, ComponentType.EXPRESS, ComponentType.FLASK])
        
        if has_frontend:
            files.extend([
                FilePlan("package.json", "NPM package configuration with all dependencies", "root"),
                FilePlan("tsconfig.json", "TypeScript configuration", "root"),
                FilePlan("tailwind.config.ts", "Tailwind CSS configuration", "root"),
                FilePlan(".env.example", "Environment variables template", "root"),
            ])
            
            if ComponentType.NEXTJS in comp_types:
                files.append(FilePlan("next.config.js", "Next.js configuration", "root"))
        
        if has_backend:
            files.extend([
                FilePlan("requirements.txt", "Python dependencies", "root"),
                FilePlan("Dockerfile", "Docker configuration for deployment", "root"),
            ])
        
        files.append(FilePlan("README.md", "Project documentation with setup instructions", "root"))
        
        return files
    
    def _plan_component_files(self, comp: TranslatedComponent) -> List[FilePlan]:
        """Plan files for a specific component."""
        files = []
        ct = comp.component_type
        
        if ct == ComponentType.NEXTJS:
            files.extend([
                FilePlan("src/app/layout.tsx", "Root layout with providers and metadata", comp.id),
                FilePlan("src/app/page.tsx", f"Landing page for {self.arch.project_name}", comp.id),
                FilePlan("src/app/globals.css", "Global styles with Tailwind", comp.id),
                FilePlan("src/lib/api.ts", "API client for backend communication", comp.id, 
                         context={"backend_url": "process.env.NEXT_PUBLIC_API_URL"}),
            ])
            
        elif ct == ComponentType.FASTAPI:
            files.extend([
                FilePlan("main.py", "FastAPI application entry point with all routes", comp.id),
                FilePlan("models.py", "Pydantic models and database schemas", comp.id),
                FilePlan("database.py", "Database connection and session management", comp.id),
            ])
            
        elif ct == ComponentType.SUPABASE:
            files.extend([
                FilePlan("src/lib/supabase.ts", "Supabase client initialization", comp.id),
                FilePlan("supabase/migrations/001_initial.sql", "Initial database schema", comp.id),
            ])
            
        elif ct == ComponentType.POSTGRES:
            files.extend([
                FilePlan("database.py", "PostgreSQL connection with SQLAlchemy", comp.id),
                FilePlan("migrations/001_initial.sql", "Initial schema migration", comp.id),
            ])
            
        elif ct == ComponentType.STRIPE:
            files.extend([
                FilePlan("src/app/api/stripe/route.ts", "Stripe webhook handler", comp.id) if self._has_nextjs() else
                FilePlan("billing/stripe.py", "Stripe integration for payments", comp.id),
                FilePlan("src/app/pricing/page.tsx", "Pricing page with plans", comp.id) if self._has_nextjs() else None,
            ])
            files = [f for f in files if f is not None]
            
        elif ct == ComponentType.AUTH:
            if self._has_nextjs():
                files.extend([
                    FilePlan("src/lib/auth.ts", "Authentication utilities and hooks", comp.id),
                    FilePlan("src/app/login/page.tsx", "Login page", comp.id),
                    FilePlan("src/app/signup/page.tsx", "Signup page", comp.id),
                ])
            else:
                files.extend([
                    FilePlan("auth/auth.py", "Authentication routes and logic", comp.id),
                    FilePlan("auth/jwt.py", "JWT token management", comp.id),
                ])
                
        elif ct == ComponentType.REDIS:
            files.append(FilePlan("cache.py", "Redis caching layer", comp.id))
            
        elif ct == ComponentType.OPENAI:
            files.append(FilePlan("ai/openai_client.py", "OpenAI API integration", comp.id))
        
        return files
    
    def _plan_integration_files(self) -> List[FilePlan]:
        """Plan files that integrate multiple components."""
        files = []
        comp_types = {c.component_type for c in self.arch.components}
        
        # Dashboard page if we have auth + frontend
        if ComponentType.AUTH in comp_types and self._has_nextjs():
            files.append(FilePlan(
                "src/app/dashboard/page.tsx",
                "Protected dashboard showing user data",
                "integration",
                dependencies=["src/lib/auth.ts", "src/lib/api.ts"],
            ))
        
        # API routes connecting frontend to backend
        if self._has_nextjs() and self._has_backend():
            files.append(FilePlan(
                "src/app/api/data/route.ts",
                "API route proxying to backend",
                "integration",
            ))
        
        return files
    
    def _has_nextjs(self) -> bool:
        return any(c.component_type == ComponentType.NEXTJS for c in self.arch.components)
    
    def _has_backend(self) -> bool:
        backend_types = {ComponentType.FASTAPI, ComponentType.EXPRESS, ComponentType.FLASK}
        return any(c.component_type in backend_types for c in self.arch.components)


# ============================================================================
# CODE GENERATOR ENGINE
# ============================================================================

class CodeGenerator:
    """
    The main code generation engine.
    
    Orchestrates:
    1. Architecture translation
    2. Generation planning
    3. LLM code generation
    4. File writing
    """
    
    def __init__(self, llm_service: Optional[LLMInterface] = None):
        self.llm = llm_service
        self.translator = get_translator()
    
    async def generate(
        self,
        architecture_spec: Dict[str, Any],
        workspace_path: Path,
        progress_callback=None,
    ) -> List[str]:
        """
        Generate a complete codebase from architecture spec.
        
        Args:
            architecture_spec: The raw architecture from frontend
            workspace_path: Where to write files
            progress_callback: Optional progress updates
            
        Returns:
            List of file paths created
        """
        # Get LLM service
        if self.llm is None:
            self.llm = get_default_llm_service()
        
        logger.info(f"Starting code generation with {self.llm.provider_name}")
        
        # Step 1: Translate architecture
        translated = self.translator.translate(architecture_spec)
        logger.info(f"Translated architecture: {len(translated.components)} components")
        
        if progress_callback:
            await progress_callback("Translated architecture", None, 0, translated.to_instruction_dsl())
        
        # Step 2: Create generation plan
        planner = GenerationPlanner(translated)
        plan = planner.create_plan()
        logger.info(f"Generation plan: {len(plan.files)} files to create")
        
        if progress_callback:
            await progress_callback(f"Planned {len(plan.files)} files", None, 1, None)
        
        # Step 3: Generate each file
        prompt_builder = PromptBuilder(translated)
        system_prompt = prompt_builder.build_system_prompt()
        
        generated_files: Dict[str, str] = {}
        files_created: List[str] = []
        
        for i, file_plan in enumerate(plan.files):
            logger.info(f"Generating [{i+1}/{len(plan.files)}]: {file_plan.path}")
            
            if progress_callback:
                await progress_callback(
                    f"Generating {file_plan.path}",
                    files_created.copy(),
                    i + 2,
                    None,
                )
            
            # Build file-specific prompt
            file_prompt = prompt_builder.build_file_prompt(file_plan, generated_files)
            
            # Generate with LLM
            try:
                content = await self._generate_file_content(system_prompt, file_prompt)
                
                # Write file
                file_path = workspace_path / file_plan.path
                file_path.parent.mkdir(parents=True, exist_ok=True)
                file_path.write_text(content, encoding="utf-8")
                
                # Track
                generated_files[file_plan.path] = content
                files_created.append(file_plan.path)
                
                logger.info(f"  ✓ Created {file_plan.path}")
                
            except Exception as e:
                logger.error(f"  ✗ Failed to generate {file_plan.path}: {e}")
                # Continue with other files
        
        if progress_callback:
            await progress_callback(
                f"Generation complete: {len(files_created)} files",
                files_created,
                len(plan.files) + 2,
                None,
            )
        
        return files_created
    
    async def _generate_file_content(self, system_prompt: str, file_prompt: str) -> str:
        """Generate a single file's content using LLM."""
        # Use the LLM's chat completion
        response = await self.llm.generate_architecture(
            description=f"{system_prompt}\n\n{file_prompt}",
            requirements=None,
            tech_stack=None,
        )
        
        # Extract the content
        content = response.get("architecture", "")
        
        # Clean up any markdown code blocks the LLM might add
        content = self._clean_code_output(content)
        
        return content
    
    def _clean_code_output(self, content: str) -> str:
        """Remove markdown code blocks and other artifacts."""
        # Remove ```language and ``` markers
        import re
        
        # Pattern for code blocks
        pattern = r'^```\w*\n?|```$'
        content = re.sub(pattern, '', content, flags=re.MULTILINE)
        
        # Remove leading/trailing whitespace
        content = content.strip()
        
        # If it starts with JSON (for package.json etc), try to parse and reformat
        if content.startswith('{'):
            try:
                parsed = json.loads(content)
                content = json.dumps(parsed, indent=2)
            except:
                pass
        
        return content


# ============================================================================
# MODULE-LEVEL INTERFACE
# ============================================================================

_generator: Optional[CodeGenerator] = None


def get_code_generator() -> CodeGenerator:
    """Get singleton generator instance."""
    global _generator
    if _generator is None:
        _generator = CodeGenerator()
    return _generator


async def generate_codebase(
    architecture_spec: Dict[str, Any],
    workspace_path: Path,
    progress_callback=None,
) -> List[str]:
    """
    Generate a complete codebase from architecture spec.
    
    This is the main entry point for REAL code generation.
    
    Args:
        architecture_spec: Raw spec from frontend (nodes, edges, prompt)
        workspace_path: Path to write files
        progress_callback: Optional callback for progress
        
    Returns:
        List of file paths created
    """
    generator = get_code_generator()
    return await generator.generate(architecture_spec, workspace_path, progress_callback)


# ============================================================================
# CLI for testing
# ============================================================================

if __name__ == "__main__":
    import asyncio
    import tempfile
    from services.architecture_translator import GOLDEN_DEMO_SPEC
    
    async def main():
        print("=" * 60)
        print("CODE GENERATOR - Intelligent Generation Demo")
        print("=" * 60)
        print()
        
        # Create temp workspace
        workspace = Path(tempfile.mkdtemp(prefix="codegen_"))
        print(f"Workspace: {workspace}")
        print()
        
        async def progress(step, files, iteration, spec):
            print(f"[{iteration}] {step}")
            if files:
                print(f"    Files: {len(files)}")
        
        try:
            files = await generate_codebase(GOLDEN_DEMO_SPEC, workspace, progress)
            
            print()
            print(f"Generated {len(files)} files:")
            for f in sorted(files):
                print(f"  - {f}")
            
            print()
            print(f"Files at: {workspace}")
            
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
    
    asyncio.run(main())
