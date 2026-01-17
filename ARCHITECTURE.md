# Architex Architecture

Full-stack application with separated frontend (React + Next.js) and backend (Python + FastAPI).

## Architecture Overview

```
┌──────────────────────┐
│  Static Landing Page │
│    (Next.js)         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ GitHub OAuth Login   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐      ┌────────────────────────┐
│   Projects Page      │◄────►│  FastAPI Backend       │
│  (React + Next.js)   │      │  (Python + FastAPI)    │
└──────────┬───────────┘      │  - Auth via GitHub     │
           │                   │  - POST /jobs endpoint │
           │                   │  - Authorized Mlink    │
           ▼                   │    (Cline integration) │
┌──────────────────────┐      └───────────┬────────────┘
│  Workflow Builder    │                  │
│  (React Flow)        │                  │
└──────────────────────┘                  │
                                          ▼
                              ┌───────────────────────┐
                              │  MongoDB Atlas        │
                              │  + Mongoose           │
                              └───────────────────────┘
                                          │
                              ┌───────────┴────────────┐
                              │                        │
                              ▼                        ▼
                    ┌──────────────┐        ┌──────────────┐
                    │  GitHub API  │        │  Gemini AI   │
                    └──────────────┘        └──────────────┘
```

## Project Structure

```
architex/
├── frontend/                 # Next.js React frontend
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   │   ├── page.tsx     # Landing page with GitHub OAuth
│   │   │   ├── auth/        # OAuth callback
│   │   │   ├── projects/    # Projects page
│   │   │   └── workflow/    # Workflow builder
│   │   ├── components/      # React components
│   │   └── lib/             # Frontend utilities
│   ├── package.json
│   └── next.config.ts
│
├── backend/                  # Python FastAPI backend
│   ├── main.py              # Main FastAPI application
│   ├── services/
│   │   ├── cline.py         # Cline integration (Authorized Mlink)
│   │   ├── gemini.py        # Google Gemini AI service
│   │   └── github.py        # GitHub API service
│   ├── database/
│   │   └── mongodb.py       # MongoDB connection
│   ├── models/
│   │   └── database.py      # Database models
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variables template
│
└── README.md                 # This file
```

## Features

### Frontend (React + Next.js)
- ✅ Static landing page
- ✅ GitHub OAuth login flow
- ✅ Projects page (displays user projects)
- ✅ Workflow builder with React Flow
- ✅ TailwindCSS 4 styling
- ✅ Dark mode support

### Backend (Python + FastAPI)
- ✅ GitHub OAuth authentication
- ✅ JWT token generation
- ✅ POST /jobs endpoint for architecture specifications
- ✅ Async background job processing
- ✅ Cline integration (Authorized Mlink)
- ✅ Google Gemini AI integration
- ✅ GitHub API integration
- ✅ MongoDB database with Mongoose
- ✅ CORS configuration

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- pnpm
- MongoDB Atlas account
- GitHub OAuth app credentials

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

5. Update `.env` with your credentials:
```env
MONGODB_URI=your_mongodb_uri
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8000/api/auth/callback
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
```

6. Run the backend:
```bash
uvicorn main:app --reload --port 8000
```

Backend will be available at http://localhost:8000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

Frontend will be available at http://localhost:3000

## API Endpoints

### Authentication
- `GET /api/auth/github` - Initiate GitHub OAuth flow
- `GET /api/auth/callback` - Handle OAuth callback

### Projects
- `GET /api/projects` - Get user projects (requires auth)
- `POST /api/projects` - Create new project (requires auth)

### Jobs
- `POST /api/jobs` - Submit architecture specification job (requires auth)
- `GET /api/jobs/{job_id}` - Get job status (requires auth)

### Health
- `GET /` - Root endpoint
- `GET /api/health` - Health check

## Architecture Flow

1. **User visits landing page** → Static Next.js page
2. **User clicks "Login with GitHub"** → Redirects to `/api/auth/github`
3. **Backend initiates OAuth** → Redirects to GitHub
4. **GitHub redirects back** → `/api/auth/callback`
5. **Backend exchanges code for token** → Creates JWT
6. **Frontend receives JWT** → Stores in localStorage
7. **User redirected to /projects** → Shows authenticated projects
8. **User submits job** → POST /jobs with architecture spec
9. **Backend processes job** → 
   - Authorizes via Cline (Authorized Mlink)
   - Generates architecture via Gemini AI
   - Creates GitHub repository if needed
   - Updates MongoDB with results

## Key Integrations

### Cline (Authorized Mlink)
- Authorization layer for operations
- Ensures secure access to resources
- Located in `backend/services/cline.py`

### Gemini AI
- Generates architecture from natural language
- Code generation capabilities
- Located in `backend/services/gemini.py`

### GitHub API
- Repository creation
- File management
- User authentication
- Located in `backend/services/github.py`

### MongoDB
- User data storage
- Project management
- Job tracking
- Located in `backend/database/mongodb.py`

## Environment Variables

### Backend
```env
MONGODB_URI=mongodb+srv://...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:8000/api/auth/callback
GOOGLE_GEMINI_API_KEY=...
JWT_SECRET=...
FRONTEND_URL=http://localhost:3000
```

### Frontend
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Development

### Running Both Services

Terminal 1 (Backend):
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Terminal 2 (Frontend):
```bash
cd frontend
pnpm dev
```

## Deployment

### Backend (Python/FastAPI)
- Deploy to Google Cloud Run, AWS Lambda, or similar
- Set environment variables in cloud provider
- Use production MongoDB instance

### Frontend (Next.js)
- Deploy to Vercel (recommended)
- Update `NEXT_PUBLIC_BACKEND_URL` to production backend URL
- Configure custom domain

## Security Notes

- JWT tokens stored in localStorage (consider httpOnly cookies for production)
- GitHub OAuth tokens securely stored in backend
- All API endpoints require authentication except OAuth flow
- CORS configured to accept requests from frontend only

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.
