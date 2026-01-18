"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Search, Grid3X3, List, Layers, ArrowRight, Github, Globe, Star, Eye, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PublicProject {
  id: string;
  name: string;
  description: string;
  author: { name: string; avatar: string };
  nodesCount: number;
  stars: number;
  views: number;
  updatedAt: string;
  tags: string[];
  githubUrl?: string;
  vercelUrl?: string;
}

const mockPublicProjects: PublicProject[] = [
  { id: "1", name: "E-commerce Microservices", description: "Complete microservices architecture for e-commerce with payment processing, inventory management, and user authentication", author: { name: "Sarah Chen", avatar: "https://i.pravatar.cc/150?u=sarah" }, nodesCount: 15, stars: 234, views: 1520, updatedAt: "2 hours ago", tags: ["microservices", "e-commerce", "stripe"], githubUrl: "https://github.com/sarahchen/ecommerce-arch", vercelUrl: "https://ecommerce-demo.vercel.app" },
  { id: "2", name: "Real-time Chat System", description: "Scalable chat architecture with WebSocket connections, message queuing, and presence detection", author: { name: "Alex Rivera", avatar: "https://i.pravatar.cc/150?u=alex" }, nodesCount: 12, stars: 189, views: 890, updatedAt: "5 hours ago", tags: ["websocket", "redis", "real-time"], githubUrl: "https://github.com/alexrivera/chat-system", vercelUrl: "https://chat-demo.vercel.app" },
  { id: "3", name: "AI Content Pipeline", description: "ML pipeline for content generation with GPT integration, image processing, and content moderation", author: { name: "James Park", avatar: "https://i.pravatar.cc/150?u=james" }, nodesCount: 18, stars: 312, views: 2100, updatedAt: "1 day ago", tags: ["ai", "ml", "openai", "content"], githubUrl: "https://github.com/jamespark/ai-pipeline" },
  { id: "4", name: "IoT Dashboard", description: "IoT device management platform with real-time monitoring, alerts, and data visualization", author: { name: "Emma Wilson", avatar: "https://i.pravatar.cc/150?u=emma" }, nodesCount: 9, stars: 156, views: 720, updatedAt: "2 days ago", tags: ["iot", "mqtt", "timeseries"], githubUrl: "https://github.com/emmawilson/iot-dash", vercelUrl: "https://iot-dashboard.vercel.app" },
  { id: "5", name: "Video Streaming Platform", description: "Video on demand architecture with transcoding, CDN distribution, and adaptive bitrate streaming", author: { name: "Michael Lee", avatar: "https://i.pravatar.cc/150?u=michael" }, nodesCount: 21, stars: 445, views: 3200, updatedAt: "3 days ago", tags: ["video", "cdn", "streaming", "aws"], githubUrl: "https://github.com/michaellee/video-platform" },
  { id: "6", name: "Multi-tenant SaaS", description: "SaaS boilerplate with tenant isolation, billing integration, and role-based access control", author: { name: "Lisa Zhang", avatar: "https://i.pravatar.cc/150?u=lisa" }, nodesCount: 14, stars: 278, views: 1850, updatedAt: "4 days ago", tags: ["saas", "multi-tenant", "rbac"], githubUrl: "https://github.com/lisazhang/saas-template", vercelUrl: "https://saas-demo.vercel.app" },
];

const allTags = ["all", "microservices", "ai", "e-commerce", "real-time", "iot", "saas"];

function ProjectCard({ project, index }: { project: PublicProject; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => { gsap.fromTo(cardRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay: index * 0.05, ease: "power2.out" }); }, [index]);

  return (
    <div ref={cardRef} className="group">
      <div className="relative bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-stone-300 hover:shadow-md transition-all duration-200">
        <div className="h-32 bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-50">
            <div className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-stone-200" />
            <div className="absolute top-4 right-8 w-12 h-8 rounded-lg bg-stone-200" />
            <div className="absolute bottom-4 left-8 w-10 h-8 rounded-lg bg-stone-200" />
            <div className="absolute bottom-4 right-4 w-8 h-8 rounded-lg bg-stone-200" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-10 rounded-lg bg-stone-300" />
          </div>
          <Layers className="w-8 h-8 text-stone-400 relative z-10" />
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src={project.author.avatar} alt={project.author.name} className="w-6 h-6 rounded-full" />
              <span className="text-xs text-stone-500">{project.author.name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-400">
              <span className="flex items-center gap-1"><Star className="w-3 h-3" />{project.stars}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{project.views}</span>
            </div>
          </div>
          <h3 className="text-stone-900 font-medium text-base mb-2">{project.name}</h3>
          <p className="text-stone-500 text-sm line-clamp-2 mb-4 leading-relaxed">{project.description}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.tags.slice(0, 3).map((tag) => <span key={tag} className="px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-full">{tag}</span>)}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <div className="flex items-center gap-2">
              {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors" onClick={(e) => e.stopPropagation()}><Github className="w-4 h-4 text-stone-500" /></a>}
              {project.vercelUrl && <a href={project.vercelUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors" onClick={(e) => e.stopPropagation()}><Globe className="w-4 h-4 text-stone-500" /></a>}
            </div>
            <Link href={`/explore/${project.id}`} className="flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors">View<ArrowRight className="w-3 h-3" /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const { isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [sortBy, setSortBy] = useState<"popular" | "recent">("popular");
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (headerRef.current) gsap.fromTo(headerRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }); }, []);

  const filteredProjects = mockPublicProjects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === "all" || p.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  }).sort((a, b) => sortBy === "popular" ? b.stars - a.stars : 0);

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href={isAuthenticated ? "/dashboard" : "/"} className="text-stone-500 hover:text-stone-900 transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
              <Link href="/" className="text-lg font-display font-bold tracking-tight text-stone-900">Architex</Link>
              <div className="h-5 w-px bg-stone-200" />
              <span className="text-sm text-stone-500">Explore</span>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link href="/dashboard" className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors">Dashboard</Link>
              ) : (
                <Link href="/login" className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors">Sign in</Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <main className="pt-24 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div ref={headerRef} className="text-center mb-12">
            <h1 className="text-4xl font-display font-medium tracking-tight text-stone-900 mb-4">Explore Architectures</h1>
            <p className="text-stone-500 text-lg max-w-2xl mx-auto">Discover and learn from public system designs. Clone, modify, and deploy community-built architectures.</p>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input type="text" placeholder="Search architectures..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full lg:w-80 pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300 transition-all" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
                {allTags.map((tag) => <button key={tag} onClick={() => setSelectedTag(tag)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedTag === tag ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"}`}>{tag === "all" ? "All" : tag}</button>)}
              </div>
              <div className="h-6 w-px bg-stone-200 hidden lg:block" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "popular" | "recent")} className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-600 text-xs font-medium focus:outline-none"><option value="popular">Popular</option><option value="recent">Recent</option></select>
              <div className="flex items-center border border-stone-200 rounded-lg bg-white overflow-hidden">
                <button onClick={() => setViewMode("grid")} className={`p-2 transition-all ${viewMode === "grid" ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-900"}`}><Grid3X3 className="w-4 h-4" /></button>
                <button onClick={() => setViewMode("list")} className={`p-2 transition-all ${viewMode === "list" ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-900"}`}><List className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-stone-100 flex items-center justify-center"><Search className="w-8 h-8 text-stone-400" /></div>
              <h3 className="text-stone-900 font-medium text-lg mb-1">No projects found</h3>
              <p className="text-stone-500 text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}