"""
Unit tests for Architecture Translator (Layer 2)

These tests prove that the translation is:
1. DETERMINISTIC - same input → same output
2. TESTABLE - no LLM required
3. CORRECT - semantics are properly extracted

Run: python -m pytest tests/test_architecture_translator.py -v
"""

import pytest
from services.architecture_translator import (
    ArchitectureTranslator,
    translate_architecture,
    get_golden_demo_instructions,
    GOLDEN_DEMO_SPEC,
    ComponentType,
    TranslatedArchitecture,
)


class TestComponentTypeResolution:
    """Test that component types are correctly resolved from various input formats."""
    
    def setup_method(self):
        self.translator = ArchitectureTranslator()
    
    def test_explicit_type_field(self):
        """Node with explicit type field."""
        node = {"id": "1", "type": "fastapi", "data": {"label": "My API"}}
        comp = self.translator._translate_node(node)
        assert comp.component_type == ComponentType.FASTAPI
    
    def test_data_type_field(self):
        """Node with type in data object."""
        node = {"id": "1", "data": {"type": "nextjs", "label": "Frontend"}}
        comp = self.translator._translate_node(node)
        assert comp.component_type == ComponentType.NEXTJS
    
    def test_technology_field(self):
        """Node with technology field."""
        node = {"id": "1", "data": {"technology": "mongodb", "label": "Database"}}
        comp = self.translator._translate_node(node)
        assert comp.component_type == ComponentType.MONGODB
    
    def test_tech_field_alias(self):
        """Node with tech field (short alias)."""
        node = {"id": "1", "data": {"tech": "redis", "label": "Cache"}}
        comp = self.translator._translate_node(node)
        assert comp.component_type == ComponentType.REDIS
    
    def test_label_inference(self):
        """Type inferred from label text."""
        node = {"id": "1", "data": {"label": "Stripe Payment Gateway"}}
        comp = self.translator._translate_node(node)
        assert comp.component_type == ComponentType.STRIPE
    
    def test_fallback_to_component(self):
        """Unknown type falls back to COMPONENT."""
        node = {"id": "1", "data": {"label": "Some Random Thing"}}
        comp = self.translator._translate_node(node)
        assert comp.component_type == ComponentType.COMPONENT


class TestTypeAliases:
    """Test that common aliases are resolved correctly."""
    
    def setup_method(self):
        self.translator = ArchitectureTranslator()
    
    @pytest.mark.parametrize("alias,expected", [
        ("next", ComponentType.NEXTJS),
        ("next.js", ComponentType.NEXTJS),
        ("reactjs", ComponentType.REACT),
        ("fast-api", ComponentType.FASTAPI),
        ("postgresql", ComponentType.POSTGRES),
        ("pg", ComponentType.POSTGRES),
        ("mongo", ComponentType.MONGODB),
        ("payments", ComponentType.STRIPE),
        ("billing", ComponentType.STRIPE),
        ("authentication", ComponentType.AUTH),
        ("cache", ComponentType.REDIS),
        ("ai", ComponentType.OPENAI),
        ("llm", ComponentType.OPENAI),
    ])
    def test_alias_resolution(self, alias, expected):
        """Test that aliases resolve to correct component types."""
        node = {"id": "1", "type": alias, "data": {"label": "Test"}}
        comp = self.translator._translate_node(node)
        assert comp.component_type == expected


class TestInteractionTranslation:
    """Test that edges are translated into meaningful interactions."""
    
    def setup_method(self):
        self.translator = ArchitectureTranslator()
    
    def test_explicit_label(self):
        """Edge with explicit label."""
        spec = {
            "nodes": [
                {"id": "1", "type": "fastapi", "data": {"label": "API"}},
                {"id": "2", "type": "postgres", "data": {"label": "DB"}},
            ],
            "edges": [
                {"source": "1", "target": "2", "label": "queries"}
            ]
        }
        result = self.translator.translate(spec)
        assert len(result.interactions) == 1
        assert "queries" in result.interactions[0].interaction_type
    
    def test_inferred_database_interaction(self):
        """Interaction to database should be 'stores data in'."""
        spec = {
            "nodes": [
                {"id": "1", "type": "fastapi", "data": {"label": "API"}},
                {"id": "2", "type": "postgres", "data": {"label": "DB"}},
            ],
            "edges": [
                {"source": "1", "target": "2"}  # No label
            ]
        }
        result = self.translator.translate(spec)
        assert "stores data in" in result.interactions[0].interaction_type
    
    def test_inferred_stripe_interaction(self):
        """Interaction to Stripe should be 'processes payments via'."""
        spec = {
            "nodes": [
                {"id": "1", "type": "fastapi", "data": {"label": "API"}},
                {"id": "2", "type": "stripe", "data": {"label": "Billing"}},
            ],
            "edges": [
                {"source": "1", "target": "2"}
            ]
        }
        result = self.translator.translate(spec)
        assert "payments" in result.interactions[0].interaction_type


class TestDeterminism:
    """Test that translation is deterministic."""
    
    def test_same_input_same_output(self):
        """Same input should produce identical output."""
        spec = GOLDEN_DEMO_SPEC
        
        result1 = translate_architecture(spec)
        result2 = translate_architecture(spec)
        
        assert result1 == result2
    
    def test_golden_demo_stability(self):
        """Golden demo instructions should be stable."""
        instructions1 = get_golden_demo_instructions()
        instructions2 = get_golden_demo_instructions()
        
        assert instructions1 == instructions2


class TestInstructionDSL:
    """Test the generated instruction DSL format."""
    
    def test_contains_project_name(self):
        """Instructions should contain project name."""
        spec = {"name": "My Test Project", "nodes": [], "edges": []}
        result = translate_architecture(spec)
        assert "My Test Project" in result
    
    def test_contains_user_prompt(self):
        """Instructions should contain user prompt."""
        spec = {"prompt": "Build a todo app", "nodes": [], "edges": []}
        result = translate_architecture(spec)
        assert "Build a todo app" in result
    
    def test_contains_requirements_section(self):
        """Instructions should have requirements section."""
        spec = {"nodes": [], "edges": []}
        result = translate_architecture(spec)
        assert "## REQUIREMENTS" in result
    
    def test_contains_env_vars(self):
        """Instructions should list environment variables."""
        spec = {
            "nodes": [
                {"id": "1", "type": "stripe", "data": {"label": "Billing"}}
            ],
            "edges": []
        }
        result = translate_architecture(spec)
        assert "STRIPE_SECRET_KEY" in result


class TestGoldenDemoSpec:
    """Test the golden demo specification."""
    
    def test_has_all_required_fields(self):
        """Golden spec should have all required fields."""
        assert "name" in GOLDEN_DEMO_SPEC
        assert "prompt" in GOLDEN_DEMO_SPEC
        assert "nodes" in GOLDEN_DEMO_SPEC
        assert "edges" in GOLDEN_DEMO_SPEC
    
    def test_nodes_are_well_formed(self):
        """Each node should have id and type."""
        for node in GOLDEN_DEMO_SPEC["nodes"]:
            assert "id" in node
            assert "type" in node
            assert "data" in node
            assert "label" in node["data"]
    
    def test_edges_reference_valid_nodes(self):
        """Each edge should reference existing nodes."""
        node_ids = {n["id"] for n in GOLDEN_DEMO_SPEC["nodes"]}
        for edge in GOLDEN_DEMO_SPEC["edges"]:
            assert edge["source"] in node_ids
            assert edge["target"] in node_ids
    
    def test_golden_demo_translates_correctly(self):
        """Golden demo should translate to meaningful instructions."""
        translator = ArchitectureTranslator()
        result = translator.translate(GOLDEN_DEMO_SPEC)
        
        # Should have 4 components
        assert len(result.components) == 4
        
        # Should have correct tech stack
        tech_stack = set(result.tech_stack)
        assert "nextjs" in tech_stack
        assert "fastapi" in tech_stack
        assert "supabase" in tech_stack
        assert "stripe" in tech_stack
        
        # Should have 3 interactions
        assert len(result.interactions) == 3
        
        # Should have env vars from Supabase and Stripe
        env_vars = set(result.env_vars)
        assert "SUPABASE_URL" in env_vars
        assert "STRIPE_SECRET_KEY" in env_vars


class TestSnapshotGoldenDemo:
    """Snapshot test - the golden demo output should match expected format."""
    
    def test_golden_demo_snapshot(self):
        """Verify golden demo instruction structure (not exact text)."""
        instructions = get_golden_demo_instructions()
        
        # Required sections
        assert "PROJECT: SaaS Starter" in instructions
        assert "## USER REQUEST" in instructions
        assert "## SYSTEM ARCHITECTURE" in instructions
        assert "## INTERACTIONS" in instructions
        assert "## TECH STACK" in instructions
        assert "## ENVIRONMENT VARIABLES" in instructions
        assert "## REQUIREMENTS" in instructions
        
        # Required components
        assert "Next.js Frontend" in instructions
        assert "FastAPI Backend" in instructions
        assert "Supabase Database" in instructions
        assert "Stripe Billing" in instructions
        
        # Required interactions
        assert "calls" in instructions.lower()
        assert "stores" in instructions.lower() or "data" in instructions.lower()
        assert "payment" in instructions.lower()
        
        # Required env vars
        assert "SUPABASE_URL" in instructions
        assert "STRIPE_SECRET_KEY" in instructions


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
