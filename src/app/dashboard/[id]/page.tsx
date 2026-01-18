"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import gsap from "gsap";
import { 
  ArrowLeft, 
  ArrowRight,
  Save, 
  Share2,
  Download,
  Loader2,
  Menu,
  X,
  Github,
  Undo2,
  Redo2,
  Check,
  Copy,
  Link2,
  Lock,
  Globe,
  MessageSquare,
  Sparkles,
  Mic,
  MicOff,
  ExternalLink,
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
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [isEditingName, setIsEditingName] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [rightPanel, setRightPanel] = useState<"guide" | "chat">("guide");
  const headerRef = useRef<HTMLElement>(null);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    
    if (projectId === "new") {
      clearCanvas();
      setProjectName("Untitled Project");
      setStoreName("Untitled Project");
      setProjectId(null);
    } else {
      setProjectId(projectId);
      const name = projectId.startsWith("new-") ? "Untitled Project" : `Project ${projectId}`;
      setProjectName(name);
      setStoreName(name);
    }
    pushHistory();
    setLoading(false);
  }, [projectId, authLoading, isAuthenticated, clearCanvas, setStoreName, setProjectId, pushHistory, router]);

  useEffect(() => {
    if (!loading && headerRef.current) {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [loading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo()) redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        if (canRedo()) redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setSaving(false);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  const handleExport = () => {
    const exportData = {
      name: projectName,
      nodes,
      edges,
      isPublic,
      githubUrl,
      deploymentUrl,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-architecture.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-stone-50 overflow-hidden">
      {showSaveToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-full text-sm shadow-xl">
            <Check className="w-4 h-4 text-emerald-400" />
            Project saved
          </div>
        </div>
      )}

        <header ref={headerRef} className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-4 flex-shrink-0 z-50">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors p-2 -ml-2 rounded-lg hover:bg-stone-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

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
          </div>

        <div className="hidden md:flex items-center gap-1">
          <button 
            onClick={() => canUndo() && undo()}
            disabled={!canUndo()}
            className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button 
            onClick={() => canRedo() && redo()}
            disabled={!canRedo()}
            className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-stone-200 mx-1" />

          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-all disabled:opacity-50"
            title="Save (Ctrl+S)"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </button>

          <button 
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-all"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-all"
            title="Export as JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-stone-200 mx-1" />

          <button 
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-[11px] tracking-widest uppercase font-medium transition-colors"
          >
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
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => canUndo() && undo()} disabled={!canUndo()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-lg disabled:opacity-30">
              <Undo2 className="w-5 h-5" />
              Undo
            </button>
            <button onClick={() => canRedo() && redo()} disabled={!canRedo()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-lg disabled:opacity-30">
              <Redo2 className="w-5 h-5" />
              Redo
            </button>
          </div>
          <button onClick={handleSave} className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-lg">
            <Save className="w-5 h-5" />
            Save
          </button>
          <button onClick={() => setShowShareModal(true)} className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-lg">
            <Share2 className="w-5 h-5" />
            Share
          </button>
          <button onClick={handleExport} className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-lg">
            <Download className="w-5 h-5" />
            Export
          </button>
          <button onClick={() => setShowGenerateModal(true)} className="w-full flex items-center gap-3 px-4 py-3 bg-stone-900 text-white rounded-lg font-medium">
            Generate Code
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 flex-shrink-0 overflow-hidden bg-white border-r border-stone-200">
          <ComponentLibrary />
        </aside>

        <main className="flex-1 overflow-hidden relative">
          <ReactFlowProvider>
            <ArchitectureCanvas />
          </ReactFlowProvider>
        </main>

        <aside className="w-80 bg-white border-l border-stone-200 flex-shrink-0 overflow-hidden flex flex-col">
          <div className="flex border-b border-stone-100">
            <button 
              onClick={() => setRightPanel("guide")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs tracking-widest uppercase font-medium transition-colors ${
                rightPanel === "guide" ? "text-stone-900 bg-white border-b-2 border-stone-900" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Guide
            </button>
            <button 
              onClick={() => setRightPanel("chat")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs tracking-widest uppercase font-medium transition-colors ${
                rightPanel === "chat" ? "text-stone-900 bg-white border-b-2 border-stone-900" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
          </div>

          {rightPanel === "guide" ? (
            <GuidePanel 
              isPublic={isPublic} 
              setIsPublic={setIsPublic}
              githubUrl={githubUrl}
              deploymentUrl={deploymentUrl}
              nodes={nodes}
              onGenerate={() => setShowGenerateModal(true)}
            />
          ) : (
            <ChatPanel />
          )}
        </aside>
      </div>

      {showGenerateModal && (
        <GenerateModal 
          onClose={() => setShowGenerateModal(false)} 
          projectName={projectName}
          nodeCount={nodes.length}
        />
      )}

      {showShareModal && (
        <ShareModal 
          onClose={() => setShowShareModal(false)}
          projectName={projectName}
          isPublic={isPublic}
          setIsPublic={setIsPublic}
        />
      )}
    </div>
  );
}

function GuidePanel({ isPublic, setIsPublic, githubUrl, deploymentUrl, nodes, onGenerate }: {
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
  githubUrl: string | null;
  deploymentUrl: string | null;
  nodes: any[];
  onGenerate: () => void;
}) {
  return (
    <>
      <div className="p-5 border-b border-stone-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-stone-900">Project Settings</h3>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] tracking-widest uppercase font-bold ${isPublic ? "text-emerald-500" : "text-stone-400"}`}>
              {isPublic ? "Public" : "Private"}
            </span>
            <button 
              onClick={() => setIsPublic(!isPublic)}
              className={`w-8 h-4 rounded-full relative transition-colors ${isPublic ? "bg-emerald-500" : "bg-stone-200"}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isPublic ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>
        </div>
        <p className="text-xs text-stone-400">Manage visibility and access</p>
      </div>

      {(githubUrl || deploymentUrl) && (
        <div className="p-5 border-b border-stone-100 bg-emerald-50/30">
          <h4 className="text-[10px] text-stone-400 tracking-widest uppercase font-medium mb-3">Live Links</h4>
          <div className="space-y-2">
            {githubUrl && (
              <a href={githubUrl} target="_blank" className="flex items-center gap-2 text-sm text-stone-900 hover:text-emerald-600 transition-colors">
                <Github className="w-4 h-4" />
                View Repository
              </a>
            )}
            {deploymentUrl && (
              <a href={deploymentUrl} target="_blank" className="flex items-center gap-2 text-sm text-stone-900 hover:text-emerald-600 transition-colors">
                <ExternalLink className="w-4 h-4" />
                Open Live App
              </a>
            )}
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">1</div>
            <div>
              <p className="text-sm font-medium text-stone-900">Design your architecture</p>
              <p className="text-xs text-stone-400 mt-0.5">Drag components and connect them</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">2</div>
            <div>
              <p className="text-sm font-medium text-stone-900">Generate code</p>
              <p className="text-xs text-stone-400 mt-0.5">Production-ready code for each component</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">3</div>
            <div>
              <p className="text-sm font-medium text-stone-900">Push to GitHub</p>
              <p className="text-xs text-stone-400 mt-0.5">New repository with complete structure</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">4</div>
            <div>
              <p className="text-sm font-medium text-stone-900">Deploy</p>
              <p className="text-xs text-stone-400 mt-0.5">Docker configs and CI/CD included</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-stone-50 rounded-lg">
            <p className="text-[10px] text-stone-400 tracking-widest uppercase font-medium mb-3">What you get</p>
            <div className="space-y-2">
              {["Complete source code", "Docker configurations", "API documentation", "CI/CD workflows", "Environment templates"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-stone-600">
                  <Check className="w-4 h-4 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-stone-100">
        <button 
          onClick={onGenerate}
          disabled={nodes.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {nodes.length === 0 ? "Add components to generate" : "Generate & Push to GitHub"}
        </button>
      </div>
    </>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState<{role: string; content: string}[]>([
    { role: "assistant", content: "Hi! I can help you design your architecture. Describe what you want to build and I'll suggest components and connections." }
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Mock AI response - backend dev will hook this up
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Based on your description, I'd recommend starting with a Next.js frontend connected to a FastAPI backend. You could add PostgreSQL for data persistence and Redis for caching. Would you like me to add these components to your canvas?" 
      }]);
      setIsLoading(false);
    }, 1500);
  };

  const toggleRecording = () => {
    // Mock voice input - ElevenLabs integration for backend dev
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setInput("I want to build a real-time chat application with user authentication");
      }, 2000);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
              msg.role === "user" 
                ? "bg-stone-900 text-white rounded-br-md" 
                : "bg-stone-100 text-stone-700 rounded-bl-md"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-stone-100">
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleRecording}
            className={`p-2.5 rounded-lg transition-colors ${
              isRecording ? "bg-red-500 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Describe your architecture..."
            className="flex-1 px-4 py-2.5 bg-stone-50 border-0 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

function GenerateModal({ onClose, projectName, nodeCount }: { 
  onClose: () => void; 
  projectName: string;
  nodeCount: number;
}) {
  const { isPublic, setIsPublic, setGithubUrl, setDeploymentUrl } = useArchitectureStore();
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [repoName, setRepoName] = useState(projectName.toLowerCase().replace(/\s+/g, '-'));

  const handleCreate = async () => {
    setIsGenerating(true);
    setStep(1);

    try {
      await new Promise(r => setTimeout(r, 3000));
      setStep(2);
      
      const githubUrl = `https://github.com/user/${repoName}`;
      const deploymentUrl = `https://${repoName}.vercel.app`;
      
      setGithubUrl(githubUrl);
      setDeploymentUrl(deploymentUrl);
      setIsGenerating(false);
    } catch (error) {
      console.error("Generation failed:", error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => !isGenerating && onClose()} />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="p-8 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-display font-medium text-stone-900">
              {step === 0 ? "Generate Project" : step === 1 ? "Building..." : "Success!"}
            </h2>
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900 rounded-full hover:bg-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-stone-400">
            {step === 0 ? `Create repository from ${nodeCount} components` : 
             step === 1 ? "Converting architecture to source code" : "Your project is ready"}
          </p>
        </div>

        <div className="p-8">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] tracking-widest uppercase text-stone-400 font-bold mb-3">
                  Repository Name
                </label>
                <div className="relative">
                  <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
                    placeholder="my-project"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] tracking-widest uppercase text-stone-400 font-bold mb-3">
                  Privacy
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 p-4 rounded-2xl border text-left transition-all ${
                      !isPublic ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-100 hover:border-stone-200'
                    }`}
                  >
                    <p className="font-bold text-xs uppercase tracking-widest mb-1">Private</p>
                    <p className="text-[10px] opacity-60">Only you</p>
                  </button>
                  <button
                    onClick={() => setIsPublic(true)}
                    className={`flex-1 p-4 rounded-2xl border text-left transition-all ${
                      isPublic ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-100 hover:border-stone-200'
                    }`}
                  >
                    <p className="font-bold text-xs uppercase tracking-widest mb-1">Public</p>
                    <p className="text-[10px] opacity-60">Community</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-stone-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-stone-900 rounded-full animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-stone-900 mb-2">Generating code...</h3>
              <p className="text-sm text-stone-400">This may take a moment</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <a 
                  href={`https://github.com/user/${repoName}`}
                  target="_blank"
                  className="flex flex-col items-center gap-3 p-6 bg-stone-50 rounded-2xl hover:bg-stone-100 transition-colors"
                >
                  <Github className="w-6 h-6 text-stone-900" />
                  <span className="text-[10px] tracking-widest uppercase font-bold text-stone-900">Repository</span>
                </a>
                <a 
                  href={`https://${repoName}.vercel.app`}
                  target="_blank"
                  className="flex flex-col items-center gap-3 p-6 bg-stone-900 rounded-2xl hover:bg-stone-800 transition-colors"
                >
                  <ExternalLink className="w-6 h-6 text-white" />
                  <span className="text-[10px] tracking-widest uppercase font-bold text-white">Live App</span>
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-stone-400 hover:text-stone-900 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-0"
          >
            Cancel
          </button>
          {step === 0 && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-[11px] tracking-widest uppercase font-bold transition-all"
            >
              Build Project
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {step === 2 && (
            <button onClick={onClose} className="px-6 py-2.5 bg-stone-900 text-white rounded-full text-[11px] tracking-widest uppercase font-bold">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ShareModal({ onClose, projectName, isPublic, setIsPublic }: {
  onClose: () => void;
  projectName: string;
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const shareLink = `https://architex.app/share/${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-medium text-stone-900">Share Project</h2>
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900 rounded-full hover:bg-stone-50 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
            <div className="flex items-center gap-3">
              {isPublic ? <Globe className="w-5 h-5 text-emerald-500" /> : <Lock className="w-5 h-5 text-stone-400" />}
              <div>
                <p className="text-sm font-medium text-stone-900">{isPublic ? "Public" : "Private"}</p>
                <p className="text-xs text-stone-400">{isPublic ? "Anyone with link can view" : "Only you can access"}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsPublic(!isPublic)}
              className={`w-10 h-5 rounded-full relative transition-colors ${isPublic ? "bg-emerald-500" : "bg-stone-200"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isPublic ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>

          {isPublic && (
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-stone-400 font-bold mb-2">
                Share Link
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-stone-50 rounded-xl">
                  <Link2 className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span className="text-sm text-stone-600 truncate">{shareLink}</span>
                </div>
                <button 
                  onClick={copyLink}
                  className="p-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-stone-50/50 border-t border-stone-100">
          <button onClick={onClose} className="w-full py-3 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
