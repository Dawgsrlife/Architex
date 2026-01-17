# Backend - Python FastAPI

FastAPI backend service for Architex with async background job processing.

## Features

- GitHub OAuth authentication
- Job processing endpoint (`POST /jobs`)
- MongoDB integration
- Cline integration for authorized operations
- GitHub API integration
- Google Gemini AI integration
- Async background task processing

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
MONGODB_URI=your_mongodb_uri
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8000/api/auth/callback
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
```

## Running

```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

- `GET /api/auth/github` - Initiate GitHub OAuth flow
- `GET /api/auth/callback` - OAuth callback handler
- `POST /api/jobs` - Submit architecture specification job
- `GET /api/projects` - Get user projects
- `GET /api/health` - Health check
