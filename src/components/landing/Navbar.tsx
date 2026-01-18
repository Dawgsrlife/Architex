"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";

const workItems = [
  { title: "Full-stack", desc: "Web & mobile apps" },
  { title: "APIs", desc: "REST & GraphQL" },
  { title: "Data Pipelines", desc: "ETL & processing" },
  { title: "Cloud Infra", desc: "AWS, GCP, Azure" },
];

const processItems = [
  { title: "Draw", desc: "Sketch your system" },
  { title: "Define", desc: "Set requirements" },
  { title: "Generate", desc: "AI writes code" },
  { title: "Deploy", desc: "Ship to production" },
];

export function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const lastScrollY = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    gsap.set(navRef.current, { opacity: 0, y: -20 });
    gsap.to(navRef.current, { 
      opacity: 1, 
      y: 0, 
      duration: 0.8, 
      delay: 1.2,
      ease: "power2.out"
    });

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setScrolled(currentScrollY > 100);
      
      if (currentScrollY < 100) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logoColor = !mounted ? "text-white" : scrolled ? "text-stone-900" : "text-white";
  const linkColor = !mounted 
    ? "text-stone-400" 
    : scrolled 
      ? "text-stone-500 hover:text-stone-900" 
      : "text-stone-400 hover:text-white";
  const buttonStyle = !mounted
    ? "bg-white text-stone-900"
    : scrolled 
      ? "bg-stone-900 text-white hover:bg-stone-800" 
      : "bg-white text-stone-900 hover:bg-stone-100";

  return (
    <nav 
      ref={navRef} 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        scrolled ? "bg-white/80 backdrop-blur-md border-b border-stone-100" : "bg-transparent"
      } ${visible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="max-w-6xl mx-auto px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <Link 
            href="/" 
            className={`text-sm font-display font-bold tracking-tight transition-colors duration-500 ease-out ${logoColor}`}
          >
            Architex
          </Link>
  
          <div className="flex items-center gap-8">
            <div 
              className="relative"
              onMouseEnter={() => setOpenDropdown("work")}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <a href="#work" className={`text-[11px] transition-colors duration-500 ease-out tracking-widest uppercase font-medium flex items-center gap-1 ${linkColor}`}>
                Work
                <svg className={`w-3 h-3 transition-transform duration-200 ${openDropdown === "work" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
<div className={`absolute top-full left-0 pt-2 w-44 transition-all duration-200 ${openDropdown === "work" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}`}>
                  <div className="bg-white border border-stone-100 shadow-lg p-3 space-y-3">
                    {workItems.map((item, i) => (
                      <a key={i} href="#work" className="block group">
                        <span className="text-sm text-stone-900 group-hover:text-stone-600 transition-colors">{item.title}</span>
                        <span className="block text-xs text-stone-400">{item.desc}</span>
                      </a>
                    ))}
                  </div>
                </div>
            </div>

            <div 
              className="relative"
              onMouseEnter={() => setOpenDropdown("process")}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <a href="#process" className={`text-[11px] transition-colors duration-500 ease-out tracking-widest uppercase font-medium flex items-center gap-1 ${linkColor}`}>
                Process
                <svg className={`w-3 h-3 transition-transform duration-200 ${openDropdown === "process" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
<div className={`absolute top-full left-0 pt-2 w-44 transition-all duration-200 ${openDropdown === "process" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}`}>
                  <div className="bg-white border border-stone-100 shadow-lg p-3 space-y-3">
                    {processItems.map((item, i) => (
                      <a key={i} href="#process" className="block group">
                        <span className="text-sm text-stone-900 group-hover:text-stone-600 transition-colors">{item.title}</span>
                        <span className="block text-xs text-stone-400">{item.desc}</span>
                      </a>
                    ))}
                  </div>
                </div>
            </div>

            <Link 
              href="/login" 
              className={`text-[11px] transition-colors duration-500 ease-out tracking-widest uppercase font-medium ${linkColor}`}
            >
              Sign In
            </Link>

            <Link 
              href="/dashboard/new" 
              className={`text-[11px] px-4 py-2 rounded-full transition-all duration-500 ease-out tracking-widest uppercase font-medium ${buttonStyle}`}
            >
              Start Project
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}