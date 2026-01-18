"""
Code Generator v2 - Cross-Node Aware Generation

This is the REAL magic layer that makes nodes + edges → coherent code.

KEY INSIGHT: The LLM must understand the FULL SYSTEM, not just individual files.

Architecture:
1. NodeSemantics - What each node MEANS and what it EXPOSES
2. InteractionContract - What each edge REQUIRES (endpoints, clients, schemas)
3. GlobalContext - The full system state passed to every file generation
4. DependencyGraph - Ensures files are generated in correct order

The difference from v1:
- v1: "Generate main.py" → LLM makes something up
- v2: "Generate main.py that exposes /api/users (used by frontend), 
       queries Supabase users table, caches with Redis, 
       and includes Stripe webhook at /webhooks/stripe" → LLM generates CONNECTED code
"""

import logging
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum

from services.architecture_translator import (
    ArchitectureTranslator,
    TranslatedArchitecture,
    TranslatedComponent,
    TranslatedInteraction,
    ComponentType,
    get_translator,
)
from services.llm_interface import LLMInterface, get_default_llm_service

logger = logging.getLogger(__name__)


# ============================================================================
# NODE SEMANTICS - What each node type EXPOSES and REQUIRES
# ============================================================================

@dataclass
class NodeContract:
    """What a node exposes to other nodes."""
    node_id: str
    node_type: ComponentType
    
    # What this node EXPOSES to others
    endpoints: List[str] = field(default_factory=list)      # e.g., ["/api/users", "/api/auth/login"]
    clients: List[str] = field(default_factory=list)        # e.g., ["supabase", "redis_client"]
    schemas: List[str] = field(default_factory=list)        # e.g., ["User", "Project", "Subscription"]
    env_vars: List[str] = field(default_factory=list)       # e.g., ["DATABASE_URL", "REDIS_URL"]
    
    # What this node REQUIRES from others
    required_endpoints: List[str] = field(default_factory=list)
    required_clients: List[str] = field(default_factory=list)


@dataclass
class InteractionContract:
    """A specific interaction between two nodes."""
    source_id: str
    target_id: str
    
    # The specific connection
    call_type: str  # "http", "client", "import", "webhook"
    
    # What source needs from target
    endpoints_used: List[str] = field(default_factory=list)
    clients_used: List[str] = field(default_factory=list)
    schemas_shared: List[str] = field(default_factory=list)


# ============================================================================
# SEMANTIC CONTRACT BUILDER
# ============================================================================

class ContractBuilder:
    """
    Builds explicit contracts from architecture.
    
    This is where nodes become ACTIONABLE:
    - Next.js node → needs to call FastAPI endpoints
    - FastAPI node → needs to expose endpoints, use DB client, cache with Redis
    - Supabase node → needs to provide client, define tables
    """
    
    def __init__(self, architecture: TranslatedArchitecture):
        self.arch = architecture
        self.component_map = {c.id: c for c in architecture.components}
        self.interaction_map = self._build_interaction_map()
    
    def _build_interaction_map(self) -> Dict[str, List[TranslatedInteraction]]:
        """Build lookup: node_id → [interactions where node is source]"""
        result: Dict[str, List[TranslatedInteraction]] = {}
        for interaction in self.arch.interactions:
            if interaction.source_id not in result:
                result[interaction.source_id] = []
            result[interaction.source_id].append(interaction)
        return result
    
    def build_contracts(self) -> Dict[str, NodeContract]:
        """Build contracts for all nodes."""
        contracts: Dict[str, NodeContract] = {}
        
        for comp in self.arch.components:
            contract = self._build_node_contract(comp)
            contracts[comp.id] = contract
        
        # Second pass: resolve cross-node requirements
        self._resolve_requirements(contracts)
        
        return contracts
    
    def _build_node_contract(self, comp: TranslatedComponent) -> NodeContract:
        """Build contract for a single node based on its type."""
        contract = NodeContract(
            node_id=comp.id,
            node_type=comp.component_type,
            env_vars=comp.env_vars.copy(),
        )
        
        # Define what each node type EXPOSES
        ct = comp.component_type
        
        if ct == ComponentType.FASTAPI:
            # FastAPI exposes REST endpoints
            contract.endpoints = [
                "/api/health",
                "/api/users",
                "/api/users/{id}",
                "/api/auth/login",
                "/api/auth/register",
                "/api/auth/me",
            ]
            contract.schemas = ["User", "UserCreate", "UserResponse", "Token"]
            
            # Check what it connects to
            interactions = self.interaction_map.get(comp.id, [])
            for interaction in interactions:
                target = self.component_map.get(interaction.target_id)
                if target:
                    if target.component_type in (ComponentType.POSTGRES, ComponentType.SUPABASE, ComponentType.MONGODB):
                        contract.required_clients.append("database")
                        contract.schemas.extend(["Project", "ProjectCreate"])
                    if target.component_type == ComponentType.REDIS:
                        contract.required_clients.append("redis")
                    if target.component_type == ComponentType.OPENAI:
                        contract.required_clients.append("openai")
                        contract.endpoints.append("/api/ai/chat")
                    if target.component_type == ComponentType.STRIPE:
                        contract.endpoints.extend(["/api/billing/checkout", "/webhooks/stripe"])
                        contract.schemas.extend(["Subscription", "CheckoutSession"])
        
        elif ct == ComponentType.NEXTJS:
            # Next.js exposes pages and API routes
            contract.endpoints = [
                "/",
                "/dashboard",
                "/login",
                "/signup",
                "/projects",
            ]
            
            # Check what backend it calls
            interactions = self.interaction_map.get(comp.id, [])
            for interaction in interactions:
                target = self.component_map.get(interaction.target_id)
                if target:
                    if target.component_type == ComponentType.FASTAPI:
                        contract.required_endpoints = [
                            "/api/auth/login",
                            "/api/auth/me",
                            "/api/users",
                        ]
                    if target.component_type == ComponentType.STRIPE:
                        contract.endpoints.append("/pricing")
        
        elif ct == ComponentType.SUPABASE:
            # Supabase exposes client and tables
            contract.clients = ["supabase_client"]
            contract.schemas = ["users", "projects", "subscriptions"]  # Tables
            contract.env_vars = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY"]
        
        elif ct == ComponentType.POSTGRES:
            # Postgres exposes connection
            contract.clients = ["database_engine", "SessionLocal"]
            contract.schemas = ["Base", "User", "Project"]  # ORM models
            contract.env_vars = ["DATABASE_URL"]
        
        elif ct == ComponentType.REDIS:
            # Redis exposes caching client
            contract.clients = ["redis_client", "cache"]
            contract.env_vars = ["REDIS_URL"]
        
        elif ct == ComponentType.STRIPE:
            # Stripe exposes billing client
            contract.clients = ["stripe"]
            contract.endpoints = ["/webhooks/stripe"]
            contract.schemas = ["Subscription", "Customer", "PaymentIntent"]
            contract.env_vars = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_ID"]
        
        elif ct == ComponentType.OPENAI:
            # OpenAI exposes AI client
            contract.clients = ["openai_client"]
            contract.env_vars = ["OPENAI_API_KEY"]
        
        elif ct == ComponentType.AUTH or ct == ComponentType.OAUTH:
            # Auth exposes auth utilities
            contract.clients = ["verify_token", "get_current_user"]
            contract.schemas = ["Token", "TokenData"]
            contract.env_vars = ["JWT_SECRET", "JWT_ALGORITHM"]
        
        return contract
    
    def _resolve_requirements(self, contracts: Dict[str, NodeContract]):
        """Second pass: resolve what each node needs from connected nodes."""
        for interaction in self.arch.interactions:
            source = contracts.get(interaction.source_id)
            target = contracts.get(interaction.target_id)
            
            if source and target:
                # Source needs target's clients
                source.required_clients.extend(target.clients)
                # Source might need target's schemas
                if target.schemas:
                    source.schemas = list(set(source.schemas + target.schemas[:3]))  # Limit


# ============================================================================
# GLOBAL CONTEXT BUILDER
# ============================================================================

@dataclass
class GlobalSystemContext:
    """
    The full system context passed to every file generation.
    
    This is the KEY to cross-node awareness.
    """
    project_name: str
    user_prompt: str
    
    # All nodes and their contracts
    nodes: Dict[str, NodeContract]
    
    # All interactions
    interactions: List[InteractionContract]
    
    # Aggregated info
    all_endpoints: Dict[str, str]  # endpoint → which node exposes it
    all_schemas: List[str]
    all_env_vars: List[str]
    
    def to_system_prompt(self) -> str:
        """Convert to a comprehensive system prompt."""
        lines = [
            "# SYSTEM ARCHITECTURE CONTEXT",
            "",
            f"Project: {self.project_name}",
            f"Goal: {self.user_prompt[:200]}...",
            "",
            "## NODES AND THEIR RESPONSIBILITIES",
            "",
        ]
        
        for node_id, contract in self.nodes.items():
            lines.append(f"### {node_id} ({contract.node_type.value})")
            if contract.endpoints:
                lines.append(f"  Exposes endpoints: {', '.join(contract.endpoints[:5])}")
            if contract.clients:
                lines.append(f"  Provides clients: {', '.join(contract.clients)}")
            if contract.schemas:
                lines.append(f"  Defines schemas: {', '.join(contract.schemas[:5])}")
            if contract.required_clients:
                lines.append(f"  Requires: {', '.join(set(contract.required_clients))}")
            lines.append("")
        
        lines.append("## INTERACTIONS (how nodes connect)")
        lines.append("")
        for interaction in self.interactions:
            lines.append(f"- {interaction.source_id} → {interaction.target_id} ({interaction.call_type})")
            if interaction.endpoints_used:
                lines.append(f"    Uses endpoints: {', '.join(interaction.endpoints_used)}")
            if interaction.clients_used:
                lines.append(f"    Uses clients: {', '.join(interaction.clients_used)}")
        lines.append("")
        
        lines.append("## SHARED SCHEMAS")
        for schema in self.all_schemas[:10]:
            lines.append(f"- {schema}")
        lines.append("")
        
        lines.append("## ENVIRONMENT VARIABLES")
        for env in self.all_env_vars:
            lines.append(f"- {env}")
        
        return "\n".join(lines)


class ContextBuilder:
    """Builds the global system context."""
    
    def __init__(self, architecture: TranslatedArchitecture):
        self.arch = architecture
        self.contract_builder = ContractBuilder(architecture)
    
    def build(self) -> GlobalSystemContext:
        """Build the full system context."""
        contracts = self.contract_builder.build_contracts()
        
        # Build interaction contracts
        interactions = []
        for inter in self.arch.interactions:
            source_contract = contracts.get(inter.source_id)
            target_contract = contracts.get(inter.target_id)
            
            if source_contract and target_contract:
                # Determine call type
                call_type = self._infer_call_type(source_contract, target_contract)
                
                interaction = InteractionContract(
                    source_id=inter.source_id,
                    target_id=inter.target_id,
                    call_type=call_type,
                    endpoints_used=target_contract.endpoints[:3] if call_type == "http" else [],
                    clients_used=target_contract.clients[:2] if call_type == "client" else [],
                )
                interactions.append(interaction)
        
        # Aggregate
        all_endpoints = {}
        all_schemas = set()
        all_env_vars = set()
        
        for node_id, contract in contracts.items():
            for ep in contract.endpoints:
                all_endpoints[ep] = node_id
            all_schemas.update(contract.schemas)
            all_env_vars.update(contract.env_vars)
        
        return GlobalSystemContext(
            project_name=self.arch.project_name,
            user_prompt=self.arch.user_prompt,
            nodes=contracts,
            interactions=interactions,
            all_endpoints=all_endpoints,
            all_schemas=list(all_schemas),
            all_env_vars=list(all_env_vars),
        )
    
    def _infer_call_type(self, source: NodeContract, target: NodeContract) -> str:
        """Infer how source calls target."""
        # Frontend → Backend = HTTP
        if source.node_type in (ComponentType.NEXTJS, ComponentType.REACT):
            if target.node_type in (ComponentType.FASTAPI, ComponentType.EXPRESS):
                return "http"
        
        # Backend → Database = client
        if source.node_type in (ComponentType.FASTAPI, ComponentType.EXPRESS):
            if target.node_type in (ComponentType.POSTGRES, ComponentType.SUPABASE, ComponentType.MONGODB):
                return "client"
            if target.node_type == ComponentType.REDIS:
                return "client"
            if target.node_type == ComponentType.OPENAI:
                return "client"
            if target.node_type == ComponentType.STRIPE:
                return "client"
        
        return "import"


# ============================================================================
# FILE GENERATION WITH FULL CONTEXT
# ============================================================================

@dataclass
class EnhancedFilePlan:
    """A file plan with full cross-node awareness."""
    path: str
    purpose: str
    owning_node: str  # Which node this file belongs to
    
    # Cross-node awareness
    exposes: List[str] = field(default_factory=list)  # What this file exposes
    requires: List[str] = field(default_factory=list)  # What this file needs from other nodes
    
    # Dependencies
    depends_on_files: List[str] = field(default_factory=list)
    
    # Generation hints
    must_include: List[str] = field(default_factory=list)  # Specific things LLM must generate


class EnhancedPlanner:
    """Creates file plans with cross-node awareness."""
    
    def __init__(self, context: GlobalSystemContext, architecture: TranslatedArchitecture):
        self.ctx = context
        self.arch = architecture
    
    def create_plan(self) -> List[EnhancedFilePlan]:
        """Create enhanced file plans."""
        plans: List[EnhancedFilePlan] = []
        
        # Root files first
        plans.extend(self._plan_root_files())
        
        # Then per-node files
        for node_id, contract in self.ctx.nodes.items():
            plans.extend(self._plan_node_files(node_id, contract))
        
        # Integration files last
        plans.extend(self._plan_integration_files())
        
        return plans
    
    def _plan_root_files(self) -> List[EnhancedFilePlan]:
        """Plan root config files."""
        has_frontend = any(c.node_type in (ComponentType.NEXTJS, ComponentType.REACT) 
                          for c in self.ctx.nodes.values())
        has_backend = any(c.node_type in (ComponentType.FASTAPI, ComponentType.EXPRESS) 
                         for c in self.ctx.nodes.values())
        
        plans = []
        
        if has_frontend:
            plans.extend([
                EnhancedFilePlan(
                    path="package.json",
                    purpose="NPM dependencies for Next.js frontend",
                    owning_node="root",
                    must_include=[
                        "next", "react", "react-dom", 
                        "@tanstack/react-query" if has_backend else None,
                        "stripe" if any(c.node_type == ComponentType.STRIPE for c in self.ctx.nodes.values()) else None,
                    ],
                ),
                EnhancedFilePlan(
                    path=".env.example",
                    purpose="Environment variables template",
                    owning_node="root",
                    must_include=self.ctx.all_env_vars,
                ),
            ])
        
        if has_backend:
            plans.append(EnhancedFilePlan(
                path="requirements.txt",
                purpose="Python dependencies for FastAPI backend",
                owning_node="root",
                must_include=[
                    "fastapi", "uvicorn", "pydantic",
                    "supabase" if any(c.node_type == ComponentType.SUPABASE for c in self.ctx.nodes.values()) else None,
                    "redis" if any(c.node_type == ComponentType.REDIS for c in self.ctx.nodes.values()) else None,
                    "stripe" if any(c.node_type == ComponentType.STRIPE for c in self.ctx.nodes.values()) else None,
                    "openai" if any(c.node_type == ComponentType.OPENAI for c in self.ctx.nodes.values()) else None,
                ],
            ))
        
        plans.append(EnhancedFilePlan(
            path="README.md",
            purpose="Project documentation with architecture overview",
            owning_node="root",
            must_include=["Setup instructions", "Environment variables", "Architecture diagram in ASCII"],
        ))
        
        return plans
    
    def _plan_node_files(self, node_id: str, contract: NodeContract) -> List[EnhancedFilePlan]:
        """Plan files for a specific node."""
        plans = []
        ct = contract.node_type
        
        if ct == ComponentType.FASTAPI:
            # Find what this backend connects to
            connected_to = [i.target_id for i in self.ctx.interactions if i.source_id == node_id]
            
            plans.extend([
                EnhancedFilePlan(
                    path="main.py",
                    purpose="FastAPI application with ALL routes",
                    owning_node=node_id,
                    exposes=contract.endpoints,
                    requires=contract.required_clients,
                    must_include=[
                        f"Endpoint: {ep}" for ep in contract.endpoints
                    ] + [
                        f"Import and use: {client}" for client in contract.required_clients
                    ],
                ),
                EnhancedFilePlan(
                    path="models.py",
                    purpose="Pydantic models and DB schemas",
                    owning_node=node_id,
                    exposes=contract.schemas,
                    must_include=[f"class {schema}" for schema in contract.schemas],
                ),
                EnhancedFilePlan(
                    path="database.py",
                    purpose="Database connection" if "database" in contract.required_clients else "Database stub",
                    owning_node=node_id,
                    requires=["DATABASE_URL"] if "database" in contract.required_clients else [],
                ),
            ])
            
            # Add Redis if connected
            if any(self.ctx.nodes.get(cid, NodeContract("", ComponentType.SERVICE)).node_type == ComponentType.REDIS 
                   for cid in connected_to):
                plans.append(EnhancedFilePlan(
                    path="cache.py",
                    purpose="Redis caching layer",
                    owning_node=node_id,
                    exposes=["redis_client", "cache_get", "cache_set"],
                    requires=["REDIS_URL"],
                ))
            
            # Add OpenAI if connected
            if any(self.ctx.nodes.get(cid, NodeContract("", ComponentType.SERVICE)).node_type == ComponentType.OPENAI 
                   for cid in connected_to):
                plans.append(EnhancedFilePlan(
                    path="ai_client.py",
                    purpose="OpenAI integration",
                    owning_node=node_id,
                    exposes=["generate_response", "chat_completion"],
                    requires=["OPENAI_API_KEY"],
                ))
        
        elif ct == ComponentType.NEXTJS:
            # Find what backend this frontend calls
            backend_endpoints = []
            for inter in self.ctx.interactions:
                if inter.source_id == node_id:
                    target = self.ctx.nodes.get(inter.target_id)
                    if target and target.node_type == ComponentType.FASTAPI:
                        backend_endpoints.extend(target.endpoints)
            
            plans.extend([
                EnhancedFilePlan(
                    path="src/app/layout.tsx",
                    purpose="Root layout with providers",
                    owning_node=node_id,
                ),
                EnhancedFilePlan(
                    path="src/app/page.tsx",
                    purpose="Landing page",
                    owning_node=node_id,
                    exposes=["/"],
                ),
                EnhancedFilePlan(
                    path="src/lib/api.ts",
                    purpose="API client that calls backend",
                    owning_node=node_id,
                    requires=backend_endpoints,
                    must_include=[
                        f"Function to call: {ep}" for ep in backend_endpoints[:5]
                    ],
                ),
                EnhancedFilePlan(
                    path="src/app/dashboard/page.tsx",
                    purpose="Dashboard showing user data from API",
                    owning_node=node_id,
                    requires=["/api/users", "/api/auth/me"],
                    must_include=["Fetch user data", "Display projects", "Handle loading/error states"],
                ),
            ])
            
            # Add auth pages if auth node exists
            if any(c.node_type in (ComponentType.AUTH, ComponentType.OAUTH) for c in self.ctx.nodes.values()):
                plans.extend([
                    EnhancedFilePlan(
                        path="src/app/login/page.tsx",
                        purpose="Login page calling /api/auth/login",
                        owning_node=node_id,
                        requires=["/api/auth/login"],
                    ),
                    EnhancedFilePlan(
                        path="src/lib/auth.ts",
                        purpose="Auth utilities - token storage, auth state",
                        owning_node=node_id,
                        exposes=["useAuth", "getToken", "isAuthenticated"],
                    ),
                ])
            
            # Add billing page if Stripe exists
            if any(c.node_type == ComponentType.STRIPE for c in self.ctx.nodes.values()):
                plans.append(EnhancedFilePlan(
                    path="src/app/pricing/page.tsx",
                    purpose="Pricing page with Stripe checkout",
                    owning_node=node_id,
                    requires=["/api/billing/checkout"],
                ))
        
        elif ct == ComponentType.SUPABASE:
            plans.extend([
                EnhancedFilePlan(
                    path="src/lib/supabase.ts",
                    purpose="Supabase client initialization",
                    owning_node=node_id,
                    exposes=["supabase"],
                    requires=["SUPABASE_URL", "SUPABASE_ANON_KEY"],
                ),
                EnhancedFilePlan(
                    path="supabase/migrations/001_initial.sql",
                    purpose="Initial database schema",
                    owning_node=node_id,
                    must_include=[f"CREATE TABLE {s}" for s in contract.schemas if not s.startswith("Supa")],
                ),
            ])
        
        return plans
    
    def _plan_integration_files(self) -> List[EnhancedFilePlan]:
        """Plan files that integrate multiple nodes."""
        plans = []
        
        # Types file if we have both frontend and backend
        has_frontend = any(c.node_type in (ComponentType.NEXTJS, ComponentType.REACT) for c in self.ctx.nodes.values())
        has_backend = any(c.node_type in (ComponentType.FASTAPI, ComponentType.EXPRESS) for c in self.ctx.nodes.values())
        
        if has_frontend and has_backend:
            plans.append(EnhancedFilePlan(
                path="src/types/api.ts",
                purpose="Shared TypeScript types matching backend schemas",
                owning_node="integration",
                must_include=[f"interface {s}" for s in self.ctx.all_schemas[:10]],
            ))
        
        return plans


# ============================================================================
# ENHANCED CODE GENERATOR
# ============================================================================

class EnhancedCodeGenerator:
    """
    Code generator with full cross-node awareness.
    
    Key difference: Every file generation prompt includes:
    1. The FULL system context
    2. What this file EXPOSES
    3. What this file REQUIRES from other nodes
    4. Specific things it MUST include
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
        """Generate a coherent, connected codebase."""
        
        # Get LLM service
        if self.llm is None:
            self.llm = get_default_llm_service()
        
        logger.info(f"Enhanced generation with {self.llm.provider_name}")
        
        # Step 1: Translate architecture
        translated = self.translator.translate(architecture_spec)
        
        # Step 2: Build global context (THE KEY TO CROSS-NODE AWARENESS)
        context_builder = ContextBuilder(translated)
        global_context = context_builder.build()
        
        logger.info(f"Built context: {len(global_context.nodes)} nodes, {len(global_context.interactions)} interactions")
        
        if progress_callback:
            await progress_callback(
                f"Analyzed architecture: {len(global_context.nodes)} nodes connected",
                None, 0, global_context.to_system_prompt()
            )
        
        # Step 3: Create enhanced file plan
        planner = EnhancedPlanner(global_context, translated)
        file_plans = planner.create_plan()
        
        logger.info(f"Planned {len(file_plans)} files")
        
        if progress_callback:
            await progress_callback(
                f"Planned {len(file_plans)} files with cross-node dependencies",
                None, 1, None
            )
        
        # Step 4: Generate each file with FULL context
        system_prompt = self._build_master_prompt(global_context)
        generated_files: Dict[str, str] = {}
        files_created: List[str] = []
        
        for i, plan in enumerate(file_plans):
            logger.info(f"Generating [{i+1}/{len(file_plans)}]: {plan.path}")
            
            if progress_callback:
                await progress_callback(
                    f"Generating {plan.path} (requires: {', '.join(plan.requires[:3])})" if plan.requires else f"Generating {plan.path}",
                    files_created.copy(),
                    i + 2,
                    None,
                )
            
            # Build file-specific prompt WITH cross-node context
            file_prompt = self._build_file_prompt(plan, global_context, generated_files)
            
            try:
                content = await self._generate_file(system_prompt, file_prompt)
                
                # Write file
                file_path = workspace_path / plan.path
                file_path.parent.mkdir(parents=True, exist_ok=True)
                file_path.write_text(content, encoding="utf-8")
                
                generated_files[plan.path] = content
                files_created.append(plan.path)
                
                logger.info(f"  ✓ {plan.path}")
                
            except Exception as e:
                logger.error(f"  ✗ {plan.path}: {e}")
        
        if progress_callback:
            await progress_callback(
                f"Complete: {len(files_created)} connected files",
                files_created,
                len(file_plans) + 2,
                None,
            )
        
        return files_created
    
    def _build_master_prompt(self, ctx: GlobalSystemContext) -> str:
        """Build the master system prompt with full context."""
        return f"""You are an expert full-stack developer building a COHERENT, CONNECTED application.

{ctx.to_system_prompt()}

## CRITICAL REQUIREMENTS

1. **CONNECTED CODE**: Every file must properly integrate with the system.
   - Frontend files MUST call backend endpoints listed above
   - Backend files MUST use database/cache clients from connected nodes
   - All imports and dependencies must actually exist

2. **WORKING CODE**: No placeholders, no TODOs, no "implement later"
   - Every function must have real implementation
   - Every API call must use real endpoints from the architecture
   - Every DB query must work with the schema

3. **PROPER TYPES**: Full TypeScript types / Python type hints
   - Schemas must match across frontend/backend
   - API responses must be properly typed

4. **ERROR HANDLING**: Production-ready error handling
   - Try/catch on all async operations
   - Proper HTTP status codes
   - User-friendly error messages

Remember: This is a REAL SYSTEM where nodes are connected. Generate code that actually works together.
"""
    
    def _build_file_prompt(
        self, 
        plan: EnhancedFilePlan, 
        ctx: GlobalSystemContext,
        existing_files: Dict[str, str]
    ) -> str:
        """Build a file-specific prompt with cross-node awareness."""
        
        lines = [
            f"## Generate: {plan.path}",
            f"Purpose: {plan.purpose}",
            f"Belongs to: {plan.owning_node}",
            "",
        ]
        
        if plan.exposes:
            lines.append(f"This file EXPOSES: {', '.join(plan.exposes)}")
            lines.append("Other files depend on these - implement them correctly!")
            lines.append("")
        
        if plan.requires:
            lines.append(f"This file REQUIRES from other nodes: {', '.join(plan.requires)}")
            lines.append("Make sure to import/call these correctly!")
            lines.append("")
        
        if plan.must_include:
            lines.append("MUST INCLUDE:")
            for item in plan.must_include:
                if item:  # Skip None values
                    lines.append(f"  - {item}")
            lines.append("")
        
        if plan.depends_on_files:
            lines.append("DEPENDS ON FILES:")
            for dep in plan.depends_on_files:
                if dep in existing_files:
                    lines.append(f"  - {dep} (already generated)")
            lines.append("")
        
        # Add relevant existing file context
        if existing_files and plan.requires:
            lines.append("RELEVANT EXISTING CODE:")
            for path, content in list(existing_files.items())[:3]:
                if any(req in path for req in ["api", "lib", "model"]):
                    truncated = content[:500] if len(content) > 500 else content
                    lines.append(f"--- {path} ---")
                    lines.append(truncated)
                    lines.append("")
        
        lines.append("Return ONLY the file content. No markdown blocks. Start now:")
        
        return "\n".join(lines)
    
    async def _generate_file(self, system_prompt: str, file_prompt: str) -> str:
        """Generate a single file."""
        response = await self.llm.generate_architecture(
            description=f"{system_prompt}\n\n{file_prompt}",
            requirements=None,
            tech_stack=None,
        )
        
        content = response.get("architecture", "")
        return self._clean_output(content)
    
    def _clean_output(self, content: str) -> str:
        """Clean LLM output."""
        import re
        content = re.sub(r'^```\w*\n?|```$', '', content, flags=re.MULTILINE).strip()
        
        if content.startswith('{') and '"files"' in content[:50]:
            try:
                parsed = json.loads(content)
                if "files" in parsed and isinstance(parsed["files"], dict):
                    # Return first file content
                    return list(parsed["files"].values())[0]
            except:
                pass
        
        return content


# ============================================================================
# MODULE INTERFACE
# ============================================================================

_generator: Optional[EnhancedCodeGenerator] = None


def get_enhanced_generator() -> EnhancedCodeGenerator:
    """Get singleton generator."""
    global _generator
    if _generator is None:
        _generator = EnhancedCodeGenerator()
    return _generator


async def generate_connected_codebase(
    architecture_spec: Dict[str, Any],
    workspace_path: Path,
    progress_callback=None,
) -> List[str]:
    """
    Generate a CONNECTED codebase where nodes actually work together.
    
    This is the main entry point for cross-node aware generation.
    """
    generator = get_enhanced_generator()
    return await generator.generate(architecture_spec, workspace_path, progress_callback)
