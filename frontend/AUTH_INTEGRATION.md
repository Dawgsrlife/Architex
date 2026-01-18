# Frontend Auth Integration Guide

## Overview
Backend: `http://localhost:8000`  
Frontend: `http://localhost:3000`

## Auth Flow

```
1. User clicks "Login with GitHub"
   → Frontend navigates to: http://localhost:8000/api/auth/github

2. Backend redirects to GitHub OAuth
   → User authorizes app on GitHub

3. GitHub redirects to backend callback
   → http://localhost:8000/api/auth/callback?code=xxx

4. Backend exchanges code for token, creates user in DB
   → Redirects to: http://localhost:3000/auth/callback?token=JWT_TOKEN
```

## Frontend Implementation

### 1. Login Button (anywhere in app)
```tsx
// Simple link - no JS needed
<a href="http://localhost:8000/api/auth/github">
  Login with GitHub
</a>
```

### 2. Callback Page (`/auth/callback`)
```tsx
// src/app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (token) {
      // Store token
      localStorage.setItem("auth_token", token);
      // Redirect to app
      router.push("/projects");
    } else {
      router.push("/");
    }
  }, [searchParams, router]);

  return <div>Authenticating...</div>;
}
```

### 3. API Calls (with auth)
```tsx
const API_URL = "http://localhost:8000";

async function fetchWithAuth(endpoint: string, options = {}) {
  const token = localStorage.getItem("auth_token");
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  
  if (res.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem("auth_token");
    window.location.href = "/";
    throw new Error("Unauthorized");
  }
  
  return res.json();
}

// Usage
const user = await fetchWithAuth("/api/users/me");
const projects = await fetchWithAuth("/api/projects");
```

### 4. Check Auth Status
```tsx
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch("http://localhost:8000/api/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
```

### 5. Logout
```tsx
function logout() {
  localStorage.removeItem("auth_token");
  window.location.href = "/";
}
```

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/github` | GET | No | Start OAuth flow |
| `/api/auth/callback` | GET | No | OAuth callback (backend handles) |
| `/api/users/me` | GET | Yes | Get current user |
| `/api/projects` | GET | Yes | List user's projects |
| `/api/projects` | POST | Yes | Create project |
| `/api/jobs` | POST | Yes | Create generation job |
| `/api/jobs/{id}` | GET | Yes | Get job status |

## User Object
```json
{
  "id": "63618609",
  "username": "SquaredPiano",
  "name": "Vishnu Sai",
  "email": "user@example.com",
  "avatar_url": "https://avatars.githubusercontent.com/u/...",
  "role": "free",
  "credits": 100
}
```

## Environment
The frontend needs no env vars for auth - backend URL is hardcoded for simplicity.
For production, make `API_URL` configurable.
