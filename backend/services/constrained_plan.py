"""
Constrained Generation Plan - LAYER 4: Explicit File Instructions for Cline

This is the CONTROL LAYER for Cline.

Cline is NOT a creative agent. It is a COMPILER.
It executes explicit instructions, nothing more.

This module creates:
1. An explicit list of files to generate
2. Explicit instructions for EACH file
3. Constraints that Cline CANNOT violate
4. Validation that output matches plan

Key principles:
1. EXPLICIT - every file has detailed instructions
2. CONSTRAINED - no files outside the plan
3. TRACEABLE - every file traces to domain model
4. VALIDATED - output is checked against plan

"Cline isn't smart here. Architex is."
"""

import logging
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path

from services.domain_interpreter import (
    DomainModel,
    DomainEntity,
    AdminPage,
    APIRoute,
    AppType,
    interpret_architecture,
)
from services.architecture_translator import TranslatedArchitecture, get_translator

logger = logging.getLogger(__name__)


# ============================================================================
# FILE INSTRUCTION STRUCTURES
# ============================================================================

class FileType(str, Enum):
    """Types of files to generate."""
    CONFIG = "config"
    MODEL = "model"
    SCHEMA = "schema"
    ROUTE = "route"
    PAGE = "page"
    COMPONENT = "component"
    UTILITY = "utility"
    STYLE = "style"
    TEST = "test"
    DOCUMENTATION = "documentation"


@dataclass
class FileInstruction:
    """
    Explicit instruction for generating ONE file.
    
    Cline reads this and produces EXACTLY this file.
    No creativity, no additions, no omissions.
    """
    path: str
    file_type: FileType
    purpose: str
    
    # Explicit content instructions
    must_include: List[str] = field(default_factory=list)
    must_not_include: List[str] = field(default_factory=list)
    
    # Entity context (if applicable)
    entity: Optional[str] = None
    entity_fields: Optional[List[Dict[str, Any]]] = None
    
    # Dependencies
    imports_from: List[str] = field(default_factory=list)
    
    # Template hints (optional, for faster generation)
    template_hint: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "path": self.path,
            "file_type": self.file_type.value,
            "purpose": self.purpose,
            "must_include": self.must_include,
            "must_not_include": self.must_not_include,
            "entity": self.entity,
            "entity_fields": self.entity_fields,
            "imports_from": self.imports_from,
        }
    
    def to_prompt(self) -> str:
        """Convert to prompt for Cline."""
        lines = [
            f"## FILE: {self.path}",
            f"**Purpose:** {self.purpose}",
            "",
        ]
        
        if self.entity:
            lines.append(f"**Entity:** {self.entity}")
            if self.entity_fields:
                lines.append("**Fields:**")
                for f in self.entity_fields:
                    lines.append(f"  - {f['name']}: {f['type']} {'(required)' if f.get('required') else '(optional)'}")
            lines.append("")
        
        if self.must_include:
            lines.append("**MUST include:**")
            for item in self.must_include:
                lines.append(f"  - {item}")
            lines.append("")
        
        if self.must_not_include:
            lines.append("**MUST NOT include:**")
            for item in self.must_not_include:
                lines.append(f"  - {item}")
            lines.append("")
        
        if self.imports_from:
            lines.append(f"**Imports from:** {', '.join(self.imports_from)}")
            lines.append("")
        
        return "\n".join(lines)


@dataclass
class ConstrainedGenerationPlan:
    """
    Complete, explicit plan for code generation.
    
    This is the CONTRACT between Architex and Cline.
    Cline executes this plan EXACTLY.
    """
    app_name: str
    app_type: AppType
    domain_model: DomainModel
    files: List[FileInstruction]
    
    # Explicit constraints
    allowed_directories: List[str] = field(default_factory=list)
    forbidden_patterns: List[str] = field(default_factory=list)
    
    # README mapping (proves architecture → code)
    readme_mapping: Dict[str, List[str]] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "app_name": self.app_name,
            "app_type": self.app_type.value,
            "file_count": len(self.files),
            "files": [f.to_dict() for f in self.files],
            "allowed_directories": self.allowed_directories,
            "forbidden_patterns": self.forbidden_patterns,
            "readme_mapping": self.readme_mapping,
        }
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)
    
    def to_cline_prompt(self) -> str:
        """
        Generate the EXACT prompt that Cline will execute.
        
        This is NOT freeform. It's a deterministic compilation of the plan.
        """
        # Get user intent from domain model
        user_intent = self.domain_model.intent if self.domain_model.intent else "A standard software system"
        
        lines = [
            "=" * 60,
            f"PROJECT: {self.app_name}",
            f"TYPE: {self.app_type.value}",
            "=" * 60,
            "",
            "## USER INTENT (MOST IMPORTANT)",
            "",
            "The user wants to build:",
            f">>> {user_intent}",
            "",
            "Your generated code MUST implement this intent.",
            "",
            "=" * 60,
            "",
            "## YOUR TASK",
            "",
            "You are a code generation agent executing a FIXED plan.",
            "",
            "You MUST:",
            "- Generate ONLY the files listed below",
            "- Follow the instructions for EACH file exactly",
            "- Implement the USER INTENT described above",
            "- Add TODO comments where information is missing",
            "",
            "You MUST NOT:",
            "- Add files not in the plan",
            "- Rename components or routes",
            "- Invent APIs or entities",
            "- Modify the file structure",
            "",
            "=" * 60,
            "FILES TO GENERATE",
            "=" * 60,
            "",
        ]
        
        for file_inst in self.files:
            lines.append(file_inst.to_prompt())
        
        lines.extend([
            "=" * 60,
            "ENTITIES",
            "=" * 60,
            "",
        ])
        
        for entity in self.domain_model.entities:
            lines.append(f"### {entity.name}")
            for f in entity.fields:
                ref = f" → {f.reference_to}" if f.reference_to else ""
                lines.append(f"  - {f.name}: {f.field_type}{ref}")
            lines.append("")
        
        lines.extend([
            "=" * 60,
            "API ROUTES",
            "=" * 60,
            "",
        ])
        
        for route in self.domain_model.api_routes:
            lines.append(f"- {route.method} {route.path} → {route.description}")
        
        lines.extend([
            "",
            "=" * 60,
            "START GENERATING",
            "=" * 60,
            "",
            "Use the write_file tool for each file.",
            "When done with ALL files, call task_complete().",
        ])
        
        return "\n".join(lines)


# ============================================================================
# PLAN BUILDER
# ============================================================================

class GenerationPlanBuilder:
    """
    Builds a constrained generation plan from a domain model.
    
    This is DETERMINISTIC - same domain model → same plan.
    """
    
    def __init__(self, domain_model: DomainModel):
        self.model = domain_model
        self.files: List[FileInstruction] = []
    
    def build(self) -> ConstrainedGenerationPlan:
        """Build the complete generation plan."""
        self.files = []
        
        # Determine tech stack
        frontend = self.model.tech_stack.get("frontend", "nextjs")
        backend = self.model.tech_stack.get("backend", "fastapi")
        database = self.model.tech_stack.get("database", "postgres")
        
        # Build files based on app type
        if self.model.app_type == AppType.ADMIN_DASHBOARD:
            self._build_admin_dashboard_plan(frontend, backend, database)
        elif self.model.app_type == AppType.FULLSTACK_APP:
            self._build_fullstack_plan(frontend, backend, database)
        elif self.model.app_type == AppType.API_BACKEND:
            self._build_api_only_plan(backend, database)
        else:
            self._build_static_plan(frontend)
        
        # Always add README
        self._add_readme()
        
        # Build allowed directories
        allowed_dirs = list(set(
            str(Path(f.path).parent) for f in self.files
        ))
        allowed_dirs.append(".")  # Root
        
        # Build README mapping (architecture → code proof)
        readme_mapping = self._build_readme_mapping()
        
        return ConstrainedGenerationPlan(
            app_name=self.model.app_name,
            app_type=self.model.app_type,
            domain_model=self.model,
            files=self.files,
            allowed_directories=sorted(allowed_dirs),
            forbidden_patterns=["node_modules/", ".git/", "__pycache__/"],
            readme_mapping=readme_mapping,
        )
    
    def _build_admin_dashboard_plan(
        self, 
        frontend: str, 
        backend: str,
        database: str,
    ):
        """Build plan for admin dashboard (Next.js + FastAPI)."""
        # === CONFIG FILES ===
        self._add_package_json(frontend)
        self._add_typescript_config()
        self._add_tailwind_config()
        self._add_env_example()
        
        if backend == "fastapi":
            self._add_requirements_txt()
            self._add_dockerfile()
        
        # === BACKEND FILES ===
        if backend == "fastapi":
            self._add_fastapi_main()
            self._add_fastapi_database(database)
            
            # Models for each entity
            for entity in self.model.entities:
                self._add_fastapi_model(entity)
            
            # Routes for each entity
            self._add_fastapi_routes()
        
        # === FRONTEND FILES ===
        if frontend == "nextjs":
            self._add_nextjs_layout()
            self._add_nextjs_globals()
            self._add_nextjs_api_client()
            
            # MANDATORY: Main landing page (implements user intent)
            self._add_nextjs_landing_page()
            
            # Auth pages (if needed)
            if self.model.auth_required:
                self._add_nextjs_auth_pages()
            
            # Dashboard page
            self._add_nextjs_dashboard()
            
            # Entity pages
            for entity in self.model.entities:
                self._add_nextjs_entity_pages(entity)
            
            # Shared components
            self._add_nextjs_components()
    
    def _build_fullstack_plan(self, frontend: str, backend: str, database: str):
        """Build plan for full-stack app."""
        # Same as admin for now - can be customized
        self._build_admin_dashboard_plan(frontend, backend, database)
    
    def _build_api_only_plan(self, backend: str, database: str):
        """Build plan for API-only backend."""
        self._add_requirements_txt()
        self._add_dockerfile()
        self._add_env_example()
        
        if backend == "fastapi":
            self._add_fastapi_main()
            self._add_fastapi_database(database)
            
            for entity in self.model.entities:
                self._add_fastapi_model(entity)
            
            self._add_fastapi_routes()
    
    def _build_static_plan(self, frontend: str):
        """Build plan for static frontend."""
        self._add_package_json(frontend)
        self._add_typescript_config()
        self._add_tailwind_config()
        
        if frontend == "nextjs":
            self._add_nextjs_layout()
            self._add_nextjs_globals()
            self.files.append(FileInstruction(
                path="src/app/page.tsx",
                file_type=FileType.PAGE,
                purpose=f"Landing page for {self.model.app_name}",
                must_include=["Export default function", "Tailwind CSS classes"],
            ))
    
    # === CONFIG FILE BUILDERS ===
    
    def _add_package_json(self, frontend: str):
        deps = ["react", "react-dom", "typescript", "tailwindcss"]
        if frontend == "nextjs":
            deps.extend(["next", "@types/node", "@types/react"])
        
        self.files.append(FileInstruction(
            path="package.json",
            file_type=FileType.CONFIG,
            purpose="NPM package configuration",
            must_include=[
                f'"name": "{self.model.app_name.lower().replace(" ", "-")}"',
                '"scripts"',
                *[f'"{dep}"' for dep in deps],
            ],
            must_not_include=["private dependencies"],
        ))
    
    def _add_typescript_config(self):
        self.files.append(FileInstruction(
            path="tsconfig.json",
            file_type=FileType.CONFIG,
            purpose="TypeScript configuration",
            must_include=["compilerOptions", "strict: true", "paths"],
        ))
    
    def _add_tailwind_config(self):
        self.files.append(FileInstruction(
            path="tailwind.config.ts",
            file_type=FileType.CONFIG,
            purpose="Tailwind CSS configuration",
            must_include=["content", "theme", "plugins"],
        ))
    
    def _add_env_example(self):
        env_vars = ["DATABASE_URL", "API_URL"]
        if self.model.auth_required:
            env_vars.extend(["JWT_SECRET", "AUTH_SECRET"])
        
        self.files.append(FileInstruction(
            path=".env.example",
            file_type=FileType.CONFIG,
            purpose="Environment variables template",
            must_include=env_vars,
        ))
    
    def _add_requirements_txt(self):
        deps = ["fastapi", "uvicorn", "pydantic", "python-dotenv"]
        if self.model.tech_stack.get("database") == "postgres":
            deps.extend(["sqlalchemy", "psycopg2-binary", "alembic"])
        if self.model.auth_required:
            deps.extend(["python-jose", "passlib", "bcrypt"])
        
        self.files.append(FileInstruction(
            path="requirements.txt",
            file_type=FileType.CONFIG,
            purpose="Python dependencies",
            must_include=deps,
        ))
    
    def _add_dockerfile(self):
        self.files.append(FileInstruction(
            path="Dockerfile",
            file_type=FileType.CONFIG,
            purpose="Docker configuration for deployment",
            must_include=[
                "FROM python",
                "COPY requirements.txt",
                "RUN pip install",
                "CMD",
            ],
        ))
    
    # === BACKEND FILE BUILDERS ===
    
    def _add_fastapi_main(self):
        routes = [f"/{entity.plural_name.lower()}" for entity in self.model.entities]
        
        self.files.append(FileInstruction(
            path="main.py",
            file_type=FileType.ROUTE,
            purpose="FastAPI application entry point",
            must_include=[
                "from fastapi import FastAPI",
                "app = FastAPI()",
                "CORS middleware",
                *[f'@app.include_router' for _ in routes[:3]],  # Limit
            ],
            must_not_include=["hardcoded secrets", "debug mode in production"],
        ))
    
    def _add_fastapi_database(self, database: str):
        if database == "postgres":
            self.files.append(FileInstruction(
                path="database.py",
                file_type=FileType.UTILITY,
                purpose="Database connection with SQLAlchemy",
                must_include=[
                    "from sqlalchemy import create_engine",
                    "from sqlalchemy.orm import sessionmaker",
                    "SQLALCHEMY_DATABASE_URL",
                    "get_db dependency",
                ],
            ))
    
    def _add_fastapi_model(self, entity: DomainEntity):
        self.files.append(FileInstruction(
            path=f"models/{entity.name.lower()}.py",
            file_type=FileType.MODEL,
            purpose=f"SQLAlchemy model for {entity.name}",
            entity=entity.name,
            entity_fields=[
                {
                    "name": f.name,
                    "type": f.field_type,
                    "required": f.required,
                    "unique": f.unique,
                    "reference_to": f.reference_to,
                }
                for f in entity.fields
            ],
            must_include=[
                "from sqlalchemy import Column",
                f"class {entity.name}(Base):",
                f'__tablename__ = "{entity.plural_name.lower()}"',
            ],
            imports_from=["database.py"],
        ))
    
    def _add_fastapi_routes(self):
        for entity in self.model.entities:
            self.files.append(FileInstruction(
                path=f"routes/{entity.name.lower()}.py",
                file_type=FileType.ROUTE,
                purpose=f"CRUD routes for {entity.name}",
                entity=entity.name,
                must_include=[
                    "from fastapi import APIRouter",
                    "router = APIRouter()",
                    f"@router.get('/')",  # List
                    f"@router.post('/')",  # Create
                    "@router.get('/{id}')",  # Read
                    "@router.put('/{id}')",  # Update
                    "@router.delete('/{id}')",  # Delete
                ],
                imports_from=[f"models/{entity.name.lower()}.py"],
            ))
    
    # === FRONTEND FILE BUILDERS ===
    
    def _add_nextjs_layout(self):
        self.files.append(FileInstruction(
            path="src/app/layout.tsx",
            file_type=FileType.PAGE,
            purpose="Root layout with navigation and providers",
            must_include=[
                "export default function RootLayout",
                "<html>",
                "<body>",
                "Inter font",
                "metadata export",
            ],
        ))
    
    def _add_nextjs_globals(self):
        self.files.append(FileInstruction(
            path="src/app/globals.css",
            file_type=FileType.STYLE,
            purpose="Global styles with Tailwind",
            must_include=[
                "@tailwind base",
                "@tailwind components",
                "@tailwind utilities",
            ],
        ))
    
    def _add_nextjs_api_client(self):
        routes = [f"/{entity.plural_name.lower()}" for entity in self.model.entities]
        
        self.files.append(FileInstruction(
            path="src/lib/api.ts",
            file_type=FileType.UTILITY,
            purpose="API client for backend communication",
            must_include=[
                "const API_URL = process.env.NEXT_PUBLIC_API_URL",
                "async function fetchApi",
                *[f"// {route} endpoints" for route in routes[:3]],
            ],
            must_not_include=["hardcoded URLs"],
        ))
    
    def _add_nextjs_landing_page(self):
        """MANDATORY: Main landing page that implements the user's intent."""
        # Build feature list from entities
        features = [entity.plural_name for entity in self.model.entities]
        if not features:
            features = ["Core Features", "User Management", "Analytics"]
        
        self.files.append(FileInstruction(
            path="src/app/page.tsx",
            file_type=FileType.PAGE,
            purpose=f"Main landing page implementing: {self.model.intent}",
            must_include=[
                "export default function HomePage",
                "Modern Tailwind CSS styling",
                "'use client' directive if using hooks",
                "Hero section with title and description",
                "Feature cards or list section",
                "Call-to-action button",
                f"App title: {self.model.app_name}",
            ],
            must_not_include=["placeholder text only", "lorem ipsum"],
        ))
        
        # Also add a main feature component if we have entities
        if self.model.entities:
            primary_entity = self.model.entities[0]
            self.files.append(FileInstruction(
                path=f"src/components/{primary_entity.name}List.tsx",
                file_type=FileType.COMPONENT,
                purpose=f"Interactive list component for {primary_entity.plural_name}",
                entity=primary_entity.name,
                must_include=[
                    f"export function {primary_entity.name}List",
                    "useState for data management",
                    "Tailwind CSS styling",
                    "Map over items to render list",
                    "Add/delete functionality",
                ],
                imports_from=["src/lib/api.ts"],
            ))
    
    def _add_nextjs_auth_pages(self):
        self.files.append(FileInstruction(
            path="src/app/login/page.tsx",
            file_type=FileType.PAGE,
            purpose="Login page",
            must_include=[
                "export default function LoginPage",
                "email input",
                "password input",
                "submit handler",
            ],
        ))
        
        self.files.append(FileInstruction(
            path="src/app/signup/page.tsx",
            file_type=FileType.PAGE,
            purpose="Sign up page",
            must_include=[
                "export default function SignupPage",
                "email input",
                "password input",
                "name input",
            ],
        ))
        
        self.files.append(FileInstruction(
            path="src/lib/auth.ts",
            file_type=FileType.UTILITY,
            purpose="Authentication utilities and hooks",
            must_include=[
                "useAuth hook",
                "login function",
                "logout function",
                "getSession function",
            ],
        ))
    
    def _add_nextjs_dashboard(self):
        entity_cards = [entity.plural_name for entity in self.model.entities]
        
        self.files.append(FileInstruction(
            path="src/app/dashboard/page.tsx",
            file_type=FileType.PAGE,
            purpose="Main dashboard with entity overviews",
            must_include=[
                "export default function DashboardPage",
                *[f"// {name} overview" for name in entity_cards[:3]],
                "statistics cards",
            ],
        ))
    
    def _add_nextjs_entity_pages(self, entity: DomainEntity):
        slug = entity.plural_name.lower()
        
        # List page
        self.files.append(FileInstruction(
            path=f"src/app/{slug}/page.tsx",
            file_type=FileType.PAGE,
            purpose=f"List all {entity.plural_name}",
            entity=entity.name,
            must_include=[
                f"export default function {entity.plural_name}Page",
                "data table or list",
                "create button",
                "search/filter",
            ],
            imports_from=["src/lib/api.ts"],
        ))
        
        # Create page
        self.files.append(FileInstruction(
            path=f"src/app/{slug}/new/page.tsx",
            file_type=FileType.PAGE,
            purpose=f"Create new {entity.name}",
            entity=entity.name,
            entity_fields=[
                {"name": f.name, "type": f.field_type, "required": f.required}
                for f in entity.fields if f.name not in ["id", "created_at", "updated_at"]
            ],
            must_include=[
                f"export default function Create{entity.name}Page",
                "form",
                "submit handler",
                "validation",
            ],
            imports_from=["src/lib/api.ts"],
        ))
        
        # Edit/Detail page
        self.files.append(FileInstruction(
            path=f"src/app/{slug}/[id]/page.tsx",
            file_type=FileType.PAGE,
            purpose=f"View and edit {entity.name}",
            entity=entity.name,
            entity_fields=[
                {"name": f.name, "type": f.field_type, "required": f.required}
                for f in entity.fields
            ],
            must_include=[
                f"export default function {entity.name}DetailPage",
                "params: { id }",
                "edit form",
                "delete button",
            ],
            imports_from=["src/lib/api.ts"],
        ))
    
    def _add_nextjs_components(self):
        self.files.append(FileInstruction(
            path="src/components/ui/Button.tsx",
            file_type=FileType.COMPONENT,
            purpose="Reusable button component",
            must_include=[
                "interface ButtonProps",
                "export function Button",
                "variants",
            ],
        ))
        
        self.files.append(FileInstruction(
            path="src/components/ui/Input.tsx",
            file_type=FileType.COMPONENT,
            purpose="Reusable input component",
            must_include=[
                "interface InputProps",
                "export function Input",
                "forwardRef",
            ],
        ))
        
        self.files.append(FileInstruction(
            path="src/components/ui/Table.tsx",
            file_type=FileType.COMPONENT,
            purpose="Reusable table component",
            must_include=[
                "interface TableProps",
                "export function Table",
                "thead, tbody, tr, td",
            ],
        ))
        
        self.files.append(FileInstruction(
            path="src/components/layout/Sidebar.tsx",
            file_type=FileType.COMPONENT,
            purpose="Admin sidebar navigation",
            must_include=[
                "export function Sidebar",
                "navigation links",
                *[f"// Link to /{entity.plural_name.lower()}" for entity in self.model.entities[:3]],
            ],
        ))
    
    def _add_readme(self):
        entity_list = ", ".join(e.name for e in self.model.entities)
        
        self.files.append(FileInstruction(
            path="README.md",
            file_type=FileType.DOCUMENTATION,
            purpose="Project documentation mapping architecture to code",
            must_include=[
                f"# {self.model.app_name}",
                f"## Intent\n{self.model.intent}",
                f"## Entities\n{entity_list}",
                "## Architecture Mapping",
                "## Getting Started",
                "## API Routes",
            ],
        ))
    
    def _build_readme_mapping(self) -> Dict[str, List[str]]:
        """Build mapping of architecture nodes to generated files."""
        mapping: Dict[str, List[str]] = {}
        
        # Map entities to files
        for entity in self.model.entities:
            entity_files = [
                f.path for f in self.files 
                if f.entity == entity.name
            ]
            mapping[f"Entity: {entity.name}"] = entity_files
        
        # Map tech stack to files
        if self.model.tech_stack.get("frontend"):
            frontend_files = [f.path for f in self.files if f.path.startswith("src/")]
            mapping["Frontend"] = frontend_files
        
        if self.model.tech_stack.get("backend"):
            backend_files = [f.path for f in self.files if f.path.endswith(".py")]
            mapping["Backend"] = backend_files
        
        return mapping


# ============================================================================
# MODULE-LEVEL INTERFACE
# ============================================================================

def build_generation_plan(architecture_spec: Dict[str, Any]) -> ConstrainedGenerationPlan:
    """
    Main entry point: Architecture → Generation Plan.
    
    This is the deterministic pipeline:
    1. Interpret architecture into domain model
    2. Build explicit file instructions
    3. Return constrained plan
    
    Args:
        architecture_spec: Raw spec from frontend
        
    Returns:
        ConstrainedGenerationPlan ready for Cline execution
    """
    # Step 1: Interpret architecture
    domain_model = interpret_architecture(architecture_spec)
    
    # Step 2: Build plan
    builder = GenerationPlanBuilder(domain_model)
    plan = builder.build()
    
    logger.info(f"Built generation plan: {len(plan.files)} files for {plan.app_name}")
    
    return plan


def get_cline_prompt(architecture_spec: Dict[str, Any]) -> str:
    """
    Get the exact prompt to send to Cline.
    
    This is the FINAL output of the planning layer.
    Cline executes this verbatim.
    """
    plan = build_generation_plan(architecture_spec)
    return plan.to_cline_prompt()


# ============================================================================
# CLI FOR TESTING
# ============================================================================

if __name__ == "__main__":
    from services.architecture_translator import GOLDEN_DEMO_SPEC
    
    print("=" * 60)
    print("CONSTRAINED GENERATION PLAN - Demo")
    print("=" * 60)
    print()
    
    # Test with admin dashboard spec
    admin_spec = {
        "name": "User Admin",
        "prompt": "Internal admin tool for managing users and access logs with role-based permissions",
        "nodes": [
            {"id": "frontend", "type": "nextjs", "data": {"label": "Next.js Admin"}},
            {"id": "backend", "type": "fastapi", "data": {"label": "FastAPI API"}},
            {"id": "db", "type": "postgres", "data": {"label": "PostgreSQL"}},
            {"id": "auth", "type": "auth", "data": {"label": "JWT Auth"}},
        ],
        "edges": [
            {"source": "frontend", "target": "backend"},
            {"source": "backend", "target": "db"},
            {"source": "backend", "target": "auth"},
        ],
    }
    
    plan = build_generation_plan(admin_spec)
    
    print(f"App: {plan.app_name}")
    print(f"Type: {plan.app_type.value}")
    print(f"Files: {len(plan.files)}")
    print()
    
    print("FILES TO GENERATE:")
    for f in plan.files:
        print(f"  [{f.file_type.value}] {f.path}")
    
    print()
    print("=" * 60)
    print("CLINE PROMPT PREVIEW (first 2000 chars):")
    print("=" * 60)
    print()
    print(plan.to_cline_prompt()[:2000])
