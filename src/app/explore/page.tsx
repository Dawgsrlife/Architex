"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  ArrowUpRight, 
  Clock, 
  Globe,
  Github,
  ExternalLink,
  Users,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Project {
  _id: string;
  name: string;
  description: string;
  repository?: string;
  deploymentUrl?: string;
  createdAt: string;
  userId: string;
}

export default function ExplorePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchPublicProjects() {
      try {
        const response = await fetch("/api/projects/public");
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPublicProjects();
  }, []);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm font-display font-bold tracking-tight text-stone-900">
                Architex
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/explore" className="text-[11px] text-stone-900 tracking-widest uppercase font-medium">
                  Explore
                </Link>
                {isAuthenticated && (
                  <Link href="/dashboard" className="text-[11px] text-stone-400 hover:text-stone-900 transition-colors tracking-widest uppercase font-medium">
                    Dashboard
                  </Link>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link 
                  href="/dashboard"
                  className="text-[11px] px-4 py-2 bg-stone-900 text-white rounded-full tracking-widest uppercase font-medium hover:bg-stone-800 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link 
                  href="/login"
                  className="text-[11px] px-4 py-2 bg-stone-900 text-white rounded-full tracking-widest uppercase font-medium hover:bg-stone-800 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <main className="pt-28 pb-24 px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-display font-medium tracking-tight text-stone-900 mb-3">
                  Explore
                </h1>
                <p className="text-stone-400 text-sm">
                  Discover public architectures from the community
                </p>
              </div>
              
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border-0 rounded-lg text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-stone-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 border border-stone-100 rounded-lg">
              <Users className="w-10 h-10 text-stone-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-stone-900 mb-1">No projects found</h3>
              <p className="text-stone-400 text-sm">
                {searchQuery ? "Try a different search term" : "Be the first to share a project"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div 
                  key={project._id}
                  className="group flex flex-col bg-white border border-stone-100 rounded-xl overflow-hidden hover:border-stone-200 hover:shadow-lg hover:shadow-stone-100/50 transition-all"
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center group-hover:bg-stone-900 transition-colors">
                        <span className="text-sm font-medium text-stone-400 group-hover:text-white transition-colors">
                          {project.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {project.repository && (
                          <a 
                            href={project.repository} 
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg hover:bg-stone-50 text-stone-400 hover:text-stone-900 transition-colors"
                          >
                            <Github className="w-4 h-4" />
                          </a>
                        )}
                        {project.deploymentUrl && (
                          <a 
                            href={project.deploymentUrl} 
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg hover:bg-stone-50 text-stone-400 hover:text-stone-900 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-base font-medium text-stone-900 mb-2">
                      {project.name}
                    </h3>
                    <p className="text-stone-400 text-sm leading-relaxed mb-6 flex-grow line-clamp-2">
                      {project.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                      <div className="flex items-center gap-1.5 text-xs text-stone-400">
                        <Clock className="w-3 h-3" />
                        {new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <Link 
                        href={`/dashboard/${project._id}`}
                        className="flex items-center gap-1.5 text-xs font-medium text-stone-900 hover:gap-2 transition-all"
                      >
                        View
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
