/**
 * Project Types - Single Source of Truth
 * 
 * These types match the backend API response exactly.
 * Backend: api/projects.py serialize_project()
 */

export type ProjectStatus = "draft" | "active" | "completed" | "generating" | "error" | "archived";

/**
 * Project as returned by the API
 * Field names match backend exactly - no mapping needed
 */
export interface Project {
  projectId: string;
  name: string;
  description: string | null;
  github_repo_url: string | null;
  current_nodes: Array<Record<string, unknown>>;
  nodes_count: number;
  status: ProjectStatus;
  prompts_history: Array<Record<string, unknown>>;
  latest_successful_job_id: string | null;
  last_updated: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Request to create a new project
 */
export interface CreateProjectRequest {
  name: string;
  description?: string;
}

/**
 * Request to update a project
 */
export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  current_nodes?: Array<Record<string, unknown>>;
}

/**
 * Status badge configuration
 */
export const STATUS_CONFIG: Record<ProjectStatus, { bg: string; text: string; dot: string; bgLight: string; textLight: string }> = {
  active: { 
    bg: "bg-emerald-500/10", 
    text: "text-emerald-400", 
    dot: "bg-emerald-400",
    bgLight: "bg-emerald-50",
    textLight: "text-emerald-700"
  },
  completed: { 
    bg: "bg-emerald-500/10", 
    text: "text-emerald-400", 
    dot: "bg-emerald-400",
    bgLight: "bg-emerald-50",
    textLight: "text-emerald-700"
  },
  generating: { 
    bg: "bg-blue-500/10", 
    text: "text-blue-400", 
    dot: "bg-blue-400",
    bgLight: "bg-blue-50",
    textLight: "text-blue-700"
  },
  draft: { 
    bg: "bg-amber-500/10", 
    text: "text-amber-400", 
    dot: "bg-amber-400",
    bgLight: "bg-amber-50",
    textLight: "text-amber-700"
  },
  error: { 
    bg: "bg-red-500/10", 
    text: "text-red-400", 
    dot: "bg-red-400",
    bgLight: "bg-red-50",
    textLight: "text-red-700"
  },
  archived: { 
    bg: "bg-stone-500/10", 
    text: "text-stone-500", 
    dot: "bg-stone-500",
    bgLight: "bg-stone-100",
    textLight: "text-stone-500"
  },
};
