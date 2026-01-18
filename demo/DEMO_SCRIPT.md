# Architex Demo Script

## Pre-Demo Setup

1. **Start Backend**:
   ```bash
   cd backend
   /Users/vishnu/Documents/Architex/.venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. **Start Frontend**:
   ```bash
   npm run dev
   ```

3. **Verify Backend** (run smoke test):
   ```bash
   cd backend
   python smoke_test_e2e.py
   ```
   Should show: `8/8 tests passed`

4. **Open Browser**: http://localhost:3000/projects/new

---

## Demo Flow (5 minutes)

### Step 1: Empty Canvas (30 sec)
- Show the empty canvas
- Point out the **Project Intent panel** on the right
- Say: *"This is Architex - architecture-first code generation"*

### Step 2: Add Incomplete Architecture (1 min)
1. Drag **Frontend** node onto canvas
2. Drag **Backend** node onto canvas
3. **DO NOT connect them**
4. Leave prompt empty

- Point to **CriticStatus**: Shows "Blocked"
- Expand to show issues:
  - "Multiple components with no connections"
  - "Intent/prompt is missing"
- Point to **Generate button**: Disabled, red

Say: *"The system won't let me generate until the architecture is valid"*

### Step 3: Fix Architecture (1 min)
1. **Connect** Frontend → Backend (drag edge)
2. Add **Database** node
3. Connect Backend → Database
4. Add **Auth** node
5. Connect Backend → Auth

- CriticStatus updates in real-time
- Some warnings may appear

### Step 4: Add Intent (30 sec)
1. Type in prompt: *"Internal admin dashboard for managing users and access logs"*
2. Watch CriticStatus turn green: "Ready"
3. Generate button enables

Say: *"Now the system understands WHAT we're building, not just the components"*

### Step 5: Preview Generated Files (1 min)
1. Click **"Preview Generated Files"**
2. Show ProvenanceMapping:
   - Each node → list of files
   - Click to expand nodes
   - Show: Frontend → pages, components
   - Show: Backend → routes, models
   - Show: Database → schemas

Say: *"Every file traces back to a specific architecture decision"*

### Step 6: Generate (30 sec)
1. Click **"Generate Project"**
2. Show job submitted
3. (Optional) Show console logs if visible

Say: *"Architex + Cline now generates exactly these files, nothing more, nothing less"*

---

## Key Talking Points

### Why This Matters
- **Not magic** - deterministic, traceable
- **Architecture enforced** - can't generate garbage
- **Intent-driven** - prompt shapes the output
- **Provenance** - every file has a source

### Differentiation
- Unlike Copilot: Structure-first, not line-by-line
- Unlike ChatGPT: Rules + architecture, not vibes
- Unlike Lovable/Bolt: Enforceable constraints, not just UI generation

---

## Fallback Screenshots

If anything fails, have these ready:
1. Screenshot of CriticStatus blocking
2. Screenshot of ProvenanceMapping expanded
3. Screenshot of generated files in folder

---

## Quick Commands

```bash
# Health check
curl http://localhost:8000/api/health

# Quick critique
curl -X POST http://localhost:8000/api/architecture/critique/quick \
  -H "Content-Type: application/json" \
  -d @demo/demo_architecture_valid.json

# Generation plan
curl -X POST http://localhost:8000/api/architecture/plan \
  -H "Authorization: Bearer dev-token-bypass" \
  -H "Content-Type: application/json" \
  -d @demo/demo_architecture_valid.json
```
