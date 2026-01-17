"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Logo, LogoMark } from "@/components/Logo";

gsap.registerPlugin(ScrollTrigger);

function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.5 }
    );

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-4">
        <div className={`flex items-center justify-between h-16 px-6 rounded-2xl transition-all duration-500 ${
          scrolled 
            ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5" 
            : "bg-transparent"
        }`}>
          <Logo size="sm" animated={false} />
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#work" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Work</a>
            <a href="#process" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Process</a>
            <a href="#pricing" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</a>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="rounded-full font-medium hidden sm:inline-flex">Sign in</Button>
            </Link>
            <Link href="/workflow">
              <Button size="sm" className="rounded-full font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 px-6">
                Start Project
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
  const titleLinesRef = useRef<HTMLSpanElement[]>([]);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.set(titleLinesRef.current, { y: 120, opacity: 0 })
        .set(subtitleRef.current, { y: 40, opacity: 0 })
        .set(ctaRef.current, { y: 30, opacity: 0 })
        .set(".hero-card", { y: 60, opacity: 0, rotateY: -15 })
        .set(videoRef.current, { scale: 0.9, opacity: 0 });

      tl.to(titleLinesRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.08,
      })
        .to(subtitleRef.current, { y: 0, opacity: 1, duration: 1 }, "-=0.7")
        .to(ctaRef.current, { y: 0, opacity: 1, duration: 0.8 }, "-=0.5")
        .to(".hero-card", {
          y: 0,
          opacity: 1,
          rotateY: 0,
          duration: 1,
          stagger: 0.12,
        }, "-=0.8")
        .to(videoRef.current, { scale: 1, opacity: 1, duration: 1.2 }, "-=0.8");

      gsap.to(gridRef.current, {
        y: -50,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        },
      });

      gsap.to(videoRef.current, {
        y: -30,
        scale: 1.05,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 2,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const heroImages = [
    "/assets/pexels-cottonbro-9665180.jpg",
    "/assets/pexels-cottonbro-9667824.jpg",
    "/assets/pexels-jakubzerdzicki-29521529.jpg",
    "/assets/pexels-picjumbo-com-55570-196644.jpg",
  ];

  return (
    <section ref={heroRef} className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(74,222,128,0.1),transparent_50%)]" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
          <div ref={gridRef} className="grid grid-cols-2 gap-4 order-2 lg:order-1">
            {heroImages.map((img, i) => (
              <div
                key={i}
                className="hero-card group relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
                style={{ perspective: "1000px" }}
              >
                <div className="absolute inset-0 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-white/10 shadow-xl">
                  <Image
                    src={img}
                    alt={`Project ${i + 1}`}
                    fill
                    className="object-cover rounded-2xl transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                    <span className="text-white text-sm font-medium">0{i + 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="order-1 lg:order-2 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-slate-200/50 dark:border-white/10 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Now accepting projects</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              <span ref={(el) => { if (el) titleLinesRef.current[0] = el; }} className="block">
                Architecture
              </span>
              <span ref={(el) => { if (el) titleLinesRef.current[1] = el; }} className="block text-slate-400 dark:text-slate-500">
                that tells
              </span>
              <span ref={(el) => { if (el) titleLinesRef.current[2] = el; }} className="block bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                your story
              </span>
            </h1>

            <p ref={subtitleRef} className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
              We craft digital experiences that transform complex systems into elegant, intuitive interfaces. From concept to production.
            </p>

            <div ref={ctaRef} className="flex flex-wrap gap-4">
              <Link href="/workflow">
                <Button size="lg" className="h-14 px-8 rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-xl shadow-slate-900/20 dark:shadow-white/20 group">
                  Start your project
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
              <Link href="#work">
                <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                  View our work
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div ref={videoRef} className="mt-16 relative">
          <div className="aspect-[21/9] rounded-3xl overflow-hidden bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-2xl">
            <video autoPlay loop muted playsInline className="w-full h-full object-cover">
              <source src="/assets/12777809_3840_2160_30fps.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Ticker({ reverse = false }: { reverse?: boolean }) {
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(tickerRef.current, {
        xPercent: reverse ? 100 : -100,
        repeat: -1,
        duration: 30,
        ease: "none",
      });
    }, tickerRef);
    return () => ctx.revert();
  }, [reverse]);

  const items = ["Architecture", "Design Systems", "React Flow", "Node Interfaces", "Data Pipelines", "Visual Editors"];

  return (
    <div className="overflow-hidden py-6 bg-slate-100 dark:bg-slate-900/50">
      <div ref={tickerRef} className="flex gap-8 whitespace-nowrap">
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-8 text-2xl font-bold text-slate-300 dark:text-slate-700">
            {item}
            <span className="text-violet-500">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function WorkSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current, 
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, scrollTrigger: { trigger: sectionRef.current, start: "top 70%" }}
      );

      cardsRef.current.forEach((card, i) => {
        gsap.fromTo(card,
          { y: 100, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 1, delay: i * 0.1, scrollTrigger: { trigger: card, start: "top 85%" }}
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const works = [
    { num: "001", title: "Flow Builder", desc: "Visual node editor for complex workflows", video: "/assets/13678999_1920_1080_25fps.mp4" },
    { num: "002", title: "Data Canvas", desc: "Real-time data visualization platform", video: "/assets/14471955_3840_2160_30fps.mp4" },
    { num: "003", title: "Pipeline Studio", desc: "Enterprise-grade pipeline orchestration", video: "/assets/6346217-uhd_4096_2160_25fps.mp4" },
  ];

  return (
    <section ref={sectionRef} id="work" className="py-32 relative overflow-hidden bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div ref={titleRef} className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-20">
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-4 block">Selected Work</span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Crafted with
              <br />
              <span className="text-slate-400 dark:text-slate-600">precision</span>
            </h2>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md">
            Each project is a unique exploration of form and function, designed to push boundaries.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {works.map((work, i) => (
            <div
              key={work.num}
              ref={(el) => { if (el) cardsRef.current[i] = el; }}
              className="group relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 hover:border-violet-500/50 transition-all duration-500"
            >
              <div className="aspect-[4/3] relative overflow-hidden">
                <video autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                  <source src={work.video} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="text-violet-400 text-sm font-mono mb-2 block">{work.num}</span>
                <h3 className="text-2xl font-bold text-white mb-2">{work.title}</h3>
                <p className="text-slate-400 text-sm">{work.desc}</p>
              </div>
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      stepsRef.current.forEach((step, i) => {
        const direction = i % 2 === 0 ? -100 : 100;
        gsap.fromTo(step,
          { x: direction, opacity: 0 },
          { x: 0, opacity: 1, duration: 1.2, ease: "power4.out", scrollTrigger: { trigger: step, start: "top 80%" }}
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const steps = [
    { num: "01", title: "Discovery", desc: "Deep dive into your vision, constraints, and goals. We map out the entire system architecture.", gradient: "from-violet-500 to-purple-600" },
    { num: "02", title: "Design", desc: "Visual prototyping with real-time collaboration. See your architecture take shape before any code.", gradient: "from-purple-500 to-pink-600" },
    { num: "03", title: "Develop", desc: "Production-grade implementation with TypeScript, testing, and documentation built in.", gradient: "from-pink-500 to-rose-600" },
    { num: "04", title: "Deploy", desc: "Seamless deployment to your infrastructure. Monitoring, scaling, and ongoing support.", gradient: "from-rose-500 to-orange-600" },
  ];

  return (
    <section ref={sectionRef} id="process" className="py-32 relative overflow-hidden bg-slate-50 dark:bg-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_70%)]" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-24">
          <span className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-4 block">Our Process</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            From concept to
            <br />
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">production</span>
          </h2>
        </div>

        <div className="space-y-8">
          {steps.map((step, i) => (
            <div
              key={step.num}
              ref={(el) => { if (el) stepsRef.current[i] = el; }}
              className="group relative p-8 lg:p-12 rounded-3xl bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 hover:border-violet-500/30 transition-all duration-500 overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${step.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left`} />
              
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                <span className={`text-7xl lg:text-9xl font-bold bg-gradient-to-br ${step.gradient} bg-clip-text text-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500`}>
                  {step.num}
                </span>
                <div className="flex-1">
                  <h3 className="text-3xl lg:text-4xl font-bold mb-4">{step.title}</h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">{step.desc}</p>
                </div>
                <div className="hidden lg:flex w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center group-hover:bg-violet-500 transition-colors duration-500">
                  <svg className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, i) => {
        gsap.fromTo(card,
          { y: 80, opacity: 0, rotateX: 10 },
          { y: 0, opacity: 1, rotateX: 0, duration: 1.2, delay: i * 0.15, scrollTrigger: { trigger: card, start: "top 85%" }}
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const testimonials = [
    { quote: "Architex transformed our entire workflow infrastructure. The attention to detail and execution was flawless.", name: "Sarah Chen", role: "CTO, DataFlow", image: "/assets/pexels-cottonbro-9665180.jpg" },
    { quote: "Working with their team felt like having an extension of our own engineering department.", name: "Marcus Johnson", role: "VP Engineering, Nexus", image: "/assets/pexels-cottonbro-9667824.jpg" },
    { quote: "The visual architecture system they built has become the backbone of our entire operation.", name: "Emily Rodriguez", role: "Founder, TechScale", image: "/assets/pexels-jakubzerdzicki-29521529.jpg" },
  ];

  return (
    <section ref={sectionRef} className="py-32 relative overflow-hidden bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-4 block">Testimonials</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Trusted by
            <span className="text-slate-400 dark:text-slate-600"> leaders</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              ref={(el) => { if (el) cardsRef.current[i] = el; }}
              className="group relative rounded-3xl overflow-hidden"
              style={{ perspective: "1000px" }}
            >
              <div className="absolute inset-0">
                <Image src={t.image} alt={t.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
              </div>
              <div className="relative p-8 pt-56">
                <p className="text-lg text-white/90 leading-relaxed mb-8">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-violet-500/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-violet-400 font-bold">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-bold text-white">{t.name}</p>
                    <p className="text-sm text-white/60">{t.role}</p>
                  </div>
                </div>
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
      cardsRef.current.forEach((card, i) => {
        gsap.fromTo(card,
          { y: 100, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, delay: i * 0.15, scrollTrigger: { trigger: sectionRef.current, start: "top 60%" }}
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const plans = [
    { name: "Starter", price: "$0", period: "to start", features: ["5 projects", "Basic templates", "Community support", "Standard exports"], cta: "Get started", featured: false },
    { name: "Professional", price: "$49", period: "/month", features: ["Unlimited projects", "Premium templates", "Priority support", "Advanced integrations", "Team collaboration"], cta: "Start trial", featured: true },
    { name: "Enterprise", price: "Custom", period: "", features: ["Everything in Pro", "Custom solutions", "Dedicated support", "SLA guarantee", "On-premise option"], cta: "Contact us", featured: false },
  ];

  return (
    <section ref={sectionRef} id="pricing" className="py-32 relative overflow-hidden bg-slate-50 dark:bg-slate-900">
      <div className="absolute inset-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-5">
          <source src="/assets/12981875_2160_4096_60fps.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 dark:from-slate-900 via-transparent to-slate-50 dark:to-slate-900" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <span className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-4 block">Pricing</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Simple, transparent
            <br />
            <span className="text-slate-400 dark:text-slate-600">pricing</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8" style={{ perspective: "1000px" }}>
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              ref={(el) => { if (el) cardsRef.current[i] = el; }}
              className={`relative p-8 rounded-3xl backdrop-blur-xl transition-all duration-500 hover:scale-105 ${
                plan.featured
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-2 border-violet-500 shadow-2xl shadow-violet-500/20 lg:-mt-4 lg:mb-4"
                  : "bg-white/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-violet-500 text-white text-sm font-medium">
                  Most Popular
                </div>
              )}
              <p className={`text-sm font-semibold uppercase tracking-widest mb-4 ${plan.featured ? "text-violet-300 dark:text-violet-600" : "text-slate-500"}`}>
                {plan.name}
              </p>
              <div className="mb-8">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className={plan.featured ? "text-white/60 dark:text-slate-600" : "text-slate-500"}>{plan.period}</span>
              </div>
              <ul className={`space-y-4 mb-8 ${plan.featured ? "text-white/90 dark:text-slate-700" : "text-slate-600 dark:text-slate-400"}`}>
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className={plan.featured ? "text-violet-400 dark:text-violet-600" : "text-violet-500"}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/workflow">
                <Button className={`w-full h-12 rounded-full font-medium ${
                  plan.featured
                    ? "bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                    : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                }`}>
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
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(contentRef.current,
        { y: 80, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 1.2, scrollTrigger: { trigger: sectionRef.current, start: "top 70%" }}
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div ref={contentRef} className="relative rounded-[2.5rem] overflow-hidden">
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src="/assets/12575318_3840_2160_30fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-slate-950/80" />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 to-purple-600/30" />

          <div className="relative z-10 p-12 lg:p-24 text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-white">
              Ready to start
              <br />
              <span className="text-violet-300">your project?</span>
            </h2>
            <p className="text-xl lg:text-2xl text-white/70 mb-12 max-w-2xl mx-auto">
              Let&apos;s build something extraordinary together.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/workflow">
                <Button size="lg" className="h-16 px-10 rounded-full bg-white text-slate-900 hover:bg-slate-100 shadow-2xl group">
                  Start your project
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
              <a href="mailto:hello@architex.dev">
                <Button variant="outline" size="lg" className="h-16 px-10 rounded-full border-2 border-white/30 text-white hover:bg-white/10">
                  Get in touch
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-20 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-2">
            <Logo size="lg" animated={false} />
            <p className="text-slate-600 dark:text-slate-400 mt-4 max-w-md">
              Crafting digital architecture for modern teams. From concept to production, we build systems that scale.
            </p>
          </div>

          <div className="space-y-4">
            <p className="font-semibold">Product</p>
            <a href="#work" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Work</a>
            <a href="#process" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Process</a>
            <a href="#pricing" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="space-y-4">
            <p className="font-semibold">Connect</p>
            <a href="#" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">GitHub</a>
            <a href="#" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Twitter</a>
            <a href="mailto:hello@architex.dev" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">hello@architex.dev</a>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <span>&copy; {new Date().getFullYear()} Architex. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</a>
          </div>
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
      <Ticker />
      <WorkSection />
      <Ticker reverse />
      <ProcessSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
