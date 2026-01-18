# Database Schema Reference

## MongoDB Collections

### users
```json
{
  "_id": "ObjectId",
  "userId": "63618609",
  "github_access_token": "gho_xxxx",
  "email": "user@example.com",
  "name": "Vishnu Sai",
  "avatar_url": "https://avatars.githubusercontent.com/u/63618609",
  "createdAt": "2026-01-17T22:00:00Z",
  "updatedAt": "2026-01-17T22:00:00Z"
}
```

### projects
```json
{
  "_id": "ObjectId",
  "projectId": "uuid-project-id",
  "userId": "63618609",
  "project_name": "My SaaS App",
  "description": "A cool SaaS application",
  "github_repo_url": "https://github.com/user/repo",
  "current_nodes": [
    {
      "id": "node-1",
      "type": "frontend",
      "data": {
        "label": "Next.js Frontend",
        "framework": "Next.js",
        "description": "Main web app"
      },
      "position": { "x": 100, "y": 100 }
    }
  ],
  "prompts_history": [
    {
      "prompt": "Create a SaaS app with Next.js frontend and FastAPI backend",
      "timestamp": "2026-01-17T22:00:00Z",
      "metadata": {}
    }
  ],
  "last_updated": "2026-01-17T22:00:00Z",
  "createdAt": "2026-01-17T22:00:00Z",
  "updatedAt": "2026-01-17T22:00:00Z"
}
```

### jobs
```json
{
  "_id": "ObjectId",
  "jobId": "uuid-job-id",
  "userId": "63618609",
  "projectId": "uuid-project-id",
  "architecture_spec": {
    "name": "My Architecture",
    "description": "Architecture description",
    "prompt": "User's text prompt",
    "nodes": [...],
    "edges": [...],
    "metadata": {}
  },
  "status": "pending|generating|done|failed",
  "logs": [
    { "ts": "2026-01-17T22:00:00Z", "level": "info", "message": "Starting..." }
  ],
  "result": {},
  "error": null,
  "createdAt": "2026-01-17T22:00:00Z",
  "updatedAt": "2026-01-17T22:00:00Z",
  "completedAt": "2026-01-17T22:05:00Z"
}
```

## Relationships

```
Users (1) ----< Projects (many)
Projects (1) ----< Jobs (many)
```

- One user has many projects
- One project has many jobs
- Each job stores the full architecture_spec for that generation run

## Key Design Decisions

1. **current_nodes**: Stored in project, represents current state of the architecture diagram
2. **prompts_history**: List of all prompts user has given for this project
3. **architecture_spec in job**: Full snapshot of the architecture at time of job creation
4. **github_repo_url**: Set when repo is created/linked, used for pushing generated code

## MongoDB Atlas Setup

1. Create cluster at https://cloud.mongodb.com
2. Create database user with password
3. Whitelist IP (or use 0.0.0.0/0 for dev)
4. Get connection string and add to `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=architex
   ```

## Indexes (database/indexes.py)
```javascript
db.users.createIndex({ "userId": 1 }, { unique: true })
db.projects.createIndex({ "userId": 1, "projectId": 1 }, { unique: true })
db.jobs.createIndex({ "userId": 1, "jobId": 1 }, { unique: true })
db.jobs.createIndex({ "userId": 1, "projectId": 1 })
```
