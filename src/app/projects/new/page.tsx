"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useArchitectureStore } from "@/stores/architecture-store";

const templates = [
  { id: "blank", name: "Blank Canvas", desc: "Start from scratch" },
  { id: "api", name: "REST API", desc: "Backend service with database" },
  { id: "fullstack", name: "Full-Stack App", desc: "Frontend + Backend + Database" },
  { id: "microservices", name: "Microservices", desc: "Distributed architecture" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { clearCanvas, setProjectId, setProjectName } = useArchitectureStore();
  const [projectName, setLocalProjectName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.set(contentRef.current, { opacity: 0, y: 20 });
    gsap.to(contentRef.current, { 
      opacity: 1, y: 0, duration: 0.5, ease: "power2.out" 
    });
  }, []);

  const handleCreate = () => {
    clearCanvas();
    setProjectId(null);
    setProjectName(projectName || "Untitled Project");
    router.push("/projects/new-" + Date.now());
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[11px] tracking-widest uppercase font-medium">Back</span>
              </Link>
              <div className="h-4 w-px bg-stone-200" />
              <Link href="/" className="text-sm font-display font-bold tracking-tight text-stone-900">
                Architex
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-16 px-8 lg:px-12">
        <div ref={contentRef} className="max-w-xl mx-auto">
          <div className="mb-10">
            <h1 className="text-2xl font-display font-medium tracking-tight text-stone-900 mb-2">
              New Project
            </h1>
            <p className="text-stone-400 text-sm">
              Create a new architecture project
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[11px] tracking-widest uppercase text-stone-400 font-medium mb-2">
                Project Name
              </label>
              <input
                type="text"
                placeholder="My Architecture"
                value={projectName}
                onChange={(e) => setLocalProjectName(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border-0 rounded-lg text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-widest uppercase text-stone-400 font-medium mb-3">
                Template
              </label>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 text-left border rounded-lg transition-all ${
                      selectedTemplate === template.id
                        ? "border-stone-900 bg-stone-50"
                        : "border-stone-100 hover:border-stone-200"
                    }`}
                  >
                    <p className="text-sm font-medium text-stone-900">{template.name}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{template.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleCreate}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-[11px] tracking-widest uppercase font-medium transition-colors"
              >
                Create Project
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
