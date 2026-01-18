"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, Check, Github } from "lucide-react";
import { useArchitectureStore } from "@/stores/architecture-store";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

interface CreateProjectResponse {
  id?: string;
  projectId?: string;
  name: string;
  description: string;
  repository_url?: string | null;
  github_repo_url?: string | null;
}

const templates = [
  { id: "blank", name: "Blank Canvas", desc: "Start from scratch" },
  { id: "api", name: "REST API", desc: "Backend service with database" },
  { id: "fullstack", name: "Full-Stack App", desc: "Frontend + Backend + Database" },
  { id: "microservices", name: "Microservices", desc: "Distributed architecture" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { clearCanvas, setProjectId, setProjectName } = useArchitectureStore();
  const [projectName, setLocalProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdProject, setCreatedProject] = useState<CreateProjectResponse | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.set(contentRef.current, { opacity: 0, y: 20 });
    gsap.to(contentRef.current, { 
      opacity: 1, y: 0, duration: 0.5, ease: "power2.out" 
    });
  }, []);

  const handleCreate = async () => {
    const name = projectName.trim() || "Untitled Project";
    
    setCreating(true);
    setError(null);
    
    console.log("[NEW PROJECT] Creating project:", name);
    
    try {
      const { data, error: apiError } = await api.post<CreateProjectResponse>('/api/projects', {
        name,
        description: description.trim() || `${selectedTemplate} architecture`,
      });
      
      console.log("[NEW PROJECT] API Response:", { data, apiError });
      
      if (apiError) {
        console.error("[NEW PROJECT] API Error:", apiError);
        setError(apiError);
        alert(`Failed to create project: ${apiError}`);
      } else if (data) {
        console.log("[NEW PROJECT] Success:", data);
        setSuccess(true);
        setCreatedProject(data);
        
        // Set up the canvas for this project
        clearCanvas();
        const projectId = data.projectId || data.id;
        setProjectId(projectId || null);
        setProjectName(data.name);
        
        // Redirect to project editor after a brief delay
        setTimeout(() => {
          router.push(`/dashboard/${projectId}`);
        }, 1500);
      }
    } catch (err) {
      console.error("[NEW PROJECT] Exception:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      alert(`Failed to create project: ${errorMessage}`);
    } finally {
      setCreating(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 text-stone-900 animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-stone-900 text-xl font-medium mb-2">Please log in</h1>
          <p className="text-stone-500 text-sm mb-4">You need to be logged in to create projects</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[11px] tracking-widest uppercase font-medium">Back</span>
              </Link>
              <div className="h-4 w-px bg-stone-200" />
              <Link href="/" className="text-sm font-display font-bold tracking-tight text-stone-900">
                Architex
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-16 px-8 lg:px-12">
        <div ref={contentRef} className="max-w-xl mx-auto">
          {/* Success State */}
          {success && createdProject && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-display font-medium text-stone-900 mb-2">
                Project Created!
              </h2>
              <p className="text-stone-500 mb-4">
                {(createdProject.github_repo_url || createdProject.repository_url) ? (
                  <>GitHub repo: <a href={createdProject.github_repo_url || createdProject.repository_url || '#'} target="_blank" rel="noopener noreferrer" className="text-stone-900 underline">{(createdProject.github_repo_url || createdProject.repository_url)?.replace('https://github.com/', '')}</a></>
                ) : (
                  "Your project is ready"
                )}
              </p>
              <p className="text-stone-400 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to editor...
              </p>
            </div>
          )}

          {/* Form */}
          {!success && (
            <>
              <div className="mb-10">
                <h1 className="text-2xl font-display font-medium tracking-tight text-stone-900 mb-2">
                  New Project
                </h1>
                <p className="text-stone-400 text-sm">
                  Create a new architecture project with a GitHub repository
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700 text-sm font-medium">Failed to create project</p>
                    <p className="text-red-600 text-sm mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-stone-400 font-medium mb-2">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="My Architecture"
                    value={projectName}
                    onChange={(e) => setLocalProjectName(e.target.value)}
                    disabled={creating}
                    className="w-full px-4 py-3 bg-stone-50 border-0 rounded-lg text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all disabled:opacity-50"
                  />
                  {projectName && user?.username && (
                    <p className="mt-2 text-xs text-stone-400 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5" />
                      Repo: {user.username}/{projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-stone-400 font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Brief description of your project..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={creating}
                    rows={3}
                    className="w-full px-4 py-3 bg-stone-50 border-0 rounded-lg text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all resize-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-stone-400 font-medium mb-3">
                    Template
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        disabled={creating}
                        className={`p-4 text-left border rounded-lg transition-all disabled:opacity-50 ${
                          selectedTemplate === template.id
                            ? "border-stone-900 bg-stone-50"
                            : "border-stone-100 hover:border-stone-200"
                        }`}
                      >
                        <p className="text-sm font-medium text-stone-900">{template.name}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{template.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-[11px] tracking-widest uppercase font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Project
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
