"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const chapters = [
  { 
    word: "Draw", 
    video: "/assets/12575318_3840_2160_30fps.mp4"
  },
  { 
    word: "Define", 
    video: "/assets/12777809_3840_2160_30fps.mp4"
  },
  { 
    word: "Generate", 
    video: "/assets/6346217-uhd_4096_2160_25fps.mp4"
  },
  { 
    word: "Deploy", 
    video: "/assets/3129671-uhd_3840_2160_30fps.mp4"
  },
];

export function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      itemsRef.current.forEach((item) => {
        gsap.fromTo(item,
          { opacity: 0.15 },
          {
            opacity: 1,
            duration: 0.5,
            scrollTrigger: {
              trigger: item,
              start: "top 60%",
              end: "top 30%",
              scrub: true,
            }
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="process" className="py-40 bg-white">
      <div className="max-w-6xl mx-auto px-8 lg:px-12">
        <p className="text-stone-400 text-[10px] tracking-[0.2em] uppercase mb-24 font-medium">Process</p>
        
        <div className="space-y-32">
          {chapters.map((chapter, i) => (
            <div
              key={chapter.word}
              ref={(el) => { if (el) itemsRef.current[i] = el; }}
              className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
            >
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <span className="text-stone-300 text-xs font-medium mb-4 block">0{i + 1}</span>
                <h3 className="text-[clamp(3rem,8vw,5rem)] font-medium text-stone-900 tracking-tight leading-none font-display">
                  {chapter.word}
                </h3>
              </div>
              
              <div className={`relative aspect-video overflow-hidden bg-stone-100 ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-500"
                >
                  <source src={chapter.video} type="video/mp4" />
                </video>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
