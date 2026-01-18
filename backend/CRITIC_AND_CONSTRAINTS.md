# Architex - Architecture Critic & Constrained Generation

## Overview

This document describes the new architecture-first code generation system for Architex.

**Key Insight**: "Cline isn't smart here. Architex is."

## The Problem (Before)

```
Architecture → Tech Stack → Generic Files
```

This produced generic boilerplate that didn't reflect the actual architecture intent.

## The Solution (After)

```
Architecture + Intent
    ↓
Architecture Critic (GATING - can block)
    ↓
Domain Interpreter (extracts entities, pages, routes)
    ↓
Constrained Generation Plan (explicit file instructions)
    ↓
Cline executes plan (NO FREESTYLING)
```

## New Services

### 1. Architecture Critic (`services/architecture_critic.py`)

**Purpose**: Validate architectures BEFORE code generation.

**Features**:
- Deterministic rule-based checks (fast, no LLM)
- Optional LLM-based analysis (structured output)
- **BLOCKING** logic - critical issues prevent generation

**Checks**:
- Missing authentication
- No database for stateful apps
- No connections between nodes
- Vague or missing intent
- Orphan nodes
- Security gaps
- Scalability concerns

**Usage**:
```python
from services.architecture_critic import critique_architecture

result = await critique_architecture(spec, skip_llm=True)

if result.blocking:
    # DO NOT PROCEED WITH GENERATION
    print(f"Blocked: {result.summary}")
```

### 2. Domain Interpreter (`services/domain_interpreter.py`)

**Purpose**: Extract application semantics from architecture + intent.

**Extracts**:
- **Entities** with fields (User, Project, Task, etc.)
- **Pages** (list, create, edit for each entity)
- **API Routes** (CRUD for each entity)
- **App Type** (admin_dashboard, api_backend, etc.)
- **Auth Requirements**

**Key Feature**: Keyword-based entity extraction from intent (deterministic).

**Example**:
```python
from services.domain_interpreter import interpret_architecture

model = interpret_architecture({
    "prompt": "Admin tool for managing users and access logs"
})

print(model.entities)  # [User, AccessLog]
print(model.pages)     # 9 pages for CRUD
print(model.api_routes)  # 10 routes
```

### 3. Constrained Generation Plan (`services/constrained_plan.py`)

**Purpose**: Create EXPLICIT file instructions for Cline.

**Every file has**:
- Path
- Purpose
- MUST INCLUDE list
- MUST NOT INCLUDE list
- Entity context (if applicable)
- Dependencies

**Cline executes this plan EXACTLY**:
- No files outside the plan
- No renaming components
- No inventing APIs
- TODOs where info is missing

### 4. Updated ClineService (`services/cline.py`)

**New method**: `run_agent_constrained()`

**Pipeline**:
1. Run Architecture Critic (can block)
2. Build Constrained Generation Plan
3. Execute plan via LLM (constrained)
4. Validate output matches plan

**File validation**: Rejects files not in the plan.

## API Endpoints

### POST `/api/architecture/critique`

Critique an architecture specification.

**Request**:
```json
{
  "architecture_spec": { ... },
  "skip_llm": false
}
```

**Response**:
```json
{
  "summary": "Architecture has blocking issues...",
  "issues": [...],
  "blocking": true,
  "issue_count": 5,
  "high_severity_count": 3
}
```

### POST `/api/architecture/critique/quick`

Fast critique (no auth, no LLM).
Use for real-time feedback while editing.

### POST `/api/architecture/interpret`

Preview extracted domain model.

**Response**:
```json
{
  "app_type": "admin_dashboard",
  "entities": [...],
  "pages": [...],
  "api_routes": [...]
}
```

### POST `/api/architecture/plan`

Preview generation plan.

**Response**:
```json
{
  "app_name": "User Admin",
  "file_count": 30,
  "files": [...],
  "readme_mapping": {...}
}
```

## Environment Variables

- `CONSTRAINED=true` - Enable constrained generation (DEFAULT)
- `SKIP_CRITIC=true` - Skip architecture criticism (dangerous!)
- `FAKE_LLM=true` - Use template generation (no LLM)
- `USE_LLM=true` - Use legacy LLM generation

## Demo Flow

1. User draws architecture on canvas
2. User adds intent: "Internal admin tool for managing users and access logs"
3. **Real-time critique** shows issues while editing
4. User clicks "Generate"
5. **Full critique** runs - blocks if critical issues
6. **Domain model** extracted (entities, pages, routes)
7. **Generation plan** built (30 files with explicit instructions)
8. **Cline executes** plan exactly
9. README proves architecture → code mapping

## Why This Wins

> "We're not generating code from prompts.
> We're generating code from **architecture + intent**.
> The canvas constrains the system. The prompt fills in human goals."

And then you show:
- Two different canvases
- Same stack
- Wildly different generated structures

**That's the wow.**

## Files Added

```
backend/services/
├── architecture_critic.py    # Gating layer
├── domain_interpreter.py     # Semantic extraction
├── constrained_plan.py       # Explicit file instructions
└── test_new_services.py      # Test suite
```

## Files Modified

- `backend/services/cline.py` - Added `run_agent_constrained()`
- `backend/services/job_worker.py` - Constrained mode as default
- `backend/main.py` - Added critique endpoints
