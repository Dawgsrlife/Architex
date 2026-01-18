"use client";

import { useEffect, useState, useCallback } from "react";
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
  AlertCircle
} from "lucide-react";
import ComponentLibrary from "@/components/canvas/ComponentLibrary";
import ArchitectureCanvas from "@/components/canvas/ArchitectureCanvas";
import { useArchitectureStore } from "@/stores/architecture-store";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Project } from "@/types/project";

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
  
  const { nodes, setProjectName: setStoreName, setProjectId, clearCanvas } = useArchitectureStore();

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

  const handleGenerate = () => {
    console.log("Generating code from architecture...");
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
            className="flex items-center gap-2 px-4 py-1.5 bg-white text-stone-950 rounded-full text-sm font-medium hover:bg-stone-100 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Generate</span>
          </button>
        </div>
      </header>

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
