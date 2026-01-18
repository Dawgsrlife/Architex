"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Github, ArrowLeft } from "lucide-react";
import gsap from "gsap";

export default function LoginPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    window.location.href = `${apiUrl}/api/auth/github`;
  };

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center bg-stone-50">
      <Link
        href="/"
        className="absolute top-8 left-8 z-20 flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-display font-bold tracking-tight text-stone-900">
          Architex
        </span>
      </Link>

      <div ref={cardRef} className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-10 shadow-sm">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-display font-medium tracking-tight text-stone-900 mb-2">
              Welcome back
            </h1>
            <p className="text-stone-500 text-sm">
              Sign in to continue building
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="group w-full bg-stone-900 text-white rounded-xl h-12 font-medium text-sm transition-all hover:bg-stone-800 active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-3">
              <Github className="w-5 h-5" />
              Continue with GitHub
            </span>
          </button>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <div className="mt-8 space-y-3">
            <input
              type="email"
              placeholder="Email address"
              disabled
              className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300 transition-colors disabled:opacity-50"
            />
            <button
              disabled
              className="w-full h-12 bg-stone-100 border border-stone-200 rounded-xl text-stone-400 text-sm font-medium"
            >
              Coming soon
            </button>
          </div>

          <p className="text-center text-xs text-stone-400 mt-10 leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="#" className="text-stone-600 hover:text-stone-900 transition-colors">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-stone-600 hover:text-stone-900 transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-stone-500 text-sm">
            New to Architex?{" "}
            <Link href="/learn-more" className="text-stone-900 hover:text-stone-600 transition-colors font-medium">
              Learn more
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
