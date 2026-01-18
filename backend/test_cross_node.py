#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test: Enhanced Code Generator with Cross-Node Awareness

This shows the difference between v1 (isolated files) and v2 (connected system).
"""

import sys
sys.path.insert(0, ".")

from services.architecture_translator import get_translator
from services.code_generator_v2 import ContextBuilder, EnhancedPlanner, GlobalSystemContext

# The Lovable Clone Spec
LOVABLE_CLONE_SPEC = {
    "projectName": "BuilderAI",
    "prompt": """Create a Lovable/v0 clone - an AI-powered app builder where users can:
    1. Describe their app in natural language
    2. See a live preview
    3. Export React code
    4. Pay for premium features
    """,
    "nodes": [
        {"id": "frontend", "type": "nextjs", "data": {"label": "Next.js Frontend"}},
        {"id": "backend", "type": "fastapi", "data": {"label": "FastAPI Backend"}},
        {"id": "db", "type": "supabase", "data": {"label": "Supabase"}},
        {"id": "ai", "type": "openai", "data": {"label": "OpenAI"}},
        {"id": "cache", "type": "redis", "data": {"label": "Redis"}},
        {"id": "billing", "type": "stripe", "data": {"label": "Stripe"}},
    ],
    "edges": [
        {"source": "frontend", "target": "backend"},
        {"source": "backend", "target": "db"},
        {"source": "backend", "target": "ai"},
        {"source": "backend", "target": "cache"},
        {"source": "backend", "target": "billing"},
    ]
}


def main():
    print("=" * 70)
    print("🔗 CROSS-NODE AWARE GENERATION")
    print("=" * 70)
    print()
    
    # Translate
    translator = get_translator()
    translated = translator.translate(LOVABLE_CLONE_SPEC)
    
    # Build context
    ctx_builder = ContextBuilder(translated)
    ctx = ctx_builder.build()
    
    print("📊 NODE CONTRACTS (what each node exposes/requires)")
    print("-" * 70)
    for node_id, contract in ctx.nodes.items():
        print(f"\n🔹 {node_id} ({contract.node_type.value})")
        if contract.endpoints:
            print(f"   EXPOSES endpoints: {', '.join(contract.endpoints[:4])}")
        if contract.clients:
            print(f"   EXPOSES clients: {', '.join(contract.clients)}")
        if contract.schemas:
            print(f"   EXPOSES schemas: {', '.join(contract.schemas[:4])}")
        if contract.required_clients:
            print(f"   REQUIRES: {', '.join(set(contract.required_clients))}")
    
    print()
    print("🔀 INTERACTIONS (how nodes connect)")
    print("-" * 70)
    for inter in ctx.interactions:
        print(f"   {inter.source_id} → {inter.target_id} ({inter.call_type})")
        if inter.endpoints_used:
            print(f"       calls: {', '.join(inter.endpoints_used[:3])}")
        if inter.clients_used:
            print(f"       uses: {', '.join(inter.clients_used)}")
    
    print()
    print("📁 ENHANCED FILE PLAN")
    print("-" * 70)
    planner = EnhancedPlanner(ctx, translated)
    plans = planner.create_plan()
    
    for i, plan in enumerate(plans, 1):
        print(f"\n{i:2}. {plan.path}")
        print(f"    Purpose: {plan.purpose}")
        if plan.exposes:
            print(f"    EXPOSES: {', '.join(plan.exposes[:3])}")
        if plan.requires:
            print(f"    REQUIRES: {', '.join(plan.requires[:3])}")
        if plan.must_include:
            must = [m for m in plan.must_include if m][:3]
            if must:
                print(f"    MUST INCLUDE: {', '.join(str(m)[:40] for m in must)}")
    
    print()
    print("=" * 70)
    print("🧠 SYSTEM PROMPT (what LLM sees for EVERY file)")
    print("=" * 70)
    print(ctx.to_system_prompt()[:2000])
    print("...")


if __name__ == "__main__":
    main()
