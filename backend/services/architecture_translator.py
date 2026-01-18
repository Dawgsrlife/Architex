"""
Architecture Translator - LAYER 2: Semantic Translation

This is the CRITICAL missing piece.

Converts a React Flow graph (nodes + edges + prompt) into a STRICT instruction DSL
that the LLM can follow deterministically.

Key principles:
1. DETERMINISTIC - same input → same output (no LLM in this step)
2. TESTABLE - unit-tested without LLMs
3. EXPLICIT - no implicit inference, every node type has explicit semantics
4. CONSTRAINED - limited vocabulary, not infinite flexibility

The output is a structured instruction document that tells the LLM exactly what to build.
"""

import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


# ============================================================================
# SEMANTIC NODE TYPES - Explicit vocabulary, not free-form
# ============================================================================

class ComponentType(Enum):
    """Known component types with explicit semantics."""
    
    # Frontend
    NEXTJS = "nextjs"
    REACT = "react"
    VITE = "vite"
    
    # Backend
    FASTAPI = "fastapi"
    EXPRESS = "express"
    FLASK = "flask"
    
    # Database
    POSTGRES = "postgres"
    SUPABASE = "supabase"
    MONGODB = "mongodb"
    SQLITE = "sqlite"
    
    # Cache
    REDIS = "redis"
    
    # Auth
    AUTH = "auth"
    OAUTH = "oauth"
    
    # Payments
    STRIPE = "stripe"
    
    # Storage
    S3 = "s3"
    CLOUDINARY = "cloudinary"
    
    # Queue
    CELERY = "celery"
    RABBITMQ = "rabbitmq"
    
    # AI
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    
    # Generic (fallback)
    SERVICE = "service"
    COMPONENT = "component"


# Semantic descriptions for each component type
COMPONENT_SEMANTICS: Dict[ComponentType, Dict[str, Any]] = {
    ComponentType.NEXTJS: {
        "description": "Next.js frontend application with App Router",
        "generates": ["pages/", "app/", "components/", "public/"],
        "files": ["next.config.js", "package.json", "tsconfig.json"],
        "dependencies": ["next", "react", "react-dom", "typescript"],
    },
    ComponentType.REACT: {
        "description": "React SPA with Vite bundler",
        "generates": ["src/", "public/"],
        "files": ["vite.config.ts", "package.json", "index.html"],
        "dependencies": ["react", "react-dom", "vite"],
    },
    ComponentType.FASTAPI: {
        "description": "FastAPI Python REST API",
        "generates": ["api/", "schemas/", "models/"],
        "files": ["main.py", "requirements.txt", "Dockerfile"],
        "dependencies": ["fastapi", "uvicorn", "pydantic"],
    },
    ComponentType.EXPRESS: {
        "description": "Express.js Node.js REST API",
        "generates": ["routes/", "controllers/", "middleware/"],
        "files": ["app.js", "package.json"],
        "dependencies": ["express", "cors", "helmet"],
    },
    ComponentType.SUPABASE: {
        "description": "Supabase backend (Postgres + Auth + Storage)",
        "generates": ["supabase/migrations/"],
        "files": ["supabase/config.toml"],
        "env_vars": ["SUPABASE_URL", "SUPABASE_ANON_KEY"],
    },
    ComponentType.POSTGRES: {
        "description": "PostgreSQL database",
        "generates": ["migrations/"],
        "env_vars": ["DATABASE_URL"],
    },
    ComponentType.MONGODB: {
        "description": "MongoDB document database",
        "generates": ["models/"],
        "env_vars": ["MONGODB_URI"],
    },
    ComponentType.REDIS: {
        "description": "Redis caching layer with connection pooling",
        "env_vars": ["REDIS_URL"],
        "features": ["caching", "session storage", "rate limiting"],
    },
    ComponentType.STRIPE: {
        "description": "Stripe payment integration",
        "generates": ["billing/"],
        "files": ["billing/stripe.py"],
        "env_vars": ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
        "features": ["subscriptions", "one-time payments", "webhooks"],
    },
    ComponentType.AUTH: {
        "description": "Authentication system",
        "generates": ["auth/"],
        "features": ["JWT", "sessions", "password hashing"],
    },
    ComponentType.OAUTH: {
        "description": "OAuth2 authentication (Google, GitHub, etc.)",
        "generates": ["auth/oauth/"],
        "features": ["social login", "token refresh"],
    },
    ComponentType.S3: {
        "description": "AWS S3 file storage",
        "env_vars": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "S3_BUCKET"],
    },
    ComponentType.OPENAI: {
        "description": "OpenAI API integration",
        "env_vars": ["OPENAI_API_KEY"],
        "features": ["chat completions", "embeddings"],
    },
}


# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class TranslatedComponent:
    """A node translated into explicit semantics."""
    id: str
    name: str
    component_type: ComponentType
    description: str
    generates: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    env_vars: List[str] = field(default_factory=list)
    features: List[str] = field(default_factory=list)
    raw_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TranslatedInteraction:
    """An edge translated into explicit interaction semantics."""
    source_id: str
    target_id: str
    interaction_type: str  # "calls", "stores", "authenticates", "queries", etc.
    description: str


@dataclass
class TranslatedArchitecture:
    """The fully translated architecture specification."""
    project_name: str
    user_prompt: str
    components: List[TranslatedComponent]
    interactions: List[TranslatedInteraction]
    tech_stack: List[str]
    env_vars: List[str]
    
    def to_instruction_dsl(self) -> str:
        """Convert to the strict instruction DSL for the LLM."""
        lines = []
        
        # Header
        lines.append("=" * 60)
        lines.append(f"PROJECT: {self.project_name}")
        lines.append("=" * 60)
        lines.append("")
        
        # User request (the meaning)
        lines.append("## USER REQUEST")
        lines.append(self.user_prompt)
        lines.append("")
        
        # System architecture
        lines.append("## SYSTEM ARCHITECTURE")
        lines.append("")
        for comp in self.components:
            lines.append(f"### {comp.name} ({comp.component_type.value})")
            lines.append(f"- Type: {comp.component_type.value}")
            lines.append(f"- Description: {comp.description}")
            if comp.generates:
                lines.append(f"- Directories: {', '.join(comp.generates)}")
            if comp.dependencies:
                lines.append(f"- Dependencies: {', '.join(comp.dependencies)}")
            if comp.env_vars:
                lines.append(f"- Environment: {', '.join(comp.env_vars)}")
            if comp.features:
                lines.append(f"- Features: {', '.join(comp.features)}")
            lines.append("")
        
        # Interactions
        lines.append("## INTERACTIONS")
        lines.append("")
        for interaction in self.interactions:
            lines.append(f"- {interaction.description}")
        lines.append("")
        
        # Tech stack summary
        lines.append("## TECH STACK")
        for tech in self.tech_stack:
            lines.append(f"- {tech}")
        lines.append("")
        
        # Environment variables
        if self.env_vars:
            lines.append("## ENVIRONMENT VARIABLES (create .env.example)")
            for var in self.env_vars:
                lines.append(f"- {var}")
            lines.append("")
        
        # Explicit requirements
        lines.append("## REQUIREMENTS")
        lines.append("1. Create all directories and files for each component")
        lines.append("2. Include proper package.json/requirements.txt with dependencies")
        lines.append("3. Create .env.example with all required environment variables")
        lines.append("4. Include Dockerfile for containerization")
        lines.append("5. Create README.md documenting the architecture")
        lines.append("6. Ensure all interactions between components are implemented")
        lines.append("7. Follow best practices for each technology")
        lines.append("")
        
        return "\n".join(lines)


# ============================================================================
# TRANSLATOR
# ============================================================================

class ArchitectureTranslator:
    """
    Translates a React Flow graph into explicit, deterministic instructions.
    
    This is the CRITICAL Layer 2 component that bridges:
    - Layer 1 (transport) which just moves data
    - Layer 3 (LLM) which generates code
    
    Without this, the LLM receives vague hints instead of explicit contracts.
    """
    
    def __init__(self):
        self._type_aliases = self._build_type_aliases()
    
    def _build_type_aliases(self) -> Dict[str, ComponentType]:
        """Build a lookup table of type aliases."""
        aliases = {}
        
        # Direct mappings
        for ct in ComponentType:
            aliases[ct.value.lower()] = ct
        
        # Common aliases
        aliases.update({
            "next": ComponentType.NEXTJS,
            "next.js": ComponentType.NEXTJS,
            "reactjs": ComponentType.REACT,
            "react.js": ComponentType.REACT,
            "fast-api": ComponentType.FASTAPI,
            "fast_api": ComponentType.FASTAPI,
            "expressjs": ComponentType.EXPRESS,
            "express.js": ComponentType.EXPRESS,
            "postgresql": ComponentType.POSTGRES,
            "pg": ComponentType.POSTGRES,
            "mongo": ComponentType.MONGODB,
            "sql": ComponentType.SQLITE,
            "payments": ComponentType.STRIPE,
            "billing": ComponentType.STRIPE,
            "authentication": ComponentType.AUTH,
            "login": ComponentType.AUTH,
            "cache": ComponentType.REDIS,
            "caching": ComponentType.REDIS,
            "storage": ComponentType.S3,
            "files": ComponentType.S3,
            "ai": ComponentType.OPENAI,
            "llm": ComponentType.OPENAI,
            "gpt": ComponentType.OPENAI,
        })
        
        return aliases
    
    def _resolve_component_type(self, node: Dict[str, Any]) -> ComponentType:
        """
        Resolve a node to a ComponentType.
        
        Checks multiple fields for type hints.
        """
        # Try explicit type field
        node_type = node.get("type", "").lower()
        if node_type in self._type_aliases:
            return self._type_aliases[node_type]
        
        # Try data.type
        data = node.get("data", {})
        data_type = data.get("type", "").lower()
        if data_type in self._type_aliases:
            return self._type_aliases[data_type]
        
        # Try data.technology
        tech = data.get("technology", data.get("tech", "")).lower()
        if tech in self._type_aliases:
            return self._type_aliases[tech]
        
        # Try to infer from label
        label = data.get("label", node.get("label", "")).lower()
        for alias, ct in self._type_aliases.items():
            if alias in label:
                return ct
        
        # Fallback to generic component
        return ComponentType.COMPONENT
    
    def _translate_node(self, node: Dict[str, Any]) -> TranslatedComponent:
        """Translate a single node into explicit semantics."""
        node_id = node.get("id", "unknown")
        data = node.get("data", {})
        label = data.get("label", node.get("label", f"Component {node_id}"))
        
        comp_type = self._resolve_component_type(node)
        semantics = COMPONENT_SEMANTICS.get(comp_type, {})
        
        return TranslatedComponent(
            id=node_id,
            name=label,
            component_type=comp_type,
            description=semantics.get("description", f"A {comp_type.value} component"),
            generates=semantics.get("generates", []),
            dependencies=semantics.get("dependencies", []),
            env_vars=semantics.get("env_vars", []),
            features=semantics.get("features", []),
            raw_data=data,
        )
    
    def _resolve_interaction_type(self, edge: Dict[str, Any], 
                                   source: TranslatedComponent,
                                   target: TranslatedComponent) -> str:
        """Determine the interaction type from edge and component types."""
        # Try explicit label
        label = edge.get("label", edge.get("data", {}).get("label", ""))
        if label:
            return label.lower()
        
        # Infer from component types
        target_type = target.component_type
        
        if target_type in (ComponentType.POSTGRES, ComponentType.MONGODB, 
                          ComponentType.SQLITE, ComponentType.SUPABASE):
            return "stores data in"
        elif target_type == ComponentType.REDIS:
            return "caches with"
        elif target_type == ComponentType.STRIPE:
            return "processes payments via"
        elif target_type in (ComponentType.AUTH, ComponentType.OAUTH):
            return "authenticates via"
        elif target_type in (ComponentType.FASTAPI, ComponentType.EXPRESS, ComponentType.FLASK):
            return "calls API of"
        elif target_type in (ComponentType.OPENAI, ComponentType.ANTHROPIC):
            return "generates content via"
        elif target_type == ComponentType.S3:
            return "stores files in"
        else:
            return "connects to"
    
    def _translate_edge(self, edge: Dict[str, Any],
                        components: Dict[str, TranslatedComponent]) -> TranslatedInteraction:
        """Translate an edge into explicit interaction semantics."""
        source_id = edge.get("source", "")
        target_id = edge.get("target", "")
        
        source = components.get(source_id)
        target = components.get(target_id)
        
        if not source or not target:
            return TranslatedInteraction(
                source_id=source_id,
                target_id=target_id,
                interaction_type="connects to",
                description=f"{source_id} connects to {target_id}"
            )
        
        interaction_type = self._resolve_interaction_type(edge, source, target)
        
        return TranslatedInteraction(
            source_id=source_id,
            target_id=target_id,
            interaction_type=interaction_type,
            description=f"{source.name} {interaction_type} {target.name}"
        )
    
    def translate(self, architecture_spec: Dict[str, Any]) -> TranslatedArchitecture:
        """
        Translate a full architecture spec into explicit instructions.
        
        Args:
            architecture_spec: The raw spec from frontend with nodes, edges, prompt
            
        Returns:
            TranslatedArchitecture with deterministic, explicit semantics
        """
        # Extract fields
        project_name = architecture_spec.get("name", "New Project")
        user_prompt = architecture_spec.get("prompt", 
                     architecture_spec.get("description", "Build an application"))
        nodes = architecture_spec.get("nodes", [])
        edges = architecture_spec.get("edges", [])
        
        logger.info(f"Translating architecture: {len(nodes)} nodes, {len(edges)} edges")
        
        # Translate nodes
        components = {}
        for node in nodes:
            comp = self._translate_node(node)
            components[comp.id] = comp
            logger.debug(f"  Node {comp.id}: {comp.name} -> {comp.component_type.value}")
        
        # Translate edges
        interactions = []
        for edge in edges:
            interaction = self._translate_edge(edge, components)
            interactions.append(interaction)
            logger.debug(f"  Edge: {interaction.description}")
        
        # Collect all tech stack and env vars
        tech_stack = list(set(
            comp.component_type.value for comp in components.values()
            if comp.component_type != ComponentType.COMPONENT
        ))
        
        all_env_vars = []
        for comp in components.values():
            all_env_vars.extend(comp.env_vars)
        env_vars = list(set(all_env_vars))
        
        return TranslatedArchitecture(
            project_name=project_name,
            user_prompt=user_prompt,
            components=list(components.values()),
            interactions=interactions,
            tech_stack=tech_stack,
            env_vars=env_vars,
        )


# ============================================================================
# MODULE-LEVEL INTERFACE
# ============================================================================

# Global translator instance
_translator: Optional[ArchitectureTranslator] = None


def get_translator() -> ArchitectureTranslator:
    """Get the singleton translator instance."""
    global _translator
    if _translator is None:
        _translator = ArchitectureTranslator()
    return _translator


def translate_architecture(architecture_spec: Dict[str, Any]) -> str:
    """
    Translate an architecture spec to instruction DSL.
    
    This is the main entry point - call this from cline.py.
    
    Args:
        architecture_spec: Raw spec from frontend
        
    Returns:
        Instruction DSL string for the LLM
    """
    translator = get_translator()
    translated = translator.translate(architecture_spec)
    return translated.to_instruction_dsl()


# ============================================================================
# GOLDEN DEMO SPEC - Locked canonical architecture for hackathon
# ============================================================================

GOLDEN_DEMO_SPEC = {
    "name": "SaaS Starter",
    "prompt": "Build a production-ready SaaS starter with user authentication, subscription billing, and a dashboard.",
    "nodes": [
        {"id": "frontend", "type": "nextjs", "data": {"label": "Next.js Frontend"}},
        {"id": "backend", "type": "fastapi", "data": {"label": "FastAPI Backend"}},
        {"id": "db", "type": "supabase", "data": {"label": "Supabase Database"}},
        {"id": "billing", "type": "stripe", "data": {"label": "Stripe Billing"}},
    ],
    "edges": [
        {"source": "frontend", "target": "backend", "label": "calls"},
        {"source": "backend", "target": "db", "label": "stores"},
        {"source": "backend", "target": "billing", "label": "processes payments"},
    ],
}


def get_golden_demo_instructions() -> str:
    """Get the deterministic instructions for the golden demo."""
    return translate_architecture(GOLDEN_DEMO_SPEC)


# ============================================================================
# CLI for testing
# ============================================================================

if __name__ == "__main__":
    import json
    
    print("=" * 60)
    print("ARCHITECTURE TRANSLATOR - Demo")
    print("=" * 60)
    print()
    
    # Translate the golden demo spec
    instructions = get_golden_demo_instructions()
    print(instructions)
    
    print()
    print("=" * 60)
    print("This output is DETERMINISTIC - same input → same output")
    print("=" * 60)
