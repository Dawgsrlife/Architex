#!/usr/bin/env python3
"""Test the intelligent code generator planning."""

import sys
sys.path.insert(0, ".")

from services.architecture_translator import GOLDEN_DEMO_SPEC, get_translator
from services.code_generator import GenerationPlanner, PromptBuilder

# Translate the spec
translator = get_translator()
translated = translator.translate(GOLDEN_DEMO_SPEC)

# Create generation plan
planner = GenerationPlanner(translated)
plan = planner.create_plan()

print("=" * 60)
print(f"PROJECT: {plan.project_name}")
print("=" * 60)
print()

print(f"COMPONENTS ({len(translated.components)}):")
for comp in translated.components:
    print(f"  - {comp.name} ({comp.component_type.value})")
print()

print(f"GENERATION PLAN ({len(plan.files)} files):")
for i, fp in enumerate(plan.files, 1):
    deps = f" [depends: {', '.join(fp.dependencies)}]" if fp.dependencies else ""
    print(f"  {i:2}. {fp.path}{deps}")
    print(f"       → {fp.purpose}")
print()

# Show a sample prompt
print("=" * 60)
print("SAMPLE FILE PROMPT:")
print("=" * 60)
prompt_builder = PromptBuilder(translated)
if plan.files:
    sample = prompt_builder.build_file_prompt(plan.files[0], {})
    print(sample[:1500])
    print("...")
