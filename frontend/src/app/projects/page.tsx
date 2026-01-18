"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  Zap,
  ArrowRight,
  Github,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatDate, getRepoShortName } from "@/lib/utils";
import { Project, STATUS_CONFIG } from "@/types/project";

function ProjectsNav() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-950/90 backdrop-blur-xl border-b border-stone-800/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-lg font-display font-bold tracking-tight text-white cursor-pointer">
              Architex
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/projects" className="px-4 py-2 text-sm text-white font-medium cursor-pointer">
                Projects
              </Link>
              <Link href="/learn-more" className="px-4 py-2 text-sm text-stone-400 hover:text-white transition-colors cursor-pointer">
                Docs
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/projects/new"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white text-stone-950 rounded-full text-sm font-medium hover:bg-stone-100 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Link>
            
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-stone-800/50 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-600 to-stone-800 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
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
                  <div className="absolute right-0 top-full mt-2 w-48 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-stone-800">
                      <p className="text-sm font-medium text-white">{user?.name || "User"}</p>
                      <p className="text-xs text-stone-500 truncate">{user?.email}</p>
                    </div>
                    <div className="p-1">
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer">
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
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

function ProjectCard({ project, index, onDelete }: { project: Project; index: number; onDelete: (id: string) => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, delay: index * 0.08, ease: "power3.out" }
    );
  }, [index]);

  const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;

  const handleDelete = async () => {
    if (!confirm(`Delete "${project.name}"?`)) return;
    setDeleting(true);
    await onDelete(project.projectId);
    setDeleting(false);
    setMenuOpen(false);
  };

  return (
    <div ref={cardRef} className="group relative">
      <Link href={`/projects/${project.projectId}`} className="cursor-pointer">
        <div className="relative bg-stone-900/40 border border-stone-800/40 rounded-2xl p-6 hover:border-stone-700/60 hover:bg-stone-900/60 transition-all duration-300">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative">
            <div className="flex items-start justify-between mb-5">
              <div className="w-11 h-11 rounded-xl bg-stone-800/80 flex items-center justify-center group-hover:bg-stone-800 transition-colors">
                <Layers className="w-5 h-5 text-stone-400 group-hover:text-white transition-colors" />
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                <span className={`text-xs font-medium ${status.text}`}>
                  {project.status}
                </span>
              </div>
            </div>
            
            <h3 className="text-white font-medium text-lg mb-2 group-hover:text-stone-100 transition-colors">
              {project.name}
            </h3>
            <p className="text-stone-500 text-sm line-clamp-2 mb-3 leading-relaxed">
              {project.description || "No description"}
            </p>
            
            {project.github_repo_url && (
              <a 
                href={project.github_repo_url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-white mb-3 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span className="truncate max-w-[150px]">{getRepoShortName(project.github_repo_url)}</span>
              </a>
            )}
            
            <div className="flex items-center justify-between text-xs text-stone-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(project.last_updated)}
              </div>
              <div className="flex items-center gap-1.5">
                <Grid3X3 className="w-3.5 h-3.5" />
                {project.nodes_count} nodes
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-stone-800/80 transition-all cursor-pointer"
        >
          <MoreHorizontal className="w-4 h-4 text-stone-400" />
        </button>
        
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-44 bg-stone-900 border border-stone-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              <Link href={`/projects/${project.projectId}`} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-stone-300 hover:bg-stone-800 transition-colors cursor-pointer">
                <ExternalLink className="w-4 h-4" />
                Open
              </Link>
              {project.github_repo_url && (
                <a href={project.github_repo_url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-stone-300 hover:bg-stone-800 transition-colors cursor-pointer">
                  <Github className="w-4 h-4" />
                  View on GitHub
                </a>
              )}
              <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-stone-300 hover:bg-stone-800 transition-colors cursor-pointer">
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <div className="h-px bg-stone-800 my-1" />
              <button onClick={handleDelete} disabled={deleting} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-50">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
    );
  }, []);

  return (
    <Link ref={cardRef} href="/projects/new" className="cursor-pointer">
      <div className="h-full min-h-[240px] border-2 border-dashed border-stone-800/60 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-stone-600 hover:bg-stone-900/30 transition-all group">
        <div className="w-14 h-14 rounded-2xl bg-stone-900 flex items-center justify-center group-hover:bg-stone-800 group-hover:scale-105 transition-all">
          <Plus className="w-7 h-7 text-stone-500 group-hover:text-white transition-colors" />
        </div>
        <div className="text-center">
          <span className="text-stone-400 text-sm font-medium group-hover:text-white transition-colors block">
            New Project
          </span>
          <span className="text-stone-600 text-xs mt-1 block">
            Start from scratch
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "draft" | "archived">("all");
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await api.get<Project[]>('/api/projects');
      if (apiError) {
        setError(apiError);
      } else {
        setProjects(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteProject = async (projectId: string) => {
    const { error: deleteError } = await api.delete(`/api/projects/${projectId}`);
    if (deleteError) {
      alert(`Failed to delete: ${deleteError}`);
    } else {
      setProjects(prev => prev.filter(p => p.projectId !== projectId));
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchProjects();
    }
  }, [isLoading, isAuthenticated, fetchProjects]);

  useEffect(() => {
    gsap.fromTo(headerRef.current,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );
    gsap.fromTo(statsRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: "power3.out" }
    );
  }, []);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === "active" || p.status === "completed").length,
    draft: projects.filter(p => p.status === "draft").length,
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">
      <ProjectsNav />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-stone-800/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-stone-700/10 rounded-full blur-3xl" />
      </div>
      
      <main className="relative pt-28 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div ref={headerRef} className="mb-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl lg:text-5xl font-display font-medium tracking-tight text-white mb-3">
                  Your Projects
                </h1>
                <p className="text-stone-400 text-lg">
                  Design, iterate, and deploy your system architectures
                </p>
              </div>
              
              <div ref={statsRef} className="flex items-center gap-6">
                <button 
                  onClick={fetchProjects}
                  disabled={loading}
                  className="p-2 text-stone-500 hover:text-white hover:bg-stone-800/50 rounded-lg transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <div className="text-center">
                  <p className="text-2xl font-display font-medium text-white">{stats.total}</p>
                  <p className="text-xs text-stone-500 uppercase tracking-wider">Total</p>
                </div>
                <div className="w-px h-10 bg-stone-800" />
                <div className="text-center">
                  <p className="text-2xl font-display font-medium text-emerald-400">{stats.active}</p>
                  <p className="text-xs text-stone-500 uppercase tracking-wider">Active</p>
                </div>
                <div className="w-px h-10 bg-stone-800" />
                <div className="text-center">
                  <p className="text-2xl font-display font-medium text-amber-400">{stats.draft}</p>
                  <p className="text-xs text-stone-500 uppercase tracking-wider">Drafts</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-72 pl-11 pr-4 py-3 bg-stone-900/50 border border-stone-800/50 rounded-xl text-white placeholder-stone-500 text-sm focus:outline-none focus:border-stone-700 focus:bg-stone-900/80 transition-all"
                />
              </div>
              
              <div className="hidden sm:flex items-center gap-1 p-1 bg-stone-900/50 border border-stone-800/50 rounded-xl">
                {(["all", "active", "draft", "archived"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-all capitalize cursor-pointer ${
                      filter === f 
                        ? "bg-white text-stone-950" 
                        : "text-stone-400 hover:text-white hover:bg-stone-800/50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-stone-900/50 border border-stone-800/50 rounded-xl">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    viewMode === "grid" ? "bg-white text-stone-950" : "text-stone-400 hover:text-white"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    viewMode === "list" ? "bg-white text-stone-950" : "text-stone-400 hover:text-white"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <Link
                href="/projects/new"
                className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-white text-stone-950 rounded-xl text-sm font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New
              </Link>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
              <button onClick={fetchProjects} className="ml-2 underline">Retry</button>
            </div>
          )}

          {filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-stone-900 flex items-center justify-center">
                <FolderOpen className="w-10 h-10 text-stone-700" />
              </div>
              <h3 className="text-white font-medium text-xl mb-2">No projects found</h3>
              <p className="text-stone-500 text-sm mb-8 max-w-sm mx-auto">
                {searchQuery ? "Try adjusting your search or filters" : "Create your first project to start designing your architecture"}
              </p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-stone-950 rounded-full text-sm font-medium hover:bg-stone-100 transition-all active:scale-95 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                Create Project
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <NewProjectCard />
              {filteredProjects.map((project, index) => (
                <ProjectCard key={project.projectId} project={project} index={index + 1} onDelete={handleDeleteProject} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project) => (
                <Link key={project.projectId} href={`/projects/${project.projectId}`} className="cursor-pointer block">
                  <div className="flex items-center gap-5 p-5 bg-stone-900/40 border border-stone-800/40 rounded-2xl hover:border-stone-700/60 hover:bg-stone-900/60 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-stone-800/80 flex items-center justify-center flex-shrink-0 group-hover:bg-stone-800 transition-colors">
                      <Layers className="w-5 h-5 text-stone-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate group-hover:text-stone-100 transition-colors">{project.name}</h3>
                      <p className="text-stone-500 text-sm truncate">{project.description}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-8 text-xs text-stone-500">
                      <div className="flex items-center gap-1.5">
                        <Grid3X3 className="w-3.5 h-3.5" />
                        {project.nodes_count} nodes
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(project.last_updated)}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0 ${
                      project.status === "active" ? "bg-emerald-500/10" :
                      project.status === "draft" ? "bg-amber-500/10" :
                      "bg-stone-500/10"
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        project.status === "active" ? "bg-emerald-400" :
                        project.status === "draft" ? "bg-amber-400" :
                        "bg-stone-500"
                      }`} />
                      <span className={`text-xs font-medium ${
                        project.status === "active" ? "text-emerald-400" :
                        project.status === "draft" ? "text-amber-400" :
                        "text-stone-500"
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
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