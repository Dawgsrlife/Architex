# Frontend Critic Integration

This document describes the frontend integration for the Architecture Critic system.

## Overview

The frontend now includes:
1. **Prompt/Intent field** - Users describe what they're building
2. **Critic Status component** - Shows validation results (pass/warnings/blocked)
3. **Generate button gating** - Cannot generate if critic blocks
4. **Provenance Mapping** - Preview which files will be generated from each node

## Architecture Store Changes

Added to `src/stores/architecture-store.ts`:

```typescript
// New fields
prompt: string;                    // User's intent/description
criticResult: CriticResult | null; // Validation result
isCriticLoading: boolean;          // Loading state

// New methods
setPrompt(prompt: string): void
setCriticResult(result: CriticResult | null): void
setIsCriticLoading(loading: boolean): void
runCritic(): Promise<void>         // Calls /api/architecture/critique/quick
```

## New Components

### CriticStatus (`src/components/canvas/CriticStatus.tsx`)

Displays the current validation status:
- **Not validated** - Gray, no validation run yet
- **Validating...** - Loading spinner
- **Ready** - Green checkmark, no issues
- **Warnings** - Amber, has non-blocking issues
- **Blocked** - Red X, has blocking issues

Expandable to show individual issues with severity, message, and suggestions.

### ProvenanceMapping (`src/components/canvas/ProvenanceMapping.tsx`)

Shows a preview of which files will be generated:
- Groups files by source architecture node
- Collapsible node sections
- Shows file paths, purposes, and types
- Color-coded by file type (page, component, api, model, etc.)

Calls `/api/architecture/plan` to get the generation plan.

## Project Editor Page Changes

Updated `src/app/projects/[id]/page.tsx`:

### Intent Panel (right sidebar)

Replaced AI chat with:
1. **Prompt textarea** - "What are you building?"
2. **CriticStatus component** - Architecture validation
3. **Quick Tips** - Guidance for good architectures
4. **Architecture Summary** - Current nodes and connections
5. **Provenance Preview button** - Shows file mapping
6. **Generate button** - Disabled until critic passes

### Generate Button States

- **Disabled (gray)**: No nodes, no prompt, or critic loading
- **Blocked (red)**: Critic returned `blocking: true`
- **Ready (gradient)**: Can generate

### Auto-validation

The critic runs automatically:
- Debounced (1 second delay)
- Triggered on node/edge changes
- Triggered on prompt changes

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/architecture/critique/quick` | POST | Fast rule-based validation |
| `/api/architecture/plan` | POST | Get file generation plan |
| `/api/jobs` | POST | Start generation job |

## User Flow

1. User drags components onto canvas
2. User writes intent in prompt field
3. Critic auto-runs and shows status
4. If blocked → user must fix issues
5. If warnings → user can proceed
6. User clicks "Preview Generated Files" to see provenance
7. User clicks "Generate Project" when ready

## Testing

To test locally:
1. Start backend: `cd backend && uvicorn main:app --reload`
2. Start frontend: `npm run dev`
3. Navigate to `/projects/new`
4. Add nodes to canvas
5. Write a prompt
6. Observe critic status updates
7. Click "Preview Generated Files" to see provenance
8. Click "Generate Project" (only enabled when ready)
