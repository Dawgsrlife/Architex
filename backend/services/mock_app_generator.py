"""
Mock App Generator - Layer 3.5: Architectural Realization

This is NOT an LLM-first system. It is a TEMPLATE-first system.

The LLM's job is ONLY to fill in placeholders, never to invent architecture.

Flow:
    translated_spec → Template Selection → Template Instantiation → Repo

Key insight: The "magic" is not intelligence, it's CONSTRAINT + ILLUSION.
The output must be:
    - Fake (mocked auth, API, data)
    - Runnable (`npm install && npm run dev` works)
    - Navigable (pages exist, routes work)
    - Visually credible (looks like a real app)

Template Taxonomy:
    1. SCAFFOLD - Always generated, architecture-independent
       - package.json, tsconfig.json, tailwind.config, etc.
       - app/layout.tsx, app/globals.css
       - lib/utils.ts
       
    2. CORE_PAGES - Always generated, content varies by spec
       - app/page.tsx (landing)
       - app/dashboard/page.tsx
       - app/projects/page.tsx
       
    3. FEATURE_TEMPLATES - Generated based on detected components
       - auth/ - if spec has AUTH component
       - billing/ - if spec has STRIPE component
       - api/ - mock API routes based on spec
       
    4. MOCK_DATA - Fake data generators
       - lib/mock-data.ts
       - lib/mock-auth.ts
       - lib/mock-api.ts
"""

import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from pathlib import Path
from enum import Enum

from services.architecture_translator import (
    TranslatedArchitecture, 
    TranslatedComponent,
    ComponentType,
    get_translator
)

logger = logging.getLogger(__name__)


# ============================================================================
# TEMPLATE TAXONOMY
# ============================================================================

class TemplateCategory(Enum):
    """Categories of templates"""
    SCAFFOLD = "scaffold"      # Always generated
    CORE_PAGE = "core_page"    # Always generated, content varies
    FEATURE = "feature"        # Based on detected components
    MOCK = "mock"              # Fake data/services


@dataclass
class FileTemplate:
    """A single file template"""
    path: str                          # Relative path in repo
    category: TemplateCategory
    content: str                       # Template content with {placeholders}
    required_components: List[ComponentType] = field(default_factory=list)  # Empty = always include
    description: str = ""


@dataclass
class GeneratedFile:
    """A file to be written"""
    path: str
    content: str
    description: str = ""


# ============================================================================
# SCAFFOLD TEMPLATES (Always Generated)
# ============================================================================

SCAFFOLD_TEMPLATES: List[FileTemplate] = [
    FileTemplate(
        path="package.json",
        category=TemplateCategory.SCAFFOLD,
        content='''{
  "name": "{project_name_slug}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.4",
    "react": "^18",
    "react-dom": "^18",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "framer-motion": "^10.16.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0"
  }
}
''',
        description="Package configuration"
    ),
    
    FileTemplate(
        path="tsconfig.json",
        category=TemplateCategory.SCAFFOLD,
        content='''{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
''',
        description="TypeScript configuration"
    ),
    
    FileTemplate(
        path="tailwind.config.ts",
        category=TemplateCategory.SCAFFOLD,
        content='''import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        secondary: "#8b5cf6",
      },
    },
  },
  plugins: [],
};
export default config;
''',
        description="Tailwind CSS configuration"
    ),
    
    FileTemplate(
        path="postcss.config.js",
        category=TemplateCategory.SCAFFOLD,
        content='''module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
''',
        description="PostCSS configuration"
    ),
    
    FileTemplate(
        path="next.config.js",
        category=TemplateCategory.SCAFFOLD,
        content='''/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
''',
        description="Next.js configuration"
    ),
    
    FileTemplate(
        path=".gitignore",
        category=TemplateCategory.SCAFFOLD,
        content='''node_modules/
.next/
out/
.DS_Store
*.log
.env*.local
''',
        description="Git ignore file"
    ),
    
    FileTemplate(
        path="src/app/globals.css",
        category=TemplateCategory.SCAFFOLD,
        content='''@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}
''',
        description="Global styles"
    ),
    
    FileTemplate(
        path="src/lib/utils.ts",
        category=TemplateCategory.SCAFFOLD,
        content='''import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
''',
        description="Utility functions"
    ),
]


# ============================================================================
# CORE PAGE TEMPLATES (Always generated, content varies)
# ============================================================================

CORE_PAGE_TEMPLATES: List[FileTemplate] = [
    FileTemplate(
        path="src/app/layout.tsx",
        category=TemplateCategory.CORE_PAGE,
        content='''import type {{ Metadata }} from "next";
import {{ Inter }} from "next/font/google";
import "./globals.css";

const inter = Inter({{ subsets: ["latin"] }});

export const metadata: Metadata = {{
  title: "{project_name}",
  description: "{project_description}",
}};

export default function RootLayout({{
  children,
}}: {{
  children: React.ReactNode;
}}) {{
  return (
    <html lang="en">
      <body className={{inter.className}}>
        {{children}}
      </body>
    </html>
  );
}}
''',
        description="Root layout"
    ),
    
    FileTemplate(
        path="src/app/page.tsx",
        category=TemplateCategory.CORE_PAGE,
        content='''import Link from "next/link";

export default function Home() {{
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
      {{/* Animated background orbs */}}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      {{/* Hero Section */}}
      <div className="relative container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm text-purple-200 mb-8 border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Generated by Architex AI
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent leading-tight">
            {project_name}
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            {project_description}
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link 
              href="/dashboard" 
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105"
            >
              Open Dashboard
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link 
              href="/projects" 
              className="px-8 py-4 border border-white/20 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 backdrop-blur"
            >
              View Projects
            </Link>
          </div>
        </div>
        
        {{/* Feature Cards */}}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {feature_cards}
        </div>
        
        {{/* Tech Stack Pills */}}
        <div className="mt-16 flex justify-center gap-3 flex-wrap">
          {tech_pills}
        </div>
      </div>
      
      {{/* Footer */}}
      <footer className="relative mt-24 border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          Built with Architex • Powered by your imagination
        </div>
      </footer>
    </main>
  );
}}
''',
        description="Landing page"
    ),
    
    FileTemplate(
        path="src/app/dashboard/page.tsx",
        category=TemplateCategory.CORE_PAGE,
        content='''"use client";

import Link from "next/link";
import {{ mockProjects }} from "@/lib/mock-data";

export default function Dashboard() {{
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {{/* Gradient background */}}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 pointer-events-none"></div>
      
      {{/* Navigation */}}
      <nav className="relative z-10 border-b border-white/10 backdrop-blur bg-slate-950/50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            {project_name}
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/projects" className="text-gray-400 hover:text-white transition-colors">
              Projects
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm font-medium">
                D
              </div>
              <span className="text-gray-300 text-sm">demo@example.com</span>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="relative z-10 container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back 👋</h1>
          <p className="text-gray-400">Here's what's happening with your projects.</p>
        </div>
        
        {{/* Stats Grid */}}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Total Projects</span>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold">{{mockProjects.length}}</p>
            <p className="text-green-400 text-sm mt-1">↑ 12% this month</p>
          </div>
          
          <div className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-green-500/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Active</span>
              <span className="text-2xl">🚀</span>
            </div>
            <p className="text-3xl font-bold text-green-400">
              {{mockProjects.filter(p => p.status === "active").length}}
            </p>
            <p className="text-gray-400 text-sm mt-1">Running smoothly</p>
          </div>
          
          <div className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Generated Files</span>
              <span className="text-2xl">📁</span>
            </div>
            <p className="text-3xl font-bold text-indigo-400">142</p>
            <p className="text-gray-400 text-sm mt-1">Across all projects</p>
          </div>
          
          <div className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Time Saved</span>
              <span className="text-2xl">⚡</span>
            </div>
            <p className="text-3xl font-bold text-amber-400">48h</p>
            <p className="text-gray-400 text-sm mt-1">vs manual coding</p>
          </div>
        </div>
        
        {{/* Recent Projects */}}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          <Link href="/projects" className="text-purple-400 hover:text-purple-300 text-sm">
            View all →
          </Link>
        </div>
        
        <div className="space-y-3">
          {{mockProjects.slice(0, 5).map((project, i) => (
            <Link 
              key={{project.id}}
              href={{`/projects/${{project.id}}`}}
              className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center text-lg">
                  {{["🏗️", "📱", "🌐", "💳", "🔐"][i % 5]}}
                </div>
                <div>
                  <h3 className="font-medium group-hover:text-purple-300 transition-colors">{{project.name}}</h3>
                  <p className="text-sm text-gray-500">{{project.description}}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {{project.tags.slice(0, 2).map((tag) => (
                    <span key={{tag}} className="px-2 py-1 bg-purple-500/10 text-purple-300 text-xs rounded-full">
                      {{tag}}
                    </span>
                  ))}}
                </div>
                <span className={{`px-2 py-1 text-xs rounded-full ${{
                  project.status === "active" 
                    ? "bg-green-500/10 text-green-400 border border-green-500/30" 
                    : "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                }}`}}>
                  {{project.status}}
                </span>
                <span className="text-gray-500 group-hover:text-purple-400 transition-colors">→</span>
              </div>
            </Link>
          ))}}
        </div>
      </main>
    </div>
  );
}}
''',
        description="Dashboard page"
    ),
    
    FileTemplate(
        path="src/app/projects/page.tsx",
        category=TemplateCategory.CORE_PAGE,
        content='''"use client";

import Link from "next/link";
import {{ mockProjects }} from "@/lib/mock-data";

export default function ProjectsPage() {{
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {{/* Gradient background */}}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 pointer-events-none"></div>
      
      {{/* Navigation */}}
      <nav className="relative z-10 border-b border-white/10 backdrop-blur bg-slate-950/50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            {project_name}
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/projects" className="text-purple-400 font-medium">
              Projects
            </Link>
          </div>
        </div>
      </nav>
      
      <main className="relative z-10 container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Projects</h1>
            <p className="text-gray-400">Manage your architecture projects</p>
          </div>
          <button className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-medium hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-purple-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={{2}} d="M12 4v16m8-8H4" /></svg>
            New Project
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {{mockProjects.map((project, i) => (
            <Link 
              key={{project.id}}
              href={{`/projects/${{project.id}}`}}
              className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center text-xl">
                  {{["🏗️", "📱", "🌐", "💳", "🔐"][i % 5]}}
                </div>
                <span className={{`px-2.5 py-1 text-xs rounded-full ${{
                  project.status === "active" 
                    ? "bg-green-500/10 text-green-400 border border-green-500/30" 
                    : "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                }}`}}>
                  {{project.status}}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-300 transition-colors">
                {{project.name}}
              </h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {{project.description}}
              </p>
              
              <div className="flex gap-2 flex-wrap">
                {{project.tags.map((tag) => (
                  <span key={{tag}} className="px-2.5 py-1 bg-purple-500/10 text-purple-300 text-xs rounded-full border border-purple-500/20">
                    {{tag}}
                  </span>
                ))}}
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-sm text-gray-500">
                <span>Created {{project.createdAt}}</span>
                <span className="text-purple-400 group-hover:text-purple-300">Open →</span>
              </div>
            </Link>
          ))}}
        </div>
      </main>
    </div>
  );
}}
''',
        description="Projects list page"
    ),
    
    FileTemplate(
        path="src/app/projects/[id]/page.tsx",
        category=TemplateCategory.CORE_PAGE,
        content='''"use client";

import Link from "next/link";
import {{ useParams }} from "next/navigation";
import {{ useState }} from "react";
import {{ mockProjects, mockNodes }} from "@/lib/mock-data";

export default function ProjectCanvasPage() {{
  const params = useParams();
  const project = mockProjects.find(p => p.id === params.id) || mockProjects[0];
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  
  const handleGenerate = () => {{
    setGenerating(true);
    setTimeout(() => {{
      setGenerating(false);
      setGenerated(true);
    }}, 3000);
  }};
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {{/* Subtle gradient */}}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 pointer-events-none"></div>
      
      {{/* Navigation */}}
      <nav className="relative z-20 border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/projects" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={{2}} d="M15 19l-7-7 7-7" /></svg>
              Back
            </Link>
            <span className="text-gray-600">|</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <h1 className="font-semibold">{{project.name}}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={{2}} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              Save
            </button>
            <button 
              onClick={{handleGenerate}}
              disabled={{generating}}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-500 hover:to-indigo-500 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            >
              {{generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Generating...
                </>
              ) : generated ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={{2}} d="M5 13l4 4L19 7" /></svg>
                  Generated!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={{2}} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Generate
                </>
              )}}
            </button>
          </div>
        </div>
      </nav>
      
      <div className="relative z-10 flex h-[calc(100vh-57px)]">
        {{/* Sidebar */}}
        <aside className="w-72 bg-slate-900/50 border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Components</h2>
            <div className="space-y-1">
              {sidebar_components}
            </div>
          </div>
          
          <div className="p-4 flex-1">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Architecture</h2>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Frontend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Backend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>Database</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span>Services</span>
              </div>
            </div>
          </div>
          
          {{/* Generation Status */}}
          {{generating && (
            <div className="p-4 border-t border-white/10 bg-purple-500/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                <span className="text-sm font-medium text-purple-300">Generating code...</span>
              </div>
              <div className="space-y-1 text-xs text-gray-400 ml-9">
                <p className="animate-pulse">→ Translating architecture...</p>
                <p className="opacity-50">→ Creating file structure...</p>
                <p className="opacity-30">→ Writing components...</p>
              </div>
            </div>
          )}}
          
          {{generated && !generating && (
            <div className="p-4 border-t border-white/10 bg-green-500/10">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={{2}} d="M5 13l4 4L19 7" /></svg>
                <div>
                  <p className="text-sm font-medium text-green-300">Code Generated!</p>
                  <p className="text-xs text-gray-400">17 files created</p>
                </div>
              </div>
            </div>
          )}}
        </aside>
        
        {{/* Canvas */}}
        <main className="flex-1 relative overflow-hidden">
          {{/* Grid background */}}
          <div className="absolute inset-0" style={{{{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
            backgroundSize: "40px 40px"
          }}}}></div>
          
          {{/* Nodes */}}
          <div className="relative p-8">
            <div className="flex flex-wrap gap-6">
              {{mockNodes.map((node, i) => (
                <div 
                  key={{node.id}}
                  className="group relative bg-slate-800/80 backdrop-blur border border-white/10 rounded-xl p-5 w-56 cursor-move hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
                  style={{{{ transform: `translate(${{(i % 3) * 20}}px, ${{Math.floor(i / 3) * 15}}px)` }}}}
                >
                  {{/* Connection dots */}}
                  <div className="absolute -right-2 top-1/2 w-4 h-4 bg-slate-700 border-2 border-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute -left-2 top-1/2 w-4 h-4 bg-slate-700 border-2 border-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className={{`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${{
                      node.type === "frontend" ? "bg-blue-500/20 border border-blue-500/30" :
                      node.type === "backend" ? "bg-green-500/20 border border-green-500/30" :
                      node.type === "database" ? "bg-purple-500/20 border border-purple-500/30" :
                      "bg-amber-500/20 border border-amber-500/30"
                    }}`}}>
                      {{node.type === "frontend" ? "🌐" :
                        node.type === "backend" ? "⚙️" :
                        node.type === "database" ? "💾" : "🔌"}}
                    </div>
                    <div>
                      <span className="font-medium block">{{node.label}}</span>
                      <span className={{`text-xs ${{
                        node.type === "frontend" ? "text-blue-400" :
                        node.type === "backend" ? "text-green-400" :
                        node.type === "database" ? "text-purple-400" :
                        "text-amber-400"
                      }}`}}>{{node.tech}}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Drag to connect
                  </div>
                </div>
              ))}}
            </div>
            
            {{/* Placeholder for empty canvas */}}
            {{mockNodes.length === 0 && (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <p className="text-lg">Drag components here to start</p>
                </div>
              </div>
            )}}
          </div>
        </main>
      </div>
    </div>
  );
}}
''',
        description="Project canvas/editor page"
    ),
]


# ============================================================================
# MOCK DATA TEMPLATES
# ============================================================================

MOCK_TEMPLATES: List[FileTemplate] = [
    FileTemplate(
        path="src/lib/mock-data.ts",
        category=TemplateCategory.MOCK,
        content='''// Mock data for demo purposes
// This is fake data - no real database

export interface Project {{
  id: string;
  name: string;
  description: string;
  status: "active" | "archived";
  tags: string[];
  createdAt: string;
}}

export interface Node {{
  id: string;
  label: string;
  type: "frontend" | "backend" | "database" | "service";
  tech: string;
}}

export const mockProjects: Project[] = [
  {{
    id: "proj-1",
    name: "E-Commerce Platform",
    description: "Full-stack e-commerce with payments",
    status: "active",
    tags: ["Next.js", "Stripe", "Postgres"],
    createdAt: "2024-01-15",
  }},
  {{
    id: "proj-2",
    name: "SaaS Dashboard",
    description: "Analytics dashboard with auth",
    status: "active",
    tags: ["React", "FastAPI", "Redis"],
    createdAt: "2024-01-10",
  }},
  {{
    id: "proj-3",
    name: "Mobile API",
    description: "REST API for mobile apps",
    status: "archived",
    tags: ["Express", "MongoDB"],
    createdAt: "2024-01-05",
  }},
];

export const mockNodes: Node[] = [
{mock_nodes}
];

// Mock user for auth
export const mockUser = {{
  id: "user-1",
  email: "demo@example.com",
  name: "Demo User",
}};
''',
        description="Mock data for the app"
    ),
    
    FileTemplate(
        path="src/lib/mock-auth.ts",
        category=TemplateCategory.MOCK,
        content='''// Fake auth provider - no real authentication
// This is for demo purposes only

import { mockUser } from "./mock-data";

export interface User {
  id: string;
  email: string;
  name: string;
}

// Simulate auth state
let currentUser: User | null = mockUser;

export function getCurrentUser(): User | null {
  return currentUser;
}

export function login(email: string, password: string): User {
  // Always succeeds with mock user
  currentUser = { ...mockUser, email };
  return currentUser;
}

export function logout(): void {
  currentUser = null;
}

export function isAuthenticated(): boolean {
  return currentUser !== null;
}
''',
        description="Fake auth provider"
    ),
]


# ============================================================================
# FEATURE TEMPLATES (Conditional based on components)
# ============================================================================

FEATURE_TEMPLATES: List[FileTemplate] = [
    FileTemplate(
        path="src/app/api/auth/route.ts",
        category=TemplateCategory.FEATURE,
        required_components=[ComponentType.AUTH, ComponentType.OAUTH],
        content='''import { NextResponse } from "next/server";
import { mockUser } from "@/lib/mock-data";

// Fake auth API - always returns mock user
export async function POST(request: Request) {
  const body = await request.json();
  
  // Simulate login delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return NextResponse.json({
    user: mockUser,
    token: "fake-jwt-token-" + Date.now(),
  });
}

export async function GET() {
  return NextResponse.json({
    user: mockUser,
    authenticated: true,
  });
}
''',
        description="Fake auth API route"
    ),
    
    FileTemplate(
        path="src/app/api/projects/route.ts",
        category=TemplateCategory.FEATURE,
        required_components=[],  # Always include if there's a backend
        content='''import { NextResponse } from "next/server";
import { mockProjects } from "@/lib/mock-data";

// Fake projects API
export async function GET() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return NextResponse.json({
    projects: mockProjects,
    total: mockProjects.length,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const newProject = {
    id: "proj-" + Date.now(),
    name: body.name || "New Project",
    description: body.description || "",
    status: "active" as const,
    tags: body.tags || [],
    createdAt: new Date().toISOString(),
  };
  
  return NextResponse.json({
    project: newProject,
    message: "Project created (mock)",
  });
}
''',
        description="Fake projects API route"
    ),
    
    FileTemplate(
        path="src/app/billing/page.tsx",
        category=TemplateCategory.FEATURE,
        required_components=[ComponentType.STRIPE],
        content='''import Link from "next/link";

export default function BillingPage() {{
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
            {project_name}
          </Link>
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Billing</h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-indigo-600">Pro Plan</p>
              <p className="text-gray-500">$29/month (mock)</p>
            </div>
            <button className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition">
              Manage Subscription
            </button>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ This is a demo. No real payments are processed.
          </p>
        </div>
      </main>
    </div>
  );
}}
''',
        description="Fake billing page"
    ),
]


# ============================================================================
# MOCK APP GENERATOR
# ============================================================================

class MockAppGenerator:
    """
    Generates a fake but runnable Next.js app from a translated spec.
    
    This is a TEMPLATE system, not an LLM system.
    The LLM only fills placeholders - it never invents architecture.
    """
    
    def __init__(self):
        self.all_templates = (
            SCAFFOLD_TEMPLATES + 
            CORE_PAGE_TEMPLATES + 
            MOCK_TEMPLATES + 
            FEATURE_TEMPLATES
        )
    
    def generate(self, translated: TranslatedArchitecture) -> List[GeneratedFile]:
        """
        Generate all files for the mock app.
        
        Args:
            translated: The translated architecture spec
            
        Returns:
            List of files to write
        """
        files: List[GeneratedFile] = []
        
        # Collect component types for feature filtering
        component_types = {c.component_type for c in translated.components}
        
        # Build placeholder values
        placeholders = self._build_placeholders(translated)
        
        logger.info(f"Generating mock app for: {translated.project_name}")
        logger.info(f"Detected components: {[c.value for c in component_types]}")
        
        for template in self.all_templates:
            # Check if template should be included
            if template.required_components:
                # Feature template - check if any required component exists
                if not any(c in component_types for c in template.required_components):
                    logger.debug(f"Skipping {template.path} - no required components")
                    continue
            
            # Generate file content
            content = self._fill_template(template.content, placeholders)
            
            files.append(GeneratedFile(
                path=template.path,
                content=content,
                description=template.description
            ))
            
            logger.debug(f"Generated: {template.path}")
        
        logger.info(f"Generated {len(files)} files")
        return files
    
    def _build_placeholders(self, translated: TranslatedArchitecture) -> Dict[str, str]:
        """Build placeholder values from the translated spec."""
        
        # Generate feature cards for landing page
        feature_cards = self._generate_feature_cards(translated.components)
        
        # Generate sidebar components
        sidebar_components = self._generate_sidebar_components(translated.components)
        
        # Generate mock nodes
        mock_nodes = self._generate_mock_nodes(translated.components)
        
        # Generate tech pills
        tech_pills = self._generate_tech_pills(translated.components)
        
        return {
            "project_name": translated.project_name,
            "project_name_slug": translated.project_name.lower().replace(" ", "-"),
            "project_description": translated.user_prompt[:100] + "..." if len(translated.user_prompt) > 100 else translated.user_prompt,
            "feature_cards": feature_cards,
            "sidebar_components": sidebar_components,
            "mock_nodes": mock_nodes,
            "tech_pills": tech_pills,
        }
    
    def _generate_feature_cards(self, components: List[TranslatedComponent]) -> str:
        """Generate feature card JSX for landing page."""
        cards = []
        
        # Icons for different component types
        icons = {
            ComponentType.NEXTJS: "🌐",
            ComponentType.REACT: "⚛️",
            ComponentType.FASTAPI: "⚡",
            ComponentType.EXPRESS: "🚂",
            ComponentType.POSTGRES: "🐘",
            ComponentType.MONGODB: "🍃",
            ComponentType.SUPABASE: "💚",
            ComponentType.STRIPE: "💳",
            ComponentType.AUTH: "🔐",
            ComponentType.OAUTH: "🔑",
            ComponentType.REDIS: "🔴",
            ComponentType.S3: "📦",
        }
        
        for comp in components[:3]:  # Max 3 cards
            icon = icons.get(comp.component_type, "🔧")
            card = f'''
          <div className="group p-6 rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">
              {icon}
            </div>
            <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-300 transition-colors">{comp.name}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{comp.description}</p>
          </div>'''
            cards.append(card)
        
        return "\n".join(cards) if cards else "<!-- No components -->"
    
    def _generate_tech_pills(self, components: List[TranslatedComponent]) -> str:
        """Generate tech stack pills for landing page."""
        pills = []
        
        for comp in components:
            tech_name = comp.component_type.value.title().replace("_", " ")
            pill = f'''
          <span className="px-4 py-2 bg-white/5 backdrop-blur border border-white/10 rounded-full text-sm text-gray-300 hover:bg-white/10 hover:border-purple-500/30 transition-all cursor-default">
            {tech_name}
          </span>'''
            pills.append(pill)
        
        return "\n".join(pills) if pills else "<!-- No tech stack -->"
    
    def _generate_sidebar_components(self, components: List[TranslatedComponent]) -> str:
        """Generate sidebar component list for canvas page."""
        items = []
        
        type_styles = {
            "frontend": ("bg-blue-500", "text-blue-400", "🌐"),
            "backend": ("bg-green-500", "text-green-400", "⚙️"),
            "database": ("bg-purple-500", "text-purple-400", "💾"),
            "service": ("bg-amber-500", "text-amber-400", "🔌"),
        }
        
        for comp in components:
            category = self._categorize_component(comp.component_type)
            dot_color, text_color, icon = type_styles.get(category, ("bg-gray-500", "text-gray-400", "🔧"))
            
            item = f'''
            <div className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm group-hover:scale-110 transition-transform">
                {icon}
              </div>
              <div>
                <span className="text-sm font-medium block">{comp.name}</span>
                <span className="text-xs {text_color}">{comp.component_type.value.title()}</span>
              </div>
            </div>'''
            items.append(item)
        
        return "\n".join(items) if items else "<!-- No components -->"
    
    def _generate_mock_nodes(self, components: List[TranslatedComponent]) -> str:
        """Generate mock node data for the canvas."""
        nodes = []
        
        for i, comp in enumerate(components):
            category = self._categorize_component(comp.component_type)
            tech = comp.component_type.value.title()
            
            node = f'''  {{
    id: "node-{i+1}",
    label: "{comp.name}",
    type: "{category}",
    tech: "{tech}",
  }}'''
            nodes.append(node)
        
        return ",\n".join(nodes)
    
    def _categorize_component(self, comp_type: ComponentType) -> str:
        """Categorize component type for UI display."""
        frontends = {ComponentType.NEXTJS, ComponentType.REACT, ComponentType.VITE}
        backends = {ComponentType.FASTAPI, ComponentType.EXPRESS, ComponentType.FLASK}
        databases = {ComponentType.POSTGRES, ComponentType.MONGODB, ComponentType.SQLITE, ComponentType.SUPABASE}
        
        if comp_type in frontends:
            return "frontend"
        elif comp_type in backends:
            return "backend"
        elif comp_type in databases:
            return "database"
        else:
            return "service"
    
    def _fill_template(self, template: str, placeholders: Dict[str, str]) -> str:
        """Fill in template placeholders and unescape braces."""
        result = template
        
        # First, replace placeholders
        for key, value in placeholders.items():
            result = result.replace("{" + key + "}", value)
        
        # Then, unescape double braces ({{ → {, }} → })
        # This allows templates to use {{ }} for literal JS object braces
        result = result.replace("{{", "{").replace("}}", "}")
        
        return result
    
    def write_to_workspace(self, files: List[GeneratedFile], workspace_path: Path) -> List[str]:
        """
        Write generated files to workspace.
        
        Returns:
            List of file paths written
        """
        written = []
        
        for f in files:
            full_path = workspace_path / f.path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(f.content, encoding="utf-8")
            written.append(f.path)
            logger.debug(f"Wrote: {f.path}")
        
        logger.info(f"Wrote {len(written)} files to {workspace_path}")
        return written


# ============================================================================
# MODULE-LEVEL INTERFACE
# ============================================================================

_generator: Optional[MockAppGenerator] = None


def get_generator() -> MockAppGenerator:
    """Get singleton generator instance."""
    global _generator
    if _generator is None:
        _generator = MockAppGenerator()
    return _generator


def generate_mock_app(architecture_spec: Dict[str, Any], workspace_path: Path) -> List[str]:
    """
    Generate a mock app from an architecture spec.
    
    This is the main entry point.
    
    Args:
        architecture_spec: Raw spec from frontend
        workspace_path: Path to write files
        
    Returns:
        List of file paths written
    """
    # Translate spec
    translator = get_translator()
    translated = translator.translate(architecture_spec)
    
    # Generate files
    generator = get_generator()
    files = generator.generate(translated)
    
    # Write to workspace
    return generator.write_to_workspace(files, workspace_path)


# ============================================================================
# CLI for testing
# ============================================================================

if __name__ == "__main__":
    from services.architecture_translator import GOLDEN_DEMO_SPEC
    import tempfile
    import shutil
    
    print("=" * 60)
    print("MOCK APP GENERATOR - Demo")
    print("=" * 60)
    print()
    
    # Create temp workspace
    workspace = Path(tempfile.mkdtemp(prefix="mock_app_"))
    print(f"Workspace: {workspace}")
    print()
    
    try:
        # Generate mock app
        files = generate_mock_app(GOLDEN_DEMO_SPEC, workspace)
        
        print(f"Generated {len(files)} files:")
        for f in sorted(files):
            print(f"  - {f}")
        
        print()
        print("To run the app:")
        print(f"  cd {workspace}")
        print("  npm install")
        print("  npm run dev")
        
    except Exception as e:
        print(f"Error: {e}")
        raise
    finally:
        # Note: not cleaning up so user can inspect
        print()
        print(f"Files at: {workspace}")
