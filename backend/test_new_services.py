"""
Test the new architecture critic, domain interpreter, and constrained plan services.
"""
import asyncio
from services.architecture_critic import critique_architecture, CriticResult
from services.domain_interpreter import interpret_architecture, DomainModel
from services.constrained_plan import build_generation_plan, ConstrainedGenerationPlan


# Test spec - Admin dashboard
admin_spec = {
    "name": "User Admin",
    "prompt": "Internal admin tool for managing users and access logs",
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


# Bad spec - should have blocking issues
bad_spec = {
    "name": "Test App",
    "prompt": "build an app",  # Too vague
    "nodes": [
        {"id": "frontend", "type": "nextjs", "data": {"label": "Next.js"}},
        {"id": "backend", "type": "fastapi", "data": {"label": "FastAPI"}},
    ],
    "edges": [],  # No connections!
}


async def test_domain_interpreter():
    print("=" * 60)
    print("TESTING: Domain Interpreter")
    print("=" * 60)
    
    model = interpret_architecture(admin_spec)
    
    print(f"App Type: {model.app_type.value}")
    print(f"Entities: {[e.name for e in model.entities]}")
    print(f"Pages: {len(model.pages)}")
    print(f"API Routes: {len(model.api_routes)}")
    print(f"Auth Required: {model.auth_required}")
    print(f"Tech Stack: {model.tech_stack}")
    
    assert model.app_type.value == "admin_dashboard", "Should detect admin dashboard"
    assert len(model.entities) > 0, "Should extract entities"
    assert model.auth_required, "Should detect auth requirement"
    
    print("\n✅ Domain Interpreter: PASSED")


async def test_constrained_plan():
    print()
    print("=" * 60)
    print("TESTING: Constrained Generation Plan")
    print("=" * 60)
    
    plan = build_generation_plan(admin_spec)
    
    print(f"App: {plan.app_name}")
    print(f"Type: {plan.app_type.value}")
    print(f"Files to generate: {len(plan.files)}")
    
    print("\nFirst 10 files:")
    for f in plan.files[:10]:
        print(f"  [{f.file_type.value:12}] {f.path}")
    
    if len(plan.files) > 10:
        print(f"  ... and {len(plan.files) - 10} more files")
    
    assert len(plan.files) > 0, "Should have files to generate"
    assert any("README" in f.path for f in plan.files), "Should have README"
    
    print("\n✅ Constrained Generation Plan: PASSED")


async def test_architecture_critic():
    print()
    print("=" * 60)
    print("TESTING: Architecture Critic (good spec)")
    print("=" * 60)
    
    result = await critique_architecture(admin_spec, skip_llm=True)
    
    print(f"Summary: {result.summary}")
    print(f"Blocking: {result.blocking}")
    print(f"Issues: {len(result.issues)}")
    
    for issue in result.issues:
        print(f"  [{issue.severity.value:8}] {issue.problem[:60]}")
    
    assert not result.blocking, "Good spec should not block"
    
    print("\n✅ Architecture Critic (good spec): PASSED")


async def test_architecture_critic_bad():
    print()
    print("=" * 60)
    print("TESTING: Architecture Critic (bad spec - should block)")
    print("=" * 60)
    
    result = await critique_architecture(bad_spec, skip_llm=True)
    
    print(f"Summary: {result.summary}")
    print(f"Blocking: {result.blocking}")
    print(f"Issues: {len(result.issues)}")
    
    for issue in result.issues:
        print(f"  [{issue.severity.value:8}] {issue.problem[:60]}")
    
    assert result.blocking, "Bad spec SHOULD block generation"
    assert len(result.issues) > 0, "Should have issues"
    
    print("\n✅ Architecture Critic (bad spec): PASSED - correctly blocked")


async def test_cline_prompt():
    print()
    print("=" * 60)
    print("TESTING: Cline Prompt Generation")
    print("=" * 60)
    
    plan = build_generation_plan(admin_spec)
    prompt = plan.to_cline_prompt()
    
    print(f"Prompt length: {len(prompt)} chars")
    print("\nFirst 1500 chars:")
    print(prompt[:1500])
    print("...")
    
    assert "PROJECT:" in prompt, "Should have project header"
    assert "ENTITIES" in prompt, "Should have entities section"
    assert "API ROUTES" in prompt, "Should have API routes section"
    
    print("\n✅ Cline Prompt: PASSED")


async def main():
    print("\n" + "=" * 60)
    print("ARCHITEX - NEW SERVICES TEST SUITE")
    print("=" * 60 + "\n")
    
    await test_domain_interpreter()
    await test_constrained_plan()
    await test_architecture_critic()
    await test_architecture_critic_bad()
    await test_cline_prompt()
    
    print()
    print("=" * 60)
    print("🎉 ALL TESTS PASSED!")
    print("=" * 60)
    print()
    print("New services ready:")
    print("  1. Architecture Critic - validates architectures before generation")
    print("  2. Domain Interpreter - extracts entities, pages, routes from intent")
    print("  3. Constrained Plan - explicit file instructions for Cline")
    print()


if __name__ == "__main__":
    asyncio.run(main())
