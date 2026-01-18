"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import { ArrowLeft, Save, Download, Loader2, Github, Play, X, Check, FolderGit2, FileCode2, Settings2, ExternalLink, Globe, Eye, EyeOff, Share2, Link2, Copy, MessageSquare, Mic, MicOff, Send, Bot } from "lucide-react";
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
    if (isRecording) { setIsRecording(false); if (transcript) onTranscript(transcript); }
    else { setIsRecording(true); setTranscript(""); setTimeout(() => setTranscript("Create a microservices architecture with a React frontend, Node.js API gateway, three backend services for users, orders, and inventory, connected to PostgreSQL databases, with Redis caching and a message queue."), 2000); }
  };
  return (
    <div className="p-4 border-t border-stone-200">
      <div className="flex items-center gap-3 mb-3">
        <button onClick={toggleRecording} className={`p-3 rounded-full transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>{isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>
        <div className="flex-1"><p className="text-sm font-medium text-stone-900">{isRecording ? "Listening..." : "Voice Input"}</p><p className="text-xs text-stone-500">{isRecording ? "Speak your architecture" : "Click to describe"}</p></div>
      </div>
      {transcript && <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700">{transcript}</div>}
    </div>
  );
}

function ChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([{ role: "assistant", content: "Hi! Describe what you want to build and I'll suggest components." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages(m => [...m, { role: "user", content: input }]);
    setInput(""); setLoading(true);
    setTimeout(() => { setMessages(m => [...m, { role: "assistant", content: "Based on your description, I'd recommend a Next.js frontend connected to a Node.js API with PostgreSQL. Should I add these to your canvas?" }]); setLoading(false); }, 1500);
  };
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-stone-200 flex items-center justify-between"><div className="flex items-center gap-2"><Bot className="w-5 h-5 text-stone-600" /><span className="font-medium text-stone-900">AI</span></div><button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-lg transition-colors"><X className="w-4 h-4 text-stone-400" /></button></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">{messages.map((m, i) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${m.role === "user" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700"}`}>{m.content}</div></div>)}{loading && <div className="flex justify-start"><div className="px-3 py-2 bg-stone-100 rounded-xl"><Loader2 className="w-4 h-4 animate-spin text-stone-400" /></div></div>}</div>
      <VoiceInput onTranscript={setInput} />
      <div className="p-4 border-t border-stone-200"><div className="flex items-center gap-2"><input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Describe your architecture..." className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/5" /><button onClick={sendMessage} disabled={!input.trim()} className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-all disabled:opacity-50"><Send className="w-4 h-4" /></button></div></div>
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
        <div className="p-6 border-b border-stone-100"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Share2 className="w-5 h-5 text-stone-600" /><h2 className="text-lg font-medium text-stone-900">Share</h2></div><button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors"><X className="w-5 h-5 text-stone-400" /></button></div></div>
        <div className="p-6">
          <label className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors mb-6">
            <div className="flex items-center gap-3">{isPublic ? <Eye className="w-5 h-5 text-emerald-600" /> : <EyeOff className="w-5 h-5 text-stone-500" />}<div><p className="text-sm font-medium text-stone-900">{isPublic ? "Public" : "Private"}</p><p className="text-xs text-stone-500">{isPublic ? "Anyone with link can view" : "Only you"}</p></div></div>
            <button onClick={() => setIsPublic(!isPublic)} className={`relative w-12 h-6 rounded-full transition-colors ${isPublic ? "bg-emerald-500" : "bg-stone-200"}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? "left-7" : "left-1"}`} /></button>
          </label>
          {isPublic && <div className="mb-6"><div className="flex items-center gap-2"><div className="flex-1 flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"><Link2 className="w-4 h-4 text-stone-400" /><span className="text-sm text-stone-600 truncate">{shareLink}</span></div><button onClick={copyLink} className="flex items-center gap-2 px-3 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-all">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button></div></div>}
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
  const [projectName, setProjectName] = useState("Untitled");
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
    if (projectId === "new") { clearCanvas(); setProjectName("Untitled"); setStoreName("Untitled"); setProjectId(null); pushHistory(); }
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

  const handleSave = async () => { setSaving(true); await new Promise(r => setTimeout(r, 800)); setSaving(false); setToast("Saved"); };
  const handleExport = () => {
    const data = { projectName, nodes, edges, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click(); URL.revokeObjectURL(url); setToast("Exported");
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

  const generationSteps = [{ label: "Analyzing", icon: Settings2 }, { label: "Generating", icon: FileCode2 }, { label: "Creating files", icon: FolderGit2 }, { label: "Pushing to GitHub", icon: Github }, ...(deployToVercel ? [{ label: "Deploying", icon: Globe }] : [])];

  if (authLoading || loading) return <div className="h-screen w-screen flex items-center justify-center bg-white"><Loader2 className="w-5 h-5 text-stone-400 animate-spin" /></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="h-screen w-screen flex flex-col bg-stone-50">
      <header className="h-12 border-b border-stone-200 bg-white flex items-center justify-between px-4 flex-shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-stone-400 hover:text-stone-900 transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
          {isEditingName ? <input type="text" value={projectName} onChange={(e) => { setProjectName(e.target.value); setStoreName(e.target.value); }} onBlur={() => setIsEditingName(false)} onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)} autoFocus className="bg-stone-50 border border-stone-200 rounded px-2 py-0.5 text-stone-900 text-sm w-32 focus:outline-none" /> : <button onClick={() => setIsEditingName(true)} className="text-sm font-medium text-stone-900 hover:text-stone-600">{projectName}</button>}
          <button onClick={() => setIsPublic(!isPublic)} className={`px-2 py-0.5 rounded text-xs font-medium ${isPublic ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{isPublic ? "Public" : "Private"}</button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleSave} disabled={saving} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}</button>
          <button onClick={() => setShareModalOpen(true)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all"><Share2 className="w-4 h-4" /></button>
          <button onClick={handleExport} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all"><Download className="w-4 h-4" /></button>
          <button onClick={() => setRightPanel(rightPanel === "chat" ? null : "chat")} className={`p-2 rounded-lg transition-all ${rightPanel === "chat" ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-900 hover:bg-stone-100"}`}><MessageSquare className="w-4 h-4" /></button>
          <div className="h-4 w-px bg-stone-200 mx-1" />
          <button onClick={() => setGenerateModalOpen(true)} disabled={nodes.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-all disabled:opacity-50"><Github className="w-3.5 h-3.5" />Deploy</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-60 flex-shrink-0 overflow-hidden border-r border-stone-200 bg-white"><ComponentLibrary /></aside>
        <main className="flex-1 overflow-hidden relative bg-stone-100"><ReactFlowProvider><ArchitectureCanvas /></ReactFlowProvider></main>
        {rightPanel === "chat" && <aside className="w-72 flex-shrink-0 border-l border-stone-200 bg-white"><ChatPanel onClose={() => setRightPanel(null)} /></aside>}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {shareModalOpen && <ShareModal isPublic={isPublic} setIsPublic={setIsPublic} onClose={() => setShareModalOpen(false)} />}

      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => !generating && setGenerateModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-5 border-b border-stone-100"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Github className="w-5 h-5 text-stone-600" /><h2 className="text-lg font-medium text-stone-900">Deploy</h2></div>{!generating && <button onClick={() => { setGenerateModalOpen(false); setGenerationStep(0); setGeneratedLinks(null); }} className="p-1 hover:bg-stone-100 rounded-lg"><X className="w-5 h-5 text-stone-400" /></button>}</div></div>
            <div className="p-5">
              {!generating && !generatedLinks ? (
                <>
                  <div className="mb-5"><label className="block text-sm font-medium text-stone-700 mb-2">Repository</label><select value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 text-sm focus:outline-none"><option value="">Select repository...</option><option value="my-app">my-app</option><option value="new-project">+ New repository</option></select></div>
                  <label className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg cursor-pointer mb-5">
                    <div className="flex items-center gap-2"><div className="w-8 h-8 rounded bg-black flex items-center justify-center"><svg className="w-4 h-4 text-white" viewBox="0 0 76 76" fill="currentColor"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" /></svg></div><span className="text-sm text-stone-900">Vercel</span></div>
                    <button onClick={() => setDeployToVercel(!deployToVercel)} className={`relative w-10 h-5 rounded-full transition-colors ${deployToVercel ? "bg-stone-900" : "bg-stone-200"}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${deployToVercel ? "left-5" : "left-0.5"}`} /></button>
                  </label>
                  <button onClick={handleGenerate} disabled={!selectedRepo} className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50"><Play className="w-4 h-4 inline mr-2" />Deploy</button>
                </>
              ) : generating ? (
                <div className="space-y-2">{generationSteps.map((step, i) => { const isActive = generationStep === i + 1; const isComplete = generationStep > i + 1; return (<div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg ${isActive ? "bg-stone-100" : isComplete ? "bg-emerald-50" : "bg-stone-50"}`}><div className={`w-6 h-6 rounded-full flex items-center justify-center ${isComplete ? "bg-emerald-500" : isActive ? "bg-stone-900" : "bg-stone-200"}`}>{isComplete ? <Check className="w-3 h-3 text-white" /> : isActive ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <step.icon className="w-3 h-3 text-stone-400" />}</div><span className={`text-sm ${isComplete ? "text-emerald-700" : isActive ? "text-stone-900" : "text-stone-400"}`}>{step.label}</span></div>); })}</div>
              ) : generatedLinks && (
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center"><Check className="w-6 h-6 text-emerald-600" /></div>
                  <h3 className="font-medium text-stone-900 mb-4">Deployed!</h3>
                  <div className="space-y-2 mb-4">
                    <a href={generatedLinks.github} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100"><div className="flex items-center gap-2"><Github className="w-4 h-4" /><span className="text-sm">GitHub</span></div><ExternalLink className="w-3 h-3 text-stone-400" /></a>
                    {generatedLinks.vercel && <a href={generatedLinks.vercel} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100"><div className="flex items-center gap-2"><Globe className="w-4 h-4" /><span className="text-sm">Live</span></div><ExternalLink className="w-3 h-3 text-stone-400" /></a>}
                  </div>
                  <button onClick={() => { setGenerateModalOpen(false); setGenerationStep(0); setGeneratedLinks(null); }} className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium">Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}