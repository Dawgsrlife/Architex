"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import { ArrowLeft, Save, Download, Loader2, Undo2, Redo2, Github, Play, X, Check, FolderGit2, FileCode2, Settings2, ExternalLink, Globe, Eye, EyeOff, Share2, Link2, Copy, MessageSquare, Mic, MicOff, Send, Bot, ChevronRight } from "lucide-react";
import ComponentLibrary from "@/components/canvas/ComponentLibrary";
import ArchitectureCanvas from "@/components/canvas/ArchitectureCanvas";
import { useArchitectureStore } from "@/stores/architecture-store";
import { useAuth } from "@/contexts/AuthContext";

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-stone-900 text-white rounded-xl shadow-lg"><Check className="w-4 h-4 text-emerald-400" /><span className="text-sm">{message}</span></div>;
}

function VoiceInput({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      if (transcript) onTranscript(transcript);
    } else {
      setIsRecording(true);
      setTranscript("");
      setTimeout(() => { setTranscript("Create a microservices architecture with a React frontend, Node.js API gateway, three backend services for users, orders, and inventory, connected to PostgreSQL databases, with Redis caching and a message queue."); }, 2000);
    }
  };

  return (
    <div className="p-4 border-t border-stone-200">
      <div className="flex items-center gap-3 mb-3">
        <button onClick={toggleRecording} className={`p-3 rounded-full transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>{isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>
        <div className="flex-1"><p className="text-sm font-medium text-stone-900">{isRecording ? "Listening..." : "Voice Input"}</p><p className="text-xs text-stone-500">{isRecording ? "Speak your architecture description" : "Click to describe your architecture"}</p></div>
      </div>
      {transcript && <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700">{transcript}</div>}
    </div>
  );
}

function ChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([{ role: "assistant", content: "Hi! I can help you design your architecture. Describe what you want to build and I'll suggest components and connections." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages(m => [...m, { role: "assistant", content: "Based on your description, I'd recommend starting with a Next.js frontend connected to a Node.js API. For data storage, PostgreSQL would work well. You might also want to add Redis for caching frequently accessed data. Should I add these components to your canvas?" }]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-2"><Bot className="w-5 h-5 text-stone-600" /><span className="font-medium text-stone-900">AI Assistant</span></div>
        <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-lg transition-colors"><X className="w-4 h-4 text-stone-400" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${m.role === "user" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700"}`}>{m.content}</div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="px-3 py-2 bg-stone-100 rounded-xl"><Loader2 className="w-4 h-4 animate-spin text-stone-400" /></div></div>}
      </div>
      <VoiceInput onTranscript={(text) => { setInput(text); }} />
      <div className="p-4 border-t border-stone-200">
        <div className="flex items-center gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Describe your architecture..." className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/5" />
          <button onClick={sendMessage} disabled={!input.trim()} className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-all disabled:opacity-50"><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}

function ShareModal({ isPublic, setIsPublic, onClose }: { isPublic: boolean; setIsPublic: (v: boolean) => void; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const shareLink = "https://architex.app/share/abc123xyz";
  const copyLink = () => { navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center"><Share2 className="w-5 h-5 text-stone-600" /></div><div><h2 className="text-lg font-medium text-stone-900">Share Project</h2><p className="text-sm text-stone-500">Collaborate or showcase your work</p></div></div>
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors"><X className="w-5 h-5 text-stone-400" /></button>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <label className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors">
              <div className="flex items-center gap-3">{isPublic ? <Eye className="w-5 h-5 text-emerald-600" /> : <EyeOff className="w-5 h-5 text-stone-500" />}<div><p className="text-sm font-medium text-stone-900">{isPublic ? "Public" : "Private"}</p><p className="text-xs text-stone-500">{isPublic ? "Anyone with the link can view" : "Only you can access"}</p></div></div>
              <button onClick={() => setIsPublic(!isPublic)} className={`relative w-12 h-6 rounded-full transition-colors ${isPublic ? "bg-emerald-500" : "bg-stone-200"}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? "left-7" : "left-1"}`} /></button>
            </label>
          </div>
          {isPublic && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">Share Link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"><Link2 className="w-4 h-4 text-stone-400" /><span className="text-sm text-stone-600 truncate">{shareLink}</span></div>
                <button onClick={copyLink} className="flex items-center gap-2 px-3 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-all">{copied ? <><Check className="w-4 h-4" />Copied</> : <><Copy className="w-4 h-4" />Copy</>}</button>
              </div>
            </div>
          )}
          <button onClick={onClose} className="w-full px-4 py-3 bg-stone-100 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-200 transition-all">Done</button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const projectId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [isEditingName, setIsEditingName] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [isPublic, setIsPublic] = useState(false);
  const [deployToVercel, setDeployToVercel] = useState(true);
  const [generatedLinks, setGeneratedLinks] = useState<{github?: string; vercel?: string} | null>(null);
  const [rightPanel, setRightPanel] = useState<"chat" | null>(null);
  
  const { nodes, edges, setProjectName: setStoreName, setProjectId, clearCanvas, undo, redo, canUndo, canRedo, pushHistory } = useArchitectureStore();

  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace("/login"); }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (projectId === "new") { clearCanvas(); setProjectName("Untitled Project"); setStoreName("Untitled Project"); setProjectId(null); pushHistory(); }
    else { setProjectId(projectId); setProjectName(`Project ${projectId}`); setStoreName(`Project ${projectId}`); }
    setLoading(false);
  }, [projectId, clearCanvas, setStoreName, setProjectId, pushHistory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const handleSave = async () => { setSaving(true); await new Promise(r => setTimeout(r, 800)); setSaving(false); setToast("Project saved"); };

  const handleExport = () => {
    const data = { projectName, nodes, edges, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click(); URL.revokeObjectURL(url);
    setToast("Project exported");
  };

  const handleGenerate = async () => {
    if (!selectedRepo) return;
    setGenerating(true); setGeneratedLinks(null); setGenerationStep(1);
    await new Promise(r => setTimeout(r, 1500)); setGenerationStep(2);
    await new Promise(r => setTimeout(r, 2000)); setGenerationStep(3);
    await new Promise(r => setTimeout(r, 1500)); setGenerationStep(4);
    if (deployToVercel) { await new Promise(r => setTimeout(r, 2000)); setGenerationStep(5); await new Promise(r => setTimeout(r, 1500)); setGenerationStep(6); }
    setGeneratedLinks({ github: `https://github.com/user/${selectedRepo}`, vercel: deployToVercel ? `https://${selectedRepo}.vercel.app` : undefined });
    setGenerating(false);
  };

  const generationSteps = [{ label: "Analyzing architecture", icon: Settings2 }, { label: "Generating code structure", icon: FileCode2 }, { label: "Creating files", icon: FolderGit2 }, { label: "Pushing to GitHub", icon: Github }, ...(deployToVercel ? [{ label: "Connecting to Vercel", icon: Globe }, { label: "Deploying application", icon: Globe }] : [])];

  if (authLoading || loading) return <div className="h-screen w-screen flex items-center justify-center bg-white"><Loader2 className="w-5 h-5 text-stone-400 animate-spin" /></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="h-screen w-screen flex flex-col bg-stone-50">
      <header className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-4 flex-shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
          <Link href="/dashboard" className="text-sm font-display font-bold tracking-tight text-stone-900">Architex</Link>
          <div className="h-5 w-px bg-stone-200" />
          {isEditingName ? <input type="text" value={projectName} onChange={(e) => { setProjectName(e.target.value); setStoreName(e.target.value); }} onBlur={() => setIsEditingName(false)} onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)} autoFocus className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-1 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300" /> : <button onClick={() => setIsEditingName(true)} className="text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors">{projectName}</button>}
          <button onClick={() => setIsPublic(!isPublic)} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${isPublic ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`} title={isPublic ? "Public project" : "Private project"}>{isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}{isPublic ? "Public" : "Private"}</button>
          <span className="text-xs text-stone-400 hidden sm:inline">{nodes.length} nodes · {edges.length} connections</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="hidden sm:flex items-center gap-1 mr-2">
            <button onClick={undo} disabled={!canUndo()} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all disabled:opacity-30" title="Undo (Ctrl+Z)"><Undo2 className="w-4 h-4" /></button>
            <button onClick={redo} disabled={!canRedo()} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all disabled:opacity-30" title="Redo (Ctrl+Y)"><Redo2 className="w-4 h-4" /></button>
          </div>
          <div className="h-5 w-px bg-stone-200 hidden sm:block" />
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}<span className="hidden sm:inline">Save</span></button>
          <button onClick={() => setShareModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all"><Share2 className="w-4 h-4" /><span className="hidden sm:inline">Share</span></button>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all"><Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span></button>
          <button onClick={() => setRightPanel(rightPanel === "chat" ? null : "chat")} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${rightPanel === "chat" ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"}`}><MessageSquare className="w-4 h-4" /><span className="hidden sm:inline">AI</span></button>
          <div className="h-5 w-px bg-stone-200 mx-1" />
          <button onClick={() => setGenerateModalOpen(true)} disabled={nodes.length === 0} className="flex items-center gap-2 px-4 py-1.5 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-stone-900"><Github className="w-4 h-4" /><span className="hidden sm:inline">Deploy</span></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 flex-shrink-0 overflow-hidden border-r border-stone-200 bg-white"><ComponentLibrary /></aside>
        <main className="flex-1 overflow-hidden relative bg-stone-100">
          <ReactFlowProvider><ArchitectureCanvas /></ReactFlowProvider>
          <div className="absolute bottom-4 left-4 flex items-center gap-3 text-xs text-stone-400">
            <span className="flex items-center gap-1.5 px-2 py-1 bg-white border border-stone-200 rounded-lg"><kbd className="font-mono">⌘Z</kbd><span>Undo</span></span>
            <span className="flex items-center gap-1.5 px-2 py-1 bg-white border border-stone-200 rounded-lg"><kbd className="font-mono">⌘Y</kbd><span>Redo</span></span>
          </div>
        </main>
        {rightPanel === "chat" && <aside className="w-80 flex-shrink-0 border-l border-stone-200 bg-white"><ChatPanel onClose={() => setRightPanel(null)} /></aside>}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {shareModalOpen && <ShareModal isPublic={isPublic} setIsPublic={setIsPublic} onClose={() => setShareModalOpen(false)} />}

      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => !generating && setGenerateModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center"><Github className="w-5 h-5 text-stone-600" /></div><div><h2 className="text-lg font-medium text-stone-900">Deploy Project</h2><p className="text-sm text-stone-500">Generate code & deploy to production</p></div></div>
                {!generating && <button onClick={() => { setGenerateModalOpen(false); setGenerationStep(0); setGeneratedLinks(null); }} className="p-2 hover:bg-stone-100 rounded-lg transition-colors"><X className="w-5 h-5 text-stone-400" /></button>}
              </div>
            </div>
            <div className="p-6">
              {!generating && !generatedLinks ? (
                <>
                  <div className="mb-6"><label className="block text-sm font-medium text-stone-700 mb-2">GitHub Repository</label><select value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300"><option value="">Choose or create a repository...</option><option value="my-app">my-app</option><option value="backend-api">backend-api</option><option value="new-project">+ Create new repository</option></select></div>
                  <div className="mb-6">
                    <label className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors">
                      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center"><svg className="w-5 h-5 text-white" viewBox="0 0 76 76" fill="currentColor"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" /></svg></div><div><p className="text-sm font-medium text-stone-900">Deploy to Vercel</p><p className="text-xs text-stone-500">Auto-deploy with preview URLs</p></div></div>
                      <button onClick={() => setDeployToVercel(!deployToVercel)} className={`relative w-12 h-6 rounded-full transition-colors ${deployToVercel ? "bg-stone-900" : "bg-stone-200"}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${deployToVercel ? "left-7" : "left-1"}`} /></button>
                    </label>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4 mb-6"><h3 className="text-sm font-medium text-stone-900 mb-3">What will be generated:</h3><ul className="space-y-2 text-sm text-stone-600">{["Complete project structure from your architecture", "Docker & infrastructure configuration", "Service boilerplate with API endpoints", "Environment variables & secrets setup", ...(deployToVercel ? ["Live deployment with custom domain"] : [])].map((item, i) => <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />{item}</li>)}</ul></div>
                  <button onClick={handleGenerate} disabled={!selectedRepo} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-all disabled:opacity-50 disabled:hover:bg-stone-900"><Play className="w-4 h-4" />Generate & Deploy</button>
                </>
              ) : generating ? (
                <div className="py-4"><div className="space-y-3">{generationSteps.map((step, index) => { const stepNum = index + 1; const isActive = generationStep === stepNum; const isComplete = generationStep > stepNum; return (<div key={index} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isActive ? "bg-stone-100" : isComplete ? "bg-emerald-50" : "bg-stone-50"}`}><div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isComplete ? "bg-emerald-500" : isActive ? "bg-stone-900" : "bg-stone-200"}`}>{isComplete ? <Check className="w-4 h-4 text-white" /> : isActive ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <step.icon className="w-4 h-4 text-stone-400" />}</div><div className="flex-1"><p className={`text-sm font-medium ${isComplete ? "text-emerald-700" : isActive ? "text-stone-900" : "text-stone-400"}`}>{step.label}</p></div></div>); })}</div></div>
              ) : generatedLinks && (
                <div className="py-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center"><Check className="w-8 h-8 text-emerald-600" /></div>
                  <h3 className="text-lg font-medium text-stone-900 text-center mb-2">Deployment Complete!</h3>
                  <p className="text-sm text-stone-500 text-center mb-6">Your project is live and ready to use</p>
                  <div className="space-y-3 mb-6">
                    <a href={generatedLinks.github} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl hover:bg-stone-100 transition-colors group"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-stone-900 flex items-center justify-center"><Github className="w-5 h-5 text-white" /></div><div><p className="text-sm font-medium text-stone-900">GitHub Repository</p><p className="text-xs text-stone-500">{generatedLinks.github}</p></div></div><ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-stone-600" /></a>
                    {generatedLinks.vercel && <a href={generatedLinks.vercel} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl hover:bg-stone-100 transition-colors group"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center"><svg className="w-5 h-5 text-white" viewBox="0 0 76 76" fill="currentColor"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" /></svg></div><div><p className="text-sm font-medium text-stone-900">Live Deployment</p><p className="text-xs text-stone-500">{generatedLinks.vercel}</p></div></div><ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-stone-600" /></a>}
                  </div>
                  <button onClick={() => { setGenerateModalOpen(false); setGenerationStep(0); setGeneratedLinks(null); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-all">Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}