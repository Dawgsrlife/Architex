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

Create a `.env` file in the backend directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials.

### MongoDB Atlas Setup

1. **Create a MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account (M0 cluster is free)

2. **Create a Cluster**
   - Click "Create" to create a new cluster
   - Choose a cloud provider and region
   - Select M0 (Free) tier
   - Wait for cluster to be created (~5 minutes)

3. **Configure Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and password (save these!)
   - Set user privileges to "Atlas admin" or "Read and write to any database"

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For local development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your server's IP address only

5. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (SRV format)
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `architex` (or your preferred database name)

6. **Set Environment Variable**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=architex
   ```

### Required Environment Variables

- `MONGODB_URI` - MongoDB Atlas connection string (SRV format)
- `MONGODB_DB_NAME` - Database name (default: `architex`)
- `GITHUB_CLIENT_ID` - GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth app client secret
- `GITHUB_CALLBACK_URL` - OAuth callback URL (e.g., `http://localhost:8000/api/auth/callback`)
- `GOOGLE_GEMINI_API_KEY` - Google Gemini API key
- `JWT_SECRET` - Secret key for JWT token signing (use a strong random string in production)
- `FRONTEND_URL` - Frontend URL (default: `http://localhost:3000`)

### Optional Environment Variables

- `TOKEN_ENCRYPTION_KEY` - Key for encrypting GitHub access tokens before storage (recommended for production)

## Running

### Local Development

```bash
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run the server
uvicorn main:app --reload --port 8000
```

The server will start on `http://localhost:8000`

### Verify MongoDB Connection

On startup, the application will:
1. Connect to MongoDB Atlas
2. Create required indexes (idempotent - safe to run multiple times)
3. Log connection status

Check the console output for:
```
INFO: Database connected and indexes ensured
```

If you see connection errors, verify:
- `MONGODB_URI` is correct and includes your password
- Network access is configured in Atlas (IP whitelist)
- Database user has proper permissions

## API Endpoints

- `GET /api/auth/github` - Initiate GitHub OAuth flow
- `GET /api/auth/callback` - OAuth callback handler
- `POST /api/jobs` - Submit architecture specification job
- `GET /api/projects` - Get user projects
- `GET /api/health` - Health check
