"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headlineRef.current, 
        { opacity: 0, y: 60 }, 
        { opacity: 1, y: 0, duration: 1.4, ease: "power3.out", delay: 0.3 }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative h-screen flex flex-col justify-center bg-stone-950 overflow-hidden">
      <div className="absolute inset-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover opacity-40 grayscale"
        >
          <source src="/assets/14471955_3840_2160_30fps.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/30 via-stone-950/60 to-stone-950" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 lg:px-12 w-full">
        <div className="max-w-4xl">
          <h1 ref={headlineRef} className="text-[clamp(2.5rem,8vw,6.5rem)] font-medium tracking-tight text-white leading-[1.05] font-display">
            Design your system.
            <br />
            <span className="text-stone-500">We write the code.</span>
          </h1>
          
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 mt-16">
                <Link 
                  href="/projects/new" 
                  className="px-8 py-4 bg-white text-stone-950 rounded-full text-sm font-medium hover:bg-stone-100 transition-all active:scale-95 cursor-pointer"
                >
                  Start Building
                </Link>
              <Link 
                href="/learn-more"
                className="text-sm font-medium text-stone-400 hover:text-white transition-colors group flex items-center gap-2 cursor-pointer"
              >
                Learn more
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
        </div>
      </div>
    </section>
  );
}