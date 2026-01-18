"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Github } from "lucide-react";
import gsap from "gsap";

export default function LoginPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out", delay: 0.2 }
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
          className="w-full h-full object-cover opacity-30 grayscale"
        >
          <source src="/assets/14471955_3840_2160_30fps.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/50 via-stone-950/70 to-stone-950" />
      </div>

      <Link
        href="/"
        className="absolute top-8 left-8 z-20 text-sm font-display font-bold tracking-tight text-white hover:text-stone-300 transition-colors"
      >
        Architex
      </Link>

      <div ref={cardRef} className="relative z-10 w-full max-w-md mx-4">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-stone-700/20 via-stone-600/10 to-stone-700/20 rounded-3xl blur-xl" />
          
          <div className="relative bg-stone-900/80 backdrop-blur-2xl border border-stone-800/50 rounded-2xl p-10">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-display font-medium tracking-tight text-white mb-3">
                Welcome back
              </h1>
              <p className="text-stone-400 text-sm">
                Sign in to continue architecting
              </p>
            </div>

            <button
              onClick={handleLogin}
              className="group w-full relative overflow-hidden bg-white text-stone-950 rounded-xl h-14 font-medium text-sm transition-all duration-300 hover:shadow-lg hover:shadow-white/10 active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-stone-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-3">
                <Github className="w-5 h-5" />
                Continue with GitHub
              </span>
            </button>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-stone-800" />
              <span className="text-xs text-stone-600 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-stone-800" />
            </div>

            <div className="mt-8 space-y-3">
              <input
                type="email"
                placeholder="Email address"
                disabled
                className="w-full h-12 px-4 bg-stone-800/50 border border-stone-700/50 rounded-xl text-white placeholder-stone-500 text-sm focus:outline-none focus:border-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                disabled
                className="w-full h-12 bg-stone-800/50 border border-stone-700/50 rounded-xl text-stone-500 text-sm font-medium cursor-not-allowed"
              >
                Coming soon
              </button>
            </div>

            <p className="text-center text-xs text-stone-600 mt-10 leading-relaxed">
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
        </div>

        <div className="mt-8 text-center">
          <p className="text-stone-500 text-sm">
            New to Architex?{" "}
            <Link href="/" className="text-white hover:text-stone-300 transition-colors font-medium">
              Learn more
            </Link>
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-stone-950 to-transparent pointer-events-none" />
    </div>
  );
}
