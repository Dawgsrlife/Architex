"use client";

import { useState, useRef, useEffect } from "react";
import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { 
  ArrowLeft, 
  Rocket, 
  Loader2, 
  Sparkles,
  Github,
  Check,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";

export default function DrawPage() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, []);

  const handleGenerate = async () => {
    if (!editor) return;

    setIsGenerating(true);
    setShowResultModal(true);
    setGenerationStep(0);

    try {
      // Step 1: Analyze drawing
      setGenerationStep(1);
      const shapes = editor.getCurrentPageShapes();
      if (shapes.length === 0) {
        alert("Please draw something first!");
        setIsGenerating(false);
        setShowResultModal(false);
        return;
      }

      // In a real app, we'd export the canvas to an image and send to Gemini Vision
      // For now, we simulate the steps
      await new Promise(r => setTimeout(r, 2000));
      
      // Step 2: Convert to Architecture
      setGenerationStep(2);
      await new Promise(r => setTimeout(r, 2500));
      
      // Step 3: Write Code & Push to GitHub
      setGenerationStep(3);
      await new Promise(r => setTimeout(r, 3000));
      
      // Step 4: Deploy to Vercel
      setGenerationStep(4);
      await new Promise(r => setTimeout(r, 2000));
      
      setIsGenerating(false);
    } catch (error) {
      console.error("Generation failed:", error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden">
      <header ref={headerRef} className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-4 flex-shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors p-2 -ml-2 rounded-lg hover:bg-stone-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <Link href="/dashboard" className="text-sm font-display font-bold tracking-tight text-stone-900">
            Architex
          </Link>

          <ChevronRight className="w-4 h-4 text-stone-300" />

          <span className="text-sm font-medium text-stone-900">
            Hand-drawn Design
          </span>
          
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">
            <Sparkles className="w-3 h-3" />
            <span className="text-[10px] tracking-wider uppercase font-bold">AI Canvas</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-[11px] tracking-widest uppercase font-medium transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Rocket className="w-3.5 h-3.5" />
            )}
            Build & Deploy
          </button>
        </div>
      </header>

      <div className="flex-1 relative">
        <Tldraw 
          onMount={(editor) => setEditor(editor)}
          inferDarkMode={false}
        />
        
        <div className="absolute top-6 right-6 z-10 max-w-xs pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md border border-stone-200 p-4 rounded-2xl shadow-xl pointer-events-auto">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-2">Instructions</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Sketch your application components and draw lines to connect them. Labels help the AI understand your intent better.
            </p>
          </div>
        </div>
      </div>

      {showResultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => !isGenerating && setShowResultModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
            <div className="p-10 text-center">
              {isGenerating ? (
                <div className="space-y-8">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-stone-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-stone-900 rounded-full animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-stone-900" />
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-display font-medium text-stone-900 mb-2">
                      {generationStep === 1 && "Analyzing sketch..."}
                      {generationStep === 2 && "Synthesizing architecture..."}
                      {generationStep === 3 && "Building codebase..."}
                      {generationStep === 4 && "Deploying to production..."}
                    </h2>
                    <p className="text-stone-400">Our AI is turning your drawing into a live application.</p>
                  </div>

                  <div className="space-y-3 max-w-xs mx-auto text-left">
                    {[
                      { step: 1, label: "Sketch Analysis" },
                      { step: 2, label: "Architecture Synthesis" },
                      { step: 3, label: "Code Generation & GitHub Push" },
                      { step: 4, label: "Vercel Deployment" }
                    ].map((item) => (
                      <div key={item.step} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                          generationStep > item.step ? "bg-emerald-500 text-white" : 
                          generationStep === item.step ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-300"
                        }`}>
                          {generationStep > item.step ? <Check className="w-3 h-3" /> : <span className="text-[10px]">{item.step}</span>}
                        </div>
                        <span className={`text-sm ${generationStep === item.step ? "text-stone-900 font-medium" : "text-stone-400"}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full mx-auto flex items-center justify-center">
                    <Check className="w-10 h-10 text-emerald-500" />
                  </div>
                  
                  <div>
                    <h2 className="text-3xl font-display font-medium text-stone-900 mb-2">Deployment Complete!</h2>
                    <p className="text-stone-400">Your application is live and the code is on GitHub.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <a 
                      href="https://github.com" 
                      target="_blank"
                      className="flex flex-col items-center gap-3 p-6 bg-stone-50 rounded-3xl hover:bg-stone-100 transition-colors group"
                    >
                      <Github className="w-6 h-6 text-stone-900" />
                      <span className="text-sm font-medium text-stone-900">View Repository</span>
                    </a>
                    <a 
                      href="https://vercel.com" 
                      target="_blank"
                      className="flex flex-col items-center gap-3 p-6 bg-stone-900 rounded-3xl hover:bg-stone-800 transition-colors group"
                    >
                      <ExternalLink className="w-6 h-6 text-white" />
                      <span className="text-sm font-medium text-white">Open Live App</span>
                    </a>
                  </div>

                  <button 
                    onClick={() => router.push("/dashboard")}
                    className="text-stone-400 hover:text-stone-900 text-sm font-medium transition-colors"
                  >
                    Back to Dashboard
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
