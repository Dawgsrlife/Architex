"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  last_updated: string;
  created_at: string;
}

interface JobSummary {
  total: number;
  pending: number;
  running: number;
  done: number;
  failed: number;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobSummary, setJobSummary] = useState<JobSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      router.push("/");
      return;
    }

    fetchProjects(token);
    fetchJobSummary(token);
  }, [router]);

  const fetchProjects = async (token: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchJobSummary = async (token: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const jobs = await response.json();
      const summary = {
        total: jobs.length,
        pending: jobs.filter((j: any) => j.status === "pending").length,
        running: jobs.filter((j: any) => j.status === "running").length,
        done: jobs.filter((j: any) => j.status === "done").length,
        failed: jobs.filter((j: any) => j.status === "failed").length,
      };
      setJobSummary(summary);
    } catch (err) {
      console.error("Failed to fetch job summary:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    router.push("/");
  };

  const handleCreateProject = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:8000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "New Project",
          description: "Created from Architex",
          repository_url: null,
        }),
      });

      if (response.ok) {
        fetchProjects(token);
      }
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your architecture projects and workflows
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/workflow">
              <Button>Open Workflow Builder</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {jobSummary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="p-4 rounded-lg border bg-card">
              <div className="text-2xl font-bold">{jobSummary.total}</div>
              <div className="text-sm text-muted-foreground">Total Jobs</div>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="text-2xl font-bold text-yellow-600">{jobSummary.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="text-2xl font-bold text-blue-600">{jobSummary.running}</div>
              <div className="text-sm text-muted-foreground">Running</div>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="text-2xl font-bold text-green-600">{jobSummary.done}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="text-2xl font-bold text-red-600">{jobSummary.failed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </div>
        )}

        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Projects</h2>
          <Button onClick={handleCreateProject}>Create Project</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project to get started
              </p>
              <Button onClick={handleCreateProject}>Create Project</Button>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-lg mb-2">{project.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      project.status === "done"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : project.status === "running"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : project.status === "failed"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {project.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(project.last_updated).toLocaleDateString()}
                  </span>
                </div>
                <Link href="/workflow">
                  <Button variant="outline" size="sm" className="w-full">
                    Open Project
                  </Button>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
