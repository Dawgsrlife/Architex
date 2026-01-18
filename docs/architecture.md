# Core Architecture Invariants

> **Purpose**: This document is the single source of truth for architectural decisions.  
> Any IDE agent or developer must preserve these invariants. Tests enforce them.

---

## 1. Project vs Job

### Projects
- **Long-lived intent** — represents a user's application idea
- **Owns the GitHub repo** — created once, reused across all jobs
- **Stores derived state**: `current_nodes`, `prompts_history`, `github_repo_url`
- **Tracks success**: `latest_successful_job_id` points to last good job

### Jobs
- **Immutable execution snapshots** — never modify themselves after creation
- **Never mutate Project directly** — except updating `latest_successful_job_id` on success
- **Store full context**: `architecture_spec` is a complete snapshot at creation time
- **Have `warnings[]`** — distinct from logs, surfaced to UI

**Rule**: One Project → Many Jobs. Jobs are attempts; Projects are intent.

---

## 2. Repo Ownership

| Entity  | Responsibility |
|---------|----------------|
| Project | Create GitHub repo (once) |
| Job     | Clone → modify → commit → push (only) |

- Repo URL is stored on Project: `github_repo_url`
- Jobs never create repos; they only push to existing ones
- If repo doesn't exist, job creates it via project (idempotent)

---

## 3. Workspace Lifecycle

```
create → run → commit → cleanup
```

### Guarantees
1. **Fresh workspace** per job: `/tmp/architex/<job_id>/`
2. **Stale cleanup**: If workspace exists from prior run, delete first
3. **Always cleanup**: `finally` block runs even on failure/exception
4. **Cleanup failure ≠ job failure**: Log warning but don't block completion

### Code Location
- `job_worker.py`: `process_job()` method, PHASE 3 and PHASE 8

---

## 4. Job Status Transitions

```
pending → running → completed | completed_with_warnings | failed
```

### Valid Transitions
| From    | To                        |
|---------|---------------------------|
| pending | running                   |
| pending | failed                    |
| running | completed                 |
| running | completed_with_warnings   |
| running | failed                    |

### Invalid Transitions (forbidden)
- `completed` → any state
- `completed_with_warnings` → any state
- `failed` → any state
- Any backward transition

**Enforcement**: `jobs_repo.update_job_status()` validates transitions via `VALID_TRANSITIONS` dict.

---

## 5. Schema Fields

### Jobs
```python
warnings: List[str] = []       # Explicit warnings for UI (separate from logs)
prompt: str = ""               # Denormalized from architecture_spec.prompt
logs: List[Dict] = []          # Execution log entries
status: str                    # pending|running|completed|completed_with_warnings|failed
completedAt: Optional[datetime] # Set on terminal states
```

### Projects
```python
latest_successful_job_id: Optional[str] = None  # Updated on completed/completed_with_warnings
current_nodes: List[Dict]                        # Derived/cached state from React Flow
prompts_history: List[Dict]                      # Historical prompts
github_repo_url: Optional[str]                   # Set once per project
```

---

## 6. Invariant Enforcement Locations

| Invariant | Enforced In | Test File |
|-----------|-------------|-----------|
| Job immutability | `job_worker.py` header comment | `test_schema_refinements.py` |
| Status transitions | `jobs_repo.update_job_status()` + `VALID_TRANSITIONS` | `test_schema_refinements.py` |
| Repo ownership | `job_worker._handle_github_push()` | — |
| Workspace cleanup | `job_worker.process_job()` finally block | — |
| latest_successful_job_id | `job_worker._update_status()` → `projects_repo.update_latest_job()` | `test_schema_refinements.py` |
| warnings persistence | `jobs_repo.update_job_status()` with `$push` | `test_schema_refinements.py` |

---

## 7. Agent Bootstrap Prompt

When starting a new IDE session, use this prompt:

> This repo enforces the invariants described in `docs/architecture.md`.  
> All changes must preserve them. Do not propose schema changes unless explicitly requested.  
> Run `python backend/tests/test_schema_refinements.py` to validate.

---

## 8. Quick Reference: What Goes Where

| Concept | Location |
|---------|----------|
| Database schema | `backend/DATABASE_SCHEMA.md` |
| Job schema (Pydantic) | `backend/schemas/jobs.py` |
| Project schema (Pydantic) | `backend/schemas/projects.py` |
| Jobs repository | `backend/repos/jobs_repo.py` |
| Projects repository | `backend/repos/projects_repo.py` |
| Job worker | `backend/services/job_worker.py` |
| Schema tests | `backend/tests/test_schema_refinements.py` |
| This document | `docs/architecture.md` |

---

## 9. Testing Invariants

```bash
cd backend
python tests/test_schema_refinements.py
```

Tests verify:
- ✅ `latest_successful_job_id` is initially `None`
- ✅ Prompt is denormalized correctly
- ✅ Warnings list initialized empty
- ✅ `pending → running` transition allowed
- ✅ Job completes with warnings
- ✅ Project `latest_successful_job_id` updated on success
- ✅ Invalid transitions (e.g., `completed → running`) prevented

---

## Changelog

- **2026-01-17**: Audit and reconciliation — all invariants now enforced in code
