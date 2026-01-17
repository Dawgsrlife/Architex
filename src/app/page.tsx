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
            ? "bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/50 dark:border-stone-700/50 shadow-lg shadow-black/5" 
            : "bg-transparent"
        }`}>
          <Logo size="sm" animated={false} />
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#work" className="text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors">Work</a>
            <a href="#process" className="text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors">Process</a>
            <a href="#pricing" className="text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors">Pricing</a>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="rounded-full font-medium hidden sm:inline-flex">Sign in</Button>
            </Link>
            <Link href="/workflow">
              <Button size="sm" className="rounded-full font-medium bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 px-6">
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
    <section ref={heroRef} className="min-h-screen relative overflow-hidden bg-stone-50 dark:bg-stone-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(167,139,250,0.08),transparent_50%)]" />
      
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-stone-200/50 dark:border-stone-700/50 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse" />
              <span className="text-sm font-medium text-stone-600 dark:text-stone-300">Now accepting projects</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              <span ref={(el) => { if (el) titleLinesRef.current[0] = el; }} className="block">
                Architecture
              </span>
              <span ref={(el) => { if (el) titleLinesRef.current[1] = el; }} className="block text-stone-400 dark:text-stone-500">
                that tells
              </span>
              <span ref={(el) => { if (el) titleLinesRef.current[2] = el; }} className="block bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#7c3aed] bg-clip-text text-transparent">
                your story
              </span>
            </h1>

            <p ref={subtitleRef} className="text-lg lg:text-xl text-stone-600 dark:text-stone-400 max-w-lg leading-relaxed">
              We craft digital experiences that transform complex systems into elegant, intuitive interfaces. From concept to production.
            </p>

            <div ref={ctaRef} className="flex flex-wrap gap-4">
              <Link href="/workflow">
                <Button size="lg" className="h-14 px-8 rounded-full bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 shadow-xl shadow-stone-900/20 dark:shadow-white/20 group">
                  Start your project
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
              <Link href="#work">
                <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-2 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800">
                  View our work
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div ref={videoRef} className="mt-16 relative">
          <div className="aspect-[21/9] rounded-3xl overflow-hidden bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-stone-200/30 dark:border-stone-700/30 shadow-2xl">
            <video autoPlay loop muted playsInline className="w-full h-full object-cover">
              <source src="/assets/12777809_3840_2160_30fps.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Ticker({ reverse = false }: { reverse?: boolean }) {
  const items = ["Architecture", "Design Systems", "React Flow", "Node Interfaces", "Data Pipelines", "Visual Editors"];

  return (
    <div className="overflow-hidden py-6 bg-stone-100 dark:bg-stone-900/50">
      <div 
        className={`flex gap-8 whitespace-nowrap ${reverse ? "animate-ticker-reverse" : "animate-ticker"}`}
        style={{ width: "max-content" }}
      >
        {[...items, ...items, ...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-8 text-2xl font-bold text-stone-300 dark:text-stone-700">
            {item}
            <span className="text-[#7c3aed]">✦</span>
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
    <section ref={sectionRef} id="work" className="py-32 relative overflow-hidden bg-white dark:bg-stone-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div ref={titleRef} className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-20">
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-[#7c3aed] dark:text-[#a78bfa] mb-4 block">Selected Work</span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Crafted with
              <br />
              <span className="text-stone-400 dark:text-stone-600">precision</span>
            </h2>
          </div>
          <p className="text-lg text-stone-600 dark:text-stone-400 max-w-md">
            Each project is a unique exploration of form and function, designed to push boundaries.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {works.map((work, i) => (
            <div
              key={work.num}
              ref={(el) => { if (el) cardsRef.current[i] = el; }}
              className="group relative rounded-3xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800 hover:border-[#7c3aed]/50 transition-all duration-500"
            >
              <div className="aspect-[4/3] relative overflow-hidden">
                <video autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                  <source src={work.video} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="text-[#a78bfa] text-sm font-mono mb-2 block">{work.num}</span>
                <h3 className="text-2xl font-bold text-white mb-2">{work.title}</h3>
                <p className="text-stone-400 text-sm">{work.desc}</p>
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
    { num: "01", title: "Discovery", desc: "Deep dive into your vision, constraints, and goals. We map out the entire system architecture.", gradient: "from-[#7c3aed] to-[#a78bfa]" },
    { num: "02", title: "Design", desc: "Visual prototyping with real-time collaboration. See your architecture take shape before any code.", gradient: "from-[#a78bfa] to-[#c4b5fd]" },
    { num: "03", title: "Develop", desc: "Production-grade implementation with TypeScript, testing, and documentation built in.", gradient: "from-[#7c3aed] to-[#5b21b6]" },
    { num: "04", title: "Deploy", desc: "Seamless deployment to your infrastructure. Monitoring, scaling, and ongoing support.", gradient: "from-[#5b21b6] to-[#7c3aed]" },
  ];

  return (
    <section ref={sectionRef} id="process" className="py-32 relative overflow-hidden bg-stone-50 dark:bg-stone-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.06),transparent_70%)]" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-24">
          <span className="text-sm font-semibold uppercase tracking-widest text-[#7c3aed] dark:text-[#a78bfa] mb-4 block">Our Process</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            From concept to
            <br />
            <span className="bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#7c3aed] bg-clip-text text-transparent">production</span>
          </h2>
        </div>

        <div className="space-y-8">
          {steps.map((step, i) => (
            <div
              key={step.num}
              ref={(el) => { if (el) stepsRef.current[i] = el; }}
              className="group relative p-8 lg:p-12 rounded-3xl bg-white/80 dark:bg-stone-800/50 backdrop-blur-xl border border-stone-200/50 dark:border-stone-700/50 hover:border-[#7c3aed]/30 transition-all duration-500 overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${step.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left`} />
              
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                <span className={`text-7xl lg:text-9xl font-bold bg-gradient-to-br ${step.gradient} bg-clip-text text-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500`}>
                  {step.num}
                </span>
                <div className="flex-1">
                  <h3 className="text-3xl lg:text-4xl font-bold mb-4">{step.title}</h3>
                  <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl">{step.desc}</p>
                </div>
                <div className="hidden lg:flex w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-700 items-center justify-center group-hover:bg-[#7c3aed] transition-colors duration-500">
                  <svg className="w-6 h-6 text-stone-400 group-hover:text-white transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <section ref={sectionRef} className="py-32 relative overflow-hidden bg-white dark:bg-stone-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="text-sm font-semibold uppercase tracking-widest text-[#7c3aed] dark:text-[#a78bfa] mb-4 block">Testimonials</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Trusted by
            <span className="text-stone-400 dark:text-stone-600"> leaders</span>
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
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-950/20" />
              </div>
              <div className="relative p-8 pt-56">
                <p className="text-lg text-white/90 leading-relaxed mb-8">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#7c3aed]/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-[#a78bfa] font-bold">{t.name[0]}</span>
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
    <section ref={sectionRef} id="pricing" className="py-32 relative overflow-hidden bg-stone-50 dark:bg-stone-900">
      <div className="absolute inset-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-5">
          <source src="/assets/12981875_2160_4096_60fps.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-stone-50 dark:from-stone-900 via-transparent to-stone-50 dark:to-stone-900" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <span className="text-sm font-semibold uppercase tracking-widest text-[#7c3aed] dark:text-[#a78bfa] mb-4 block">Pricing</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Simple, transparent
            <br />
            <span className="text-stone-400 dark:text-stone-600">pricing</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8" style={{ perspective: "1000px" }}>
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              ref={(el) => { if (el) cardsRef.current[i] = el; }}
              className={`relative p-8 rounded-3xl backdrop-blur-xl transition-all duration-500 hover:scale-105 ${
                plan.featured
                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-2 border-[#7c3aed] shadow-2xl shadow-[#7c3aed]/20 lg:-mt-4 lg:mb-4"
                  : "bg-white/80 dark:bg-stone-800/50 border border-stone-200/50 dark:border-stone-700/50"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#7c3aed] text-white text-sm font-medium">
                  Most Popular
                </div>
              )}
              <p className={`text-sm font-semibold uppercase tracking-widest mb-4 ${plan.featured ? "text-[#a78bfa] dark:text-[#7c3aed]" : "text-stone-500"}`}>
                {plan.name}
              </p>
              <div className="mb-8">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className={plan.featured ? "text-white/60 dark:text-stone-600" : "text-stone-500"}>{plan.period}</span>
              </div>
              <ul className={`space-y-4 mb-8 ${plan.featured ? "text-white/90 dark:text-stone-700" : "text-stone-600 dark:text-stone-400"}`}>
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className={plan.featured ? "text-[#a78bfa] dark:text-[#7c3aed]" : "text-[#7c3aed]"}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/workflow">
                <Button className={`w-full h-12 rounded-full font-medium ${
                  plan.featured
                    ? "bg-white text-stone-900 hover:bg-stone-100 dark:bg-stone-900 dark:text-white dark:hover:bg-stone-800"
                    : "bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
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
    <section ref={sectionRef} className="py-32 bg-white dark:bg-stone-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div ref={contentRef} className="relative rounded-[2.5rem] overflow-hidden">
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src="/assets/12575318_3840_2160_30fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-stone-950/80" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/30 to-[#a78bfa]/30" />

          <div className="relative z-10 p-12 lg:p-24 text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-white">
              Ready to start
              <br />
              <span className="text-[#a78bfa]">your project?</span>
            </h2>
            <p className="text-xl lg:text-2xl text-white/70 mb-12 max-w-2xl mx-auto">
              Let&apos;s build something extraordinary together.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/workflow">
                <Button size="lg" className="h-16 px-10 rounded-full bg-white text-stone-900 hover:bg-stone-100 shadow-2xl group">
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
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".footer-col",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, scrollTrigger: { trigger: footerRef.current, start: "top 90%" }}
      );
    }, footerRef);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="relative overflow-hidden bg-stone-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),transparent_50%)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7c3aed]/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-12 mb-20">
          <div className="col-span-2 footer-col">
            <LogoMark size={48} className="mb-6" />
            <p className="text-stone-400 text-sm leading-relaxed max-w-xs mb-6">
              Building the tools that power modern software architecture.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-stone-800 hover:bg-[#7c3aed] flex items-center justify-center transition-colors group">
                <svg className="w-5 h-5 text-stone-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-stone-800 hover:bg-[#7c3aed] flex items-center justify-center transition-colors group">
                <svg className="w-5 h-5 text-stone-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-stone-800 hover:bg-[#7c3aed] flex items-center justify-center transition-colors group">
                <svg className="w-5 h-5 text-stone-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">Product</p>
            <ul className="space-y-3">
              <li><a href="#work" className="text-sm text-stone-400 hover:text-white transition-colors">Work</a></li>
              <li><a href="#process" className="text-sm text-stone-400 hover:text-white transition-colors">Process</a></li>
              <li><a href="#pricing" className="text-sm text-stone-400 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="text-sm text-stone-400 hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">Resources</p>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-stone-400 hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="text-sm text-stone-400 hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="text-sm text-stone-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm text-stone-400 hover:text-white transition-colors">Tutorials</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">Company</p>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-stone-400 hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-sm text-stone-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-sm text-stone-400 hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="text-sm text-stone-400 hover:text-white transition-colors">Press</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">Legal</p>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-stone-400 hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="text-sm text-stone-400 hover:text-white transition-colors">Terms</a></li>
              <li><a href="#" className="text-sm text-stone-400 hover:text-white transition-colors">Security</a></li>
              <li><a href="#" className="text-sm text-stone-400 hover:text-white transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-800/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <span>&copy; {new Date().getFullYear()} Architex</span>
              <span className="text-stone-700">•</span>
              <span>Designed in Paris</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-stone-500">All systems operational</span>
            </div>
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
