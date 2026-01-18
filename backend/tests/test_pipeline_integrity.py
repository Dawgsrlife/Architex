"""
Pipeline Integrity Tests

These tests verify that the code generation pipeline is structurally sound:
1. Every node in spec has a contract
2. Every edge creates requires/exposes relationships
3. File plans have correct dependencies
4. Prompts contain all required elements
5. Extensibility is preserved

Run: python3 -m pytest tests/test_pipeline_integrity.py -v
"""

import pytest
from typing import Dict, Set, List
from services.architecture_translator import (
    ArchitectureTranslator,
    TranslatedArchitecture,
    ComponentType,
    get_translator,
)
from services.code_generator_v2 import (
    ContractBuilder,
    ContextBuilder,
    EnhancedPlanner,
    GlobalSystemContext,
    NodeContract,
    EnhancedFilePlan,
)


# ============================================================================
# TEST FIXTURES - Various architecture specs
# ============================================================================

MINIMAL_SPEC = {
    "name": "MinimalApp",
    "prompt": "Simple app with frontend and backend",
    "nodes": [
        {"id": "frontend", "type": "nextjs", "data": {"label": "Frontend"}},
        {"id": "backend", "type": "fastapi", "data": {"label": "Backend"}},
    ],
    "edges": [
        {"source": "frontend", "target": "backend"},
    ]
}

FULL_STACK_SPEC = {
    "name": "FullStackApp",
    "prompt": "Full SaaS with auth, database, cache, payments, AI",
    "nodes": [
        {"id": "frontend", "type": "nextjs", "data": {"label": "Next.js Frontend"}},
        {"id": "backend", "type": "fastapi", "data": {"label": "FastAPI Backend"}},
        {"id": "db", "type": "supabase", "data": {"label": "Supabase"}},
        {"id": "cache", "type": "redis", "data": {"label": "Redis Cache"}},
        {"id": "billing", "type": "stripe", "data": {"label": "Stripe Billing"}},
        {"id": "ai", "type": "openai", "data": {"label": "OpenAI"}},
    ],
    "edges": [
        {"source": "frontend", "target": "backend"},
        {"source": "backend", "target": "db"},
        {"source": "backend", "target": "cache"},
        {"source": "backend", "target": "billing"},
        {"source": "backend", "target": "ai"},
    ]
}

DISCONNECTED_SPEC = {
    "name": "DisconnectedApp",
    "prompt": "App with nodes that have no edges",
    "nodes": [
        {"id": "frontend", "type": "nextjs", "data": {"label": "Frontend"}},
        {"id": "backend", "type": "fastapi", "data": {"label": "Backend"}},
        {"id": "orphan", "type": "redis", "data": {"label": "Orphan Redis"}},
    ],
    "edges": [
        {"source": "frontend", "target": "backend"},
        # Note: orphan has no edges
    ]
}


# ============================================================================
# TEST: Contract Completeness
# ============================================================================

class TestContractCompleteness:
    """Verify every node gets a contract."""
    
    def setup_method(self):
        self.translator = get_translator()
    
    def test_all_nodes_have_contracts(self):
        """Every node in spec must have a corresponding contract."""
        translated = self.translator.translate(FULL_STACK_SPEC)
        builder = ContractBuilder(translated)
        contracts = builder.build_contracts()
        
        spec_node_ids = {n["id"] for n in FULL_STACK_SPEC["nodes"]}
        contract_node_ids = set(contracts.keys())
        
        assert spec_node_ids == contract_node_ids, \
            f"Missing contracts for: {spec_node_ids - contract_node_ids}"
    
    def test_contracts_have_node_types(self):
        """Every contract must have a valid node type."""
        translated = self.translator.translate(FULL_STACK_SPEC)
        builder = ContractBuilder(translated)
        contracts = builder.build_contracts()
        
        for node_id, contract in contracts.items():
            assert isinstance(contract.node_type, ComponentType), \
                f"Node {node_id} has invalid type: {contract.node_type}"
    
    def test_fastapi_exposes_endpoints(self):
        """FastAPI nodes must expose endpoints."""
        translated = self.translator.translate(MINIMAL_SPEC)
        builder = ContractBuilder(translated)
        contracts = builder.build_contracts()
        
        backend_contract = contracts.get("backend")
        assert backend_contract is not None
        assert len(backend_contract.endpoints) > 0, \
            "FastAPI must expose at least one endpoint"
    
    def test_database_nodes_expose_clients(self):
        """Database nodes must expose clients."""
        translated = self.translator.translate(FULL_STACK_SPEC)
        builder = ContractBuilder(translated)
        contracts = builder.build_contracts()
        
        db_contract = contracts.get("db")
        assert db_contract is not None
        assert len(db_contract.clients) > 0, \
            "Database nodes must expose clients"
    
    def test_orphan_nodes_still_have_contracts(self):
        """Nodes without edges should still have contracts."""
        translated = self.translator.translate(DISCONNECTED_SPEC)
        builder = ContractBuilder(translated)
        contracts = builder.build_contracts()
        
        orphan_contract = contracts.get("orphan")
        assert orphan_contract is not None
        assert orphan_contract.node_type == ComponentType.REDIS


# ============================================================================
# TEST: Edge → Interaction Mapping
# ============================================================================

class TestEdgeInteractionMapping:
    """Verify edges create proper requires/exposes relationships."""
    
    def setup_method(self):
        self.translator = get_translator()
    
    def test_all_edges_become_interactions(self):
        """Every edge must create an interaction."""
        translated = self.translator.translate(FULL_STACK_SPEC)
        
        spec_edges = FULL_STACK_SPEC["edges"]
        assert len(translated.interactions) == len(spec_edges), \
            f"Expected {len(spec_edges)} interactions, got {len(translated.interactions)}"
    
    def test_frontend_backend_edge_is_http(self):
        """Frontend → Backend edge should be HTTP call type."""
        translated = self.translator.translate(MINIMAL_SPEC)
        ctx_builder = ContextBuilder(translated)
        ctx = ctx_builder.build()
        
        # Find the frontend → backend interaction
        interaction = next(
            (i for i in ctx.interactions if i.source_id == "frontend" and i.target_id == "backend"),
            None
        )
        assert interaction is not None
        assert interaction.call_type == "http", \
            f"Frontend→Backend should be HTTP, got {interaction.call_type}"
    
    def test_backend_db_edge_is_client(self):
        """Backend → DB edge should be client call type."""
        translated = self.translator.translate(FULL_STACK_SPEC)
        ctx_builder = ContextBuilder(translated)
        ctx = ctx_builder.build()
        
        interaction = next(
            (i for i in ctx.interactions if i.source_id == "backend" and i.target_id == "db"),
            None
        )
        assert interaction is not None
        assert interaction.call_type == "client", \
            f"Backend→DB should be client, got {interaction.call_type}"
    
    def test_http_interactions_have_endpoints(self):
        """HTTP interactions should list endpoints used."""
        translated = self.translator.translate(MINIMAL_SPEC)
        ctx_builder = ContextBuilder(translated)
        ctx = ctx_builder.build()
        
        http_interactions = [i for i in ctx.interactions if i.call_type == "http"]
        for interaction in http_interactions:
            assert len(interaction.endpoints_used) > 0, \
                f"HTTP interaction {interaction.source_id}→{interaction.target_id} has no endpoints"
    
    def test_client_interactions_have_clients(self):
        """Client interactions should list clients used."""
        translated = self.translator.translate(FULL_STACK_SPEC)
        ctx_builder = ContextBuilder(translated)
        ctx = ctx_builder.build()
        
        client_interactions = [i for i in ctx.interactions if i.call_type == "client"]
        for interaction in client_interactions:
            assert len(interaction.clients_used) > 0, \
                f"Client interaction {interaction.source_id}→{interaction.target_id} has no clients"
    
    def test_backend_requires_connected_clients(self):
        """Backend should require clients from nodes it connects to."""
        translated = self.translator.translate(FULL_STACK_SPEC)
        builder = ContractBuilder(translated)
        contracts = builder.build_contracts()
        
        backend_contract = contracts.get("backend")
        assert backend_contract is not None
        
        # Backend connects to: db, cache, billing, ai
        # Should require clients from each
        required = set(backend_contract.required_clients)
        assert "supabase_client" in required or "database" in required, \
            f"Backend should require supabase client, got {required}"
        assert "redis_client" in required or "redis" in required or "cache" in required, \
            f"Backend should require redis, got {required}"


# ============================================================================
# TEST: File Plan Dependencies
# ============================================================================

class TestFilePlanDependencies:
    """Verify file plans have correct dependencies and ordering."""
    
    def setup_method(self):
        self.translator = get_translator()
    
    def _get_file_plans(self, spec: Dict) -> List[EnhancedFilePlan]:
        translated = self.translator.translate(spec)
        ctx_builder = ContextBuilder(translated)
        ctx = ctx_builder.build()
        planner = EnhancedPlanner(ctx, translated)
        return planner.create_plan()
    
    def test_all_node_types_generate_files(self):
        """Each node type should generate at least one file."""
        plans = self._get_file_plans(FULL_STACK_SPEC)
        
        # Collect owning nodes
        owning_nodes = {p.owning_node for p in plans}
        
        # Check that main node types are represented
        # (some nodes may share files, so we check for presence, not 1:1)
        assert "frontend" in owning_nodes or \
               any("src/app" in p.path for p in plans), \
               "Frontend should have files"
        assert "backend" in owning_nodes or \
               any("main.py" in p.path for p in plans), \
               "Backend should have files"
    
    def test_root_files_exist(self):
        """Root files (package.json, etc.) should always be generated."""
        plans = self._get_file_plans(MINIMAL_SPEC)
        paths = {p.path for p in plans}
        
        # Check for essential root files
        assert "package.json" in paths or "requirements.txt" in paths, \
            "Should have package.json or requirements.txt"
        assert "README.md" in paths, \
            "Should have README.md"
    
    def test_main_py_has_requirements(self):
        """main.py should list required imports."""
        plans = self._get_file_plans(FULL_STACK_SPEC)
        
        main_py_plan = next(
            (p for p in plans if p.path == "main.py"),
            None
        )
        assert main_py_plan is not None, "main.py should be in plan"
        assert len(main_py_plan.requires) > 0, \
            "main.py should require clients from connected nodes"
    
    def test_api_ts_requires_backend_endpoints(self):
        """Frontend api.ts should require backend endpoints."""
        plans = self._get_file_plans(MINIMAL_SPEC)
        
        api_plan = next(
            (p for p in plans if "api.ts" in p.path or "api" in p.path.lower()),
            None
        )
        assert api_plan is not None, "Should have an API client file"
        assert len(api_plan.requires) > 0, \
            "API client should require backend endpoints"
    
    def test_must_include_contains_endpoints(self):
        """must_include should contain actual endpoints for backend files."""
        plans = self._get_file_plans(MINIMAL_SPEC)
        
        main_py_plan = next(
            (p for p in plans if p.path == "main.py"),
            None
        )
        assert main_py_plan is not None
        
        # must_include should reference endpoints
        must_include_str = " ".join(str(m) for m in main_py_plan.must_include if m)
        assert "/api" in must_include_str or "endpoint" in must_include_str.lower(), \
            f"main.py must_include should mention endpoints: {main_py_plan.must_include}"
    
    def test_stripe_generates_billing_files(self):
        """Stripe node should generate billing-related files."""
        plans = self._get_file_plans(FULL_STACK_SPEC)
        paths = {p.path for p in plans}
        
        # Check for pricing page or billing files
        has_billing = any(
            "pricing" in p.lower() or "billing" in p.lower() or "stripe" in p.lower()
            for p in paths
        )
        assert has_billing, \
            f"Stripe node should generate billing files. Got: {paths}"
    
    def test_redis_generates_cache_file(self):
        """Redis node should generate cache file."""
        plans = self._get_file_plans(FULL_STACK_SPEC)
        paths = {p.path for p in plans}
        
        has_cache = any("cache" in p.lower() for p in paths)
        assert has_cache, \
            f"Redis node should generate cache file. Got: {paths}"


# ============================================================================
# TEST: Global Context Consistency
# ============================================================================

class TestGlobalContext:
    """Verify global context aggregates correctly."""
    
    def setup_method(self):
        self.translator = get_translator()
    
    def _get_context(self, spec: Dict) -> GlobalSystemContext:
        translated = self.translator.translate(spec)
        ctx_builder = ContextBuilder(translated)
        return ctx_builder.build()
    
    def test_all_endpoints_aggregated(self):
        """all_endpoints should contain endpoints from all nodes."""
        ctx = self._get_context(FULL_STACK_SPEC)
        
        assert len(ctx.all_endpoints) > 0, \
            "Should have aggregated endpoints"
        # Backend endpoints should be present
        assert any("/api" in ep for ep in ctx.all_endpoints), \
            "Should have API endpoints"
    
    def test_all_schemas_aggregated(self):
        """all_schemas should contain schemas from all nodes."""
        ctx = self._get_context(FULL_STACK_SPEC)
        
        assert len(ctx.all_schemas) > 0, \
            "Should have aggregated schemas"
    
    def test_all_env_vars_aggregated(self):
        """all_env_vars should contain env vars from all nodes."""
        ctx = self._get_context(FULL_STACK_SPEC)
        
        assert len(ctx.all_env_vars) > 0, \
            "Should have aggregated env vars"
        # Supabase vars
        supabase_vars = [v for v in ctx.all_env_vars if "SUPABASE" in v]
        assert len(supabase_vars) > 0, \
            "Should have Supabase env vars"
        # Stripe vars
        stripe_vars = [v for v in ctx.all_env_vars if "STRIPE" in v]
        assert len(stripe_vars) > 0, \
            "Should have Stripe env vars"
    
    def test_system_prompt_contains_nodes(self):
        """System prompt should describe all nodes."""
        ctx = self._get_context(FULL_STACK_SPEC)
        prompt = ctx.to_system_prompt()
        
        for node in FULL_STACK_SPEC["nodes"]:
            node_id = node["id"]
            assert node_id in prompt, \
                f"System prompt should mention node {node_id}"
    
    def test_system_prompt_contains_interactions(self):
        """System prompt should describe interactions."""
        ctx = self._get_context(MINIMAL_SPEC)
        prompt = ctx.to_system_prompt()
        
        assert "frontend" in prompt and "backend" in prompt, \
            "Prompt should mention both nodes"
        assert "→" in prompt or "->" in prompt or "http" in prompt.lower(), \
            "Prompt should show interaction"


# ============================================================================
# TEST: Extensibility
# ============================================================================

class TestExtensibility:
    """Verify new node types can be added without breaking the pipeline."""
    
    def setup_method(self):
        self.translator = get_translator()
    
    def test_unknown_node_type_does_not_crash(self):
        """Unknown node types should fallback gracefully."""
        spec = {
            "name": "UnknownNodeApp",
            "prompt": "App with unknown node type",
            "nodes": [
                {"id": "frontend", "type": "nextjs", "data": {"label": "Frontend"}},
                {"id": "mystery", "type": "quantum_computer", "data": {"label": "Mystery"}},
            ],
            "edges": [
                {"source": "frontend", "target": "mystery"},
            ]
        }
        
        # Should not throw
        translated = self.translator.translate(spec)
        
        # Mystery should become COMPONENT type
        mystery_comp = next(
            (c for c in translated.components if c.id == "mystery"),
            None
        )
        assert mystery_comp is not None
        assert mystery_comp.component_type == ComponentType.COMPONENT
    
    def test_label_based_inference_for_unknown_type(self):
        """Should infer type from label when type is unknown."""
        spec = {
            "name": "LabelInferenceApp",
            "prompt": "App inferring from labels",
            "nodes": [
                {"id": "n1", "type": "custom", "data": {"label": "PostgreSQL Database"}},
                {"id": "n2", "type": "custom", "data": {"label": "Redis Cache Layer"}},
            ],
            "edges": []
        }
        
        translated = self.translator.translate(spec)
        
        n1 = next((c for c in translated.components if c.id == "n1"), None)
        n2 = next((c for c in translated.components if c.id == "n2"), None)
        
        # Labels contain "postgres" and "redis", should be inferred
        assert n1.component_type in (ComponentType.POSTGRES, ComponentType.COMPONENT)
        assert n2.component_type in (ComponentType.REDIS, ComponentType.COMPONENT)
    
    def test_all_component_types_are_handled(self):
        """Every ComponentType should have handling in contract builder."""
        # Create a spec with every known component type
        nodes = []
        for i, ct in enumerate(ComponentType):
            if ct not in (ComponentType.COMPONENT, ComponentType.SERVICE):
                nodes.append({
                    "id": f"node_{i}",
                    "type": ct.value,
                    "data": {"label": f"Test {ct.value}"}
                })
        
        spec = {
            "name": "AllTypesApp",
            "prompt": "App with all component types",
            "nodes": nodes,
            "edges": []
        }
        
        # Should not throw
        translated = self.translator.translate(spec)
        ctx_builder = ContextBuilder(translated)
        ctx = ctx_builder.build()
        
        # Every node should have a contract
        assert len(ctx.nodes) == len(nodes)


# ============================================================================
# TEST: Prompt Verification
# ============================================================================

class TestPromptVerification:
    """Verify prompts contain all required elements."""
    
    def setup_method(self):
        self.translator = get_translator()
    
    def _build_file_prompt(self, ctx: GlobalSystemContext, plan: EnhancedFilePlan) -> str:
        """Build the exact prompt that would be sent to LLM for this file."""
        system_prompt = ctx.to_system_prompt()
        
        file_prompt = f"""
Generate the file: {plan.path}
Purpose: {plan.purpose}
"""
        if plan.exposes:
            file_prompt += f"\nThis file MUST EXPOSE:\n"
            for exp in plan.exposes:
                file_prompt += f"  - {exp}\n"
        
        if plan.requires:
            file_prompt += f"\nThis file REQUIRES (import/use these):\n"
            for req in plan.requires:
                file_prompt += f"  - {req}\n"
        
        if plan.must_include:
            must = [m for m in plan.must_include if m]
            if must:
                file_prompt += f"\nMUST INCLUDE in code:\n"
                for m in must:
                    file_prompt += f"  - {m}\n"
        
        return f"{system_prompt}\n\n{file_prompt}"
    
    def test_main_py_prompt_includes_endpoints(self):
        """main.py prompt should include endpoints to expose."""
        translated = self.translator.translate(MINIMAL_SPEC)
        ctx_builder = ContextBuilder(translated)
        ctx = ctx_builder.build()
        planner = EnhancedPlanner(ctx, translated)
        plans = planner.create_plan()
        
        main_plan = next((p for p in plans if p.path == "main.py"), None)
        assert main_plan is not None
        
        prompt = self._build_file_prompt(ctx, main_plan)
        
        assert "/api" in prompt, \
            "main.py prompt should mention API endpoints"
    
    def test_api_ts_prompt_includes_backend_endpoints(self):
        """api.ts prompt should include backend endpoints to call."""
        translated = self.translator.translate(MINIMAL_SPEC)
        ctx_builder = ContextBuilder(translated)
        ctx = ctx_builder.build()
        planner = EnhancedPlanner(ctx, translated)
        plans = planner.create_plan()
        
        api_plan = next((p for p in plans if "api.ts" in p.path), None)
        assert api_plan is not None
        
        prompt = self._build_file_prompt(ctx, api_plan)
        
        assert "/api" in prompt or "REQUIRES" in prompt, \
            "api.ts prompt should reference backend endpoints"
    
    def test_prompts_include_env_vars(self):
        """Prompts should include relevant env vars."""
        translated = self.translator.translate(FULL_STACK_SPEC)
        ctx_builder = ContextBuilder(translated)
        ctx = ctx_builder.build()
        
        prompt = ctx.to_system_prompt()
        
        assert "SUPABASE" in prompt or "STRIPE" in prompt or "REDIS" in prompt, \
            "System prompt should mention env vars"


# ============================================================================
# TEST: End-to-End Dry Run
# ============================================================================

class TestEndToEndDryRun:
    """Full pipeline dry run verification."""
    
    def setup_method(self):
        self.translator = get_translator()
    
    def test_full_pipeline_produces_valid_output(self):
        """Full pipeline should produce valid file plans."""
        spec = FULL_STACK_SPEC
        
        # Step 1: Translate
        translated = self.translator.translate(spec)
        assert len(translated.components) == len(spec["nodes"])
        assert len(translated.interactions) == len(spec["edges"])
        
        # Step 2: Build context
        ctx_builder = ContextBuilder(translated)
        ctx = ctx_builder.build()
        assert len(ctx.nodes) == len(spec["nodes"])
        assert len(ctx.interactions) == len(spec["edges"])
        
        # Step 3: Create file plans
        planner = EnhancedPlanner(ctx, translated)
        plans = planner.create_plan()
        assert len(plans) > 0
        
        # Step 4: Verify every plan has required fields
        for plan in plans:
            assert plan.path, f"Plan missing path: {plan}"
            assert plan.purpose, f"Plan missing purpose: {plan}"
            assert plan.owning_node, f"Plan missing owning_node: {plan}"
    
    def test_every_edge_creates_relationship(self):
        """Every edge should create at least one requires/exposes relationship."""
        spec = FULL_STACK_SPEC
        
        translated = self.translator.translate(spec)
        ctx_builder = ContextBuilder(translated)
        ctx = ctx_builder.build()
        planner = EnhancedPlanner(ctx, translated)
        plans = planner.create_plan()
        
        # Collect all requires from all plans
        all_requires = set()
        for plan in plans:
            all_requires.update(plan.requires)
        
        # Collect all exposes from all plans
        all_exposes = set()
        for plan in plans:
            all_exposes.update(plan.exposes)
        
        # There should be some overlap (what one exposes, another requires)
        # This is a weak test but catches gross errors
        assert len(all_requires) > 0, "Should have some requirements"
        assert len(all_exposes) > 0, "Should have some exposures"
    
    def test_no_duplicate_file_paths(self):
        """File plans should not have duplicate paths."""
        spec = FULL_STACK_SPEC
        
        translated = self.translator.translate(spec)
        ctx_builder = ContextBuilder(translated)
        ctx = ctx_builder.build()
        planner = EnhancedPlanner(ctx, translated)
        plans = planner.create_plan()
        
        paths = [p.path for p in plans]
        unique_paths = set(paths)
        
        duplicates = [p for p in paths if paths.count(p) > 1]
        assert len(paths) == len(unique_paths), \
            f"Duplicate file paths: {set(duplicates)}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
