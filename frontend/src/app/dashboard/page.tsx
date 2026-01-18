"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { 
  Plus, Search, Grid3X3, List, MoreHorizontal, Clock, FolderOpen,
  Trash2, Copy, ExternalLink, LogOut, Settings, Layers,
  ArrowRight, ArrowUpRight, Github, Loader2, RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatDate, getRepoShortName } from "@/lib/utils";
import { Project, STATUS_CONFIG } from "@/types/project";

function DashboardNav() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/dashboard" className="text-lg font-display font-bold tracking-tight text-stone-900">Architex</Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/new" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-all">
              <Plus className="w-3.5 h-3.5" />New
            </Link>
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 text-sm font-medium overflow-hidden hover:ring-2 hover:ring-stone-300 transition-all">
                {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.name || "User"} className="w-full h-full object-cover" /> : (user?.name?.charAt(0) || user?.email?.charAt(0) || "U")}
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="p-3 border-b border-stone-100">
                      <p className="text-sm font-medium text-stone-900 truncate">{user?.name || "User"}</p>
                      <p className="text-xs text-stone-500 truncate">{user?.email}</p>
                    </div>
                    <div className="p-1">
                      <Link href="/dashboard/settings" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-lg transition-colors">
                        <Settings className="w-4 h-4" />Settings
                      </Link>
                      <button onClick={async () => { await logout(); router.push("/"); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" />Sign out
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
    gsap.fromTo(cardRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay: index * 0.05, ease: "power2.out" });
  }, [index]);

  const handleDelete = async () => {
    if (!confirm(`Delete "${project.name}"?`)) return;
    setDeleting(true);
    await onDelete(project.projectId);
    setDeleting(false);
    setMenuOpen(false);
  };

  return (
    <div ref={cardRef} className="group relative">
      <Link href={`/dashboard/${project.projectId}`}>
        <div className="relative bg-white border border-stone-200 rounded-xl p-6 hover:border-stone-300 hover:shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center"><Layers className="w-5 h-5 text-stone-600" /></div>
            <div className={`text-xs font-medium px-2 py-1 rounded-full ${project.status === "active" ? "bg-emerald-50 text-emerald-700" : project.status === "draft" ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-stone-500"}`}>{project.status}</div>
          </div>
          <h3 className="text-stone-900 font-medium text-base mb-1.5">{project.name}</h3>
          <p className="text-stone-500 text-sm line-clamp-2 mb-2 leading-relaxed">{project.description || "No description"}</p>
          {project.github_repo_url && (
            <a href={project.github_repo_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 mb-2 transition-colors">
              <Github className="w-3 h-3" />
              <span className="truncate max-w-[140px]">{getRepoShortName(project.github_repo_url)}</span>
            </a>
          )}
          <div className="flex items-center justify-between text-xs text-stone-400">
            <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(project.last_updated)}</div>
            <div className="flex items-center gap-1"><Grid3X3 className="w-3.5 h-3.5" />{project.nodes_count} nodes</div>
          </div>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"><ArrowUpRight className="w-4 h-4 text-stone-400" /></div>
        </div>
      </Link>
      <div className="absolute top-4 right-12 z-10">
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(!menuOpen); }} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-stone-100 transition-all"><MoreHorizontal className="w-4 h-4 text-stone-400" /></button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-stone-200 rounded-lg shadow-lg z-50 overflow-hidden">
              <Link href={`/projects/${project.projectId}`} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"><ExternalLink className="w-4 h-4" />Open</Link>
              {project.github_repo_url && (
                <a href={project.github_repo_url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"><Github className="w-4 h-4" />GitHub</a>
              )}
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"><Copy className="w-4 h-4" />Duplicate</button>
              <div className="h-px bg-stone-100 my-1" />
              <button onClick={handleDelete} disabled={deleting} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "draft" | "archived">("all");
  const headerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => { if (!isLoading && !isAuthenticated) router.replace("/login"); }, [isAuthenticated, isLoading, router]);
  useEffect(() => { if (!isLoading && isAuthenticated) fetchProjects(); }, [isLoading, isAuthenticated, fetchProjects]);
  useEffect(() => { if (headerRef.current) gsap.fromTo(headerRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }); }, []);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = { total: projects.length, active: projects.filter(p => p.status === "active" || p.status === "completed").length, draft: projects.filter(p => p.status === "draft").length };

  if (isLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-stone-50">
      <DashboardNav />
      <main className="pt-24 pb-16 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div ref={headerRef} className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-medium tracking-tight text-stone-900">Your Projects</h1>
                <p className="text-stone-500 text-sm mt-1">{stats.total} projects · {stats.active} active · {stats.draft} drafts</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => fetchProjects()} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 border border-stone-200 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-100 transition-all active:scale-95 disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <Link href="/dashboard/new" className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-all active:scale-95">
                  <Plus className="w-4 h-4" />New Project
                </Link>
              </div>
            </div>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300 transition-all" />
              </div>
              <div className="hidden sm:flex items-center border border-stone-200 rounded-lg bg-white overflow-hidden">
                {(["all", "active", "draft", "archived"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 text-xs font-medium transition-all capitalize ${filter === f ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-stone-200 rounded-lg bg-white overflow-hidden">
                <button onClick={() => setViewMode("grid")} className={`p-2 transition-all ${viewMode === "grid" ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-900"}`}><Grid3X3 className="w-4 h-4" /></button>
                <button onClick={() => setViewMode("list")} className={`p-2 transition-all ${viewMode === "list" ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-900"}`}><List className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-stone-100 flex items-center justify-center"><FolderOpen className="w-8 h-8 text-stone-400" /></div>
              <h3 className="text-stone-900 font-medium text-lg mb-1">No projects found</h3>
              <p className="text-stone-500 text-sm mb-6 max-w-sm mx-auto">{searchQuery ? "Try adjusting your search or filters" : "Create your first project to get started"}</p>
              <Link href="/dashboard/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-all active:scale-95">Create Project<ArrowRight className="w-4 h-4" /></Link>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{filteredProjects.map((project, index) => <ProjectCard key={project.projectId || `project-${index}`} project={project} index={index} onDelete={handleDeleteProject} />)}</div>
          ) : (
            <div className="space-y-2">
              {filteredProjects.map((project, index) => (
                <Link key={project.projectId || `project-${index}`} href={`/dashboard/${project.projectId}`} className="block">
                  <div className="flex items-center gap-4 p-4 bg-white border border-stone-200 rounded-xl hover:border-stone-300 hover:shadow-sm transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0"><Layers className="w-5 h-5 text-stone-600" /></div>
                    <div className="flex-1 min-w-0"><h3 className="text-stone-900 font-medium truncate">{project.name}</h3><p className="text-stone-500 text-sm truncate">{project.description}</p></div>
                    <div className="hidden sm:flex items-center gap-6 text-xs text-stone-400"><div className="flex items-center gap-1"><Grid3X3 className="w-3.5 h-3.5" />{project.nodes_count}</div><div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(project.last_updated)}</div></div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${project.status === "active" ? "bg-emerald-50 text-emerald-700" : project.status === "draft" ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-stone-500"}`}>{project.status}</div>
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