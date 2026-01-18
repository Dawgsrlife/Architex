"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Github, ArrowLeft } from "lucide-react";
import gsap from "gsap";

export default function LoginPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headlineRef.current, 
        { opacity: 0, y: 60 }, 
        { opacity: 1, y: 0, duration: 1.4, ease: "power3.out", delay: 0.3 }
      );
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.6 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    window.location.href = `${apiUrl}/api/auth/github`;
  };

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center bg-stone-950 overflow-hidden">
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

      <Link
        href="/"
        className="absolute top-8 left-8 z-20 flex items-center gap-2 text-stone-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-display font-bold tracking-tight text-white">
          Architex
        </span>
      </Link>

      <div className="relative z-10 w-full max-w-md mx-4">
        <h1 ref={headlineRef} className="text-[clamp(2rem,6vw,3.5rem)] font-medium tracking-tight text-white leading-[1.1] font-display text-center mb-12">
          Welcome back.
        </h1>

        <div ref={cardRef} className="bg-stone-900/60 backdrop-blur-xl border border-stone-800 rounded-2xl p-10">
          <button
            onClick={handleLogin}
            className="group w-full bg-white text-stone-950 rounded-full h-12 font-medium text-sm transition-all hover:bg-stone-100 active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-3">
              <Github className="w-5 h-5" />
              Continue with GitHub
            </span>
          </button>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-stone-700" />
            <span className="text-xs text-stone-500 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-stone-700" />
          </div>

          <div className="mt-8 space-y-3">
            <input
              type="email"
              placeholder="Email address"
              disabled
              className="w-full h-12 px-4 bg-stone-800/50 border border-stone-700 rounded-full text-white placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-stone-600 transition-colors disabled:opacity-50"
            />
            <button
              disabled
              className="w-full h-12 bg-stone-800/50 border border-stone-700 rounded-full text-stone-500 text-sm font-medium"
            >
              Coming soon
            </button>
          </div>

          <p className="text-center text-xs text-stone-500 mt-10 leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="#" className="text-stone-400 hover:text-white transition-colors">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-stone-400 hover:text-white transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-stone-500 text-sm">
            New to Architex?{" "}
            <Link href="/learn-more" className="text-white hover:text-stone-300 transition-colors font-medium">
              Learn more
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
