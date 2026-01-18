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
  Settings, 
  Share2,
  Download,
  MoreHorizontal,
  Loader2
} from "lucide-react";
import ComponentLibrary from "@/components/canvas/ComponentLibrary";
import ArchitectureCanvas from "@/components/canvas/ArchitectureCanvas";
import { useArchitectureStore } from "@/stores/architecture-store";

export default function ProjectEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [isEditingName, setIsEditingName] = useState(false);
  
  const { nodes, setProjectName: setStoreName, setProjectId, clearCanvas } = useArchitectureStore();

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

  const handleGenerate = () => {
    console.log("Generating code from architecture...");
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-950">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-stone-950">
      <header className="h-14 border-b border-stone-800/50 bg-stone-950/80 backdrop-blur-xl flex items-center justify-between px-4 flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Back</span>
          </Link>

          <div className="h-5 w-px bg-stone-800" />

          <Link href="/" className="text-sm font-display font-bold tracking-tight text-white">
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
              className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-stone-600"
            />
          ) : (
            <button 
              onClick={() => setIsEditingName(true)}
              className="text-sm font-medium text-white hover:text-stone-300 transition-colors"
            >
              {projectName}
            </button>
          )}

          <span className="text-xs text-stone-600">
            {nodes.length} nodes
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Save</span>
          </button>

          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <div className="h-5 w-px bg-stone-800 mx-1" />

          <button 
            onClick={handleGenerate}
            className="flex items-center gap-2 px-4 py-1.5 bg-white text-stone-950 rounded-lg text-sm font-medium hover:bg-stone-100 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Generate</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 flex-shrink-0 overflow-hidden">
          <ComponentLibrary />
        </aside>

        <main className="flex-1 overflow-hidden">
          <ReactFlowProvider>
            <ArchitectureCanvas />
          </ReactFlowProvider>
        </main>

        <aside className="w-72 border-l border-stone-800/50 bg-stone-950 flex-shrink-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-800/50">
            <h3 className="text-sm font-semibold text-white mb-1">AI Assistant</h3>
            <p className="text-xs text-stone-500">Ask for help designing your architecture</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="bg-stone-900/50 border border-stone-800/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-stone-300">
                      Welcome! I can help you design your system architecture. Try dragging components from the left panel onto the canvas.
                    </p>
                    <p className="text-xs text-stone-500 mt-2">
                      Tip: Connect components by dragging from one handle to another.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-stone-800/50">
            <div className="relative">
              <input
                type="text"
                placeholder="Ask AI for suggestions..."
                className="w-full px-4 py-3 bg-stone-900 border border-stone-800 rounded-xl text-white text-sm placeholder-stone-500 focus:outline-none focus:border-stone-700 pr-12"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-lg hover:bg-stone-100 transition-colors">
                <Play className="w-4 h-4 text-stone-950" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
