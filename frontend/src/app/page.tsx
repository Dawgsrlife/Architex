"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Navbar,
  HeroSection,
  WorkSection,
  ProcessSection,
  CTASection,
  Footer,
} from "@/components/landing";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
      </main>
    );
  }

  if (isAuthenticated) {
    return null;
  }

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
