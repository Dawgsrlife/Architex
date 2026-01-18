/**
 * Project Service
 * 
 * Handles project creation and retrieval for the canvas.
 * 
 * INVARIANT: A job cannot be created unless a projectId exists.
 * This service auto-creates projects when needed.
 */

import { api } from './api';

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
}

interface CreateProjectResponse {
    id: string;
    name: string;
    description: string;
    status: string;
}

/**
 * Ensure a project exists for the current session.
 * If projectId is provided and valid, returns it.
 * If not, creates a new project and returns the new ID.
 * 
 * @param currentProjectId - The current project ID (may be null)
 * @param projectName - Name for the project (used if creating new)
 * @returns The valid project ID (never null)
 * @throws Error if project creation fails
 */
export async function ensureProjectExists(
    currentProjectId: string | null,
    projectName: string = 'Canvas Project'
): Promise<string> {
    // If we have a project ID, verify it exists
    if (currentProjectId) {
        // TODO: Could verify via GET /api/projects/:id, but for now trust local state
        return currentProjectId;
    }

    // Create a new project
    const { data, error } = await api.post<CreateProjectResponse>('/api/projects', {
        name: projectName,
        description: 'Auto-created from canvas session',
    });

    if (error || !data) {
        throw new Error(error || 'Failed to create project');
    }

    return data.id;
}

/**
 * List all projects for the current user.
 */
export async function listProjects(): Promise<Project[]> {
    const { data, error } = await api.get<Project[]>('/api/projects');

    if (error || !data) {
        console.error('Failed to list projects:', error);
        return [];
    }

    return data;
}
