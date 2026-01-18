"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-24 bg-white border-t border-stone-100">
      <div className="max-w-6xl mx-auto px-8 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
          <div className="flex items-center gap-2">
            <span className="text-stone-900 font-display font-bold tracking-tight">Architex</span>
            <span className="text-stone-300 text-xs">&copy; {new Date().getFullYear()}</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-12 gap-y-4">
            <a href="#work" className="text-[11px] text-stone-500 hover:text-stone-900 transition-colors tracking-widest uppercase font-medium">Work</a>
            <a href="#process" className="text-[11px] text-stone-500 hover:text-stone-900 transition-colors tracking-widest uppercase font-medium">Process</a>
            <Link href="/login" className="text-[11px] text-stone-500 hover:text-stone-900 transition-colors tracking-widest uppercase font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
