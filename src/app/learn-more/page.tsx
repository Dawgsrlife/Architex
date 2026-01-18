"use client";

import Link from "next/link";
import { ArrowLeft, Book, Code, Layers, Zap, Users, Terminal, Github } from "lucide-react";

export default function LearnMorePage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="p-2 -ml-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="text-sm font-display font-bold tracking-tight text-stone-900">
                Documentation
              </span>
            </div>
            <Link 
              href="/login"
              className="text-[11px] px-4 py-2 bg-stone-900 text-white rounded-full tracking-widest uppercase font-medium hover:bg-stone-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-24 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <h1 className="text-4xl font-display font-medium tracking-tight text-stone-900 mb-4">
              Build Better Architecture
            </h1>
            <p className="text-lg text-stone-400 max-w-2xl">
              Architex helps you design, visualize, and generate production-ready code for your software architecture.
            </p>
          </div>

          <div className="grid gap-8 mb-16">
            <section className="p-8 bg-stone-50 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-medium text-stone-900">Visual Architecture Design</h2>
              </div>
              <p className="text-stone-500 mb-4">
                Drag and drop components to design your system architecture. Connect services, databases, APIs, and more with an intuitive visual editor.
              </p>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
                  Pre-built component library
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
                  Real-time collaboration
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
                  Export to multiple formats
                </li>
              </ul>
            </section>

            <section className="p-8 bg-stone-50 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-medium text-stone-900">AI-Powered Code Generation</h2>
              </div>
              <p className="text-stone-500 mb-4">
                Transform your architecture diagrams into production-ready code. Generate boilerplate, API routes, database schemas, and infrastructure configs.
              </p>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
                  Multiple framework support
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
                  Docker & Kubernetes configs
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
                  CI/CD pipeline templates
                </li>
              </ul>
            </section>

            <section className="p-8 bg-stone-50 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center">
                  <Github className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-medium text-stone-900">GitHub Integration</h2>
              </div>
              <p className="text-stone-500 mb-4">
                Push generated code directly to GitHub. Create new repositories or update existing ones with a single click.
              </p>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
                  One-click repository creation
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
                  Branch management
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
                  Automatic README generation
                </li>
              </ul>
            </section>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-medium text-stone-900 mb-4">Ready to get started?</h3>
            <div className="flex items-center justify-center gap-4">
              <Link 
                href="/login"
                className="px-6 py-3 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                Sign in with GitHub
              </Link>
              <Link 
                href="/explore"
                className="px-6 py-3 border border-stone-200 text-stone-600 rounded-full text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                Explore Projects
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
