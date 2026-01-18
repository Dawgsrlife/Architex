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
  Send
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
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [aiMessage, setAiMessage] = useState("");
  
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
