#!/usr/bin/env python3
"""
Test: Generate a Lovable Clone Architecture

This demonstrates the intelligent code generator with a complex spec.
"""

import sys
sys.path.insert(0, ".")

from services.architecture_translator import get_translator
from services.code_generator import GenerationPlanner, PromptBuilder

# The Lovable Clone Spec - What a user might create on the canvas
LOVABLE_CLONE_SPEC = {
    "projectName": "BuilderAI - AI App Builder",
    "prompt": """Create a Lovable/v0 clone - an AI-powered application builder where users can:
    1. Describe their app idea in natural language
    2. See a preview of the generated UI in real-time
    3. Edit and iterate on the design
    4. Export working React code
    5. Deploy with one click
    
    The app should have:
    - Landing page with demo video
    - Auth with Google/GitHub OAuth
    - Dashboard showing user's projects
    - AI chat interface for describing apps
    - Live preview panel
    - Code export functionality
    - Stripe billing for premium features
    """,
    "nodes": [
        {
            "id": "frontend",
            "type": "nextjs",
            "data": {"label": "Next.js Frontend", "technology": "nextjs"}
        },
        {
            "id": "backend",
            "type": "fastapi",
            "data": {"label": "FastAPI Backend", "technology": "fastapi"}
        },
        {
            "id": "db",
            "type": "supabase",
            "data": {"label": "Supabase", "technology": "supabase"}
        },
        {
            "id": "auth",
            "type": "oauth",
            "data": {"label": "OAuth Login", "technology": "oauth"}
        },
        {
            "id": "ai",
            "type": "openai",
            "data": {"label": "OpenAI API", "technology": "openai"}
        },
        {
            "id": "redis",
            "type": "redis",
            "data": {"label": "Redis Cache", "technology": "redis"}
        },
        {
            "id": "billing",
            "type": "stripe",
            "data": {"label": "Stripe Payments", "technology": "stripe"}
        },
    ],
    "edges": [
        {"source": "frontend", "target": "backend"},
        {"source": "backend", "target": "db"},
        {"source": "backend", "target": "auth"},
        {"source": "backend", "target": "ai"},
        {"source": "backend", "target": "redis"},
        {"source": "frontend", "target": "billing"},
    ]
}

# Translate
translator = get_translator()
translated = translator.translate(LOVABLE_CLONE_SPEC)

# Plan
planner = GenerationPlanner(translated)
plan = planner.create_plan()

print("=" * 70)
print("🚀 LOVABLE CLONE - Architecture Analysis")
print("=" * 70)
print()

print(f"PROJECT: {plan.project_name}")
print()
print("USER REQUEST:")
print("-" * 70)
print(LOVABLE_CLONE_SPEC["prompt"][:500])
print()

print("DETECTED COMPONENTS:")
print("-" * 70)
for comp in translated.components:
    features = f" ({', '.join(comp.features)})" if comp.features else ""
    print(f"  🔹 {comp.name}: {comp.description}{features}")
print()

print("INTERACTIONS:")
print("-" * 70)
for interaction in translated.interactions:
    print(f"  → {interaction.description}")
print()

print(f"GENERATION PLAN ({len(plan.files)} files):")
print("-" * 70)
for i, fp in enumerate(plan.files, 1):
    print(f"  {i:2}. {fp.path}")
    print(f"      └─ {fp.purpose}")
print()

# Show the DSL that would go to the LLM
print("=" * 70)
print("📝 SEMANTIC DSL (what the LLM sees):")
print("=" * 70)
dsl = translated.to_instruction_dsl()
print(dsl[:2000])
print("...")
print()

# Show a complex file prompt
print("=" * 70)
print("🧠 SAMPLE INTELLIGENT PROMPT (for main.py):")
print("=" * 70)
prompt_builder = PromptBuilder(translated)

# Find the FastAPI main.py file
for fp in plan.files:
    if fp.path == "main.py":
        full_prompt = prompt_builder.build_system_prompt() + "\n\n" + prompt_builder.build_file_prompt(fp, {})
        print(full_prompt[:3000])
        print("...")
        break
