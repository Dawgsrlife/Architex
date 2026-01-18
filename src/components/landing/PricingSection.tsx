"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { plans } from "@/data/landing";

gsap.registerPlugin(ScrollTrigger);

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, i) => {
        gsap.fromTo(card,
          { y: 100, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, delay: i * 0.15, scrollTrigger: { trigger: sectionRef.current, start: "top 60%" } }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="pricing" className="py-48 relative overflow-hidden bg-stone-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(124,58,237,0.05),transparent_50%)]" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Flexible Plans</span>
          </div>
          <h2 className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6">
            Scale with<br />
            <span className="text-stone-500">Confidence</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8" style={{ perspective: "2000px" }}>
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              ref={(el) => { if (el) cardsRef.current[i] = el; }}
              className={`relative p-10 rounded-[2rem] backdrop-blur-xl transition-all duration-500 group overflow-hidden ${plan.featured
                ? "bg-stone-900/50 border-2 border-[#7c3aed]/50 shadow-[0_0_50px_-12px_rgba(124,58,237,0.3)] lg:-mt-4 lg:mb-4"
                : "bg-stone-900/30 border border-stone-800 hover:border-stone-700"
                }`}
            >
              {plan.featured && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#7c3aed] to-transparent" />}

              <div className="relative z-10">
                <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-8 ${plan.featured ? "text-[#a78bfa]" : "text-stone-500"}`}>
                  {plan.name}
                </p>
                <div className="mb-10">
                  <span className="text-6xl font-bold text-white">{plan.price}</span>
                  <span className="text-stone-500 ml-2">{plan.period}</span>
                </div>

                <ul className="space-y-5 mb-12">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-stone-300">
                      <div className="w-5 h-5 rounded-full bg-[#7c3aed]/10 flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#a78bfa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/workflow">
                  <Button className={`w-full h-14 rounded-2xl font-bold text-sm transition-all duration-300 ${plan.featured
                    ? "bg-[#7c3aed] text-white hover:bg-[#6d28d9] shadow-lg shadow-[#7c3aed]/25 hover:shadow-[#7c3aed]/40 hover:-translate-y-1"
                    : "bg-white text-stone-900 hover:bg-stone-100 hover:-translate-y-1"
                    }`}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
