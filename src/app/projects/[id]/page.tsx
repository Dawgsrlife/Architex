"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import { 
  ArrowLeft, 
  Save, 
  Share2,
  Download,
  Loader2,
  Command,
  Play
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
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-stone-50">
      <header className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-4 flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link 
            href="/projects" 
            className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Projects</span>
          </Link>

          <div className="h-5 w-px bg-stone-200" />

          <Link href="/" className="text-sm font-display font-bold tracking-tight text-stone-900">
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
              className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300"
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
            {nodes.length} nodes
          </span>
        </div>

        <div className="flex items-center gap-1">
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
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <div className="h-5 w-px bg-stone-200 mx-1" />

          <button 
            onClick={handleGenerate}
            className="flex items-center gap-2 px-4 py-1.5 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all active:scale-95"
          >
            <Play className="w-4 h-4" />
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
          
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-stone-400">
            <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-stone-500">
              <Command className="w-3 h-3 inline" />
            </kbd>
            <span>+ K for commands</span>
          </div>
        </main>
      </div>
    </div>
  );
}
