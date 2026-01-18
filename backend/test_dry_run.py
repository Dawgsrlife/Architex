#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DRY RUN TEST: See exactly what prompts would be sent to LLM

This test runs the FULL pipeline but captures prompts instead of calling LLM.
It proves the cross-node awareness is actually being used.
"""

import sys
import json
from pathlib import Path
from dataclasses import dataclass
from typing import List

sys.path.insert(0, ".")

from services.architecture_translator import get_translator
from services.code_generator_v2 import (
    ContextBuilder, 
    EnhancedPlanner, 
    GlobalSystemContext,
    EnhancedFilePlan
)

# 3-node test: Next.js -> FastAPI -> Supabase
THREE_NODE_SPEC = {
    "projectName": "TaskApp",
    "prompt": "Create a task management app with user auth and task CRUD.",
    "nodes": [
        {"id": "frontend", "type": "nextjs", "data": {"label": "Next.js Frontend"}},
        {"id": "backend", "type": "fastapi", "data": {"label": "FastAPI Backend"}},
        {"id": "db", "type": "supabase", "data": {"label": "Supabase"}},
    ],
    "edges": [
        {"source": "frontend", "target": "backend"},
        {"source": "backend", "target": "db"},
    ]
}


def build_file_prompt(ctx: GlobalSystemContext, plan: EnhancedFilePlan) -> str:
    """Build the exact prompt that would be sent to LLM for this file."""
    
    # System context (same for all files)
    system_prompt = ctx.to_system_prompt()
    
    # File-specific prompt
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
    
    file_prompt += """
CRITICAL REQUIREMENTS:
1. Generate ONLY the file content, no markdown fences
2. Code must be production-ready, not placeholder
3. Import from sibling files as needed (e.g., from database import get_db)
4. Use environment variables from the ENVIRONMENT VARIABLES list
5. Make actual API calls to the endpoints listed in INTERACTIONS
"""
    
    return f"=== SYSTEM CONTEXT ===\n{system_prompt}\n\n=== FILE PROMPT ===\n{file_prompt}"


def main():
    print("=" * 70)
    print("DRY RUN: Cross-Node Aware Prompt Generation")
    print("=" * 70)
    print()
    print("This shows EXACTLY what we would send to the LLM for each file.")
    print()
    
    # Translate architecture
    translator = get_translator()
    translated = translator.translate(THREE_NODE_SPEC)
    
    # Build context
    ctx_builder = ContextBuilder(translated)
    ctx = ctx_builder.build()
    
    # Create file plans
    planner = EnhancedPlanner(ctx, translated)
    plans = planner.create_plan()
    
    print(f"Architecture: {len(translated.components)} nodes, {len(translated.interactions)} edges")
    print(f"File Plan: {len(plans)} files")
    print()
    
    # Show 3 key files: main.py, api.ts, and dashboard
    key_files = ["main.py", "src/lib/api.ts", "src/app/dashboard/page.tsx"]
    
    for target_file in key_files:
        plan = next((p for p in plans if p.path == target_file), None)
        if not plan:
            print(f"[SKIP] {target_file} not in plan")
            continue
        
        print("=" * 70)
        print(f"FILE: {target_file}")
        print("=" * 70)
        
        prompt = build_file_prompt(ctx, plan)
        
        # Show the prompt (truncated for readability)
        lines = prompt.split('\n')
        if len(lines) > 80:
            for line in lines[:80]:
                print(line)
            print(f"\n... ({len(lines) - 80} more lines)")
        else:
            print(prompt)
        
        print()
    
    # Save all prompts to a file for inspection
    output_dir = Path("/tmp/architex_dry_run")
    output_dir.mkdir(exist_ok=True)
    
    for plan in plans:
        prompt = build_file_prompt(ctx, plan)
        safe_name = plan.path.replace("/", "_").replace(".", "_") + ".txt"
        (output_dir / safe_name).write_text(prompt)
    
    print("=" * 70)
    print(f"All {len(plans)} prompts saved to: {output_dir}")
    print("=" * 70)
    print()
    print("Inspect the prompts to verify cross-node awareness:")
    print(f"  cat {output_dir}/main_py.txt")
    print(f"  cat {output_dir}/src_lib_api_ts.txt")


if __name__ == "__main__":
    main()
