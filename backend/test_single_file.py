#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SINGLE FILE TEST: Generate just main.py with cross-node context

This test burns MINIMAL tokens (one LLM call) to prove the magic works.
"""

import os
import sys
import asyncio

sys.path.insert(0, ".")

from services.architecture_translator import get_translator
from services.code_generator_v2 import ContextBuilder, EnhancedPlanner
from services.llm_interface import get_llm_service

# Minimal 3-node spec
SPEC = {
    "projectName": "TaskApp",
    "prompt": "Task management with auth and CRUD.",
    "nodes": [
        {"id": "frontend", "type": "nextjs", "data": {"label": "Next.js"}},
        {"id": "backend", "type": "fastapi", "data": {"label": "FastAPI"}},
        {"id": "db", "type": "supabase", "data": {"label": "Supabase"}},
    ],
    "edges": [
        {"source": "frontend", "target": "backend"},
        {"source": "backend", "target": "db"},
    ]
}


async def main():
    print("=" * 70)
    print("SINGLE FILE TEST: Prove LLM + Cross-Node Awareness = Magic")
    print("=" * 70)
    print()
    
    # Check API
    try:
        llm = get_llm_service()
        print(f"Using LLM: {llm.provider_name}")
    except Exception as e:
        print(f"ERROR: {e}")
        return
    
    # Build context
    translator = get_translator()
    translated = translator.translate(SPEC)
    ctx = ContextBuilder(translated).build()
    planner = EnhancedPlanner(ctx, translated)
    plans = planner.create_plan()
    
    # Find main.py plan
    main_plan = next((p for p in plans if p.path == "main.py"), None)
    if not main_plan:
        print("ERROR: main.py not in plan")
        return
    
    # Build prompt
    system_ctx = ctx.to_system_prompt()
    
    file_prompt = f"""
Generate the file: {main_plan.path}
Purpose: {main_plan.purpose}

This file MUST EXPOSE these endpoints:
{chr(10).join(f'  - {e}' for e in main_plan.exposes)}

This file MUST IMPORT from sibling files:
{chr(10).join(f'  - {r}' for r in main_plan.requires)}

CRITICAL:
1. Output ONLY Python code, no markdown
2. Use FastAPI with proper type hints
3. Import from database.py (from database import get_supabase_client)
4. Define all endpoints listed above
5. Use Pydantic models for request/response
6. Production-ready, not placeholder
"""
    
    full_prompt = f"""You are a senior backend developer generating production code.

SYSTEM ARCHITECTURE:
{system_ctx}

YOUR TASK:
{file_prompt}
"""
    
    print("Generating main.py with cross-node context...")
    print("-" * 70)
    
    # Make the call
    try:
        response = await llm.generate_architecture(
            description=full_prompt,
            requirements=["FastAPI", "Supabase", "Production-ready"],
            tech_stack=["Python", "FastAPI", "Supabase"]
        )
        
        if response.get("success") and response.get("files"):
            # New format
            for path, content in response["files"].items():
                print(f"Generated: {path}")
                print("=" * 70)
                lines = content.split('\n')[:100]
                for i, line in enumerate(lines, 1):
                    print(f"{i:3}: {line}")
                if len(content.split('\n')) > 100:
                    print(f"... ({len(content.split(chr(10))) - 100} more lines)")
        else:
            # Try direct content
            content = response.get("content", str(response))
            print("Generated content:")
            print("=" * 70)
            lines = content.split('\n')[:100]
            for i, line in enumerate(lines, 1):
                print(f"{i:3}: {line}")
                
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
