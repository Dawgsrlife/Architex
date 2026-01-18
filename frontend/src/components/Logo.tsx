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
    md: { width: 40, height: 40, text: "text-xl" },
    lg: { width: 56, height: 56, text: "text-3xl" },
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
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="12"
          fill="#1c1917"
        />
        <path
          d="M14 34L24 14L34 34"
          stroke="#fafaf9"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 28H31"
          stroke="#a1a1aa"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle
          cx="24"
          cy="14"
          r="3"
          fill="#fafaf9"
        />
      </svg>
      <span className={`font-display font-bold tracking-tight ${sizes[size].text} text-stone-900`}>
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
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="#1c1917"
      />
      <path
        d="M14 34L24 14L34 34"
        stroke="#fafaf9"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 28H31"
        stroke="#a1a1aa"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle
        cx="24"
        cy="14"
        r="3"
        fill="#fafaf9"
      />
    </svg>
  );
}
