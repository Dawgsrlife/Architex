#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
E2E Test: Cross-Node Aware Code Generation

This test generates REAL connected code for a 4-node architecture.
Run with: GROQ_API_KEY=xxx python3 test_e2e_generation.py
"""

import os
import sys
import asyncio
import shutil
from pathlib import Path

sys.path.insert(0, ".")

from services.code_generator_v2 import generate_connected_codebase

# Simple 4-node spec: Next.js + FastAPI + Supabase + Redis
FOUR_NODE_SPEC = {
    "projectName": "TaskManager",
    "prompt": """Create a task management app where users can:
    1. Create, update, delete tasks
    2. Assign tasks to users
    3. Track task status
    4. Cache frequently accessed tasks
    """,
    "nodes": [
        {"id": "frontend", "type": "nextjs", "data": {"label": "Next.js App"}},
        {"id": "backend", "type": "fastapi", "data": {"label": "FastAPI Server"}},
        {"id": "db", "type": "supabase", "data": {"label": "Supabase DB"}},
        {"id": "cache", "type": "redis", "data": {"label": "Redis Cache"}},
    ],
    "edges": [
        {"source": "frontend", "target": "backend"},
        {"source": "backend", "target": "db"},
        {"source": "backend", "target": "cache"},
    ]
}


async def progress_callback(step, files, iteration, spec):
    print(f"  [{iteration}] {step}")
    if files:
        print(f"      Files: {len(files)} created")


async def main():
    # Check for API key - must match what llm_interface.py looks for
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("GOOGLE_GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
    fake_mode = os.getenv("FAKE_LLM", "").lower() in ("true", "1", "yes")
    
    if not api_key and not fake_mode:
        print("=" * 60)
        print("No API key found. Running in FAKE_LLM mode for structure test.")
        print("For real generation, set: GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY")
        print("=" * 60)
        print()
        os.environ["FAKE_LLM"] = "true"
    
    print("=" * 70)
    print("E2E TEST: Cross-Node Aware Code Generation")
    print("=" * 70)
    print()
    print("Architecture: Next.js -> FastAPI -> Supabase + Redis")
    print()
    
    # Create test workspace
    workspace = Path("/tmp/architex_e2e_test")
    if workspace.exists():
        shutil.rmtree(workspace)
    workspace.mkdir(parents=True)
    
    print(f"Workspace: {workspace}")
    print()
    print("Generating connected codebase...")
    print("-" * 70)
    
    try:
        files = await generate_connected_codebase(
            FOUR_NODE_SPEC,
            workspace,
            progress_callback=progress_callback
        )
        
        print()
        print("=" * 70)
        print(f"SUCCESS! Generated {len(files)} files")
        print("=" * 70)
        print()
        
        # List files
        print("Files created:")
        for f in sorted(files):
            fpath = workspace / f
            size = fpath.stat().st_size if fpath.exists() else 0
            print(f"  {f} ({size} bytes)")
        
        # Show a sample file (main.py)
        main_py = workspace / "main.py"
        if main_py.exists():
            print()
            print("=" * 70)
            print("Sample: main.py (first 80 lines)")
            print("=" * 70)
            content = main_py.read_text()
            lines = content.split('\n')[:80]
            for i, line in enumerate(lines, 1):
                print(f"{i:3}: {line}")
        
        # Show api.ts
        api_ts = workspace / "src" / "lib" / "api.ts"
        if api_ts.exists():
            print()
            print("=" * 70)
            print("Sample: src/lib/api.ts (first 50 lines)")
            print("=" * 70)
            content = api_ts.read_text()
            lines = content.split('\n')[:50]
            for i, line in enumerate(lines, 1):
                print(f"{i:3}: {line}")
        
        # Validate connections
        print()
        print("=" * 70)
        print("VALIDATION: Checking cross-node connections")
        print("=" * 70)
        
        checks = [
            ("main.py imports cache", "main.py", ["cache", "redis"]),
            ("main.py imports database", "main.py", ["database", "supabase"]),
            ("api.ts calls backend", "src/lib/api.ts", ["/api/", "fetch"]),
        ]
        
        for name, path, keywords in checks:
            fpath = workspace / path
            if fpath.exists():
                content = fpath.read_text().lower()
                found = any(kw.lower() in content for kw in keywords)
                status = "PASS" if found else "FAIL"
                print(f"  [{status}] {name}")
            else:
                print(f"  [SKIP] {name} - file not found")
        
    except Exception as e:
        print()
        print("=" * 70)
        print(f"FAILED: {e}")
        print("=" * 70)
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
