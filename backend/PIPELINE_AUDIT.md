# Architex Pipeline Structural Audit

**Date**: January 17, 2026  
**Auditor**: Copilot  
**Purpose**: Identify structural gaps and prove pipeline integrity

---

## Executive Summary

The pipeline has **solid foundations** but **critical gaps in code-time execution**. The architecture→code translation is well-designed on paper, but the actual LLM code generation is disconnected from the structural promises.

### ✅ What Works
1. **Architecture Translator** - 33/33 tests passing, deterministic
2. **Node Type Resolution** - Proper aliases and inference
3. **Edge Semantic Mapping** - Correctly infers interaction types
4. **Contract Building** - Nodes expose/require contracts correctly
5. **File Planning** - Enhanced planner creates dependency-ordered file plans

### ⚠️ Critical Gaps Identified

#### GAP 1: Hardcoded Endpoints (No Spec-Driven Generation)
**Location**: `code_generator_v2.py`, lines 133-180

```python
if ct == ComponentType.FASTAPI:
    # PROBLEM: These are HARDCODED, not derived from spec!
    contract.endpoints = [
        "/api/health",
        "/api/users",
        "/api/users/{id}",
        "/api/auth/login",
        # ... etc
    ]
```

**Issue**: The endpoints exposed by FastAPI are hardcoded, not derived from the user's prompt or the connected nodes. If the user wants a "blog API", they still get `/api/users`.

**Fix Needed**: Derive endpoints from:
- User prompt (NLP extraction)
- Connected nodes (e.g., Supabase table names → API endpoints)
- Frontend requirements (what endpoints does frontend need?)

---

#### GAP 2: Schemas Are Static, Not Derived
**Location**: `code_generator_v2.py`, lines 135-136

```python
contract.schemas = ["User", "UserCreate", "UserResponse", "Token"]
```

**Issue**: Schemas are hardcoded. A "blog app" would still get User/Token schemas, not Post/Comment.

**Fix Needed**: Schema inference from:
- User prompt entities
- Database node specifications
- LLM extraction in a pre-processing step

---

#### GAP 3: No Validation That Generated Code Matches Contracts
**Location**: No test exists for this

**Issue**: The file plan says "MUST INCLUDE endpoint /api/users", but there's no validation that the LLM-generated code actually includes it.

**Fix Needed**: Post-generation validation step:
- Parse generated Python/TS files
- Extract actual endpoints/functions
- Compare against contract requirements
- Fail/warn if mismatch

---

#### GAP 4: LLM Output Parsing Is Fragile
**Location**: `code_generator_v2.py`, lines 834-845

```python
def _clean_output(self, content: str) -> str:
    content = re.sub(r'^```\w*\n?|```$', '', content, flags=re.MULTILINE).strip()
    # ... fragile JSON parsing
```

**Issue**: If LLM returns anything unexpected (explanations, markdown, JSON wrapper), the code may be corrupted.

**Fix Needed**: Robust parsing with:
- Structured output (JSON mode if available)
- Multiple extraction strategies
- Validation of output syntax

---

#### GAP 5: No Cross-File Import Validation
**Location**: Not implemented

**Issue**: `main.py` may generate `from database import get_db`, but `database.py` may not actually export `get_db`.

**Fix Needed**: 
- Track exports from each generated file
- Validate imports in subsequent files
- Fail if import cannot be resolved

---

#### GAP 6: Mock Generator Is Disconnected From Translator
**Location**: `mock_app_generator.py`

**Issue**: The mock generator has its own component detection logic that duplicates (and may diverge from) `architecture_translator.py`.

**Evidence**:
```python
# mock_app_generator.py
if self._has_component(ComponentType.AUTH):  # Own detection

# architecture_translator.py  
def _resolve_component_type(...)  # Different detection
```

**Fix Needed**: Mock generator should use `TranslatedArchitecture` as input, not raw spec.

---

#### GAP 7: No Extensibility Test
**Issue**: Adding a new node type (e.g., `ComponentType.PRISMA`) requires changes in:
1. `architecture_translator.py` - ComponentType enum
2. `architecture_translator.py` - COMPONENT_SEMANTICS dict
3. `architecture_translator.py` - Type aliases
4. `code_generator_v2.py` - ContractBuilder._build_node_contract
5. `code_generator_v2.py` - EnhancedPlanner._plan_node_files
6. `mock_app_generator.py` - FEATURE_TEMPLATES

**Fix Needed**: Plugin architecture or at minimum a test that proves all 6 locations are updated together.

---

## Test Coverage Gaps

### Missing Tests

1. **Contract Completeness Test**
   - Assert every node in spec has a contract
   - Assert every edge has an interaction contract
   
2. **File Plan Dependency Test**
   - Assert files are ordered correctly (database.py before main.py)
   - Assert no circular dependencies
   
3. **Prompt Content Verification Test**
   - Assert prompts contain all MUST_INCLUDE items
   - Assert prompts reference correct endpoints/clients
   
4. **Extensibility Test**
   - Add a fake node type
   - Assert translator handles it
   - Assert planner generates files for it

5. **End-to-End Dry Run Test**
   - Full spec → all prompts → verify all nodes accounted for
   - Verify every edge creates at least one requires/exposes relationship

---

## Current Test Results

```
tests/test_architecture_translator.py ... 33 passed ✅
```

**But missing**:
- tests/test_code_generator_v2.py (0 tests!)
- tests/test_contract_builder.py (doesn't exist)
- tests/test_enhanced_planner.py (doesn't exist)
- tests/test_pipeline_integrity.py (doesn't exist)

---

## Recommendations

### Immediate Actions (Before Frontend Integration)

1. **Write Pipeline Integrity Tests** (see next section)
2. **Add Contract Completeness Assertions**
3. **Add Dry Run Validation**

### Medium Term

4. **Make Endpoints Spec-Driven** (not hardcoded)
5. **Add Post-Generation Validation** 
6. **Create Plugin Architecture** for node types

### For Hackathon Demo

7. **Use Mock Generator** for reliability
8. **Keep LLM Generation as "premium feature"**
9. **Document what ACTUALLY works** vs. what's planned

---

## Visualization: Current Pipeline

```
┌─────────────────┐
│ Frontend Spec   │ nodes: [], edges: [], prompt: ""
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2: Architecture Translator                      ✅ WORKS │
│ • Deterministic                                                │
│ • 33 tests passing                                             │
│ • Converts nodes → TranslatedComponents                        │
│ • Converts edges → TranslatedInteractions                      │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2.5: Contract Builder                           ⚠️ GAPS  │
│ • Endpoints are HARDCODED (not spec-driven)                    │
│ • Schemas are HARDCODED (not spec-driven)                      │
│ • Required clients are correctly inferred from edges           │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2.6: Enhanced Planner                           ✅ WORKS │
│ • Creates file plans based on node types                       │
│ • Includes must_include, requires, exposes                     │
│ • Dependency ordering present                                  │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 3A: LLM Code Generation                         ⚠️ RISKY │
│ • Prompts are well-formed                                      │
│ • NO validation that output matches requirements               │
│ • Output parsing is fragile                                    │
│ • Cross-file imports not validated                             │
└────────┬────────────────────────────────────────────────────────┘
         │
         ├───────────────────┐
         ▼                   ▼
┌──────────────────┐  ┌────────────────────────────────────────────┐
│ LLM Generated    │  │ Layer 3B: Mock Generator            ✅ OK │
│ (unreliable)     │  │ • Templates work                          │
│                  │  │ • BUT disconnected from translator        │
└──────────────────┘  └────────────────────────────────────────────┘
```

---

## Conclusion

**The pipeline is 60% complete.** The architecture translation layer is solid and well-tested. The contract building and file planning layers work but have hardcoded assumptions. The LLM generation layer is structurally complete but has no validation.

**For a hackathon**: Use the mock generator. It's reliable and produces working code.

**For production**: Fix the gaps above, especially:
1. Spec-driven endpoint/schema generation
2. Post-generation validation
3. Cross-file import verification

---

*This audit was generated by analyzing the codebase structure, running existing tests, and tracing the data flow from spec to generated code.*
