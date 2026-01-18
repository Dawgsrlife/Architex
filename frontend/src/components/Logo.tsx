"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface LogoProps {
  className?: string;
  animated?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", animated = true, size = "md" }: LogoProps) {
  const logoRef = useRef<SVGSVGElement>(null);

  const sizes = {
    sm: { width: 32, height: 32, text: "text-lg" },
    md: { width: 40, height: 40, text: "text-2xl" },
    lg: { width: 56, height: 56, text: "text-4xl" },
  };

  useEffect(() => {
    if (!animated || !logoRef.current) return;

    const paths = logoRef.current.querySelectorAll("path");
    gsap.set(paths, { strokeDasharray: 100, strokeDashoffset: 100 });
    gsap.to(paths, {
      strokeDashoffset: 0,
      duration: 1.5,
      stagger: 0.1,
      ease: "power2.out",
    });
  }, [animated]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        ref={logoRef}
        width={sizes[size].width}
        height={sizes[size].height}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="12"
          fill="white"
          className="shadow-inner"
        />
        <path
          d="M14 34L24 14L34 34"
          stroke="url(#logo-gradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 28H30"
          stroke="#7c3aed"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.8"
        />
        <circle
          cx="24"
          cy="14"
          r="3.5"
          fill="#7c3aed"
        />
      </svg>
      <span className={`font-bold tracking-tight ${sizes[size].text} text-stone-900 dark:text-white`}>
        Architex
      </span>
    </div>
  );
}

export function LogoMark({ className = "", size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logomark-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="white"
      />
      <path
        d="M14 34L24 14L34 34"
        stroke="url(#logomark-gradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 28H30"
        stroke="#7c3aed"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      <circle
        cx="24"
        cy="14"
        r="3.5"
        fill="#7c3aed"
      />
    </svg>
  );
}
