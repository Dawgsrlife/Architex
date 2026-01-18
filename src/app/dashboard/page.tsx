"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { 
  Plus, 
  Search, 
  Grid3X3, 
  List, 
  MoreHorizontal, 
  Clock, 
  FolderOpen,
  Trash2,
  Copy,
  ExternalLink,
  LogOut,
  Settings,
  ChevronDown,
  Layers,
  ArrowRight,
  ArrowUpRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Project {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  nodesCount: number;
  status: "draft" | "active" | "archived";
}

const mockProjects: Project[] = [
  { id: "1", name: "E-commerce Platform", description: "Full-stack e-commerce with Next.js, Stripe, and PostgreSQL", updatedAt: "2 hours ago", nodesCount: 12, status: "active" },
  { id: "2", name: "Auth Microservice", description: "JWT authentication service with Redis caching", updatedAt: "1 day ago", nodesCount: 8, status: "active" },
  { id: "3", name: "Data Pipeline", description: "Real-time ETL with Kafka and Elasticsearch", updatedAt: "3 days ago", nodesCount: 15, status: "draft" },
  { id: "4", name: "Mobile Backend", description: "REST API for iOS and Android apps", updatedAt: "1 week ago", nodesCount: 6, status: "archived" },
  { id: "5", name: "Analytics Dashboard", description: "Real-time metrics with WebSockets", updatedAt: "2 weeks ago", nodesCount: 9, status: "draft" },
];

function DashboardNav() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-lg font-display font-bold tracking-tight text-stone-900">
              Architex
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/dashboard" className="px-4 py-2 text-sm text-stone-900 font-medium">
                Dashboard
              </Link>
              <Link href="/explore" className="px-4 py-2 text-sm text-stone-500 hover:text-stone-900 transition-colors">
                Explore
              </Link>
              <Link href="/sketch" className="px-4 py-2 text-sm text-stone-500 hover:text-stone-900 transition-colors">
                Sketch
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/new"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Link>
            
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 text-sm font-medium overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name || "User"} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0) || user?.email?.charAt(0) || "U"
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>
              
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="p-3 border-b border-stone-100">
                      <p className="text-sm font-medium text-stone-900">{user?.name || "User"}</p>
                      <p className="text-xs text-stone-500 truncate">{user?.email}</p>
                    </div>
                    <div className="p-1">
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-lg transition-colors">
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, delay: index * 0.05, ease: "power2.out" }
    );
  }, [index]);

  return (
    <div ref={cardRef} className="group relative">
      <Link href={`/dashboard/${project.id}`}>
        <div className="relative bg-white border border-stone-200 rounded-xl p-6 hover:border-stone-300 hover:shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-stone-600" />
            </div>
            <div className={`text-xs font-medium px-2 py-1 rounded-full ${
              project.status === "active" ? "bg-emerald-50 text-emerald-700" :
              project.status === "draft" ? "bg-amber-50 text-amber-700" :
              "bg-stone-100 text-stone-500"
            }`}>
              {project.status}
            </div>
          </div>
          
          <h3 className="text-stone-900 font-medium text-base mb-1.5">
            {project.name}
          </h3>
          <p className="text-stone-500 text-sm line-clamp-2 mb-4 leading-relaxed">
            {project.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-stone-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {project.updatedAt}
            </div>
            <div className="flex items-center gap-1">
              <Grid3X3 className="w-3.5 h-3.5" />
              {project.nodesCount} nodes
            </div>
          </div>

          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-4 h-4 text-stone-400" />
          </div>
        </div>
      </Link>
      
      <div className="absolute top-4 right-12 z-10">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-stone-100 transition-all"
        >
          <MoreHorizontal className="w-4 h-4 text-stone-400" />
        </button>
        
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-stone-200 rounded-lg shadow-lg z-50 overflow-hidden">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
                <ExternalLink className="w-4 h-4" />
                Open
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <div className="h-px bg-stone-100 my-1" />
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NewProjectCard() {
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
  }, []);

  return (
    <Link ref={cardRef} href="/dashboard/new">
      <div className="h-full min-h-[200px] border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-stone-300 hover:bg-stone-50/50 transition-all group">
        <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
          <Plus className="w-6 h-6 text-stone-500 group-hover:text-stone-700 transition-colors" />
        </div>
        <div className="text-center">
          <span className="text-stone-600 text-sm font-medium group-hover:text-stone-900 transition-colors block">
            New Project
          </span>
          <span className="text-stone-400 text-xs mt-0.5 block">
            Start from scratch
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "draft" | "archived">("all");
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  const filteredProjects = mockProjects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: mockProjects.length,
    active: mockProjects.filter(p => p.status === "active").length,
    draft: mockProjects.filter(p => p.status === "draft").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <DashboardNav />
      
      <main className="pt-24 pb-16 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div ref={headerRef} className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-medium tracking-tight text-stone-900">
                  Dashboard
                </h1>
                <p className="text-stone-500 text-sm mt-1">
                  {stats.total} projects · {stats.active} active · {stats.draft} drafts
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300 transition-all"
                />
              </div>
              
              <div className="hidden sm:flex items-center border border-stone-200 rounded-lg bg-white overflow-hidden">
                {(["all", "active", "draft", "archived"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 text-xs font-medium transition-all capitalize ${
                      filter === f 
                        ? "bg-stone-900 text-white" 
                        : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-stone-200 rounded-lg bg-white overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-all ${
                    viewMode === "grid" ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-900"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-all ${
                    viewMode === "list" ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-900"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <Link
                href="/dashboard/new"
                className="sm:hidden flex items-center gap-2 px-3 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New
              </Link>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-stone-100 flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="text-stone-900 font-medium text-lg mb-1">No projects found</h3>
              <p className="text-stone-500 text-sm mb-6 max-w-sm mx-auto">
                {searchQuery ? "Try adjusting your search or filters" : "Create your first project to get started"}
              </p>
              <Link
                href="/dashboard/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all active:scale-95"
              >
                Create Project
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <NewProjectCard />
              {filteredProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index + 1} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProjects.map((project, index) => (
                <Link key={project.id} href={`/dashboard/${project.id}`} className="block">
                  <div className="flex items-center gap-4 p-4 bg-white border border-stone-200 rounded-xl hover:border-stone-300 hover:shadow-sm transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <Layers className="w-5 h-5 text-stone-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-stone-900 font-medium truncate">{project.name}</h3>
                      <p className="text-stone-500 text-sm truncate">{project.description}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-6 text-xs text-stone-400">
                      <div className="flex items-center gap-1">
                        <Grid3X3 className="w-3.5 h-3.5" />
                        {project.nodesCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {project.updatedAt}
                      </div>
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                      project.status === "active" ? "bg-emerald-50 text-emerald-700" :
                      project.status === "draft" ? "bg-amber-50 text-amber-700" :
                      "bg-stone-100 text-stone-500"
                    }`}>
                      {project.status}
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
