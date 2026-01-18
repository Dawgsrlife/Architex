"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const workItems = [
  { 
    title: "Full-stack applications", 
    image: "/assets/pexels-thisisengineering-3862377.jpg"
  },
  { 
    title: "API architectures", 
    image: "/assets/pexels-cottonbro-9667824.jpg"
  },
  { 
    title: "Data pipelines", 
    image: "/assets/pexels-cottonbro-9665180.jpg"
  },
  { 
    title: "Cloud infrastructure", 
    image: "/assets/pexels-tima-miroshnichenko-6615230.jpg"
  },
];

export function WorkSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 40 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1,
          scrollTrigger: { trigger: sectionRef.current, start: "top 60%" }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="work" className="py-32 lg:py-48 bg-white">
      <div className="max-w-6xl mx-auto px-8 lg:px-12">
        <div ref={contentRef}>
          <p className="text-stone-400 text-[10px] tracking-[0.2em] uppercase mb-6 font-medium">Capabilities</p>
          <h2 className="text-[clamp(2.5rem,5vw,3.5rem)] font-medium text-stone-900 tracking-tight leading-[1.1] mb-16 font-display">
            Built to scale.
          </h2>

          <div className="space-y-0 border-t border-stone-200">
            {workItems.map((item, i) => (
              <div 
                key={i} 
                className="border-b border-stone-200"
              >
                <button
                  onClick={() => setExpandedItem(expandedItem === i ? null : i)}
                  className="w-full py-6 flex items-center justify-between group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                    <span className="text-stone-300 text-xs font-medium tabular-nums">0{i + 1}</span>
                    <span className="text-stone-900 text-xl font-medium tracking-tight group-hover:text-stone-600 transition-colors">{item.title}</span>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-stone-400 transition-transform duration-300 ${expandedItem === i ? "rotate-180" : ""}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div className={`grid transition-all duration-500 ease-out ${expandedItem === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <div className="pb-8 pl-12">
                      <div className="relative aspect-[16/10] max-w-md overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                        <Image 
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
