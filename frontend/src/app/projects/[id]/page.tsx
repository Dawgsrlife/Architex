"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Share2,
  Download,
  Loader2,
  Command,
  MessageSquare,
  X,
  Send,
  Github,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";
import ComponentLibrary from "@/components/canvas/ComponentLibrary";
import ArchitectureCanvas from "@/components/canvas/ArchitectureCanvas";
import { useArchitectureStore } from "@/stores/architecture-store";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Project } from "@/types/project";

// Job status types
type JobStatus = "pending" | "running" | "completed" | "failed" | "completed_with_warnings";

interface Job {
  jobId: string;
  status: JobStatus;
  error?: string;
  warnings?: string[];
  logs?: string[];
  result?: {
    files_generated?: number;
    github_url?: string;
  };
  current_step?: string;
}

export default function ProjectEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [isEditingName, setIsEditingName] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [aiMessage, setAiMessage] = useState("");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const { nodes, edges, prompt, setProjectName: setStoreName, setProjectId, clearCanvas } = useArchitectureStore();

  const fetchProject = useCallback(async () => {
    if (!projectId || projectId === "new") return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await api.get<Project>(`/api/projects/${projectId}`);
      if (apiError) {
        setError(apiError);
      } else if (data) {
        setProject(data);
        setProjectName(data.name);
        setStoreName(data.name);
        setProjectId(data.projectId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId, setStoreName, setProjectId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (projectId === "new") {
        clearCanvas();
        setProjectName("Untitled Project");
        setStoreName("Untitled Project");
        setProjectId(null);
        setLoading(false);
      } else {
        fetchProject();
      }
    }
  }, [authLoading, isAuthenticated, projectId, clearCanvas, setStoreName, setProjectId, fetchProject]);

  const handleSave = async () => {
    if (!projectId || projectId === "new") return;

    setSaving(true);
    try {
      const { error: saveError } = await api.patch(`/api/projects/${projectId}`, {
        name: projectName,
        nodes_count: nodes.length,
      });

      if (saveError) {
        console.error("Save error:", saveError);
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const { data, error: apiError } = await api.get<Job>(`/api/jobs/${jobId}`);

      if (apiError) {
        console.error("Job poll error:", apiError);
        return;
      }

      if (data) {
        setCurrentJob(data);

        // Check if job is complete
        if (data.status === "completed") {
          setIsGenerating(false);
          setGenerationSuccess(true);
          setGenerationError(null);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          // Refresh project to get updated github_repo_url
          fetchProject();
        } else if (data.status === "completed_with_warnings") {
          setIsGenerating(false);
          setGenerationSuccess(true);
          setGenerationError(null);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          fetchProject();
        } else if (data.status === "failed") {
          setIsGenerating(false);
          setGenerationSuccess(false);
          setGenerationError(data.error || "Generation failed");
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error("Job polling error:", err);
    }
  }, [fetchProject]);

  const handleGenerate = async () => {
    // CRITICAL: Get projectId from MULTIPLE sources and validate
    // Source 1: params.id from useParams()
    const paramsId = params?.id;
    // Source 2: window.location.pathname
    const pathParts = typeof window !== 'undefined' ? window.location.pathname.split('/') : [];
    const urlPathId = pathParts[pathParts.indexOf('projects') + 1];
    // Source 3: The projectId variable from component scope
    const scopeProjectId = projectId;
    
    // Pick the best available ID (prefer URL path as most reliable)
    const rawProjectId = urlPathId || (typeof paramsId === 'string' ? paramsId : String(paramsId)) || scopeProjectId;
    
    console.log("🔍 AGGRESSIVE DEBUG:");
    console.log("   - params object:", params);
    console.log("   - params.id:", paramsId);
    console.log("   - window.location.pathname:", typeof window !== 'undefined' ? window.location.pathname : 'N/A');
    console.log("   - urlPathId (from pathname):", urlPathId);
    console.log("   - scopeProjectId (component var):", scopeProjectId);
    console.log("   - SELECTED rawProjectId:", rawProjectId);

    // Clean the ID - remove any whitespace, ensure it's a string
    const cleanProjectId = rawProjectId ? String(rawProjectId).trim() : '';

    // Validate projectId is a valid MongoDB ObjectId-like string
    const isValidProjectId = cleanProjectId && 
      cleanProjectId !== "new" && 
      cleanProjectId !== "undefined" && 
      cleanProjectId !== "null" &&
      cleanProjectId !== "[object Object]" &&
      cleanProjectId.length >= 20;

    if (!isValidProjectId) {
      const errorMsg = `CRITICAL ERROR: Invalid Project ID "${cleanProjectId}". Please navigate to a valid project first.`;
      setGenerationError(errorMsg);
      console.error("❌ CRITICAL: projectId validation failed:", {
        cleanProjectId,
        rawProjectId,
        paramsId,
        urlPathId,
        scopeProjectId,
        pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A'
      });
      alert(`Error: Project ID is invalid or missing.\n\nExpected: 24-character ID\nGot: "${cleanProjectId}"\n\nPlease refresh the page and try again.`);
      return;
    }

    // Use the validated and cleaned projectId from here on
    const validatedProjectId = cleanProjectId;
    console.log("✅ VALIDATED PROJECT ID:", validatedProjectId);

    if (nodes.length === 0) {
      setGenerationError("Add at least one component to generate code");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(false);
    setCurrentJob(null);

    console.log("🚀 Starting code generation...");
    console.log("📋 Project ID (validated):", validatedProjectId);
    console.log("📋 Nodes:", nodes.length);
    console.log("📋 Edges:", edges.length);
    console.log("📋 Prompt:", prompt);

    try {
      // Build the architecture spec
      const architectureSpec = {
        name: projectName,
        description: prompt || "Generated via Visual Editor",
        prompt: prompt || "A standard software system",
        nodes: nodes,
        edges: edges,
        metadata: {
          projectId: validatedProjectId,
          github_repo_url: project?.github_repo_url,
        },
        components: nodes.map((n: any) => n.data?.label || n.type),
        frameworks: nodes.map((n: any) => n.data?.framework).filter(Boolean)
      };

      console.log("📤 Sending job request with project_id:", validatedProjectId);

      const { data, error: apiError } = await api.post<{ jobId: string }>('/api/jobs', {
        project_id: validatedProjectId,  // Validated project ID from URL params
        architecture_spec: architectureSpec,
      });

      if (apiError) {
        console.error("❌ Job creation failed:", apiError);
        setGenerationError(apiError);
        setIsGenerating(false);
        return;
      }

      if (data?.jobId) {
        console.log("✅ Job created:", data.jobId);
        setCurrentJob({ jobId: data.jobId, status: "pending" });

        // Start polling for job status
        pollingRef.current = setInterval(() => {
          pollJobStatus(data.jobId);
        }, 2000);

        // Initial poll
        pollJobStatus(data.jobId);
      }
    } catch (err) {
      console.error("❌ Generation error:", err);
      setGenerationError(err instanceof Error ? err.message : "Failed to start generation");
      setIsGenerating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-950">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-950">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-white text-xl font-medium mb-2">Error loading project</h1>
          <p className="text-stone-400 text-sm mb-4">{error}</p>
          <Link href="/projects" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-stone-950 rounded-lg text-sm font-medium">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-stone-950">
      <header className="h-14 border-b border-stone-800/30 bg-stone-950/90 backdrop-blur-xl flex items-center justify-between px-4 flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Projects</span>
          </Link>

          <div className="h-5 w-px bg-stone-800" />

          <Link href="/" className="text-sm font-display font-bold tracking-tight text-white cursor-pointer">
            Architex
          </Link>

          <div className="h-5 w-px bg-stone-800" />

          {isEditingName ? (
            <input
              type="text"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                setStoreName(e.target.value);
              }}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
              autoFocus
              className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-stone-600"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-sm font-medium text-white hover:text-stone-300 transition-colors cursor-pointer"
            >
              {projectName}
            </button>
          )}

          <span className="text-xs text-stone-600 hidden sm:inline">
            {nodes.length} nodes
          </span>

          {project?.github_repo_url && (
            <a
              href={project.github_repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-xs text-stone-500 hover:text-white transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="max-w-[150px] truncate">{project.github_repo_url.replace('https://github.com/', '')}</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-1">
          {project?.github_repo_url && (
            <a
              href={project.github_repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="md:hidden flex items-center gap-2 px-3 py-1.5 text-sm text-stone-400 hover:text-white hover:bg-stone-800/50 rounded-lg transition-all"
            >
              <Github className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-400 hover:text-white hover:bg-stone-800/50 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Save</span>
          </button>

          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-400 hover:text-white hover:bg-stone-800/50 rounded-lg transition-all cursor-pointer">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-400 hover:text-white hover:bg-stone-800/50 rounded-lg transition-all cursor-pointer">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <div className="h-5 w-px bg-stone-800 mx-1" />

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-1.5 bg-white text-stone-950 rounded-full text-sm font-medium hover:bg-stone-100 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Generate</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Generation Status Banner */}
      {(isGenerating || generationError || generationSuccess) && (
        <div className={`px-4 py-3 flex items-center justify-between ${generationError
            ? 'bg-red-500/10 border-b border-red-500/20'
            : generationSuccess
              ? currentJob?.status === 'completed_with_warnings'
                ? 'bg-yellow-500/10 border-b border-yellow-500/20'
                : 'bg-green-500/10 border-b border-green-500/20'
              : 'bg-blue-500/10 border-b border-blue-500/20'
          }`}>
          <div className="flex items-center gap-3">
            {generationError ? (
              <XCircle className="w-5 h-5 text-red-400" />
            ) : generationSuccess ? (
              currentJob?.status === 'completed_with_warnings' ? (
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )
            ) : (
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            )}

            <div>
              <p className={`text-sm font-medium ${generationError
                  ? 'text-red-300'
                  : generationSuccess
                    ? currentJob?.status === 'completed_with_warnings'
                      ? 'text-yellow-300'
                      : 'text-green-300'
                    : 'text-blue-300'
                }`}>
                {generationError
                  ? 'Generation Failed'
                  : generationSuccess
                    ? currentJob?.status === 'completed_with_warnings'
                      ? 'Completed with Warnings'
                      : 'Generation Complete!'
                    : currentJob?.current_step || 'Generating code...'}
              </p>
              {generationError && (
                <p className="text-xs text-red-400/80 mt-0.5">{generationError}</p>
              )}
              {currentJob?.warnings && currentJob.warnings.length > 0 && (
                <p className="text-xs text-yellow-400/80 mt-0.5">
                  {currentJob.warnings[0]}
                </p>
              )}
              {currentJob?.result?.files_generated && (
                <p className="text-xs text-green-400/80 mt-0.5">
                  {currentJob.result.files_generated} files generated
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {generationSuccess && project?.github_repo_url && (
              <a
                href={project.github_repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-white text-stone-950 rounded-lg text-sm font-medium hover:bg-stone-100 transition-all"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </a>
            )}
            <button
              onClick={() => {
                setGenerationError(null);
                setGenerationSuccess(false);
                setCurrentJob(null);
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-stone-400" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 flex-shrink-0 overflow-hidden border-r border-stone-800/30">
          <ComponentLibrary />
        </aside>

        <main className="flex-1 overflow-hidden relative">
          <ReactFlowProvider>
            <ArchitectureCanvas />
          </ReactFlowProvider>

          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-stone-600">
            <kbd className="px-1.5 py-0.5 bg-stone-900 border border-stone-800 rounded">
              <Command className="w-3 h-3 inline" />
            </kbd>
            <span>+ K for commands</span>
          </div>
        </main>

        {aiPanelOpen && (
          <aside className="w-80 border-l border-stone-800/30 bg-stone-950 flex-shrink-0 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-stone-800/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">AI Assistant</h3>
                  <p className="text-xs text-stone-500">Ask for architecture help</p>
                </div>
              </div>
              <button
                onClick={() => setAiPanelOpen(false)}
                className="p-1.5 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div className="bg-stone-900/50 border border-stone-800/40 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-stone-300 leading-relaxed">
                        Welcome to Architex! I can help you design your system architecture. Try:
                      </p>
                      <ul className="mt-3 space-y-2">
                        <li className="text-xs text-stone-500 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-stone-600" />
                          Drag components from the left panel
                        </li>
                        <li className="text-xs text-stone-500 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-stone-600" />
                          Connect them by dragging handles
                        </li>
                        <li className="text-xs text-stone-500 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-stone-600" />
                          Ask me for suggestions or optimizations
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-800/30">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask AI for suggestions..."
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-900/50 border border-stone-800/40 rounded-xl text-white text-sm placeholder-stone-500 focus:outline-none focus:border-stone-700 pr-12"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-lg hover:bg-stone-100 transition-colors cursor-pointer">
                  <Send className="w-4 h-4 text-stone-950" />
                </button>
              </div>
            </div>
          </aside>
        )}

        {!aiPanelOpen && (
          <button
            onClick={() => setAiPanelOpen(true)}
            className="fixed bottom-6 right-6 p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-105 transition-all cursor-pointer"
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
