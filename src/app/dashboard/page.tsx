"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Clock, 
  FolderOpen,
  Trash2,
  Copy,
  ExternalLink,
  LogOut,
  Settings,
  ChevronDown,
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
];

function DashboardNav() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
      <div className="max-w-6xl mx-auto px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-sm font-display font-bold tracking-tight text-stone-900">
              Architex
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-[11px] text-stone-900 tracking-widest uppercase font-medium">
                Projects
              </Link>
              <Link href="/explore" className="text-[11px] text-stone-400 hover:text-stone-900 transition-colors tracking-widest uppercase font-medium">
                Explore
              </Link>
              <Link href="/dashboard/draw" className="text-[11px] text-stone-400 hover:text-stone-900 transition-colors tracking-widest uppercase font-medium">
                Draw
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/new"
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-full text-[11px] tracking-widest uppercase font-medium hover:bg-stone-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </Link>
            
            <div ref={menuRef} className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-stone-50 transition-colors"
              >
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.name || user.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white text-xs font-medium">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-100 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-3 border-b border-stone-100">
                    <p className="text-sm font-medium text-stone-900">{user?.name || user?.username || "User"}</p>
                    <p className="text-xs text-stone-400">@{user?.username || "user"}</p>
                  </div>
                  <div className="p-1">
                    <Link 
                      href="/dashboard/settings" 
                      className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button 
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(rowRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, delay: 0.05 + index * 0.03, ease: "power2.out" }
    );
  }, [index]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div ref={rowRef} className="group relative">
      <Link href={`/dashboard/${project.id}`}>
        <div className="flex items-center justify-between py-5 px-6 border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-stone-500">
                {project.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium text-stone-900 truncate">
                  {project.name}
                </h3>
                {project.status === "draft" && (
                  <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full uppercase tracking-wider font-medium">
                    Draft
                  </span>
                )}
                {project.status === "archived" && (
                  <span className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full uppercase tracking-wider font-medium">
                    Archived
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 truncate mt-0.5">
                {project.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-8 text-xs text-stone-400">
              <span>{project.nodesCount} components</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {project.updatedAt}
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
          </div>
        </div>
      </Link>
      
      <div ref={menuRef} className="absolute top-1/2 -translate-y-1/2 right-16 z-10">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-stone-100 transition-all"
        >
          <MoreHorizontal className="w-4 h-4 text-stone-400" />
        </button>
        
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-stone-100 rounded-xl shadow-xl overflow-hidden">
            <Link 
              href={`/dashboard/${project.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open
            </Link>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
              <Copy className="w-3.5 h-3.5" />
              Duplicate
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-stone-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "draft" | "archived">("all");
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      gsap.set(headerRef.current, { opacity: 0, y: -20 });
      gsap.to(headerRef.current, { 
        opacity: 1, y: 0, duration: 0.6, delay: 0.1, ease: "power2.out" 
      });
      gsap.set(contentRef.current, { opacity: 0 });
      gsap.to(contentRef.current, { 
        opacity: 1, duration: 0.6, delay: 0.2, ease: "power2.out" 
      });
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
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

  const stats = {
    total: mockProjects.length,
    active: mockProjects.filter(p => p.status === "active").length,
    draft: mockProjects.filter(p => p.status === "draft").length,
    components: mockProjects.reduce((acc, p) => acc + p.nodesCount, 0)
  };

  return (
    <div className="min-h-screen bg-white">
      <DashboardNav />
      
      <main className="pt-28 pb-16 px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div ref={headerRef} className="mb-12">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
              <div>
                <h1 className="text-3xl font-display font-medium tracking-tight text-stone-900 mb-2">
                  Projects
                </h1>
                <p className="text-stone-400 text-sm">
                  Design and manage your system architectures
                </p>
              </div>

            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-100 rounded-lg overflow-hidden">
              <div className="bg-white p-6">
                <p className="text-2xl font-medium text-stone-900">{stats.total}</p>
                <p className="text-xs text-stone-400 mt-1 tracking-wide uppercase">Total</p>
              </div>
              <div className="bg-white p-6">
                <p className="text-2xl font-medium text-stone-900">{stats.active}</p>
                <p className="text-xs text-stone-400 mt-1 tracking-wide uppercase">Active</p>
              </div>
              <div className="bg-white p-6">
                <p className="text-2xl font-medium text-stone-900">{stats.draft}</p>
                <p className="text-xs text-stone-400 mt-1 tracking-wide uppercase">Draft</p>
              </div>
              <div className="bg-white p-6">
                <p className="text-2xl font-medium text-stone-900">{stats.components}</p>
                <p className="text-xs text-stone-400 mt-1 tracking-wide uppercase">Components</p>
              </div>
            </div>
          </div>

          <div ref={contentRef}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-stone-50 border-0 rounded-lg text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {(["all", "active", "draft", "archived"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 text-[11px] tracking-widest uppercase font-medium rounded-full transition-all ${
                      filter === f 
                        ? "bg-stone-900 text-white" 
                        : "text-stone-400 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredProjects.length === 0 && !searchQuery ? (
              <div className="text-center py-20 border border-stone-100 rounded-lg">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-stone-50 flex items-center justify-center">
                  <FolderOpen className="w-7 h-7 text-stone-300" />
                </div>
                <h3 className="text-lg text-stone-900 font-medium mb-1">No projects yet</h3>
                <p className="text-stone-400 text-sm mb-6">
                  Create your first project to get started
                </p>
                <Link
                  href="/dashboard/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-full text-[11px] tracking-widest uppercase font-medium hover:bg-stone-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Project
                </Link>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-16 border border-stone-100 rounded-lg">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-stone-50 flex items-center justify-center">
                  <Search className="w-6 h-6 text-stone-300" />
                </div>
                <h3 className="text-stone-900 font-medium mb-1">No results</h3>
                <p className="text-stone-400 text-sm">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="border border-stone-100 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-6 py-3 bg-stone-50/50 border-b border-stone-100">
                  <span className="text-[10px] text-stone-400 tracking-widest uppercase font-medium">
                    {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] text-stone-400 tracking-widest uppercase font-medium">
                    Last updated
                  </span>
                </div>
                {filteredProjects.map((project, index) => (
                  <ProjectRow key={project.id} project={project} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
