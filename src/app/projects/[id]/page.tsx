"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Sparkles, 
  Share2,
  Download,
  Loader2,
  Command,
  MessageSquare,
  X,
  Send,
  FileText,
  Rocket,
  FolderTree
} from "lucide-react";
import ComponentLibrary from "@/components/canvas/ComponentLibrary";
import ArchitectureCanvas from "@/components/canvas/ArchitectureCanvas";
import CriticStatus from "@/components/canvas/CriticStatus";
import ProvenanceMapping from "@/components/canvas/ProvenanceMapping";
import { useArchitectureStore } from "@/stores/architecture-store";

export default function ProjectEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [isEditingName, setIsEditingName] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [aiMessage, setAiMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);
  
  const { 
    nodes, 
    edges,
    prompt,
    setPrompt,
    criticResult,
    isCriticLoading,
    runCritic,
    setProjectName: setStoreName, 
    setProjectId, 
    clearCanvas 
  } = useArchitectureStore();

  // Run critic when architecture changes (debounced)
  useEffect(() => {
    if (nodes.length === 0) return;
    
    const timer = setTimeout(() => {
      runCritic();
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timer);
  }, [nodes.length, edges.length, prompt]);
  
  // Check if generation is blocked
  const isBlocked = criticResult?.blocking === true;
  const canGenerate = nodes.length > 0 && prompt.trim().length > 0 && !isBlocked && !isCriticLoading;

  useEffect(() => {
    if (projectId === "new") {
      clearCanvas();
      setProjectName("Untitled Project");
      setStoreName("Untitled Project");
      setProjectId(null);
    } else {
      setProjectId(projectId);
      setProjectName(`Project ${projectId}`);
      setStoreName(`Project ${projectId}`);
    }
    setLoading(false);
  }, [projectId, clearCanvas, setStoreName, setProjectId]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    
    setIsGenerating(true);
    
    try {
      const architectureSpec = {
        name: projectName,
        description: prompt,
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type,
          data: n.data
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target
        })),
        metadata: {
          intent: prompt
        }
      };

      const response = await fetch("http://localhost:8000/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          architecture_spec: architectureSpec,
          project_id: projectId !== "new" ? projectId : null
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start generation");
      }

      const data = await response.json();
      console.log("Job started:", data.job_id);
      // TODO: Navigate to job progress page or show modal
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-950">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
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
        </div>

        <div className="flex items-center gap-1">
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
            disabled={!canGenerate || isGenerating}
            title={isBlocked ? "Fix architecture issues before generating" : !prompt.trim() ? "Add a project description first" : ""}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              isBlocked 
                ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                : canGenerate 
                  ? "bg-white text-stone-950 hover:bg-stone-100"
                  : "bg-stone-700 text-stone-400"
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : isBlocked ? (
              <>
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Blocked</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                <span className="hidden sm:inline">Generate</span>
              </>
            )}
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">Project Intent</h3>
                  <p className="text-xs text-stone-500">Describe what you&apos;re building</p>
                </div>
              </div>
              <button 
                onClick={() => setAiPanelOpen(false)}
                className="p-1.5 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Intent/Prompt Input */}
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-2">
                  What are you building?
                </label>
                <textarea
                  placeholder="e.g., A SaaS dashboard for managing user subscriptions with authentication, billing integration, and analytics..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-stone-900/50 border border-stone-800/40 rounded-xl text-white text-sm placeholder-stone-600 focus:outline-none focus:border-stone-600 resize-none"
                />
                <p className="text-xs text-stone-600 mt-1.5">
                  Be specific about features, user types, and integrations
                </p>
              </div>

              {/* Critic Status */}
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-2">
                  Architecture Validation
                </label>
                <CriticStatus />
              </div>

              {/* Quick Tips */}
              <div className="bg-stone-900/30 border border-stone-800/30 rounded-xl p-4">
                <h4 className="text-xs font-medium text-stone-300 mb-2">Quick Tips</h4>
                <ul className="space-y-2">
                  <li className="text-xs text-stone-500 flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                    Add an Auth component for user management
                  </li>
                  <li className="text-xs text-stone-500 flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    Connect your Frontend to Backend with edges
                  </li>
                  <li className="text-xs text-stone-500 flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                    Include a Database for persistent data
                  </li>
                </ul>
              </div>

              {/* Architecture Summary */}
              {nodes.length > 0 && (
                <div className="bg-stone-900/30 border border-stone-800/30 rounded-xl p-4">
                  <h4 className="text-xs font-medium text-stone-300 mb-2">Current Architecture</h4>
                  <div className="space-y-1">
                    {nodes.slice(0, 5).map((node) => (
                      <div key={node.id} className="flex items-center gap-2 text-xs text-stone-400">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: node.data.color || "#6b7280" }}
                        />
                        {node.data.label}
                      </div>
                    ))}
                    {nodes.length > 5 && (
                      <p className="text-xs text-stone-600">+{nodes.length - 5} more components</p>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 mt-2">
                    {edges.length} connection{edges.length !== 1 ? "s" : ""}
                  </p>
                  
                  {/* Preview Provenance Button */}
                  <button
                    onClick={() => setShowProvenance(!showProvenance)}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-stone-400 hover:text-stone-200 bg-stone-800/50 hover:bg-stone-800 rounded-lg transition-colors"
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    {showProvenance ? "Hide File Preview" : "Preview Generated Files"}
                  </button>
                </div>
              )}

              {/* Provenance Mapping */}
              {showProvenance && nodes.length > 0 && prompt.trim() && (
                <ProvenanceMapping
                  architectureSpec={{
                    name: projectName,
                    description: prompt,
                    nodes: nodes.map(n => ({
                      id: n.id,
                      data: { label: n.data.label, color: n.data.color }
                    })),
                    edges: edges.map(e => ({
                      id: e.id,
                      source: e.source,
                      target: e.target
                    })),
                    metadata: { intent: prompt }
                  }}
                />
              )}
            </div>

            {/* Generate Section */}
            <div className="p-4 border-t border-stone-800/30 space-y-3">
              {!canGenerate && (
                <div className="text-xs text-stone-500 text-center">
                  {nodes.length === 0 && "Add components to your architecture"}
                  {nodes.length > 0 && !prompt.trim() && "Describe what you're building above"}
                  {nodes.length > 0 && prompt.trim() && isBlocked && "Fix the blocking issues above"}
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  canGenerate 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/20"
                    : "bg-stone-800 text-stone-500 cursor-not-allowed"
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Code...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Generate Project
                  </>
                )}
              </button>
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
