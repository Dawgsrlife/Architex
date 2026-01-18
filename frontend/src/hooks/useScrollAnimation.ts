"use client";

import { useEffect, RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useFadeInOnScroll(
  ref: RefObject<HTMLElement | null>,
  options?: { y?: number; duration?: number; start?: string }
) {
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { y: options?.y ?? 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: options?.duration ?? 1,
          scrollTrigger: { trigger: ref.current, start: options?.start ?? "top 70%" },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [ref, options]);
}

export function useStaggerFadeIn(
  containerRef: RefObject<HTMLElement | null>,
  itemsRef: RefObject<HTMLElement[]>,
  options?: { y?: number; duration?: number; stagger?: number; start?: string }
) {
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      itemsRef.current.forEach((item, i) => {
        if (!item) return;
        gsap.fromTo(
          item,
          { y: options?.y ?? 100, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: options?.duration ?? 1,
            delay: i * (options?.stagger ?? 0.1),
            scrollTrigger: { trigger: item, start: options?.start ?? "top 85%" },
          }
        );
      });
    }, containerRef);
    return () => ctx.revert();
  }, [containerRef, itemsRef, options]);
}

export function useParallax(
  ref: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
  options?: { y?: number; scale?: number }
) {
  useEffect(() => {
    if (!ref.current || !triggerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(ref.current, {
        y: options?.y ?? -50,
        scale: options?.scale ?? 1.02,
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 2,
        },
      });
    }, triggerRef);
    return () => ctx.revert();
  }, [ref, triggerRef, options]);
}
