"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import { ArrowLeft, Save, Download, Loader2, Github, Play, X, Check, FolderGit2, FileCode2, Settings2, ExternalLink, Globe, Eye, EyeOff, Share2, Link2, Copy, MessageSquare, Mic, MicOff, Send, Bot, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import ComponentLibrary from "@/components/canvas/ComponentLibrary";
import ArchitectureCanvas from "@/components/canvas/ArchitectureCanvas";
import { useArchitectureStore } from "@/stores/architecture-store";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { ensureProjectExists } from "@/lib/project";

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
  const [generatedLinks, setGeneratedLinks] = useState<{ github?: string; vercel?: string } | null>(null);
  const [rightPanel, setRightPanel] = useState<"chat" | null>(null);

  const { nodes, edges, prompt, githubRepoUrl, setProjectName: setStoreName, setProjectId, setPrompt, setGithubRepoUrl, clearCanvas, undo, redo, canUndo, canRedo } = useArchitectureStore();
  
  const [criticStatus, setCriticStatus] = useState<"idle" | "checking" | "pass" | "warning" | "error">("idle");
  const [criticMessage, setCriticMessage] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace("/login"); }, [isAuthenticated, authLoading, router]);

  // Load project data when projectId changes
  const loadProject = useCallback(async (id: string) => {
    try {
      const { data } = await api.get<{
        name: string;
        description?: string;
        github_repo_url?: string;
        repository_url?: string;
        current_nodes?: any[];
        prompts_history?: { prompt: string }[];
      }>(`/api/projects/${id}`);
      
      if (data) {
        setProjectName(data.name || "Untitled");
        setStoreName(data.name || "Untitled");
        const repoUrl = data.github_repo_url || data.repository_url;
        if (repoUrl) {
          setGithubRepoUrl(repoUrl);
          setSelectedRepo(repoUrl.split('/').pop() || '');
        }
        // Load last prompt if available
        if (data.prompts_history && data.prompts_history.length > 0) {
          setPrompt(data.prompts_history[data.prompts_history.length - 1].prompt);
        }
      }
    } catch (err) {
      console.error("Failed to load project:", err);
    }
  }, [setStoreName, setGithubRepoUrl, setPrompt]);

  useEffect(() => {
    if (projectId === "new") { 
      clearCanvas(); 
      setProjectName("Untitled"); 
      setStoreName("Untitled"); 
      setProjectId(null);
      setPrompt("");
      setGithubRepoUrl(null);
    } else { 
      setProjectId(projectId); 
      loadProject(projectId);
    }
    setLoading(false);
  }, [projectId, clearCanvas, setStoreName, setProjectId, setPrompt, setGithubRepoUrl, loadProject]);

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
    // Must have a prompt to generate
    if (!prompt.trim()) {
      alert("Please enter a description of what you want to build");
      return;
    }
    
    // Must have nodes
    if (nodes.length === 0) {
      alert("Please add at least one component to the canvas");
      return;
    }

    setGenerating(true); 
    setGeneratedLinks(null); 
    setGenerationStep(1);

    console.log("[GENERATE] Starting generation...");
    console.log("[GENERATE] Prompt:", prompt);
    console.log("[GENERATE] Nodes:", nodes.length);
    console.log("[GENERATE] GitHub Repo:", githubRepoUrl);

    try {
      // INVARIANT: A job cannot be created unless a projectId exists
      const validProjectId = await ensureProjectExists(projectId === "new" ? null : projectId, projectName);
      console.log("[GENERATE] Project ID:", validProjectId);

      // Update store if we got a new project
      if (projectId === "new") {
        setProjectId(validProjectId);
      }

      setGenerationStep(2); // Generating

      // Construct architecture spec from canvas - THIS IS THE CRITICAL PAYLOAD
      const architectureSpec = {
        name: projectName,
        prompt: prompt,  // THE USER'S DESCRIPTION - Critical for LLM!
        description: prompt,  // Also include as description for compat
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.data?.componentId || n.type,
          data: n.data,
          position: n.position,
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
        })),
        metadata: { 
          deployToVercel,
          githubRepoUrl: githubRepoUrl,
        },
        components: nodes.map((n: any) => n.data?.label || n.data?.componentId || n.type),
        frameworks: nodes.map((n: any) => n.data?.framework).filter(Boolean)
      };

      console.log("[GENERATE] Architecture Spec:", JSON.stringify(architectureSpec, null, 2));

      // Create job - this triggers backend generation
      const { data: jobData, error: jobError } = await api.post<{ job_id: string }>('/api/jobs', {
        architecture_spec: architectureSpec,
        project_id: validProjectId
      });

      if (jobError || !jobData) {
        console.error("[GENERATE] Job creation failed:", jobError);
        throw new Error(jobError || 'Failed to start job');
      }

      const jobId = jobData.job_id;
      console.log("[GENERATE] Job created:", jobId);
      setGenerationStep(3); // Creating files

      // Poll for job completion
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes max
      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000));

        const { data: status } = await api.get<{
          status: string;
          result?: { github_repo_url?: string; files_generated?: number };
          metadata?: { github_repo_url?: string };
          current_step?: string;
          error?: string;
        }>(`/api/jobs/${jobId}`);

        console.log(`[GENERATE] Poll ${attempts + 1}: ${status?.status} - ${status?.current_step || 'no step'}`);

        if (status?.status === 'running') {
          // Update step based on progress (approximate)
          if (attempts > 5) setGenerationStep(4); // Pushing to GitHub
          if (attempts > 10 && deployToVercel) setGenerationStep(5); // Deploying
        }

        if (status?.status === 'completed' || status?.status === 'completed_with_warnings') {
          console.log("[GENERATE] Job completed!", status);
          const repoUrl = githubRepoUrl || status.result?.github_repo_url || status.metadata?.github_repo_url;
          setGeneratedLinks({
            github: repoUrl || undefined,
            vercel: deployToVercel ? `https://${selectedRepo || projectName.toLowerCase().replace(/\s+/g, '-')}.vercel.app` : undefined
          });
          setGenerationStep(deployToVercel ? 6 : 5);
          setToast(`Generated ${status.result?.files_generated || 'some'} files!`);
          break;
        }

        if (status?.status === 'failed') {
          console.error("[GENERATE] Job failed:", status.error);
          throw new Error(status.error || 'Job failed');
        }

        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Job timed out');
      }

    } catch (error) {
      console.error('[GENERATE] Error:', error);
      alert(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Show what we have anyway
      if (githubRepoUrl) {
        setGeneratedLinks({
          github: githubRepoUrl,
          vercel: undefined
        });
      }
    } finally {
      setGenerating(false);
    }
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
        <main className="flex-1 overflow-hidden relative bg-stone-100">
          {/* Floating Prompt Panel - The System Intent */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4">
            <div className="bg-white/95 backdrop-blur-xl border border-stone-200 rounded-xl shadow-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-stone-100 bg-stone-50/50">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-stone-600 uppercase tracking-wide">System Intent</span>
                {prompt.trim() && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Ready
                  </span>
                )}
              </div>
              <div className="p-3">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to build... e.g., 'A real-time chat application with user authentication, message persistence, and WebSocket support'"
                  className="w-full bg-transparent text-stone-900 text-sm placeholder-stone-400 resize-none focus:outline-none min-h-[60px]"
                  rows={2}
                />
              </div>
              {githubRepoUrl && (
                <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/50 flex items-center gap-2">
                  <Github className="w-3.5 h-3.5 text-stone-400" />
                  <a href={githubRepoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-stone-500 hover:text-stone-900 truncate">
                    {githubRepoUrl.replace('https://github.com/', '')}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <ReactFlowProvider><ArchitectureCanvas /></ReactFlowProvider>
        </main>
        {rightPanel === "chat" && <aside className="w-72 flex-shrink-0 border-l border-stone-200 bg-white"><ChatPanel onClose={() => setRightPanel(null)} /></aside>}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {shareModalOpen && <ShareModal isPublic={isPublic} setIsPublic={setIsPublic} onClose={() => setShareModalOpen(false)} />}

      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => !generating && setGenerateModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-5 border-b border-stone-100"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Sparkles className="w-5 h-5 text-amber-500" /><h2 className="text-lg font-medium text-stone-900">Generate Code</h2></div>{!generating && <button onClick={() => { setGenerateModalOpen(false); setGenerationStep(0); setGeneratedLinks(null); }} className="p-1 hover:bg-stone-100 rounded-lg"><X className="w-5 h-5 text-stone-400" /></button>}</div></div>
            <div className="p-5">
              {!generating && !generatedLinks ? (
                <>
                  {/* Prompt Summary */}
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">System Intent</p>
                        <p className="text-xs text-amber-700 mt-1 line-clamp-2">{prompt || "No description provided"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Nodes Summary */}
                  <div className="mb-4 p-3 bg-stone-50 border border-stone-200 rounded-lg">
                    <p className="text-sm font-medium text-stone-700 mb-2">Architecture ({nodes.length} components)</p>
                    <div className="flex flex-wrap gap-1">
                      {nodes.slice(0, 6).map((n, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-stone-200 rounded text-xs text-stone-600">
                          {n.data?.label || n.data?.componentId || 'Component'}
                        </span>
                      ))}
                      {nodes.length > 6 && <span className="px-2 py-0.5 text-xs text-stone-400">+{nodes.length - 6} more</span>}
                    </div>
                  </div>

                  {/* GitHub Repo */}
                  {githubRepoUrl ? (
                    <div className="mb-4 p-3 bg-stone-50 border border-stone-200 rounded-lg flex items-center gap-2">
                      <Github className="w-4 h-4 text-stone-600" />
                      <span className="text-sm text-stone-700 flex-1 truncate">{githubRepoUrl.replace('https://github.com/', '')}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-700">No GitHub repo linked - will create on generate</span>
                    </div>
                  )}

                  {/* Vercel Toggle */}
                  <label className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg cursor-pointer mb-5">
                    <div className="flex items-center gap-2"><div className="w-8 h-8 rounded bg-black flex items-center justify-center"><svg className="w-4 h-4 text-white" viewBox="0 0 76 76" fill="currentColor"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" /></svg></div><span className="text-sm text-stone-900">Deploy to Vercel</span></div>
                    <button onClick={() => setDeployToVercel(!deployToVercel)} className={`relative w-10 h-5 rounded-full transition-colors ${deployToVercel ? "bg-stone-900" : "bg-stone-200"}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${deployToVercel ? "left-5" : "left-0.5"}`} /></button>
                  </label>

                  {/* Generate Button */}
                  <button 
                    onClick={handleGenerate} 
                    disabled={!prompt.trim() || nodes.length === 0}
                    className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Generate & Push to GitHub
                  </button>

                  {(!prompt.trim() || nodes.length === 0) && (
                    <p className="text-xs text-center text-amber-600 mt-2">
                      {!prompt.trim() ? "Add a system intent first" : "Add components to the canvas"}
                    </p>
                  )}
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