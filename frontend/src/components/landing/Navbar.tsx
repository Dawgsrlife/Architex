"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";

export function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const token = document.cookie.includes("auth_token=");
    setIsLoggedIn(token);
    
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
            <a href="#work" className={`text-[11px] transition-colors duration-500 ease-out tracking-widest uppercase font-medium ${linkColor}`}>
              Work
            </a>

            <a href="#process" className={`text-[11px] transition-colors duration-500 ease-out tracking-widest uppercase font-medium ${linkColor}`}>
              Process
            </a>

            {!isLoggedIn && (
              <Link 
                href="/login" 
                className={`text-[11px] transition-colors duration-500 ease-out tracking-widest uppercase font-medium ${linkColor}`}
              >
                Sign In
              </Link>
            )}

            <Link 
              href={isLoggedIn ? "/dashboard/new" : "/login"}
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