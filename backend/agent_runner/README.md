# Agent Runner

Standalone worker process for processing architecture generation jobs. The agent runner polls MongoDB for pending jobs, generates code using Cline (with Gemini fallback), and pushes the generated code to GitHub repositories.

## Overview

The Agent Runner is a separate service that:

1. **Claims Jobs**: Atomically claims pending jobs from MongoDB
2. **Creates Workspace**: Sets up working directories for each job
3. **Builds Specs**: Converts architecture specs to `spec.json` and `instructions.md`
4. **Generates Code**: Runs Cline (or Gemini fallback) to generate code
5. **Validates Output**: Ensures generated code meets requirements
6. **Commits & Pushes**: Commits and pushes code to GitHub repositories
7. **Updates Status**: Updates job status in MongoDB with results

## Architecture

```
backend/agent_runner/
├── src/agent_runner/
│   ├── __init__.py
│   ├── main.py              # Entrypoint
│   ├── config.py            # Configuration management
│   ├── db.py                # MongoDB connection
│   ├── models.py            # Data models
│   ├── runner.py            # Main runner logic
│   ├── job_claim.py         # Atomic job claiming
│   ├── workspace.py         # Workspace management
│   ├── spec_builder.py      # Converts architecture_spec -> spec.json
│   ├── instructions_builder.py  # Generates instructions.md
│   ├── cline_client.py      # Cline CLI adapter
│   ├── gemini_fallback.py   # Gemini fallback generator
│   ├── git_client.py        # Git operations
│   └── utils.py             # Utilities (logging, sanitization)
├── scripts/
│   └── seed_job.py          # Seed script for testing
├── Dockerfile
├── docker-compose.yml       # Local testing setup
├── requirements.txt
├── .env.example
└── README.md
```

## Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   cd backend/agent_runner
   pip install -r requirements.txt
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Run the runner**:
   ```bash
   # Using Python module
   PYTHONPATH=./src python -m agent_runner.main
   
   # Or set PYTHONPATH in environment
   export PYTHONPATH=$PWD/src
   python -m agent_runner.main
   ```

### Docker Compose (with local MongoDB)

1. **Create `.env` file** (copy from `.env.example`)
2. **Update MongoDB URI** to point to docker service:
   ```env
   MONGODB_URI=mongodb://mongo:27017/architex
   ```
3. **Run**:
   ```bash
   docker-compose up
   ```

### Seed Test Job

Create a test job to verify the runner:

```bash
# Make sure MongoDB is running and .env is configured
PYTHONPATH=./src python scripts/seed_job.py
```

The runner will automatically pick up the pending job.

## Configuration

### Environment Variables

See `.env.example` for all available options:

#### Required

- `MONGODB_URI`: MongoDB connection string
- `MONGO_DB_NAME`: Database name (default: `architex`)

#### Optional

**Gemini API** (for fallback):
- `GOOGLE_GEMINI_API_KEY`: Google Gemini API key
- `GEMINI_MODEL`: Model name (default: `gemini-1.5-pro`)

**GitHub** (for pushing):
- `GITHUB_TOKEN`: GitHub personal access token with `repo` scope

**Runner Settings**:
- `RUNNER_POLL_SECONDS`: Polling interval in seconds (default: `2`)
- `WORKDIR_ROOT`: Root directory for workspaces (default: `/tmp`)

**Git Settings**:
- `GIT_AUTHOR_NAME`: Git commit author name (default: `Architex Bot`)
- `GIT_AUTHOR_EMAIL`: Git commit author email (default: `bot@architex.local`)
- `CLONE_DEFAULT_BRANCH`: Default branch name (default: `main`)
- `CLONE_REMOTE_NAME`: Remote name (default: `origin`)

**Cline Settings**:
- `CLINE_ENABLED`: Enable Cline adapter (default: `true`)
- `CLINE_CMD`: Cline command name (default: `cline`)

## How It Works

### Job Processing Flow

1. **Poll MongoDB**: Runner polls for jobs with `status: "pending"`
2. **Claim Job**: Atomically updates job to `status: "running"` with `startedAt`
3. **Create Workspace**: Sets up directories under `WORKDIR_ROOT/<jobId>/`
4. **Build Specs**: Converts `architecture_spec` to `spec.json` and `instructions.md`
5. **Generate Code**:
   - Tries Cline CLI first (if enabled and available)
   - Falls back to Gemini API if Cline unavailable
   - Writes generated files to `repo/` directory
6. **Validate**: Checks for `README.md` and at least one other file
7. **Git Operations**:
   - Initializes Git repository
   - Commits all changes
   - Pushes to GitHub (if repo URL and token configured)
8. **Update Status**: Marks job as `done` or `failed` with metadata

### Database Schema

The runner expects these MongoDB collections:

**jobs**:
```javascript
{
  _id: string,
  projectId: string,
  status: "pending" | "running" | "done" | "failed",
  architecture_spec: { nodes: [], edges: [] },
  logs: [string],
  metadata: { repoUrl?: string, commitSha?: string, pushSkipped?: boolean },
  createdAt: Date,
  startedAt?: Date,
  finishedAt?: Date
}
```

**projects**:
```javascript
{
  _id: string,
  ownerId: string,
  name: string,
  githubRepoUrl: string,
  lastUpdated: Date,
  jobIds: [string]
}
```

### Workspace Structure

For each job, the runner creates:

```
/tmp/<jobId>/
├── input/
│   ├── architecture_spec.json  # Original spec from job
│   ├── spec.json               # Converted spec
│   └── instructions.md         # Cline-friendly instructions
└── repo/
    ├── README.md               # Generated files
    └── ...                     # Generated codebase
```

## Code Generation

### Cline Integration

The runner uses Cline CLI for code generation when available:

```bash
cline generate --repo <repo_dir> --instructions <instructions_path>
```

If `CLINE_CMD` is not available, the runner automatically falls back to Gemini.

### Gemini Fallback

If Cline is unavailable or fails, the runner uses Gemini API:

- Reads `spec.json` and `instructions.md`
- Calls Gemini API to generate code
- Expects JSON response: `{ "files": { "path": "content", ... } }`
- Writes files to `repo/` directory

If no Gemini API key is configured, a minimal stub is generated.

## Security

- **Token Sanitization**: All logs are sanitized to remove tokens/secrets
- **No Token Logging**: Never logs full URLs with embedded tokens
- **Environment Variables**: Tokens stored in environment, never in code
- **Safe Error Messages**: Exception messages are sanitized before logging

## Development

### Running Tests

```bash
# Seed a test job
PYTHONPATH=./src python scripts/seed_job.py

# Run the runner
PYTHONPATH=./src python -m agent_runner.main
```

### Debugging

Enable debug logging:

```python
# In main.py or via environment
logging.basicConfig(level=logging.DEBUG)
```

### Adding Features

1. **New Code Generator**: Implement in separate module, add to `runner.py`
2. **New Validation**: Extend `validate_output()` in `runner.py`
3. **New Git Operations**: Add methods to `git_client.py`

## Troubleshooting

### Runner Not Picking Up Jobs

- Check MongoDB connection: Ensure `MONGODB_URI` is correct
- Check job status: Jobs must be `status: "pending"`
- Check polling: Increase `RUNNER_POLL_SECONDS` if needed

### Code Generation Fails

- Check Cline: Verify `CLINE_CMD` is in PATH
- Check Gemini: Ensure `GOOGLE_GEMINI_API_KEY` is set
- Check logs: Review job `logs` field in MongoDB

### Git Push Fails

- Check token: Ensure `GITHUB_TOKEN` has `repo` scope
- Check repo URL: Verify `githubRepoUrl` in project document
- Check permissions: Token must have push access to repository

### Workspace Issues

- Check permissions: Ensure `WORKDIR_ROOT` is writable
- Check disk space: Ensure sufficient space for generated code
- Check cleanup: Workspaces are kept by default (cleanup manually if needed)

## Production Deployment

### As a Service

Run as a systemd service or similar:

```ini
[Unit]
Description=Architex Agent Runner
After=network.target

[Service]
Type=simple
User=architex
WorkingDirectory=/opt/architex/backend/agent_runner
Environment="PYTHONPATH=/opt/architex/backend/agent_runner/src"
EnvironmentFile=/opt/architex/backend/agent_runner/.env
ExecStart=/usr/bin/python3 -m agent_runner.main
Restart=always

[Install]
WantedBy=multi-user.target
```

### Docker Deployment

Build and run:

```bash
docker build -t architex-agent-runner .
docker run -d \
  --env-file .env \
  --name agent-runner \
  architex-agent-runner
```

### Scaling

Run multiple runner instances for parallel processing:

- Each runner will claim different jobs atomically
- No coordination needed between instances
- MongoDB handles job locking via `find_one_and_update`

## License

Part of the Architex project.
