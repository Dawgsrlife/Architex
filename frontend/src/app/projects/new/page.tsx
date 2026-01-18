"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Github, Sparkles, FolderPlus, Check, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useArchitectureStore } from "@/stores/architecture-store";
import { api } from "@/lib/api";

interface CreateProjectResponse {
  projectId: string;
  name: string;
  description: string;
  github_repo_url: string | null;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { clearCanvas, setProjectName: setStoreName, setProjectId } = useArchitectureStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdProject, setCreatedProject] = useState<CreateProjectResponse | null>(null);

  const generateRepoName = (projectName: string) => {
    return projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    
    setCreating(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await api.post<CreateProjectResponse>('/api/projects', {
        name: name.trim(),
        description: description.trim(),
      });
      
      if (apiError) {
        setError(apiError);
      } else if (data) {
        setSuccess(true);
        setCreatedProject(data);
        // Set up the canvas for this project
        clearCanvas();
        setStoreName(data.name);
        setProjectId(data.projectId);
        // Redirect to project editor after a brief delay
        setTimeout(() => {
          router.push(`/projects/${data.projectId}`);
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="text-center">
          <h1 className="text-white text-xl font-medium mb-2">Please log in</h1>
          <p className="text-stone-400 text-sm mb-4">You need to be logged in to create projects</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-stone-950 rounded-lg text-sm font-medium">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-stone-800/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-stone-700/10 rounded-full blur-3xl" />
      </div>
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-stone-950/90 backdrop-blur-xl border-b border-stone-800/30">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/projects" className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </Link>
              <div className="h-5 w-px bg-stone-800" />
              <Link href="/" className="text-sm font-display font-bold tracking-tight text-white">
                Architex
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative pt-32 pb-16 px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Success State */}
          {success && createdProject && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Check className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-display font-medium text-white mb-2">
                Project Created!
              </h2>
              <p className="text-stone-400 mb-4">
                {createdProject.github_repo_url ? (
                  <>GitHub repository created at <a href={createdProject.github_repo_url} target="_blank" rel="noopener noreferrer" className="text-white underline">{createdProject.github_repo_url.replace('https://github.com/', '')}</a></>
                ) : (
                  "Your project is ready"
                )}
              </p>
              <p className="text-stone-500 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to editor...
              </p>
            </div>
          )}

          {/* Form */}
          {!success && (
            <>
              <div className="text-center mb-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-stone-900 flex items-center justify-center">
                  <FolderPlus className="w-8 h-8 text-stone-400" />
                </div>
                <h1 className="text-3xl font-display font-medium tracking-tight text-white mb-3">
                  Create New Project
                </h1>
                <p className="text-stone-400 text-lg max-w-md mx-auto">
                  Start designing your system architecture. We&apos;ll create a GitHub repository automatically.
                </p>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 text-sm font-medium">Failed to create project</p>
                      <p className="text-red-400/80 text-sm mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                {/* Project Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-stone-300 mb-2">
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., E-commerce Platform"
                    className="w-full px-4 py-3 bg-stone-900/50 border border-stone-800/50 rounded-xl text-white placeholder-stone-500 text-base focus:outline-none focus:border-stone-700 focus:bg-stone-900/80 transition-all"
                    disabled={creating}
                    autoFocus
                  />
                  {name && (
                    <p className="mt-2 text-xs text-stone-500 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5" />
                      Repository will be created as: <span className="text-stone-400">{user?.username}/{generateRepoName(name)}</span>
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-stone-300 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your project..."
                    rows={4}
                    className="w-full px-4 py-3 bg-stone-900/50 border border-stone-800/50 rounded-xl text-white placeholder-stone-500 text-base focus:outline-none focus:border-stone-700 focus:bg-stone-900/80 transition-all resize-none"
                    disabled={creating}
                  />
                </div>

                {/* GitHub Integration Notice */}
                <div className="p-4 bg-stone-900/50 border border-stone-800/50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Github className="w-5 h-5 text-stone-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-stone-300">GitHub Integration</p>
                      <p className="text-xs text-stone-500 mt-1">
                        A new repository will be automatically created on your GitHub account when you create this project.
                        Generated code will be pushed directly to this repository.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-4">
                  <Link href="/projects" className="text-sm text-stone-400 hover:text-white transition-colors">
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={creating || !name.trim()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-stone-950 rounded-full text-sm font-medium hover:bg-stone-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Create Project
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}