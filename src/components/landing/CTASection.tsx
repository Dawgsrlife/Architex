"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 40 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1,
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-48 bg-stone-950 overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/assets/12487101_1920_1080_25fps.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/90 to-stone-950/70" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-8 lg:px-12">
        <div ref={contentRef} className="max-w-2xl">
          <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-medium text-white tracking-tight leading-[1.05] mb-16 font-display">
            Ready to build?
          </h2>
          
            <Link 
              href="/projects/new" 
              className="inline-flex items-center gap-6 group"
            >
            <span className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-stone-900 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
            <span className="text-sm font-medium text-white tracking-widest uppercase">Start Building</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
