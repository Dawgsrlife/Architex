"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function Navbar() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.5 }
    );
  }, []);

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between h-14 px-6 rounded-2xl bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-lg shadow-black/5">
          <span className="text-lg font-bold tracking-tight">Architex</span>
          
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="rounded-xl font-medium">Sign in</Button>
            </Link>
            <Link href="/workflow">
              <Button size="sm" className="rounded-xl font-medium bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(
        titleRef.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2 }
      )
        .fromTo(
          subtitleRef.current,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1 },
          "-=0.8"
        )
        .fromTo(
          ctaRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          "-=0.6"
        )
        .fromTo(
          visualRef.current,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.2 },
          "-=0.8"
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-20 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 
            ref={titleRef}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8"
          >
            Build architecture
            <br />
            <span className="bg-gradient-to-r from-accent via-accent/80 to-accent/60 bg-clip-text text-transparent">
              at the speed of thought
            </span>
          </h1>
          
          <p 
            ref={subtitleRef}
            className="text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Transform ideas into production-ready code. AI-powered architecture design that understands your vision.
          </p>
          
          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/workflow">
              <Button size="lg" className="h-14 px-8 text-base rounded-2xl bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 shadow-xl shadow-black/20">
                Start building free
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base rounded-2xl border-2">
                See how it works
              </Button>
            </Link>
          </div>
        </div>

        <div 
          ref={visualRef}
          className="mt-20 relative"
        >
          <div className="aspect-video max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-muted to-muted/50 border border-border/50 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />
            <div className="p-8 h-full flex items-center justify-center">
              <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-2xl bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-border/50 flex items-center justify-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-accent/20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".how-title",
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        }
      );

      stepsRef.current.forEach((step, i) => {
        gsap.fromTo(
          step,
          { x: i % 2 === 0 ? -100 : 100, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1,
            scrollTrigger: {
              trigger: step,
              start: "top 85%",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      num: "01",
      title: "Describe your vision",
      desc: "Tell us what you want to build in plain English. Our AI understands context, constraints, and best practices.",
      gradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
      num: "02",
      title: "Watch it come alive",
      desc: "See your architecture visualized in real-time. Drag, drop, and refine until it's perfect.",
      gradient: "from-purple-500/20 to-pink-500/20",
    },
    {
      num: "03",
      title: "Ship with confidence",
      desc: "Export production-ready code. TypeScript, tested, documented, and following your conventions.",
      gradient: "from-orange-500/20 to-red-500/20",
    },
  ];

  return (
    <section ref={sectionRef} id="how-it-works" className="py-32 lg:py-40 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="how-title text-center mb-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">How it works</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Three steps to production
          </h2>
        </div>
        
        <div className="space-y-8">
          {steps.map((step, i) => (
            <div
              key={step.num}
              ref={(el) => { if (el) stepsRef.current[i] = el; }}
              className={`relative p-8 lg:p-12 rounded-3xl bg-gradient-to-br ${step.gradient} border border-border/50 backdrop-blur-sm`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <span className="text-7xl lg:text-8xl font-bold text-foreground/10">{step.num}</span>
                <div>
                  <h3 className="text-2xl lg:text-3xl font-bold mb-3">{step.title}</h3>
                  <p className="text-lg text-muted-foreground max-w-xl">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".features-title",
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        }
      );

      cardsRef.current.forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 60, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            delay: i * 0.1,
            scrollTrigger: {
              trigger: card,
              start: "top 90%",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const features = [
    { icon: "✦", title: "AI-powered generation", desc: "Context-aware code that understands your project" },
    { icon: "◈", title: "Visual workflows", desc: "Drag-and-drop architecture builder" },
    { icon: "◎", title: "Voice control", desc: "Speak your architecture into existence" },
    { icon: "⬡", title: "GitHub integration", desc: "Push to repos, create branches, manage PRs" },
    { icon: "◉", title: "Live preview", desc: "See changes instantly with hot reload" },
    { icon: "◇", title: "Type safety", desc: "Full TypeScript with automatic inference" },
  ];

  return (
    <section ref={sectionRef} id="features" className="py-32 lg:py-40 bg-muted/30 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      
      <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="features-title text-center mb-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">Capabilities</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Everything you need
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for developers who ship fast.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              ref={(el) => { if (el) cardsRef.current[i] = el; }}
              className="group p-8 rounded-3xl bg-white dark:bg-white/5 border border-border/50 hover:border-accent/50 transition-all duration-500 hover:shadow-xl hover:shadow-accent/10"
            >
              <div className="text-3xl mb-6 w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const quotesRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      quotesRef.current.forEach((quote, i) => {
        gsap.fromTo(
          quote,
          { y: 80, opacity: 0, rotateX: 10 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 1,
            delay: i * 0.2,
            scrollTrigger: {
              trigger: quote,
              start: "top 85%",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const testimonials = [
    {
      quote: "Architex has completely transformed how I approach new projects. What used to take days now takes hours.",
      name: "Sarah Chen",
      role: "Senior Developer at Vercel",
    },
    {
      quote: "The AI understands exactly what I need. It's like having a senior architect always available.",
      name: "Marcus Johnson",
      role: "Tech Lead at Stripe",
    },
    {
      quote: "Finally, a tool that bridges the gap between ideation and implementation without compromise.",
      name: "Emily Rodriguez",
      role: "Founder at TechFlow",
    },
  ];

  return (
    <section ref={sectionRef} id="testimonials" className="py-32 lg:py-40">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">Testimonials</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Loved by developers
          </h2>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              ref={(el) => { if (el) quotesRef.current[i] = el; }}
              className="p-8 rounded-3xl bg-gradient-to-br from-muted/50 to-transparent border border-border/50"
            >
              <p className="text-lg leading-relaxed mb-8">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="font-bold">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".pricing-title",
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        }
      );

      cardsRef.current.forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 100, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            delay: i * 0.15,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 60%",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: ["5 generations/day", "Basic templates", "Community support"],
      cta: "Get started",
      featured: false,
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      features: ["Unlimited generations", "Advanced templates", "GitHub integration", "Voice commands", "Priority support"],
      cta: "Start free trial",
      featured: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      features: ["Everything in Pro", "Custom integrations", "SLA guarantee", "Dedicated support"],
      cta: "Contact sales",
      featured: false,
    },
  ];

  return (
    <section ref={sectionRef} id="pricing" className="py-32 lg:py-40 bg-muted/30 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/10 rounded-full blur-3xl" />
      
      <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="pricing-title text-center mb-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">Pricing</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-muted-foreground">Start free. Scale as you grow.</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              ref={(el) => { if (el) cardsRef.current[i] = el; }}
              className={`p-8 rounded-3xl border ${
                plan.featured
                  ? "bg-black text-white dark:bg-white dark:text-black border-transparent shadow-2xl scale-105"
                  : "bg-white dark:bg-white/5 border-border/50"
              }`}
            >
              <p className={`text-sm font-semibold uppercase tracking-widest mb-4 ${plan.featured ? "text-white/70 dark:text-black/70" : "text-muted-foreground"}`}>
                {plan.name}
              </p>
              <div className="mb-8">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className={plan.featured ? "text-white/70 dark:text-black/70" : "text-muted-foreground"}>{plan.period}</span>
              </div>
              <ul className={`space-y-4 mb-8 ${plan.featured ? "text-white/90 dark:text-black/90" : "text-muted-foreground"}`}>
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className={plan.featured ? "text-white dark:text-black" : "text-accent"}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/workflow">
                <Button
                  className={`w-full h-12 rounded-2xl font-medium ${
                    plan.featured
                      ? "bg-white text-black hover:bg-white/90 dark:bg-black dark:text-white dark:hover:bg-black/90"
                      : ""
                  }`}
                  variant={plan.featured ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".cta-content",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 lg:py-40">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="cta-content relative p-12 lg:p-20 rounded-[2.5rem] bg-gradient-to-br from-black to-black/90 dark:from-white dark:to-white/90 text-white dark:text-black text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/30 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Ready to ship faster?
            </h2>
            <p className="text-xl text-white/70 dark:text-black/70 mb-10 max-w-xl mx-auto">
              Join thousands of developers building smarter with Architex.
            </p>
            <Link href="/workflow">
              <Button size="lg" className="h-14 px-10 text-base rounded-2xl bg-white text-black hover:bg-white/90 dark:bg-black dark:text-white dark:hover:bg-black/90 shadow-xl">
                Get started free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-16 border-t border-border">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
          <div>
            <span className="text-2xl font-bold tracking-tight">Architex</span>
            <p className="text-muted-foreground mt-3 max-w-xs">
              AI-powered architecture design for modern developers.
            </p>
          </div>
          
          <div className="flex gap-16 text-sm">
            <div className="space-y-4">
              <p className="font-semibold">Product</p>
              <a href="#features" className="block text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="block text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            </div>
            <div className="space-y-4">
              <p className="font-semibold">Connect</p>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Twitter</a>
            </div>
            <div className="space-y-4">
              <p className="font-semibold">Legal</p>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            </div>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Architex. All rights reserved.</span>
          <span>Built with AI, for builders.</span>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
