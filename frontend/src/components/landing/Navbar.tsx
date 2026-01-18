"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";

const workItems = [
  { title: "Full-stack" },
  { title: "APIs" },
  { title: "Data Pipelines" },
  { title: "Cloud Infra" },
];

const processItems = [
  { title: "Draw" },
  { title: "Define" },
  { title: "Generate" },
  { title: "Deploy" },
];

export function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
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

  return (
    <nav 
      ref={navRef} 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-md border-b border-stone-100" : ""
      } ${visible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="max-w-6xl mx-auto px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <Link 
            ref={logoRef}
            href="/" 
            className={`text-sm font-display font-bold tracking-tight transition-all duration-300 ${scrolled ? "text-stone-900" : "text-white"}`}
          >
            Architex
          </Link>
  
          <div className="flex items-center gap-8">
            <div 
              className="relative"
              onMouseEnter={() => setOpenDropdown("work")}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <a href="#work" className={`text-[11px] transition-all duration-300 tracking-widest uppercase font-medium flex items-center gap-1 ${scrolled ? "text-stone-500 hover:text-stone-900" : "text-stone-400 hover:text-white"}`}>
                Work
                <svg className={`w-3 h-3 transition-transform duration-150 ${openDropdown === "work" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
              {openDropdown === "work" && (
                <div className="absolute top-full left-0 pt-2 w-36">
                  <div className="bg-white border border-stone-100 shadow-lg p-3 space-y-2">
                    {workItems.map((item, i) => (
                      <a key={i} href="#work" className="block text-sm text-stone-600 hover:text-stone-900 transition-colors">
                        {item.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div 
              className="relative"
              onMouseEnter={() => setOpenDropdown("process")}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <a href="#process" className={`text-[11px] transition-all duration-300 tracking-widest uppercase font-medium flex items-center gap-1 ${scrolled ? "text-stone-500 hover:text-stone-900" : "text-stone-400 hover:text-white"}`}>
                Process
                <svg className={`w-3 h-3 transition-transform duration-150 ${openDropdown === "process" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
              {openDropdown === "process" && (
                <div className="absolute top-full left-0 pt-2 w-36">
                  <div className="bg-white border border-stone-100 shadow-lg p-3 space-y-2">
                    {processItems.map((item, i) => (
                      <a key={i} href="#process" className="block text-sm text-stone-600 hover:text-stone-900 transition-colors">
                        {item.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link 
              href="/workflow" 
              className={`text-[11px] px-4 py-2 rounded-full transition-all duration-300 tracking-widest uppercase font-medium ${scrolled ? "bg-stone-900 text-white hover:bg-stone-800" : "bg-white text-stone-900 hover:bg-stone-100"}`}
            >
              Start Project
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
