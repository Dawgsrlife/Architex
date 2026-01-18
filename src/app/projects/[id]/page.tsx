"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import gsap from "gsap";
import { 
  ArrowLeft, 
  Save, 
  Share2,
  Download,
  Loader2,
  Menu,
  X,
  ChevronRight,
  Play,
  MessageSquare,
  Send
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
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

  useEffect(() => {
    if (!loading && headerRef.current) {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [loading]);

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
      <div className="h-screen w-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
          <p className="text-stone-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-stone-100 overflow-hidden">
      <header ref={headerRef} className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-4 flex-shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors p-2 -ml-2 rounded-lg hover:bg-stone-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[11px] tracking-widest uppercase font-medium hidden sm:inline">Back</span>
          </Link>

          <div className="h-4 w-px bg-stone-200" />

          <Link href="/" className="text-sm font-display font-bold tracking-tight text-stone-900">
            Architex
          </Link>

          <ChevronRight className="w-4 h-4 text-stone-300" />

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
              className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
            />
          ) : (
            <button 
              onClick={() => setIsEditingName(true)}
              className="text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors"
            >
              {projectName}
            </button>
          )}

          <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-1 rounded tracking-wider uppercase">
            {nodes.length} nodes
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="text-[11px] tracking-widest uppercase font-medium">Save</span>
          </button>

          <button className="flex items-center gap-2 px-3 py-2 text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-all">
            <Share2 className="w-4 h-4" />
            <span className="text-[11px] tracking-widest uppercase font-medium">Share</span>
          </button>

          <button className="flex items-center gap-2 px-3 py-2 text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-all">
            <Download className="w-4 h-4" />
            <span className="text-[11px] tracking-widest uppercase font-medium">Export</span>
          </button>

          <div className="h-4 w-px bg-stone-200 mx-2" />

          <button 
            onClick={handleGenerate}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-[11px] tracking-widest uppercase font-medium transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Generate
          </button>
        </div>

        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors"
        >
          {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {showMobileMenu && (
        <div className="md:hidden absolute top-14 left-0 right-0 z-40 bg-white border-b border-stone-200 p-4 space-y-2">
          <button onClick={handleSave} className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-lg">
            <Save className="w-5 h-5" />
            Save
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-lg">
            <Share2 className="w-5 h-5" />
            Share
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-lg">
            <Download className="w-5 h-5" />
            Export
          </button>
          <button onClick={handleGenerate} className="w-full flex items-center gap-3 px-4 py-3 bg-stone-900 text-white rounded-lg font-medium">
            <Play className="w-5 h-5" />
            Generate Code
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-60 flex-shrink-0 overflow-hidden bg-white border-r border-stone-200">
          <ComponentLibrary />
        </aside>

        <main className="flex-1 overflow-hidden relative bg-stone-100">
          <ReactFlowProvider>
            <ArchitectureCanvas />
          </ReactFlowProvider>
        </main>

        <aside className="w-72 bg-white border-l border-stone-200 flex-shrink-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-stone-400" />
              <h3 className="text-[11px] tracking-widest uppercase font-medium text-stone-500">Assistant</h3>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="bg-stone-50 rounded-lg p-4">
                <p className="text-sm text-stone-600 leading-relaxed">
                  Drag components from the sidebar onto the canvas to design your architecture. Connect them by dragging between handles.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-stone-400 tracking-widest uppercase font-medium">Suggestions</p>
                <div className="space-y-2">
                  <button className="w-full p-3 text-left text-sm text-stone-600 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                    Add a database
                  </button>
                  <button className="w-full p-3 text-left text-sm text-stone-600 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                    Connect to API
                  </button>
                  <button className="w-full p-3 text-left text-sm text-stone-600 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                    Add authentication
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-stone-100">
            <div className="relative">
              <input
                type="text"
                placeholder="Ask a question..."
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border-0 rounded-lg text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 pr-10 transition-all"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-stone-900 rounded-lg transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
