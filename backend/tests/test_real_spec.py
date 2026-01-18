#!/usr/bin/env python3
"""
Test the agent with a REAL architecture spec
This proves the semantic translation works
"""
import asyncio
import sys
import shutil
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

async def main():
    from services.cline import cline_service
    
    # A REAL architecture spec like frontend would send
    architecture_spec = {
        "name": "TaskFlow API",
        "description": "A simple task management REST API",
        "prompt": "Build a REST API for a task management app. Include endpoints for creating, reading, updating, and deleting tasks. Each task should have a title, description, status, and due date. Use FastAPI and store data in-memory for now.",
        "nodes": [
            {"id": "1", "type": "backend", "data": {"label": "FastAPI Server", "tech": "FastAPI"}},
            {"id": "2", "type": "datastore", "data": {"label": "In-Memory Store", "tech": "Python dict"}},
            {"id": "3", "type": "api", "data": {"label": "REST Endpoints", "tech": "OpenAPI"}}
        ],
        "edges": [
            {"source": "3", "target": "1", "label": "routes defined in"},
            {"source": "1", "target": "2", "label": "stores data in"}
        ]
    }
    
    workspace = Path("/tmp/architex/test_real_spec")
    if workspace.exists():
        shutil.rmtree(workspace)
    workspace.mkdir(parents=True)
    
    print("="*60)
    print("TESTING WITH REAL ARCHITECTURE SPEC")
    print("="*60)
    print(f"Prompt: {architecture_spec['prompt'][:80]}...")
    print(f"Nodes: {len(architecture_spec['nodes'])}")
    print(f"Edges: {len(architecture_spec['edges'])}")
    print(f"Workspace: {workspace}")
    print("="*60)
    
    success = await cline_service.run_agent(
        job_id="test_real",
        workspace_path=workspace,
        architecture_spec=architecture_spec
    )
    
    print("\n" + "="*60)
    print("RESULTS")
    print("="*60)
    
    # List generated files
    files = list(workspace.rglob("*"))
    actual_files = [f for f in files if f.is_file()]
    
    print(f"\nGenerated {len(actual_files)} files:")
    total_bytes = 0
    for f in sorted(actual_files):
        size = f.stat().st_size
        total_bytes += size
        print(f"  {f.relative_to(workspace)} ({size} bytes)")
    
    print(f"\nTotal: {total_bytes} bytes")
    
    # Show main.py content if exists
    main_py = workspace / "main.py"
    if main_py.exists():
        print("\n" + "="*60)
        print("main.py CONTENT")
        print("="*60)
        print(main_py.read_text()[:2000])
    
    # Check for README
    readme = workspace / "README.md"
    if readme.exists():
        print("\n" + "="*60)
        print("README.md CONTENT")
        print("="*60)
        print(readme.read_text()[:1000])
    
    print("\n" + "="*60)
    if success and len(actual_files) >= 3:
        print("✓ SUCCESS: Agent generated meaningful output")
    else:
        print("✗ FAIL: Agent did not complete properly")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
