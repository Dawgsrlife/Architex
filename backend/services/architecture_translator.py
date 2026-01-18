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
# CODE GENERATION INSTRUCTIONS - Strict Node-to-Implementation Mapping
# ============================================================================
# These are EXPLICIT instructions appended to the system prompt based on nodes.
# This is the "semantic glue" that bridges architecture → working code.

CODE_INSTRUCTIONS: Dict[ComponentType, List[str]] = {
    # --- Frontend ---
    ComponentType.NEXTJS: [
        "Use Next.js 14+ with App Router (not Pages Router)",
        "Use TypeScript with strict mode enabled",
        "Use Tailwind CSS for styling (already configured)",
        "Create loading.tsx and error.tsx for each route",
        "Use Server Components by default, 'use client' only when needed",
        "Store API calls in src/lib/api.ts with typed responses",
    ],
    ComponentType.REACT: [
        "Use React 18+ with Vite as the build tool",
        "Use TypeScript with strict mode",
        "Use Tailwind CSS for styling",
        "Use React Router v6 for client-side routing",
        "Store API calls in src/api/ with axios or fetch",
    ],
    ComponentType.VITE: [
        "Configure Vite with TypeScript and React plugin",
        "Enable HMR (Hot Module Replacement)",
        "Add path aliases in vite.config.ts",
    ],
    
    # --- Backend ---
    ComponentType.FASTAPI: [
        "Use FastAPI with async/await throughout",
        "Use Pydantic v2 for request/response validation",
        "Structure: main.py, routers/, schemas/, models/, services/",
        "Add CORS middleware for frontend communication",
        "Use dependency injection for database sessions",
        "Include OpenAPI/Swagger docs at /docs",
    ],
    ComponentType.EXPRESS: [
        "Use Express.js with TypeScript",
        "Use Zod or Joi for request validation",
        "Structure: app.ts, routes/, controllers/, middleware/",
        "Add helmet for security headers",
        "Add cors middleware for frontend communication",
        "Use express-async-errors for error handling",
    ],
    ComponentType.FLASK: [
        "Use Flask with Blueprints for modular routes",
        "Use Marshmallow for serialization",
        "Use Flask-RESTful or Flask-RESTX for APIs",
    ],
    
    # --- Databases ---
    ComponentType.POSTGRES: [
        "Include SQLAlchemy 2.0+ with asyncpg for async Postgres access",
        "Create Alembic migrations in migrations/ directory",
        "Use declarative_base() for ORM models",
        "Define get_db() dependency for session injection",
        "Use UUID primary keys (uuid.uuid4)",
        "Add indexes on frequently queried columns",
    ],
    ComponentType.SUPABASE: [
        "Use @supabase/supabase-js client library",
        "Initialize client with SUPABASE_URL and SUPABASE_ANON_KEY",
        "Use Supabase Auth for user authentication",
        "Use Row Level Security (RLS) policies for data access",
        "Store files in Supabase Storage buckets",
    ],
    ComponentType.MONGODB: [
        "Use Motor for async MongoDB access (Python) or Mongoose (Node.js)",
        "Define schemas with Pydantic (Python) or Mongoose Schema (Node.js)",
        "Use ObjectId for document IDs",
        "Create indexes on frequently queried fields",
        "Use aggregation pipelines for complex queries",
    ],
    ComponentType.SQLITE: [
        "Use SQLite for development/testing only",
        "Use SQLAlchemy with aiosqlite for async access",
        "Store database file in data/ directory",
    ],
    
    # --- Caching ---
    ComponentType.REDIS: [
        "Use redis-py with async support (aioredis) for Python",
        "Use ioredis for Node.js applications",
        "Implement connection pooling for performance",
        "Use Redis for session storage and rate limiting",
        "Set appropriate TTLs for cached data",
        "Use Redis pub/sub for real-time features if needed",
    ],
    
    # --- Authentication ---
    ComponentType.AUTH: [
        "Use JWT (JSON Web Tokens) for stateless auth",
        "Use python-jose for JWT encoding/decoding (Python)",
        "Use bcrypt or argon2 for password hashing",
        "Store refresh tokens securely (httpOnly cookies or DB)",
        "Implement /auth/login, /auth/register, /auth/refresh endpoints",
        "Add auth middleware to protect routes",
    ],
    ComponentType.OAUTH: [
        "Use authlib (Python) or passport.js (Node.js) for OAuth",
        "Support Google and GitHub OAuth providers minimum",
        "Store OAuth tokens encrypted in database",
        "Implement callback routes: /auth/google/callback, /auth/github/callback",
        "Link OAuth accounts to existing users by email",
    ],
    
    # --- Payments ---
    ComponentType.STRIPE: [
        "Use stripe-python or @stripe/stripe-js libraries",
        "Implement Stripe Checkout for one-time payments",
        "Use Stripe Customer Portal for subscription management",
        "Handle webhooks at /webhooks/stripe with signature verification",
        "Store customer_id and subscription_id in user records",
        "Use Stripe Price IDs from environment variables",
    ],
    
    # --- Storage ---
    ComponentType.S3: [
        "Use boto3 (Python) or @aws-sdk/client-s3 (Node.js)",
        "Generate presigned URLs for secure uploads/downloads",
        "Set appropriate bucket policies and CORS configuration",
        "Use multipart upload for large files",
        "Store file metadata (key, bucket, size) in database",
    ],
    ComponentType.CLOUDINARY: [
        "Use cloudinary SDK for image optimization",
        "Generate transformation URLs for thumbnails",
        "Implement upload presets for security",
    ],
    
    # --- AI/ML ---
    ComponentType.OPENAI: [
        "Use openai Python package or openai npm package",
        "Implement streaming responses for chat completions",
        "Store conversation history for context",
        "Handle rate limits with exponential backoff",
        "Use environment variable OPENAI_API_KEY",
    ],
    ComponentType.ANTHROPIC: [
        "Use anthropic Python package",
        "Implement streaming for long responses",
        "Handle rate limits appropriately",
    ],
    
    # --- Queue/Workers ---
    ComponentType.CELERY: [
        "Use Celery with Redis as broker",
        "Define tasks in tasks/ directory",
        "Use task signatures for chaining",
        "Implement retry with exponential backoff",
    ],
    ComponentType.RABBITMQ: [
        "Use pika (Python) or amqplib (Node.js)",
        "Implement publisher confirms for reliability",
        "Use dead letter queues for failed messages",
    ],
    
    # --- Fallback ---
    ComponentType.SERVICE: [
        "Create a clean service class with clear interface",
        "Use dependency injection pattern",
        "Add error handling and logging",
    ],
    ComponentType.COMPONENT: [
        "Create modular, reusable component",
        "Document inputs and outputs clearly",
    ],
}


# ============================================================================
# EDGE INVARIANTS - Code Patterns Enforced by Connections
# ============================================================================
# When two nodes are connected by an edge, specific code patterns are REQUIRED.
# This is the "semantic glue" that makes the visual graph actually matter.
#
# Format: (source_type, target_type): [list of code invariants]

EDGE_INVARIANTS: Dict[tuple, List[str]] = {
    # === AUTH CONNECTIONS ===
    (ComponentType.AUTH, ComponentType.REACT): [
        "main.tsx MUST wrap the app in <AuthProvider> context",
        "Create src/contexts/AuthContext.tsx with useAuth hook",
        "AuthContext must expose: user, login, logout, isAuthenticated",
        "Protected routes must redirect to /login if not authenticated",
    ],
    (ComponentType.AUTH, ComponentType.NEXTJS): [
        "Create src/contexts/AuthContext.tsx with 'use client' directive",
        "Root layout.tsx must wrap children in <AuthProvider>",
        "AuthContext must expose: user, login, logout, isAuthenticated, loading",
        "Create middleware.ts to protect /dashboard/* routes",
        "Redirect unauthenticated users to /login",
    ],
    (ComponentType.OAUTH, ComponentType.REACT): [
        "main.tsx MUST wrap the app in OAuth provider (Auth0Provider or similar)",
        "Configure OAuth with domain and clientId from environment variables",
        "Create /auth/callback route to handle OAuth redirects",
        "Store OAuth tokens in AuthContext for API calls",
    ],
    (ComponentType.OAUTH, ComponentType.NEXTJS): [
        "Create auth/callback/route.ts API route for OAuth callback",
        "Use next-auth or @auth0/auth0-react for authentication",
        "Store session in cookies for SSR compatibility",
        "Add getSession helper in src/lib/auth.ts",
    ],
    
    # === FRONTEND -> BACKEND CONNECTIONS ===
    (ComponentType.REACT, ComponentType.FASTAPI): [
        "Create src/lib/api.ts with typed fetch wrapper",
        "Base URL must come from VITE_API_URL environment variable",
        "All API functions must be typed with TypeScript interfaces",
        "Include Authorization header with Bearer token when user is authenticated",
        "Handle 401 errors by redirecting to login",
    ],
    (ComponentType.NEXTJS, ComponentType.FASTAPI): [
        "Create src/lib/api.ts with typed fetch wrapper",
        "Base URL must come from NEXT_PUBLIC_API_URL environment variable",
        "All API functions must return typed responses",
        "Include error handling for network failures",
        "Use fetch with proper headers: Content-Type, Authorization",
    ],
    (ComponentType.REACT, ComponentType.EXPRESS): [
        "Create src/api/client.ts with axios or fetch wrapper",
        "Configure baseURL from environment variable",
        "Add request/response interceptors for auth and error handling",
    ],
    (ComponentType.NEXTJS, ComponentType.EXPRESS): [
        "Create src/lib/api.ts with typed client",
        "Use NEXT_PUBLIC_API_URL for server URL",
        "Handle CORS-related issues in development",
    ],
    
    # === BACKEND -> DATABASE CONNECTIONS ===
    (ComponentType.FASTAPI, ComponentType.POSTGRES): [
        "database.py MUST use SQLAlchemy with async engine",
        "DATABASE_URL must come from environment variable",
        "Create get_db() dependency for session injection",
        "Use declarative_base() for ORM model definitions",
        "Include alembic.ini and migrations/ for database migrations",
        "Models MUST have: id (UUID), created_at, updated_at timestamps",
    ],
    (ComponentType.FASTAPI, ComponentType.MONGODB): [
        "database.py MUST use Motor for async MongoDB access",
        "MONGODB_URI must come from environment variable",
        "Create get_database() dependency for collection access",
        "Use Pydantic models with ObjectId handling",
    ],
    (ComponentType.FASTAPI, ComponentType.SUPABASE): [
        "Create supabase_client.py with Supabase Python client",
        "SUPABASE_URL and SUPABASE_KEY from environment",
        "Use Supabase Auth for user management",
        "Enable Row Level Security (RLS) in migrations",
    ],
    (ComponentType.EXPRESS, ComponentType.POSTGRES): [
        "Use Prisma ORM with PostgreSQL provider",
        "DATABASE_URL in .env for connection string",
        "Create prisma/schema.prisma with data models",
        "Run prisma generate after schema changes",
    ],
    (ComponentType.EXPRESS, ComponentType.MONGODB): [
        "Use Mongoose for MongoDB ODM",
        "MONGODB_URI in environment for connection",
        "Define schemas in models/ directory",
    ],
    
    # === BACKEND -> AUTH CONNECTIONS ===
    (ComponentType.FASTAPI, ComponentType.AUTH): [
        "Create auth/jwt.py with JWT encoding/decoding using python-jose",
        "Create auth/password.py with bcrypt for password hashing",
        "SECRET_KEY must come from environment variable",
        "Implement get_current_user dependency for protected routes",
        "Create /auth/login, /auth/register, /auth/me endpoints",
    ],
    (ComponentType.EXPRESS, ComponentType.AUTH): [
        "Use jsonwebtoken for JWT handling",
        "Use bcryptjs for password hashing",
        "Create auth middleware in middleware/auth.ts",
        "JWT_SECRET from environment variable",
    ],
    
    # === BACKEND -> PAYMENTS ===
    (ComponentType.FASTAPI, ComponentType.STRIPE): [
        "Create billing/stripe.py with Stripe client",
        "STRIPE_SECRET_KEY from environment variable",
        "Implement /billing/create-checkout-session endpoint",
        "Implement /webhooks/stripe with signature verification",
        "Store customer_id on User model",
    ],
    (ComponentType.EXPRESS, ComponentType.STRIPE): [
        "Use stripe npm package",
        "Create routes/billing.ts with checkout and webhook routes",
        "Verify webhook signatures with STRIPE_WEBHOOK_SECRET",
    ],
    
    # === BACKEND -> CACHE ===
    (ComponentType.FASTAPI, ComponentType.REDIS): [
        "Create cache/redis.py with aioredis connection pool",
        "REDIS_URL from environment variable",
        "Implement cache decorator for expensive operations",
        "Use Redis for session storage if needed",
    ],
    
    # === BACKEND -> AI ===
    (ComponentType.FASTAPI, ComponentType.OPENAI): [
        "Create services/openai.py with OpenAI client",
        "OPENAI_API_KEY from environment variable",
        "Implement streaming responses for chat endpoints",
        "Handle rate limits with exponential backoff",
    ],
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
    implementation_instructions: List[str] = field(default_factory=list)
    
    def to_instruction_dsl(self) -> str:
        """Convert to the strict instruction DSL for the LLM."""
        lines = []
        
        # Header
        lines.append("=" * 60)
        lines.append(f"PROJECT: {self.project_name}")
        lines.append("=" * 60)
        lines.append("")
        
        # User request (the meaning) - CRITICAL: This drives the generation
        lines.append("## USER INTENT (MOST IMPORTANT)")
        lines.append("")
        lines.append("The user wants to build:")
        lines.append(f">>> {self.user_prompt}")
        lines.append("")
        lines.append("Your generated code MUST implement this intent.")
        lines.append("")
        
        # =================================================================
        # IMPLEMENTATION INSTRUCTIONS - The Semantic Glue
        # =================================================================
        if self.implementation_instructions:
            lines.append("## IMPLEMENTATION INSTRUCTIONS (CRITICAL)")
            lines.append("Follow these technology-specific requirements EXACTLY:")
            lines.append("")
            for instruction in self.implementation_instructions:
                lines.append(f"• {instruction}")
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
        
        # CRITICAL: Extract user prompt - this is the "meaning" behind the nodes
        user_prompt = architecture_spec.get("prompt", "").strip()
        if not user_prompt:
            user_prompt = architecture_spec.get("description", "").strip()
        if not user_prompt:
            user_prompt = "A standard software system"
            logger.warning(f"No prompt provided for {project_name}, using default")
        
        logger.info(f"[TRANSLATOR] User prompt: {user_prompt[:80]}...")
        
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
        
        # =====================================================================
        # BUILD IMPLEMENTATION INSTRUCTIONS (Semantic Glue)
        # =====================================================================
        # This is the critical piece that converts nodes → code-gen instructions.
        # Each node type adds specific, actionable instructions for the LLM.
        implementation_instructions = self._build_implementation_instructions(components, edges)
        
        logger.info(f"Generated {len(implementation_instructions)} implementation instructions")
        
        return TranslatedArchitecture(
            project_name=project_name,
            user_prompt=user_prompt,
            components=list(components.values()),
            interactions=interactions,
            tech_stack=tech_stack,
            env_vars=env_vars,
            implementation_instructions=implementation_instructions,
        )
    
    def _build_implementation_instructions(
        self, 
        components: Dict[str, TranslatedComponent],
        edges: List[Dict[str, Any]] = None
    ) -> List[str]:
        """
        Build implementation-specific instructions based on detected nodes AND edges.
        
        This is the SEMANTIC GLUE that bridges:
        - Visual architecture (nodes) → Working code (implementation)
        - Visual connections (edges) → Integration code (API clients, auth, etc.)
        
        Each node type and edge connection adds specific, actionable instructions 
        that the LLM MUST follow when generating code.
        
        Returns:
            List of instruction strings to include in the prompt
        """
        instructions = []
        seen_types = set()
        
        # === NODE-BASED INSTRUCTIONS ===
        instructions.append("=== COMPONENT REQUIREMENTS ===")
        instructions.append("")
        
        for comp in components.values():
            comp_type = comp.component_type
            
            # Only add instructions once per component type
            if comp_type in seen_types:
                continue
            seen_types.add(comp_type)
            
            # Get code instructions for this component type
            type_instructions = CODE_INSTRUCTIONS.get(comp_type, [])
            
            if type_instructions:
                # Add header for this component
                instructions.append(f"[{comp_type.value.upper()}]")
                instructions.extend(type_instructions)
                instructions.append("")  # Blank line separator
        
        # === EDGE-BASED INVARIANTS (Connection Requirements) ===
        if edges:
            edge_instructions = self._build_edge_invariants(components, edges)
            if edge_instructions:
                instructions.append("=== CONNECTION INVARIANTS (CRITICAL) ===")
                instructions.append("These are REQUIRED based on how your components are connected:")
                instructions.append("")
                instructions.extend(edge_instructions)
        
        return instructions
    
    def _build_edge_invariants(
        self,
        components: Dict[str, TranslatedComponent],
        edges: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Build edge-based code invariants from the graph connections.
        
        When two nodes are connected, specific code patterns are REQUIRED.
        This makes the visual graph actually drive code generation.
        """
        invariants = []
        seen_edges = set()
        
        for edge in edges:
            source_id = edge.get("source", "")
            target_id = edge.get("target", "")
            
            source_comp = components.get(source_id)
            target_comp = components.get(target_id)
            
            if not source_comp or not target_comp:
                continue
            
            source_type = source_comp.component_type
            target_type = target_comp.component_type
            
            # Check for matching edge invariant
            edge_key = (source_type, target_type)
            
            # Avoid duplicates
            if edge_key in seen_edges:
                continue
            seen_edges.add(edge_key)
            
            # Look up edge invariants
            edge_rules = EDGE_INVARIANTS.get(edge_key, [])
            
            if edge_rules:
                invariants.append(f"[{source_type.value.upper()} → {target_type.value.upper()}]")
                invariants.append(f"Because {source_comp.name} connects to {target_comp.name}:")
                for rule in edge_rules:
                    invariants.append(f"  • {rule}")
                invariants.append("")
        
        return invariants


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


def get_implementation_instructions(architecture_spec: Dict[str, Any]) -> List[str]:
    """
    Get just the implementation instructions for an architecture.
    
    This is the SEMANTIC GLUE function that converts nodes to code instructions.
    
    Example:
        If architecture has a "postgres" node, returns:
        - "Include SQLAlchemy 2.0+ with asyncpg for async Postgres access"
        - "Create Alembic migrations in migrations/ directory"
        - etc.
    
    Args:
        architecture_spec: Raw spec from frontend
        
    Returns:
        List of implementation instruction strings
    """
    translator = get_translator()
    translated = translator.translate(architecture_spec)
    return translated.implementation_instructions


def build_combined_prompt(architecture_spec: Dict[str, Any]) -> str:
    """
    Build a combined prompt that merges user prompt with node-specific instructions.
    
    This is the key function for TASK 3 - Node-to-Prompt Translation.
    
    Args:
        architecture_spec: Raw spec from frontend (must include 'prompt' and 'nodes')
        
    Returns:
        Combined prompt string with user intent + implementation instructions
    """
    translator = get_translator()
    translated = translator.translate(architecture_spec)
    
    lines = [
        "## USER INTENT",
        translated.user_prompt,
        "",
        "## TECHNOLOGY-SPECIFIC REQUIREMENTS",
        "Based on your architecture, you MUST follow these implementation patterns:",
        "",
    ]
    
    for instruction in translated.implementation_instructions:
        if instruction:  # Skip empty lines in list
            lines.append(f"• {instruction}")
        else:
            lines.append("")
    
    return "\n".join(lines)


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
    print("IMPLEMENTATION INSTRUCTIONS (Semantic Glue)")
    print("=" * 60)
    print()
    
    # Show just the implementation instructions
    impl_instructions = get_implementation_instructions(GOLDEN_DEMO_SPEC)
    for inst in impl_instructions:
        if inst:
            print(f"  {inst}")
        else:
            print()
    
    print()
    print("=" * 60)
    print("COMBINED PROMPT (User Intent + Tech Instructions)")
    print("=" * 60)
    print()
    
    combined = build_combined_prompt(GOLDEN_DEMO_SPEC)
    print(combined)
    
    print()
    print("=" * 60)
    print("This output is DETERMINISTIC - same input → same output")
    print("=" * 60)
