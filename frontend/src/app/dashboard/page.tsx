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
  ChevronDown
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-950/80 backdrop-blur-xl border-b border-stone-800/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-sm font-display font-bold tracking-tight text-white">
              Architex
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/projects" className="px-4 py-2 text-sm text-white font-medium">
                Projects
              </Link>
              <Link href="/dashboard" className="px-4 py-2 text-sm text-stone-400 hover:text-white transition-colors">
                Templates
              </Link>
              <Link href="/dashboard" className="px-4 py-2 text-sm text-stone-400 hover:text-white transition-colors">
                Settings
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/projects/new"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white text-stone-950 rounded-lg text-sm font-medium hover:bg-stone-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Link>
            
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-stone-800/50 transition-colors"
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
                  <div className="absolute right-0 top-full mt-2 w-48 bg-stone-900 border border-stone-800 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-stone-800">
                      <p className="text-sm font-medium text-white">{user?.name || "User"}</p>
                      <p className="text-xs text-stone-400 truncate">{user?.email}</p>
                    </div>
                    <div className="p-1">
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 rounded-lg transition-colors">
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-stone-800 rounded-lg transition-colors"
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

  const statusColors = {
    active: "bg-emerald-500/20 text-emerald-400",
    draft: "bg-stone-500/20 text-stone-400",
    archived: "bg-stone-700/20 text-stone-500",
  };

  return (
    <div ref={cardRef} className="group relative">
      <Link href={`/projects/${project.id}`}>
        <div className="relative bg-stone-900/50 border border-stone-800/50 rounded-xl p-5 hover:border-stone-700/50 hover:bg-stone-900/80 transition-all duration-300 cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-stone-800 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-stone-400" />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[project.status]}`}>
              {project.status}
            </span>
          </div>
          
          <h3 className="text-white font-medium mb-1 group-hover:text-stone-100 transition-colors">
            {project.name}
          </h3>
          <p className="text-stone-500 text-sm line-clamp-2 mb-4">
            {project.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-stone-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {project.updatedAt}
            </div>
            <div className="flex items-center gap-1">
              <Grid3X3 className="w-3.5 h-3.5" />
              {project.nodesCount} nodes
            </div>
          </div>
        </div>
      </Link>
      
      <div className="absolute top-3 right-3 z-10">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-stone-700/50 transition-all"
        >
          <MoreHorizontal className="w-4 h-4 text-stone-400" />
        </button>
        
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-40 bg-stone-900 border border-stone-800 rounded-lg shadow-xl z-50 overflow-hidden">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 transition-colors">
                <ExternalLink className="w-4 h-4" />
                Open
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 transition-colors">
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-stone-800 transition-colors">
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
    if (isAuthenticated) {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-600 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const filteredProjects = mockProjects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-stone-950">
      <DashboardNav />
      
      <main className="pt-24 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div ref={headerRef} className="mb-8">
            <h1 className="text-3xl font-display font-medium tracking-tight text-white mb-2">
              Your Projects
            </h1>
            <p className="text-stone-400">
              Create, manage, and deploy your architecture designs
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-stone-900/50 border border-stone-800/50 rounded-lg text-white placeholder-stone-500 text-sm focus:outline-none focus:border-stone-700 transition-colors"
                />
              </div>
              
              <div className="flex items-center gap-1 p-1 bg-stone-900/50 border border-stone-800/50 rounded-lg">
                {(["all", "active", "draft", "archived"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                      filter === f 
                        ? "bg-stone-800 text-white" 
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-stone-900/50 border border-stone-800/50 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "grid" ? "bg-stone-800 text-white" : "text-stone-400 hover:text-white"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "list" ? "bg-stone-800 text-white" : "text-stone-400 hover:text-white"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <Link
                href="/projects/new"
                className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-white text-stone-950 rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New
              </Link>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-900 flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-stone-600" />
              </div>
              <h3 className="text-white font-medium mb-2">No projects found</h3>
              <p className="text-stone-500 text-sm mb-6">
                {searchQuery ? "Try adjusting your search or filters" : "Create your first project to get started"}
              </p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-stone-950 rounded-lg text-sm font-medium hover:bg-stone-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </Link>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/projects/new">
                <div className="h-full min-h-[200px] border-2 border-dashed border-stone-800 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-stone-700 hover:bg-stone-900/30 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center group-hover:bg-stone-800 transition-colors">
                    <Plus className="w-6 h-6 text-stone-500 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-stone-500 text-sm font-medium group-hover:text-white transition-colors">
                    New Project
                  </span>
                </div>
              </Link>
              {filteredProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProjects.map((project, index) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="flex items-center gap-4 p-4 bg-stone-900/50 border border-stone-800/50 rounded-xl hover:border-stone-700/50 hover:bg-stone-900/80 transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-stone-800 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-5 h-5 text-stone-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{project.name}</h3>
                      <p className="text-stone-500 text-sm truncate">{project.description}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-6 text-xs text-stone-500">
                      <div className="flex items-center gap-1">
                        <Grid3X3 className="w-3.5 h-3.5" />
                        {project.nodesCount} nodes
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {project.updatedAt}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                      project.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                      project.status === "draft" ? "bg-stone-500/20 text-stone-400" :
                      "bg-stone-700/20 text-stone-500"
                    }`}>
                      {project.status}
                    </span>
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
