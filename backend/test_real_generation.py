#!/usr/bin/env python3
"""
Test: Generate REAL code with LLM for a single file.

This shows the difference between template generation and intelligent AI generation.
"""

import asyncio
import sys
import os
sys.path.insert(0, ".")

# Check for API key
if not os.getenv("GOOGLE_GEMINI_API_KEY"):
    print("⚠️  GOOGLE_GEMINI_API_KEY not set - cannot test real generation")
    print("    Set it in your environment to test actual AI code generation")
    sys.exit(1)

from services.architecture_translator import get_translator
from services.code_generator import GenerationPlanner, PromptBuilder
from services.llm_interface import get_default_llm_service

# Lovable Clone Spec
LOVABLE_CLONE_SPEC = {
    "projectName": "BuilderAI",
    "prompt": """Create a Lovable/v0 clone - an AI-powered app builder where users can:
    1. Describe their app in natural language
    2. See a live preview
    3. Export React code
    
    Include: Auth, Dashboard, AI chat, Stripe billing
    """,
    "nodes": [
        {"id": "frontend", "type": "nextjs", "data": {"label": "Next.js Frontend"}},
        {"id": "backend", "type": "fastapi", "data": {"label": "FastAPI Backend"}},
        {"id": "db", "type": "supabase", "data": {"label": "Supabase"}},
        {"id": "ai", "type": "openai", "data": {"label": "OpenAI"}},
        {"id": "billing", "type": "stripe", "data": {"label": "Stripe"}},
    ],
    "edges": [
        {"source": "frontend", "target": "backend"},
        {"source": "backend", "target": "db"},
        {"source": "backend", "target": "ai"},
    ]
}


async def main():
    print("=" * 70)
    print("🧠 INTELLIGENT CODE GENERATION TEST")
    print("=" * 70)
    print()
    
    # Get LLM service
    llm = get_default_llm_service()
    print(f"Using: {llm.provider_name}")
    print()
    
    # Translate spec
    translator = get_translator()
    translated = translator.translate(LOVABLE_CLONE_SPEC)
    
    # Build prompt for main.py
    prompt_builder = PromptBuilder(translated)
    system_prompt = prompt_builder.build_system_prompt()
    
    # Find main.py
    planner = GenerationPlanner(translated)
    plan = planner.create_plan()
    
    target_file = None
    for fp in plan.files:
        if fp.path == "main.py":
            target_file = fp
            break
    
    if not target_file:
        print("No main.py in plan!")
        return
    
    file_prompt = prompt_builder.build_file_prompt(target_file, {})
    full_prompt = f"{system_prompt}\n\n{file_prompt}"
    
    print("📤 Sending to LLM...")
    print("-" * 70)
    
    try:
        response = await llm.generate_architecture(
            description=full_prompt,
            requirements=None,
            tech_stack=None,
        )
        
        content = response.get("architecture", "")
        
        # Clean markdown blocks
        import re
        content = re.sub(r'^```\w*\n?|```$', '', content, flags=re.MULTILINE).strip()
        
        print()
        print("=" * 70)
        print("📝 GENERATED main.py:")
        print("=" * 70)
        print(content[:3000])
        if len(content) > 3000:
            print(f"\n... ({len(content)} total chars)")
        print()
        print("=" * 70)
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
