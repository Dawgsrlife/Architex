# Database Schema Reference

## MongoDB Collections

### users
```json
{
  "_id": "63618609",
  "github_id": 63618609,
  "username": "SquaredPiano",
  "name": "Vishnu Sai",
  "email": "user@example.com",
  "avatar_url": "https://avatars.githubusercontent.com/u/63618609",
  "github_access_token": "gho_xxxx",
  "role": "free",
  "credits": 100,
  "created_at": "2026-01-17T22:00:00Z",
  "updated_at": "2026-01-17T22:00:00Z"
}
```

### projects
```json
{
  "_id": "uuid-project-id",
  "user_id": "63618609",
  "name": "My SaaS App",
  "description": "A cool SaaS application",
  "repository_url": "https://github.com/user/repo",
  "status": "pending",
  "created_at": "2026-01-17T22:00:00Z",
  "updated_at": "2026-01-17T22:00:00Z"
}
```

### jobs
```json
{
  "_id": "uuid-job-id",
  "user_id": "63618609",
  "project_id": "uuid-project-id",
  "architecture_spec": {
    "name": "My Architecture",
    "description": "Architecture description",
    "nodes": [
      {
        "id": "node-1",
        "type": "frontend",
        "data": {
          "label": "React Frontend",
          "framework": "Next.js",
          "description": "Main web app",
          "instructions": "Use App Router, TypeScript"
        },
        "position": { "x": 100, "y": 100 }
      },
      {
        "id": "node-2",
        "type": "backend",
        "data": {
          "label": "FastAPI Backend",
          "framework": "FastAPI",
          "instructions": "RESTful API with JWT auth"
        },
        "position": { "x": 300, "y": 100 }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2",
        "label": "REST API"
      }
    ],
    "metadata": {}
  },
  "status": "pending|generating|done|failed",
  "logs": [
    { "timestamp": "2026-01-17T22:00:00Z", "message": "Starting..." }
  ],
  "result": {},
  "error": null,
  "created_at": "2026-01-17T22:00:00Z",
  "updated_at": "2026-01-17T22:00:00Z",
  "completed_at": "2026-01-17T22:05:00Z"
}
```

## MongoDB Atlas Setup

1. Create cluster at https://cloud.mongodb.com
2. Create database user with password
3. Whitelist IP (or use 0.0.0.0/0 for dev)
4. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/architex?retryWrites=true&w=majority
   ```
5. Add to `.env`:
   ```
   MONGODB_URI=mongodb+srv://...
   ```

## Indexes (Optional Optimization)
```javascript
// In MongoDB shell or Atlas UI
db.users.createIndex({ "github_id": 1 }, { unique: true })
db.projects.createIndex({ "user_id": 1 })
db.jobs.createIndex({ "user_id": 1, "created_at": -1 })
db.jobs.createIndex({ "project_id": 1 })
```
