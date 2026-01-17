# API Documentation

## Overview

Architex provides several API endpoints for AI code generation, GitHub integration, Solana payments, and workflow management.

## Authentication

Currently, API endpoints are public. In production, you should implement authentication using NextAuth or similar.

## Endpoints

### AI Code Generation

#### Generate Code

```
POST /api/ai/generate-code
```

Generate code using Google Gemini AI.

**Request Body:**
```json
{
  "prompt": "Create a React component for user login",
  "context": "Using TypeScript and Next.js",
  "language": "typescript"
}
```

**Response:**
```json
{
  "code": "// Generated code...",
  "explanation": "// Explanation of the code..."
}
```

### GitHub Integration

#### Get Repositories

```
GET /api/github/repos
```

Fetch authenticated user's GitHub repositories.

**Response:**
```json
{
  "repos": [
    {
      "name": "repo-name",
      "fullName": "owner/repo-name",
      "description": "Repository description",
      "url": "https://github.com/owner/repo-name",
      "stars": 123,
      "language": "TypeScript"
    }
  ]
}
```

### Solana Payments

#### Create Payment

```
POST /api/payment/create
```

Create a Solana payment transaction.

**Request Body:**
```json
{
  "amount": 0.1,
  "recipientAddress": "SolanaAddressHere...",
  "memo": "Payment for service"
}
```

**Response:**
```json
{
  "signature": "transaction_signature",
  "status": "success",
  "amount": 0.1,
  "timestamp": "2026-01-17T18:00:00.000Z"
}
```

### Workflow Management

#### Save Workflow

```
POST /api/workflow/save
```

Create or update a workflow.

**Request Body:**
```json
{
  "name": "My Workflow",
  "description": "Workflow description",
  "projectId": "project_id_here",
  "nodes": [],
  "edges": []
}
```

**Response:**
```json
{
  "workflow": {
    "_id": "workflow_id",
    "name": "My Workflow",
    "status": "draft",
    "createdAt": "2026-01-17T18:00:00.000Z"
  }
}
```

#### Get Workflows

```
GET /api/workflow/save?projectId=project_id
```

Retrieve workflows, optionally filtered by project.

**Response:**
```json
{
  "workflows": [
    {
      "_id": "workflow_id",
      "name": "My Workflow",
      "status": "draft",
      "nodes": [],
      "edges": []
    }
  ]
}
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `500` - Internal Server Error

Error responses include a message:

```json
{
  "error": "Error message here"
}
```

## Rate Limiting

Currently, there are no rate limits. In production, implement rate limiting for API endpoints.

## Examples

### Using cURL

```bash
# Generate code
curl -X POST http://localhost:3000/api/ai/generate-code \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a login form", "language": "typescript"}'

# Get repositories
curl http://localhost:3000/api/github/repos
```

### Using JavaScript/TypeScript

```typescript
// Generate code
const response = await fetch('/api/ai/generate-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Create a login form',
    language: 'typescript'
  })
});
const data = await response.json();
console.log(data.code);
```

## Notes

- All POST requests require `Content-Type: application/json` header
- Timestamps are in ISO 8601 format
- MongoDB ObjectIds are returned as strings
