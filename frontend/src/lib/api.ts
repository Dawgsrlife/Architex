/**
 * Architex API Client
 * 
 * INVARIANT: All authenticated requests MUST have Authorization header.
 * If token is missing, this client THROWS rather than sending unauthenticated requests.
 * 
 * Risk Levels:
 * - LOW:  GET /api/auth/me, GET /api/jobs/:id
 * - MEDIUM: POST /api/jobs
 * - HIGH: POST /api/jobs/:id/approve, POST /deploy
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Custom error for missing auth
export class AuthRequiredError extends Error {
    constructor(endpoint: string) {
        super(`Authentication required for ${endpoint}. No token available.`);
        this.name = 'AuthRequiredError';
    }
}

// Endpoints that don't require auth
const PUBLIC_ENDPOINTS = [
    '/api/auth/github',
    '/api/auth/callback',
    '/api/health',
];

function isPublicEndpoint(path: string): boolean {
    return PUBLIC_ENDPOINTS.some(pub => path.startsWith(pub));
}

/**
 * Get auth token from localStorage.
 * Returns null if not authenticated.
 */
export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
}

/**
 * Build headers with auth token.
 * THROWS if auth required but token missing.
 */
function buildHeaders(path: string, additionalHeaders?: HeadersInit): Headers {
    const headers = new Headers(additionalHeaders);

    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (!isPublicEndpoint(path)) {
        const token = getAuthToken();
        if (!token) {
            // FAIL LOUDLY - don't silently send unauthenticated request
            throw new AuthRequiredError(path);
        }
        headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
}

interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    status: number;
}

/**
 * Core fetch wrapper with auth handling.
 */
async function apiRequest<T>(
    method: string,
    path: string,
    body?: unknown
): Promise<ApiResponse<T>> {
    try {
        const headers = buildHeaders(path);

        const response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        // Handle 401 - redirect to login
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            // Could emit event or redirect here
            return { data: null, error: 'Unauthorized', status: 401 };
        }

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            return {
                data: null,
                error: data?.error || data?.detail || `Request failed with status ${response.status}`,
                status: response.status
            };
        }

        return { data, error: null, status: response.status };

    } catch (err) {
        // Re-throw AuthRequiredError so callers can handle it
        if (err instanceof AuthRequiredError) {
            throw err;
        }
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Network error',
            status: 0
        };
    }
}

/**
 * API Client
 * 
 * Usage:
 *   const { data, error } = await api.get<Job[]>('/api/jobs');
 *   const { data, error } = await api.post('/api/jobs', { architecture_spec });
 */
export const api = {
    get: <T>(path: string) => apiRequest<T>('GET', path),
    post: <T>(path: string, body?: unknown) => apiRequest<T>('POST', path, body),
    put: <T>(path: string, body?: unknown) => apiRequest<T>('PUT', path, body),
    patch: <T>(path: string, body?: unknown) => apiRequest<T>('PATCH', path, body),
    delete: <T>(path: string) => apiRequest<T>('DELETE', path),
};

// Re-export API_URL for socket connections etc
export { API_URL };
