"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import { 
  ArrowLeft, 
  Save, 
  Share2,
  Download,
  Loader2,
  Undo2,
  Redo2,
  Github,
  Play,
  X,
  Check,
  ChevronRight,
  FolderGit2,
  FileCode2,
  Settings2
} from "lucide-react";
import ComponentLibrary from "@/components/canvas/ComponentLibrary";
import ArchitectureCanvas from "@/components/canvas/ArchitectureCanvas";
import { useArchitectureStore } from "@/stores/architecture-store";
import { useAuth } from "@/contexts/AuthContext";

export default function ProjectEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const projectId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [isEditingName, setIsEditingName] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  
  const { 
    nodes, 
    edges,
    setProjectName: setStoreName, 
    setProjectId, 
    clearCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
    pushHistory
  } = useArchitectureStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (projectId === "new") {
      clearCanvas();
      setProjectName("Untitled Project");
      setStoreName("Untitled Project");
      setProjectId(null);
      pushHistory();
    } else {
      setProjectId(projectId);
      setProjectName(`Project ${projectId}`);
      setStoreName(`Project ${projectId}`);
    }
    setLoading(false);
  }, [projectId, clearCanvas, setStoreName, setProjectId, pushHistory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const handleGenerate = async () => {
    if (!selectedRepo) return;
    
    setGenerating(true);
    setGenerationStep(1);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setGenerationStep(2);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGenerationStep(3);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setGenerationStep(4);
    
    setGenerating(false);
  };

  const generationSteps = [
    { label: "Analyzing architecture", icon: Settings2 },
    { label: "Generating code structure", icon: FileCode2 },
    { label: "Creating files", icon: FolderGit2 },
    { label: "Pushing to GitHub", icon: Github },
  ];

  if (authLoading || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-stone-50">
      <header className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-4 flex-shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <Link href="/dashboard" className="text-sm font-display font-bold tracking-tight text-stone-900">
            Architex
          </Link>

          <div className="h-5 w-px bg-stone-200" />

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
              className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-1 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300"
            />
          ) : (
            <button 
              onClick={() => setIsEditingName(true)}
              className="text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors"
            >
              {projectName}
            </button>
          )}

          <span className="text-xs text-stone-400 hidden sm:inline">
            {nodes.length} nodes · {edges.length} connections
          </span>
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden sm:flex items-center gap-1 mr-2">
            <button 
              onClick={undo}
              disabled={!canUndo()}
              className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-400"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button 
              onClick={redo}
              disabled={!canRedo()}
              className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-400"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="h-5 w-px bg-stone-200 hidden sm:block" />

          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Save</span>
          </button>

          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <div className="h-5 w-px bg-stone-200 mx-1" />

          <button 
            onClick={() => setGenerateModalOpen(true)}
            disabled={nodes.length === 0}
            className="flex items-center gap-2 px-4 py-1.5 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-stone-900"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">Generate</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 flex-shrink-0 overflow-hidden border-r border-stone-200 bg-white">
          <ComponentLibrary />
        </aside>

        <main className="flex-1 overflow-hidden relative bg-stone-100">
          <ReactFlowProvider>
            <ArchitectureCanvas />
          </ReactFlowProvider>
          
          <div className="absolute bottom-4 left-4 flex items-center gap-3 text-xs text-stone-400">
            <span className="flex items-center gap-1.5 px-2 py-1 bg-white border border-stone-200 rounded-lg">
              <kbd className="font-mono">⌘Z</kbd>
              <span>Undo</span>
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 bg-white border border-stone-200 rounded-lg">
              <kbd className="font-mono">⌘Y</kbd>
              <span>Redo</span>
            </span>
          </div>
        </main>
      </div>

      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => !generating && setGenerateModalOpen(false)} />
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="p-6 border-b border-stone-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                    <Github className="w-5 h-5 text-stone-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-stone-900">Generate to GitHub</h2>
                    <p className="text-sm text-stone-500">Push your architecture as code</p>
                  </div>
                </div>
                {!generating && (
                  <button 
                    onClick={() => setGenerateModalOpen(false)}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-stone-400" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {!generating ? (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Select Repository
                    </label>
                    <select
                      value={selectedRepo}
                      onChange={(e) => setSelectedRepo(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300"
                    >
                      <option value="">Choose a repository...</option>
                      <option value="my-app">my-app</option>
                      <option value="backend-api">backend-api</option>
                      <option value="new-project">new-project</option>
                    </select>
                  </div>

                  <div className="bg-stone-50 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-medium text-stone-900 mb-3">What will be generated:</h3>
                    <ul className="space-y-2 text-sm text-stone-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Project structure based on your architecture
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Docker configuration files
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Service boilerplate code
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Infrastructure as Code (Terraform)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        README and documentation
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={!selectedRepo}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-all disabled:opacity-50 disabled:hover:bg-stone-900"
                  >
                    <Play className="w-4 h-4" />
                    Generate & Push to GitHub
                  </button>
                </>
              ) : (
                <div className="py-4">
                  <div className="space-y-4">
                    {generationSteps.map((step, index) => {
                      const stepNum = index + 1;
                      const isActive = generationStep === stepNum;
                      const isComplete = generationStep > stepNum;
                      
                      return (
                        <div 
                          key={index}
                          className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                            isActive ? "bg-stone-100" : isComplete ? "bg-emerald-50" : "bg-stone-50"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isComplete ? "bg-emerald-500" : isActive ? "bg-stone-900" : "bg-stone-200"
                          }`}>
                            {isComplete ? (
                              <Check className="w-5 h-5 text-white" />
                            ) : isActive ? (
                              <Loader2 className="w-5 h-5 text-white animate-spin" />
                            ) : (
                              <step.icon className="w-5 h-5 text-stone-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              isComplete ? "text-emerald-700" : isActive ? "text-stone-900" : "text-stone-400"
                            }`}>
                              {step.label}
                            </p>
                          </div>
                          {isComplete && (
                            <Check className="w-5 h-5 text-emerald-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {generationStep === 4 && !generating && (
                    <div className="mt-6 p-4 bg-emerald-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-emerald-900">Successfully generated!</p>
                          <p className="text-sm text-emerald-700">Your code has been pushed to {selectedRepo}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setGenerateModalOpen(false);
                          setGenerationStep(0);
                        }}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all"
                      >
                        View on GitHub
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
