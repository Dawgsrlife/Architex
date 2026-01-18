# Architex Documentation

## Overview
Architex is an AI-powered architecture-to-code platform that transforms visual system designs into production-ready code repositories. Users design their application architecture using an interactive React Flow canvas, and Architex automatically generates a complete GitHub repository with all necessary code, configuration, and infrastructure through agentic AI automation.

## System Architecture

### Frontend
- **Static Landing Page (`/`)**: Marketing site with CTA to login
- **Authentication**: GitHub OAuth integration for secure user access
- **Projects Dashboard (`/projects`)**: View, create, and manage architecture projects
- **Architecture Canvas**: Interactive React Flow interface where users design system architecture using nodes and edges
- **Project Button**: Opens existing projects
- **Open Project Action**: Loads saved architecture into canvas

### Backend (FastAPI)
API Layer with the following endpoints:

- **`GET /projects`**
  - Check user authentication via GitHub OAuth token
  - Fetch all projects for authenticated user

- **`POST /jobs`**
  - Accepts `architecture_spec` (JSON representation of React Flow nodes/edges)
  - Creates new job entry in MongoDB
  - Triggers background task for code generation
  - Returns `job_id`

- **`GET /jobs/{id}`**
  - Poll every 2-5 seconds to get job status
  - Returns: `running` | `pending` | `done` | `failed`
  - Includes `current_nodes` and `prompts_history` for real-time progress

### Database (MongoDB Atlas)

#### Users Collection
```json
{
  "userId": "string",
  "name": "string",
  "github_access_token": "string"
}
```

#### Projects Collection
```json
{
  "projectId": "string",
  "project_name": "string",
  "last_updated": "timestamp",
  "architecture_spec": "JSON",
  "current_nodes": "array",
  "prompts_history": "array"
}
```

#### Jobs Collection
```json
{
  "jobId": "string",
  "status": "running | pending | done | failed",
  "architecture_spec": "JSON",
  "current_nodes": "array",
  "projectId": "string",
  "logs": "array"
}
```

### Agent Runner
The core code generation engine powered by:

- **Cline**: Autonomous coding agent
- **Gemini**: LLM for code generation and decision-making

**Workflow:**
1. Receives job from background task
2. Parses `architecture_spec` into structured instructions
3. Initializes GitHub repository
4. Writes code to local filesystem (`/tmp/<JobID>/`)
5. Executes single commit with all generated files
6. Pushes to GitHub repository
7. Updates database with completion status

### Local Filesystem
- **Temporary workspace**: `/tmp/<JobID>/`
- Generated files staged here before commit

## GitHub Integration
- Creates new repository for each project
- Single atomic commit containing all generated code
- Repository URL linked to project in database

## User Flow

### 1. Landing & Authentication
- User visits Architex landing page
- Clicks "Get Started" CTA
- Authenticates via GitHub OAuth
- Redirected to Projects Dashboard

### 2. Project Creation
- Click "New Project" button
- Enter project name
- Opens blank React Flow canvas

### 3. Architecture Design
- Add nodes for components (Frontend, Backend, Database, Auth, APIs, etc.)
- Connect nodes with edges to define data flow
- Configure node properties (tech stack, dependencies, specifications)
- Save architecture specification

### 4. Code Generation
- Click "Generate Code" button
- System creates job and submits to Agent Runner
- Real-time status updates via polling (`GET /jobs/{id}`)
- Progress indicators show:
  - Current nodes being processed
  - Agent prompts and responses
  - Build status

### 5. Completion
- GitHub repository created with generated code
- Link to repository displayed
- Project marked as complete
- User can clone repository and start development

## Key Features

### Visual Architecture Design
- Drag-and-drop React Flow interface
- Pre-built component templates (Frontend, Backend, Database, Auth, APIs)
- Visual connection of system components
- Real-time validation of architecture

### AI-Powered Code Generation
- Automated conversion of visual design to code
- Support for multiple tech stacks (React, Next.js, FastAPI, Node.js, MongoDB, PostgreSQL)
- Infrastructure as Code (Docker, Kubernetes, Terraform)
- Best practices and design patterns built-in

### GitHub Integration
- Automatic repository creation
- Single commit with complete project structure
- Ready-to-clone and deploy
- Version control from day one

### Real-Time Monitoring
- Live job status updates
- View agent decision-making process
- Detailed logs and error reporting
- Prompt history for transparency

## Technical Stack

### Frontend
- React
- Next.js
- React Flow
- TailwindCSS
- TypeScript

### Backend
- FastAPI
- Python
- GitHub OAuth

### Database
- MongoDB Atlas

### AI/Agent
- Cline (autonomous coding agent)
- Google Gemini (LLM)

### Infrastructure
- GitHub API
- Background task processing

## API Reference

### Authentication
All protected endpoints require GitHub OAuth token in header:
```text
Authorization: Bearer <github_access_token>
```

### Endpoints

#### `GET /projects`
Fetch all projects for authenticated user.

**Response:**
```json
[
  {
    "projectId": "proj_123",
    "project_name": "My App",
    "last_updated": "2026-01-17T19:00:00Z",
    "architecture_spec": {...}
  }
]
```

#### `POST /jobs`
Submit architecture for code generation.

**Request Body:**
```json
{
  "architecture_spec": {
    "nodes": [...],
    "edges": [...]
  }
}
```

**Response:**
```json
{
  "jobId": "job_456",
  "status": "pending"
}
```

#### `GET /jobs/{id}`
Poll job status (recommended: every 2-5 seconds).

**Response:**
```json
{
  "jobId": "job_456",
  "status": "running",
  "current_nodes": ["frontend", "backend"],
  "prompts_history": [
    "Generating Next.js frontend structure...",
    "Setting up FastAPI backend..."
  ]
}
```

## Security
- **GitHub OAuth**: Secure authentication and repository access
- **Token Management**: Access tokens stored securely in MongoDB
- **API Authorization**: All endpoints validate user authentication
- **Repository Permissions**: Generated repos are private by default

## Future Enhancements
- Support for additional AI models (Claude, GPT-4)
- Template library for common architectures
- Collaborative editing
- Architecture versioning
- Cost estimation
- Deployment automation
- CI/CD pipeline generation
