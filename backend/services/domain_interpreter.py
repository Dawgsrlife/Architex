"""
Domain Interpreter - LAYER 3: Architecture → Application Semantics

This is the CRITICAL missing layer.

Current flow (broken):
    Architecture → Tech Stack → Files (generic skeletons)

New flow (meaningful):
    Architecture + Intent
    → Domain Model (entities, operations)
    → Generation Plan (explicit file instructions)
    → Cline executes plan (no freestyling)

This module extracts APPLICATION SEMANTICS from architecture:
- What ENTITIES does this system manage?
- What OPERATIONS can be performed?
- What PAGES/ROUTES are needed?
- What AUTH model is required?

Key principles:
1. DETERMINISTIC - same input → same output (mostly)
2. INTENT-DRIVEN - user prompt is REQUIRED and meaningful
3. ADMIN-FOCUSED - optimized for internal tools, CRUD dashboards
4. CONSTRAINED - outputs explicit contracts, not vague hints

This is NOT magic. It's controlled extraction + one optional LLM call.
"""

import logging
import json
import re
from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass, field
from enum import Enum

from services.architecture_translator import (
    ArchitectureTranslator,
    TranslatedArchitecture,
    TranslatedComponent,
    ComponentType,
    get_translator,
)
from services.llm_interface import LLMInterface, get_default_llm_service

logger = logging.getLogger(__name__)


# ============================================================================
# DOMAIN MODEL STRUCTURES
# ============================================================================

class AppType(str, Enum):
    """Type of application being built."""
    ADMIN_DASHBOARD = "admin_dashboard"      # CRUD internal tool
    API_BACKEND = "api_backend"              # API only, no frontend
    FULLSTACK_APP = "fullstack_app"          # Frontend + Backend
    STATIC_SITE = "static_site"              # Frontend only


class OperationType(str, Enum):
    """Types of operations on entities."""
    LIST = "list"
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    SEARCH = "search"
    EXPORT = "export"


@dataclass
class EntityField:
    """A field in an entity."""
    name: str
    field_type: str  # "string", "number", "boolean", "date", "email", "enum"
    required: bool = True
    unique: bool = False
    reference_to: Optional[str] = None  # FK to another entity


@dataclass
class DomainEntity:
    """
    An entity in the domain model.
    
    Examples:
    - User (name, email, role)
    - Project (name, description, owner)
    - Task (title, status, assignee)
    """
    name: str
    plural_name: str
    description: str
    fields: List[EntityField] = field(default_factory=list)
    operations: List[OperationType] = field(default_factory=lambda: [
        OperationType.LIST, OperationType.CREATE, 
        OperationType.READ, OperationType.UPDATE, OperationType.DELETE
    ])
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "plural_name": self.plural_name,
            "description": self.description,
            "fields": [
                {
                    "name": f.name,
                    "type": f.field_type,
                    "required": f.required,
                    "unique": f.unique,
                    "reference_to": f.reference_to,
                }
                for f in self.fields
            ],
            "operations": [op.value for op in self.operations],
        }


@dataclass 
class AdminPage:
    """A page in the admin dashboard."""
    path: str
    title: str
    entity: Optional[str] = None  # Entity this page manages
    page_type: str = "list"  # "list", "create", "edit", "detail", "dashboard"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "path": self.path,
            "title": self.title,
            "entity": self.entity,
            "page_type": self.page_type,
        }


@dataclass
class APIRoute:
    """An API route to generate."""
    path: str
    method: str  # GET, POST, PUT, DELETE
    entity: Optional[str] = None
    operation: Optional[OperationType] = None
    description: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "path": self.path,
            "method": self.method,
            "entity": self.entity,
            "operation": self.operation.value if self.operation else None,
            "description": self.description,
        }


@dataclass
class DomainModel:
    """
    Complete domain model extracted from architecture + intent.
    
    This is the SEMANTIC LAYER between architecture and code generation.
    Every file generated must trace back to something in this model.
    """
    app_type: AppType
    app_name: str
    intent: str
    entities: List[DomainEntity] = field(default_factory=list)
    pages: List[AdminPage] = field(default_factory=list)
    api_routes: List[APIRoute] = field(default_factory=list)
    auth_required: bool = False
    auth_model: str = "jwt"  # "jwt", "session", "oauth", "none"
    tech_stack: Dict[str, str] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "app_type": self.app_type.value,
            "app_name": self.app_name,
            "intent": self.intent,
            "entities": [e.to_dict() for e in self.entities],
            "pages": [p.to_dict() for p in self.pages],
            "api_routes": [r.to_dict() for r in self.api_routes],
            "auth_required": self.auth_required,
            "auth_model": self.auth_model,
            "tech_stack": self.tech_stack,
        }
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


# ============================================================================
# KEYWORD-BASED ENTITY EXTRACTION (DETERMINISTIC)
# ============================================================================

# Common domain entity patterns for admin dashboards
ENTITY_KEYWORDS = {
    # User management
    "user": {"name": "User", "plural": "Users", "fields": [
        EntityField("id", "string", required=True, unique=True),
        EntityField("email", "email", required=True, unique=True),
        EntityField("name", "string", required=True),
        EntityField("role", "enum", required=True),
        EntityField("created_at", "date", required=True),
    ]},
    "account": {"name": "Account", "plural": "Accounts", "alias": "user"},
    "member": {"name": "Member", "plural": "Members", "alias": "user"},
    
    # Project management
    "project": {"name": "Project", "plural": "Projects", "fields": [
        EntityField("id", "string", required=True, unique=True),
        EntityField("name", "string", required=True),
        EntityField("description", "string", required=False),
        EntityField("status", "enum", required=True),
        EntityField("owner_id", "string", required=True, reference_to="User"),
        EntityField("created_at", "date", required=True),
    ]},
    
    # Task management
    "task": {"name": "Task", "plural": "Tasks", "fields": [
        EntityField("id", "string", required=True, unique=True),
        EntityField("title", "string", required=True),
        EntityField("description", "string", required=False),
        EntityField("status", "enum", required=True),
        EntityField("priority", "enum", required=False),
        EntityField("assignee_id", "string", required=False, reference_to="User"),
        EntityField("project_id", "string", required=False, reference_to="Project"),
        EntityField("due_date", "date", required=False),
    ]},
    "todo": {"name": "Todo", "plural": "Todos", "alias": "task"},
    "ticket": {"name": "Ticket", "plural": "Tickets", "alias": "task"},
    
    # Team management
    "team": {"name": "Team", "plural": "Teams", "fields": [
        EntityField("id", "string", required=True, unique=True),
        EntityField("name", "string", required=True),
        EntityField("description", "string", required=False),
    ]},
    "organization": {"name": "Organization", "plural": "Organizations", "alias": "team"},
    "workspace": {"name": "Workspace", "plural": "Workspaces", "alias": "team"},
    
    # Content management
    "post": {"name": "Post", "plural": "Posts", "fields": [
        EntityField("id", "string", required=True, unique=True),
        EntityField("title", "string", required=True),
        EntityField("content", "string", required=True),
        EntityField("author_id", "string", required=True, reference_to="User"),
        EntityField("published", "boolean", required=True),
        EntityField("created_at", "date", required=True),
    ]},
    "article": {"name": "Article", "plural": "Articles", "alias": "post"},
    "blog": {"name": "BlogPost", "plural": "BlogPosts", "alias": "post"},
    
    # Access control
    "role": {"name": "Role", "plural": "Roles", "fields": [
        EntityField("id", "string", required=True, unique=True),
        EntityField("name", "string", required=True, unique=True),
        EntityField("permissions", "string", required=True),
    ]},
    "permission": {"name": "Permission", "plural": "Permissions", "fields": [
        EntityField("id", "string", required=True, unique=True),
        EntityField("name", "string", required=True, unique=True),
        EntityField("resource", "string", required=True),
        EntityField("action", "string", required=True),
    ]},
    "access": {"name": "AccessLog", "plural": "AccessLogs", "fields": [
        EntityField("id", "string", required=True, unique=True),
        EntityField("user_id", "string", required=True, reference_to="User"),
        EntityField("action", "string", required=True),
        EntityField("resource", "string", required=True),
        EntityField("timestamp", "date", required=True),
        EntityField("ip_address", "string", required=False),
    ]},
    "log": {"name": "AuditLog", "plural": "AuditLogs", "alias": "access"},
    "audit": {"name": "AuditLog", "plural": "AuditLogs", "alias": "access"},
    
    # Inventory
    "product": {"name": "Product", "plural": "Products", "fields": [
        EntityField("id", "string", required=True, unique=True),
        EntityField("name", "string", required=True),
        EntityField("description", "string", required=False),
        EntityField("price", "number", required=True),
        EntityField("quantity", "number", required=True),
        EntityField("category", "string", required=False),
    ]},
    "item": {"name": "Item", "plural": "Items", "alias": "product"},
    "inventory": {"name": "InventoryItem", "plural": "InventoryItems", "alias": "product"},
    
    # Orders
    "order": {"name": "Order", "plural": "Orders", "fields": [
        EntityField("id", "string", required=True, unique=True),
        EntityField("customer_id", "string", required=True, reference_to="User"),
        EntityField("status", "enum", required=True),
        EntityField("total", "number", required=True),
        EntityField("created_at", "date", required=True),
    ]},
    
    # Customer/CRM
    "customer": {"name": "Customer", "plural": "Customers", "fields": [
        EntityField("id", "string", required=True, unique=True),
        EntityField("name", "string", required=True),
        EntityField("email", "email", required=True),
        EntityField("phone", "string", required=False),
        EntityField("company", "string", required=False),
        EntityField("created_at", "date", required=True),
    ]},
    "contact": {"name": "Contact", "plural": "Contacts", "alias": "customer"},
    "lead": {"name": "Lead", "plural": "Leads", "alias": "customer"},
    
    # Settings
    "setting": {"name": "Setting", "plural": "Settings", "fields": [
        EntityField("key", "string", required=True, unique=True),
        EntityField("value", "string", required=True),
        EntityField("category", "string", required=False),
    ]},
    "config": {"name": "Config", "plural": "Configs", "alias": "setting"},
}


class KeywordEntityExtractor:
    """
    Extract entities from intent using keyword matching.
    
    This is DETERMINISTIC - no LLM needed.
    Fast and predictable.
    """
    
    def extract(self, intent: str) -> List[DomainEntity]:
        """Extract entities from intent string."""
        intent_lower = intent.lower()
        found_entities: Dict[str, DomainEntity] = {}
        
        for keyword, entity_def in ENTITY_KEYWORDS.items():
            if keyword in intent_lower:
                # Handle aliases
                if "alias" in entity_def:
                    actual_key = entity_def["alias"]
                    actual_def = ENTITY_KEYWORDS[actual_key]
                else:
                    actual_def = entity_def
                
                name = actual_def["name"]
                if name not in found_entities:
                    found_entities[name] = DomainEntity(
                        name=name,
                        plural_name=actual_def["plural"],
                        description=f"Represents a {name.lower()} in the system",
                        fields=actual_def.get("fields", []).copy(),
                    )
        
        # Always include User for admin dashboards (auth context)
        if "User" not in found_entities and found_entities:
            user_def = ENTITY_KEYWORDS["user"]
            found_entities["User"] = DomainEntity(
                name="User",
                plural_name="Users",
                description="System user with authentication",
                fields=user_def.get("fields", []).copy(),
            )
        
        return list(found_entities.values())


# ============================================================================
# DOMAIN INTERPRETER
# ============================================================================

class DomainInterpreter:
    """
    Interprets architecture + intent into a domain model.
    
    This is the CRITICAL missing layer that makes code generation meaningful.
    
    Process:
    1. Determine app type from architecture
    2. Extract entities from intent (keyword-based)
    3. Optionally enrich with LLM (one controlled call)
    4. Generate pages and routes from entities
    5. Return complete domain model
    """
    
    def __init__(self, llm_service: Optional[LLMInterface] = None):
        self.llm = llm_service
        self.translator = get_translator()
        self.keyword_extractor = KeywordEntityExtractor()
    
    def interpret(
        self, 
        architecture_spec: Dict[str, Any],
        use_llm: bool = False,
    ) -> DomainModel:
        """
        Interpret architecture spec into domain model.
        
        Args:
            architecture_spec: Raw spec from frontend
            use_llm: If True, use LLM to enrich entity extraction
            
        Returns:
            Complete DomainModel
        """
        # Step 1: Translate architecture
        translated = self.translator.translate(architecture_spec)
        
        # Step 2: Determine app type
        app_type = self._determine_app_type(translated)
        
        # Step 3: Check for auth
        auth_required, auth_model = self._check_auth(translated)
        
        # Step 4: Extract entities from intent
        entities = self.keyword_extractor.extract(translated.user_prompt)
        
        # If no entities found, create default based on intent
        if not entities:
            entities = self._create_default_entities(translated.user_prompt)
        
        # Step 5: Generate pages and routes
        pages = self._generate_pages(entities, app_type, auth_required)
        api_routes = self._generate_routes(entities)
        
        # Step 6: Build tech stack map
        tech_stack = self._build_tech_stack(translated)
        
        return DomainModel(
            app_type=app_type,
            app_name=translated.project_name,
            intent=translated.user_prompt,
            entities=entities,
            pages=pages,
            api_routes=api_routes,
            auth_required=auth_required,
            auth_model=auth_model,
            tech_stack=tech_stack,
        )
    
    def _determine_app_type(self, arch: TranslatedArchitecture) -> AppType:
        """Determine the type of application from architecture."""
        comp_types = {c.component_type for c in arch.components}
        
        has_frontend = any(ct in comp_types for ct in [
            ComponentType.NEXTJS, ComponentType.REACT, ComponentType.VITE
        ])
        has_backend = any(ct in comp_types for ct in [
            ComponentType.FASTAPI, ComponentType.EXPRESS, ComponentType.FLASK
        ])
        
        if has_frontend and has_backend:
            # Check intent for admin keywords
            intent_lower = arch.user_prompt.lower()
            admin_keywords = ["admin", "dashboard", "internal", "manage", "crud", "panel"]
            if any(kw in intent_lower for kw in admin_keywords):
                return AppType.ADMIN_DASHBOARD
            return AppType.FULLSTACK_APP
        elif has_backend:
            return AppType.API_BACKEND
        else:
            return AppType.STATIC_SITE
    
    def _check_auth(self, arch: TranslatedArchitecture) -> tuple[bool, str]:
        """Check if auth is present and what model."""
        comp_types = {c.component_type for c in arch.components}
        
        if ComponentType.OAUTH in comp_types:
            return True, "oauth"
        elif ComponentType.AUTH in comp_types:
            return True, "jwt"
        elif ComponentType.SUPABASE in comp_types:
            return True, "supabase"
        else:
            # Check intent for auth keywords
            intent_lower = arch.user_prompt.lower()
            if any(kw in intent_lower for kw in ["auth", "login", "user", "account"]):
                return True, "jwt"
            return False, "none"
    
    def _create_default_entities(self, intent: str) -> List[DomainEntity]:
        """Create default entities when keyword extraction fails."""
        # Extract potential entity names from intent using simple NLP
        # Look for "managing X", "X management", etc.
        patterns = [
            r"manag(?:e|ing)\s+(\w+)",
            r"(\w+)\s+management",
            r"track(?:ing)?\s+(\w+)",
            r"admin(?:istration)?\s+(?:of\s+)?(\w+)",
        ]
        
        found_words: Set[str] = set()
        intent_lower = intent.lower()
        
        for pattern in patterns:
            matches = re.findall(pattern, intent_lower)
            found_words.update(matches)
        
        entities = []
        for word in found_words:
            # Capitalize and singularize
            name = word.title()
            if name.endswith("s"):
                singular = name[:-1]
            else:
                singular = name
            
            entities.append(DomainEntity(
                name=singular,
                plural_name=name if name.endswith("s") else name + "s",
                description=f"Entity for {singular.lower()} management",
                fields=[
                    EntityField("id", "string", required=True, unique=True),
                    EntityField("name", "string", required=True),
                    EntityField("created_at", "date", required=True),
                    EntityField("updated_at", "date", required=True),
                ],
            ))
        
        # If still nothing, create a generic "Item" entity
        if not entities:
            entities.append(DomainEntity(
                name="Item",
                plural_name="Items",
                description="Generic item in the system",
                fields=[
                    EntityField("id", "string", required=True, unique=True),
                    EntityField("name", "string", required=True),
                    EntityField("description", "string", required=False),
                    EntityField("status", "enum", required=True),
                    EntityField("created_at", "date", required=True),
                ],
            ))
        
        return entities
    
    def _generate_pages(
        self, 
        entities: List[DomainEntity],
        app_type: AppType,
        auth_required: bool,
    ) -> List[AdminPage]:
        """Generate admin pages from entities."""
        pages = []
        
        # Auth pages
        if auth_required:
            pages.append(AdminPage("/login", "Login", page_type="auth"))
            pages.append(AdminPage("/signup", "Sign Up", page_type="auth"))
        
        # Dashboard (home)
        pages.append(AdminPage("/dashboard", "Dashboard", page_type="dashboard"))
        
        # Entity pages
        for entity in entities:
            slug = entity.plural_name.lower()
            
            # List page
            pages.append(AdminPage(
                f"/{slug}",
                entity.plural_name,
                entity=entity.name,
                page_type="list",
            ))
            
            # Create page
            pages.append(AdminPage(
                f"/{slug}/new",
                f"Create {entity.name}",
                entity=entity.name,
                page_type="create",
            ))
            
            # Edit/Detail page
            pages.append(AdminPage(
                f"/{slug}/[id]",
                f"{entity.name} Details",
                entity=entity.name,
                page_type="edit",
            ))
        
        return pages
    
    def _generate_routes(self, entities: List[DomainEntity]) -> List[APIRoute]:
        """Generate API routes from entities."""
        routes = []
        
        for entity in entities:
            slug = entity.plural_name.lower()
            
            # CRUD routes
            routes.append(APIRoute(
                f"/api/{slug}",
                "GET",
                entity=entity.name,
                operation=OperationType.LIST,
                description=f"List all {entity.plural_name.lower()}",
            ))
            
            routes.append(APIRoute(
                f"/api/{slug}",
                "POST",
                entity=entity.name,
                operation=OperationType.CREATE,
                description=f"Create a new {entity.name.lower()}",
            ))
            
            routes.append(APIRoute(
                f"/api/{slug}/{{id}}",
                "GET",
                entity=entity.name,
                operation=OperationType.READ,
                description=f"Get a single {entity.name.lower()} by ID",
            ))
            
            routes.append(APIRoute(
                f"/api/{slug}/{{id}}",
                "PUT",
                entity=entity.name,
                operation=OperationType.UPDATE,
                description=f"Update a {entity.name.lower()}",
            ))
            
            routes.append(APIRoute(
                f"/api/{slug}/{{id}}",
                "DELETE",
                entity=entity.name,
                operation=OperationType.DELETE,
                description=f"Delete a {entity.name.lower()}",
            ))
        
        return routes
    
    def _build_tech_stack(self, arch: TranslatedArchitecture) -> Dict[str, str]:
        """Build tech stack mapping from architecture."""
        tech_stack = {}
        
        for comp in arch.components:
            ct = comp.component_type
            
            if ct == ComponentType.NEXTJS:
                tech_stack["frontend"] = "nextjs"
            elif ct == ComponentType.REACT:
                tech_stack["frontend"] = "react"
            elif ct == ComponentType.FASTAPI:
                tech_stack["backend"] = "fastapi"
            elif ct == ComponentType.EXPRESS:
                tech_stack["backend"] = "express"
            elif ct in [ComponentType.POSTGRES, ComponentType.SUPABASE]:
                tech_stack["database"] = "postgres"
            elif ct == ComponentType.MONGODB:
                tech_stack["database"] = "mongodb"
            elif ct == ComponentType.REDIS:
                tech_stack["cache"] = "redis"
            elif ct in [ComponentType.AUTH, ComponentType.OAUTH]:
                tech_stack["auth"] = ct.value
        
        return tech_stack


# ============================================================================
# MODULE-LEVEL INTERFACE
# ============================================================================

_interpreter: Optional[DomainInterpreter] = None


def get_interpreter() -> DomainInterpreter:
    """Get singleton interpreter instance."""
    global _interpreter
    if _interpreter is None:
        _interpreter = DomainInterpreter()
    return _interpreter


def interpret_architecture(
    architecture_spec: Dict[str, Any],
    use_llm: bool = False,
) -> DomainModel:
    """
    Main entry point for domain interpretation.
    
    Args:
        architecture_spec: Raw spec from frontend
        use_llm: If True, use LLM to enrich entity extraction
        
    Returns:
        Complete DomainModel with entities, pages, routes
    """
    interpreter = get_interpreter()
    return interpreter.interpret(architecture_spec, use_llm)


# ============================================================================
# CLI FOR TESTING
# ============================================================================

if __name__ == "__main__":
    from services.architecture_translator import GOLDEN_DEMO_SPEC
    
    print("=" * 60)
    print("DOMAIN INTERPRETER - Demo")
    print("=" * 60)
    print()
    
    # Test with golden demo spec
    print("Testing with GOLDEN_DEMO_SPEC...")
    model = interpret_architecture(GOLDEN_DEMO_SPEC)
    
    print(f"\nApp Type: {model.app_type.value}")
    print(f"App Name: {model.app_name}")
    print(f"Intent: {model.intent}")
    print(f"Auth Required: {model.auth_required} ({model.auth_model})")
    
    print(f"\nEntities ({len(model.entities)}):")
    for entity in model.entities:
        print(f"  - {entity.name}: {len(entity.fields)} fields")
    
    print(f"\nPages ({len(model.pages)}):")
    for page in model.pages[:10]:  # Limit output
        print(f"  - {page.path}: {page.title}")
    
    print(f"\nAPI Routes ({len(model.api_routes)}):")
    for route in model.api_routes[:10]:  # Limit output
        print(f"  - {route.method} {route.path}")
    
    print()
    print("=" * 60)
    
    # Test with admin dashboard intent
    print("\nTesting with admin dashboard intent...")
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
    
    model = interpret_architecture(admin_spec)
    
    print(f"\nApp Type: {model.app_type.value}")
    print(f"Entities: {[e.name for e in model.entities]}")
    print(f"Tech Stack: {model.tech_stack}")
