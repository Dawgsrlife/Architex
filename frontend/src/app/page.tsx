"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Navbar,
  HeroSection,
  WorkSection,
  ProcessSection,
  CTASection,
  Footer,
} from "@/components/landing";

export default function Home() {
  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      <Navbar />
      <HeroSection />
      <WorkSection />
      <ProcessSection />
      <CTASection />
      <Footer />
    </main>
  );
}
