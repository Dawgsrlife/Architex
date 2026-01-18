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
    
    # === BACKEND FILE BUILDERS (RICH CONTEXT) ===
    
    def _add_fastapi_main(self):
        """Generate main.py with full initialization."""
        routes = [entity.plural_name.lower() for entity in self.model.entities]
        router_imports = ", ".join([f"{r}_router" for r in routes]) if routes else "# No routers yet"
        
        self.files.append(FileInstruction(
            path="main.py",
            file_type=FileType.ROUTE,
            purpose=f"FastAPI application entry point for {self.model.app_name}",
            must_include=[
                "from fastapi import FastAPI",
                "from fastapi.middleware.cors import CORSMiddleware",
                "app = FastAPI(title='" + self.model.app_name + "')",
                "# CORS - Allow all origins for demo",
                "app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])",
                "# Health check endpoint",
                "@app.get('/health')",
                "def health_check(): return {'status': 'healthy'}",
                *[f"from routes.{r} import router as {r}_router" for r in routes[:5]],
                *[f"app.include_router({r}_router, prefix='/{r}', tags=['{r.title()}'])" for r in routes[:5]],
            ],
            must_not_include=["hardcoded secrets", "debug=True in production"],
            template_hint="""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Import routers
{router_imports}

app = FastAPI(
    title="{app_name}",
    description="Auto-generated API by Architex",
    version="1.0.0"
)

# CORS middleware - allow all origins for demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "app": "{app_name}"}

# Include routers
{router_includes}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
""",
        ))
    
    def _add_fastapi_database(self, database: str):
        """Generate database.py with full connection logic."""
        if database == "postgres":
            self.files.append(FileInstruction(
                path="database.py",
                file_type=FileType.UTILITY,
                purpose="PostgreSQL database connection with SQLAlchemy ORM",
                must_include=[
                    "from sqlalchemy import create_engine",
                    "from sqlalchemy.ext.declarative import declarative_base",
                    "from sqlalchemy.orm import sessionmaker, Session",
                    "import os",
                    "SQLALCHEMY_DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://...')",
                    "engine = create_engine(SQLALCHEMY_DATABASE_URL)",
                    "SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)",
                    "Base = declarative_base()",
                    "def get_db():",
                    "    db = SessionLocal()",
                    "    try:",
                    "        yield db",
                    "    finally:",
                    "        db.close()",
                ],
                template_hint="""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

# Database URL from environment variable
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://user:password@localhost:5432/dbname"
)

# Create engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    \"\"\"Dependency that provides a database session.\"\"\"
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    \"\"\"Create all tables in the database.\"\"\"
    Base.metadata.create_all(bind=engine)
""",
            ))
    
    def _add_fastapi_model(self, entity: DomainEntity):
        """Generate SQLAlchemy model with proper fields and relationships."""
        # Build field descriptions
        field_descriptions = []
        for f in entity.fields:
            ref = f" (FK to {f.reference_to})" if f.reference_to else ""
            field_descriptions.append(f"  - {f.name}: {f.field_type}{ref}")
        
        related_entities = [f.reference_to for f in entity.fields if f.reference_to]
        relationships = ", ".join(related_entities) if related_entities else "None"
        
        self.files.append(FileInstruction(
            path=f"models/{entity.name.lower()}.py",
            file_type=FileType.MODEL,
            purpose=f"SQLAlchemy ORM model for {entity.name} with full field definitions",
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
                "from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text",
                "from sqlalchemy.dialects.postgresql import UUID",
                "from sqlalchemy.orm import relationship",
                "from datetime import datetime",
                "import uuid",
                "from database import Base",
                f"class {entity.name}(Base):",
                f'    __tablename__ = "{entity.plural_name.lower()}"',
                "    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)",
                "    created_at = Column(DateTime, default=datetime.utcnow)",
                "    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)",
                *[f"    {f.name} = Column(...)" for f in entity.fields[:5] if f.name not in ['id', 'created_at', 'updated_at']],
            ],
            imports_from=["database.py"],
            template_hint=f"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base

class {entity.name}(Base):
    \"\"\"
    {entity.description}
    
    Related entities: {relationships}
    \"\"\"
    __tablename__ = "{entity.plural_name.lower()}"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Fields from architecture:
{chr(10).join(['    # ' + d for d in field_descriptions])}
    
    # ADD YOUR COLUMN DEFINITIONS HERE based on the fields above
    # Example: name = Column(String(255), nullable=False)
    
    def __repr__(self):
        return f"<{entity.name}(id={{self.id}})>"
""",
        ))
    
    def _add_fastapi_routes(self):
        """Generate CRUD routes with full implementation."""
        for entity in self.model.entities:
            self.files.append(FileInstruction(
                path=f"routes/{entity.name.lower()}.py",
                file_type=FileType.ROUTE,
                purpose=f"Full CRUD API routes for {entity.name} with Pydantic schemas and error handling",
                entity=entity.name,
                must_include=[
                    "from fastapi import APIRouter, Depends, HTTPException, status",
                    "from sqlalchemy.orm import Session",
                    "from pydantic import BaseModel",
                    "from typing import List, Optional",
                    "from database import get_db",
                    f"from models.{entity.name.lower()} import {entity.name}",
                    "router = APIRouter()",
                    "# Pydantic schemas",
                    f"class {entity.name}Create(BaseModel):",
                    f"class {entity.name}Response(BaseModel):",
                    "    class Config: orm_mode = True",
                    f"@router.get('/', response_model=List[{entity.name}Response])",
                    f"def list_{entity.plural_name.lower()}(db: Session = Depends(get_db)):",
                    f"@router.post('/', response_model={entity.name}Response, status_code=status.HTTP_201_CREATED)",
                    f"def create_{entity.name.lower()}(data: {entity.name}Create, db: Session = Depends(get_db)):",
                    f"@router.get('/{{id}}', response_model={entity.name}Response)",
                    f"def get_{entity.name.lower()}(id: str, db: Session = Depends(get_db)):",
                    "    if not item: raise HTTPException(status_code=404, detail='Not found')",
                    f"@router.put('/{{id}}', response_model={entity.name}Response)",
                    f"@router.delete('/{{id}}', status_code=status.HTTP_204_NO_CONTENT)",
                ],
                imports_from=[f"models/{entity.name.lower()}.py", "database.py"],
                template_hint=f"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from database import get_db
from models.{entity.name.lower()} import {entity.name}

router = APIRouter()

# ============ Pydantic Schemas ============

class {entity.name}Create(BaseModel):
    \"\"\"Schema for creating a new {entity.name}.\"\"\"
    # Add fields here based on entity fields
    pass

class {entity.name}Update(BaseModel):
    \"\"\"Schema for updating a {entity.name}.\"\"\"
    # All fields optional for partial updates
    pass

class {entity.name}Response(BaseModel):
    \"\"\"Schema for {entity.name} response.\"\"\"
    id: UUID
    created_at: datetime
    updated_at: datetime
    # Add other fields
    
    class Config:
        orm_mode = True

# ============ CRUD Endpoints ============

@router.get("/", response_model=List[{entity.name}Response])
def list_{entity.plural_name.lower()}(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    \"\"\"List all {entity.plural_name}.\"\"\"
    items = db.query({entity.name}).offset(skip).limit(limit).all()
    return items

@router.post("/", response_model={entity.name}Response, status_code=status.HTTP_201_CREATED)
def create_{entity.name.lower()}(data: {entity.name}Create, db: Session = Depends(get_db)):
    \"\"\"Create a new {entity.name}.\"\"\"
    item = {entity.name}(**data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/{{id}}", response_model={entity.name}Response)
def get_{entity.name.lower()}(id: str, db: Session = Depends(get_db)):
    \"\"\"Get a {entity.name} by ID.\"\"\"
    item = db.query({entity.name}).filter({entity.name}.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="{entity.name} not found")
    return item

@router.put("/{{id}}", response_model={entity.name}Response)
def update_{entity.name.lower()}(id: str, data: {entity.name}Update, db: Session = Depends(get_db)):
    \"\"\"Update a {entity.name}.\"\"\"
    item = db.query({entity.name}).filter({entity.name}.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="{entity.name} not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{{id}}", status_code=status.HTTP_204_NO_CONTENT)
def delete_{entity.name.lower()}(id: str, db: Session = Depends(get_db)):
    \"\"\"Delete a {entity.name}.\"\"\"
    item = db.query({entity.name}).filter({entity.name}.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="{entity.name} not found")
    db.delete(item)
    db.commit()
    return None
""",
            ))
    
    # === FRONTEND FILE BUILDERS (RICH CONTEXT) ===
    
    def _add_nextjs_layout(self):
        """Generate root layout with full metadata and navigation."""
        nav_links = [f"/{entity.plural_name.lower()}" for entity in self.model.entities]
        
        self.files.append(FileInstruction(
            path="src/app/layout.tsx",
            file_type=FileType.PAGE,
            purpose=f"Root layout for {self.model.app_name} with navigation and global styles",
            must_include=[
                "import './globals.css'",
                "import { Inter } from 'next/font/google'",
                "const inter = Inter({ subsets: ['latin'] })",
                "export const metadata = { title: '" + self.model.app_name + "', description: '...' }",
                "export default function RootLayout({ children })",
                "<html lang='en'>",
                "<body className={inter.className}>",
                "// Navigation bar with links",
                "<nav className='...'>",
                *[f"<Link href='{link}'>" for link in nav_links[:3]],
                "{children}",
                "</body>",
                "</html>",
            ],
            template_hint=f"""
import './globals.css'
import {{ Inter }} from 'next/font/google'
import Link from 'next/link'

const inter = Inter({{ subsets: ['latin'] }})

export const metadata = {{
  title: '{self.model.app_name}',
  description: 'Auto-generated by Architex - {self.model.intent[:50]}...',
}}

export default function RootLayout({{
  children,
}}: {{
  children: React.ReactNode
}}) {{
  return (
    <html lang="en">
      <body className={{inter.className + ' bg-gray-50 dark:bg-gray-900 min-h-screen'}}>
        {{/* Navigation */}}
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                  {self.model.app_name}
                </Link>
                <div className="hidden md:ml-6 md:flex md:space-x-4">
                  <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Dashboard
                  </Link>
                  {' '.join([f'<Link href="/{e.plural_name.lower()}">{e.plural_name}</Link>' for e in self.model.entities[:3]])}
                </div>
              </div>
            </div>
          </div>
        </nav>
        {{/* Main content */}}
        <main>{{children}}</main>
      </body>
    </html>
  )
}}
""",
        ))
    
    def _add_nextjs_globals(self):
        """Generate global CSS with Tailwind and custom theme."""
        self.files.append(FileInstruction(
            path="src/app/globals.css",
            file_type=FileType.STYLE,
            purpose="Global styles with Tailwind CSS and custom theme",
            must_include=[
                "@tailwind base;",
                "@tailwind components;",
                "@tailwind utilities;",
                "/* Custom component classes */",
                ".btn-primary { @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors; }",
                ".card { @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6; }",
                ".input { @apply w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent; }",
            ],
            template_hint="""
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom component classes for consistent styling */
@layer components {
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md;
  }
  
  .btn-secondary {
    @apply bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors;
  }
  
  .card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow;
  }
  
  .input {
    @apply w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all;
  }
  
  .label {
    @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
  }
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Focus visible for accessibility */
:focus-visible {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}
""",
        ))
    
    def _add_nextjs_api_client(self):
        """Generate typed API client with functions for all entities."""
        entities = self.model.entities
        
        self.files.append(FileInstruction(
            path="src/lib/api.ts",
            file_type=FileType.UTILITY,
            purpose="Typed API client with CRUD functions for all entities",
            must_include=[
                "const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'",
                "// Generic fetch wrapper with error handling",
                "async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T>",
                "// Handle response errors",
                "if (!response.ok) throw new Error(...)",
                *[f"// {entity.name} API functions" for entity in entities[:3]],
                *[f"export async function get{entity.plural_name}()" for entity in entities[:3]],
                *[f"export async function create{entity.name}(data: {entity.name}Create)" for entity in entities[:3]],
                *[f"export async function delete{entity.name}(id: string)" for entity in entities[:3]],
            ],
            must_not_include=["hardcoded localhost in production code"],
            template_hint=f"""
// API Client - Auto-generated by Architex

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============ Types ============
{chr(10).join([f'''
export interface {e.name} {{
  id: string;
  created_at: string;
  updated_at: string;
  // Add fields based on your schema
}}

export interface {e.name}Create {{
  // Fields for creating a new {e.name}
}}
''' for e in entities])}

// ============ Generic Fetch Wrapper ============

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {{
  const response = await fetch(`${{API_URL}}${{endpoint}}`, {{
    headers: {{
      'Content-Type': 'application/json',
      ...options?.headers,
    }},
    ...options,
  }});
  
  if (!response.ok) {{
    const error = await response.json().catch(() => ({{ detail: 'Unknown error' }}));
    throw new Error(error.detail || `HTTP ${{response.status}}`);
  }}
  
  if (response.status === 204) return undefined as T;
  return response.json();
}}

// ============ Entity API Functions ============
{chr(10).join([f'''
// --- {e.plural_name} ---
export async function get{e.plural_name}(): Promise<{e.name}[]> {{
  return fetchApi<{e.name}[]>('/{e.plural_name.lower()}');
}}

export async function get{e.name}(id: string): Promise<{e.name}> {{
  return fetchApi<{e.name}>(`/{e.plural_name.lower()}/${{id}}`);
}}

export async function create{e.name}(data: {e.name}Create): Promise<{e.name}> {{
  return fetchApi<{e.name}>('/{e.plural_name.lower()}', {{
    method: 'POST',
    body: JSON.stringify(data),
  }});
}}

export async function update{e.name}(id: string, data: Partial<{e.name}Create>): Promise<{e.name}> {{
  return fetchApi<{e.name}>(`/{e.plural_name.lower()}/${{id}}`, {{
    method: 'PUT',
    body: JSON.stringify(data),
  }});
}}

export async function delete{e.name}(id: string): Promise<void> {{
  return fetchApi<void>(`/{e.plural_name.lower()}/${{id}}`, {{ method: 'DELETE' }});
}}
''' for e in entities])}
""",
        ))
    
    def _add_nextjs_landing_page(self):
        """MANDATORY: Main landing page with hero, features, and CTA."""
        features = [entity.plural_name for entity in self.model.entities]
        if not features:
            features = ["Core Features", "User Management", "Analytics"]
        
        self.files.append(FileInstruction(
            path="src/app/page.tsx",
            file_type=FileType.PAGE,
            purpose=f"Professional landing page for {self.model.app_name} implementing: {self.model.intent}",
            must_include=[
                "'use client'",
                "import Link from 'next/link'",
                "export default function HomePage()",
                "// Hero section with gradient background",
                "<section className='bg-gradient-to-br from-blue-600 to-purple-700'>",
                f"<h1 className='text-4xl md:text-6xl font-bold'>{self.model.app_name}</h1>",
                "<p className='text-xl text-gray-200'>",
                "// Features grid",
                "<div className='grid md:grid-cols-3 gap-8'>",
                *[f"// Feature card: {f}" for f in features[:3]],
                "// Call to action",
                "<Link href='/dashboard' className='btn-primary'>",
                "Get Started",
                "</a>",
            ],
            must_not_include=["Lorem ipsum", "placeholder", "TODO"],
            template_hint=f"""
'use client'

import Link from 'next/link'
import {{ ArrowRight, CheckCircle, Sparkles, Zap }} from 'lucide-react'

export default function HomePage() {{
  const features = [
{chr(10).join([f"    {{ title: '{f}', description: 'Manage your {f.lower()} efficiently with our intuitive interface.', icon: CheckCircle }}," for f in features[:4]])}
  ];

  return (
    <div className="min-h-screen">
      {{/* Hero Section */}}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Generated by Architex
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {self.model.app_name}
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
            {self.model.intent[:100]}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link 
              href="#features" 
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {{/* Features Section */}}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Powerful features to manage your data efficiently
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {{features.map((feature, index) => (
              <div key={{index}} className="card hover:border-blue-500/50">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {{feature.title}}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {{feature.description}}
                </p>
              </div>
            ))}}
          </div>
        </div>
      </section>

      {{/* CTA Section */}}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start managing your data today with our powerful platform.
          </p>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            Launch Dashboard
          </Link>
        </div>
      </section>

      {{/* Footer */}}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 {self.model.app_name}. Built with Architex.</p>
        </div>
      </footer>
    </div>
  )
}}
""",
        ))
        
        # Also add a main feature component if we have entities
        if self.model.entities:
            primary_entity = self.model.entities[0]
            self.files.append(FileInstruction(
                path=f"src/components/{primary_entity.name}List.tsx",
                file_type=FileType.COMPONENT,
                purpose=f"Interactive CRUD list component for {primary_entity.plural_name} with add/edit/delete",
                entity=primary_entity.name,
                must_include=[
                    "'use client'",
                    "import { useState, useEffect } from 'react'",
                    f"import {{ get{primary_entity.plural_name}, create{primary_entity.name}, delete{primary_entity.name} }} from '@/lib/api'",
                    f"interface {primary_entity.name} {{ id: string; /* ... */ }}",
                    f"export function {primary_entity.name}List()",
                    f"const [items, setItems] = useState<{primary_entity.name}[]>([])",
                    "const [loading, setLoading] = useState(true)",
                    "const [newItem, setNewItem] = useState('')",
                    "// Fetch items on mount",
                    "useEffect(() => { fetchItems() }, [])",
                    "// Add new item handler",
                    "const handleAdd = async () => { ... }",
                    "// Delete item handler",
                    "const handleDelete = async (id: string) => { ... }",
                    "// Render loading state",
                    "// Render items list with map",
                    "// Render add form",
                ],
                imports_from=["src/lib/api.ts"],
                template_hint=f"""
'use client'

import {{ useState, useEffect }} from 'react'
import {{ get{primary_entity.plural_name}, create{primary_entity.name}, delete{primary_entity.name} }} from '@/lib/api'
import {{ Plus, Trash2, Loader2 }} from 'lucide-react'

interface {primary_entity.name} {{
  id: string;
  created_at: string;
  // Add other fields
}}

export function {primary_entity.name}List() {{
  const [items, setItems] = useState<{primary_entity.name}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch items on mount
  useEffect(() => {{
    fetchItems();
  }}, []);

  const fetchItems = async () => {{
    try {{
      setLoading(true);
      const data = await get{primary_entity.plural_name}();
      setItems(data);
      setError(null);
    }} catch (err) {{
      setError(err instanceof Error ? err.message : 'Failed to load items');
    }} finally {{
      setLoading(false);
    }}
  }};

  const handleAdd = async (e: React.FormEvent) => {{
    e.preventDefault();
    if (!newItemName.trim()) return;
    
    try {{
      setCreating(true);
      const newItem = await create{primary_entity.name}({{ name: newItemName }});
      setItems([...items, newItem]);
      setNewItemName('');
    }} catch (err) {{
      setError(err instanceof Error ? err.message : 'Failed to create item');
    }} finally {{
      setCreating(false);
    }}
  }};

  const handleDelete = async (id: string) => {{
    try {{
      await delete{primary_entity.name}(id);
      setItems(items.filter(item => item.id !== id));
    }} catch (err) {{
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }}
  }};

  if (loading) {{
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }}

  return (
    <div className="space-y-6">
      {{/* Add form */}}
      <form onSubmit={{handleAdd}} className="flex gap-4">
        <input
          type="text"
          value={{newItemName}}
          onChange={{(e) => setNewItemName(e.target.value)}}
          placeholder="Add new {primary_entity.name.lower()}..."
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={{creating}}
          className="btn-primary flex items-center gap-2"
        >
          {{creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}}
          Add
        </button>
      </form>

      {{/* Error message */}}
      {{error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {{error}}
        </div>
      )}}

      {{/* Items list */}}
      <div className="space-y-3">
        {{items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No {primary_entity.plural_name.lower()} yet. Add one above!
          </div>
        ) : (
          items.map((item) => (
            <div
              key={{item.id}}
              className="card flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {{item.id}}
                </p>
                <p className="text-sm text-gray-500">
                  Created: {{new Date(item.created_at).toLocaleDateString()}}
                </p>
              </div>
              <button
                onClick={{() => handleDelete(item.id)}}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}}
      </div>
    </div>
  );
}}
""",
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
