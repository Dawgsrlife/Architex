"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  ArrowLeft, 
  Rocket, 
  Loader2, 
  X, 
  Check, 
  Github,
  Globe,
  ExternalLink,
  Sparkles,
  Play,
  FileCode2,
  FolderGit2,
  Settings2,
  Wand2,
  PenTool
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const Tldraw = dynamic(
  async () => {
    const mod = await import("tldraw");
    return mod.Tldraw;
  },
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-stone-100">
        <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
      </div>
    )
  }
);

export default function SketchPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [deployToVercel, setDeployToVercel] = useState(true);
  const [generatedLinks, setGeneratedLinks] = useState<{github?: string; vercel?: string} | null>(null);
  const [projectName, setProjectName] = useState("My Sketch");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleGenerate = async () => {
    if (!selectedRepo) return;
    
    setGenerating(true);
    setGeneratedLinks(null);
    setGenerationStep(1);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGenerationStep(2);
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    setGenerationStep(3);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGenerationStep(4);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setGenerationStep(5);
    
    if (deployToVercel) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGenerationStep(6);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setGenerationStep(7);
    }
    
    setGeneratedLinks({
      github: `https://github.com/user/${selectedRepo}`,
      vercel: deployToVercel ? `https://${selectedRepo}.vercel.app` : undefined
    });
    
    setGenerating(false);
  };

  const generationSteps = [
    { label: "Analyzing your sketch with AI", icon: Sparkles },
    { label: "Interpreting architecture components", icon: Wand2 },
    { label: "Generating code structure", icon: FileCode2 },
    { label: "Creating project files", icon: FolderGit2 },
    { label: "Pushing to GitHub", icon: Github },
    ...(deployToVercel ? [
      { label: "Connecting to Vercel", icon: Globe },
      { label: "Deploying application", icon: Rocket },
    ] : [])
  ];

  if (authLoading) {
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

          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-medium text-stone-900">Sketch Mode</span>
          </div>

          <div className="h-5 w-px bg-stone-200" />

          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent border-none text-sm text-stone-600 focus:outline-none focus:text-stone-900"
            placeholder="Untitled Sketch"
          />
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setGenerateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Build from Sketch</span>
          </button>
        </div>
      </header>

      <div className="flex-1 relative">
        <Tldraw />
        
        <div className="absolute bottom-4 left-4 bg-white border border-stone-200 rounded-xl p-4 shadow-lg max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-stone-900">AI-Powered</span>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            Draw your application architecture using shapes, arrows, and labels. Our AI will interpret your sketch and generate a complete, deployable project.
          </p>
        </div>
      </div>

      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => !generating && setGenerateModalOpen(false)} />
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-stone-900">Build from Sketch</h2>
                    <p className="text-sm text-stone-500">AI will interpret and build your app</p>
                  </div>
                </div>
                {!generating && (
                  <button 
                    onClick={() => {
                      setGenerateModalOpen(false);
                      setGenerationStep(0);
                      setGeneratedLinks(null);
                    }}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-stone-400" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {!generating && !generatedLinks ? (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Wand2 className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">How it works</p>
                        <p className="text-xs text-amber-700 mt-1">
                          Our AI analyzes your sketch to identify components like databases, APIs, services, and their connections. It then generates production-ready code based on your visual design.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300"
                      placeholder="My Project"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      GitHub Repository
                    </label>
                    <select
                      value={selectedRepo}
                      onChange={(e) => setSelectedRepo(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300"
                    >
                      <option value="">Choose or create a repository...</option>
                      <option value="my-sketched-app">my-sketched-app (new)</option>
                      <option value="prototype-app">prototype-app</option>
                      <option value="quick-mvp">quick-mvp</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" viewBox="0 0 76 76" fill="currentColor">
                            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-900">Deploy to Vercel</p>
                          <p className="text-xs text-stone-500">Auto-deploy with preview URLs</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeployToVercel(!deployToVercel)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          deployToVercel ? "bg-stone-900" : "bg-stone-200"
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          deployToVercel ? "left-7" : "left-1"
                        }`} />
                      </button>
                    </label>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={!selectedRepo}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-all disabled:opacity-50 disabled:hover:bg-stone-900"
                  >
                    <Sparkles className="w-4 h-4" />
                    Analyze & Build
                  </button>
                </>
              ) : generating ? (
                <div className="py-4">
                  <div className="space-y-3">
                    {generationSteps.map((step, index) => {
                      const stepNum = index + 1;
                      const isActive = generationStep === stepNum;
                      const isComplete = generationStep > stepNum;
                      
                      return (
                        <div 
                          key={index}
                          className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                            isActive ? "bg-amber-50" : isComplete ? "bg-emerald-50" : "bg-stone-50"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isComplete ? "bg-emerald-500" : isActive ? "bg-amber-500" : "bg-stone-200"
                          }`}>
                            {isComplete ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : isActive ? (
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            ) : (
                              <step.icon className="w-4 h-4 text-stone-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              isComplete ? "text-emerald-700" : isActive ? "text-amber-700" : "text-stone-400"
                            }`}>
                              {step.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : generatedLinks && (
                <div className="py-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-medium text-stone-900 text-center mb-2">
                    Your App is Live!
                  </h3>
                  <p className="text-sm text-stone-500 text-center mb-6">
                    We turned your sketch into a real application
                  </p>

                  <div className="space-y-3 mb-6">
                    <a
                      href={generatedLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl hover:bg-stone-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-stone-900 flex items-center justify-center">
                          <Github className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-900">GitHub Repository</p>
                          <p className="text-xs text-stone-500">{generatedLinks.github}</p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-stone-600" />
                    </a>

                    {generatedLinks.vercel && (
                      <a
                        href={generatedLinks.vercel}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl hover:bg-stone-100 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 76 76" fill="currentColor">
                              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-stone-900">Live Deployment</p>
                            <p className="text-xs text-stone-500">{generatedLinks.vercel}</p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-stone-600" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setGenerateModalOpen(false);
                      setGenerationStep(0);
                      setGeneratedLinks(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-all"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
