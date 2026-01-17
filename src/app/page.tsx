"use client";

import Link from "next/link";
import Image from "next/image";
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
  const videoRef = useRef<HTMLVideoElement>(null);

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
          { scale: 0.8, opacity: 0, y: 60 },
          { scale: 1, opacity: 1, y: 0, duration: 1.4 },
          "-=0.6"
        );

      gsap.to(visualRef.current, {
        y: -30,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-30 dark:opacity-20"
      >
        <source src="/assets/12575318_3840_2160_30fps.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-20 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 
            ref={titleRef}
            className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-8"
          >
            Build architecture
            <br />
            <span className="bg-gradient-to-r from-accent via-purple-500 to-pink-500 bg-clip-text text-transparent">
              at the speed of thought
            </span>
          </h1>
          
          <p 
            ref={subtitleRef}
            className="text-xl lg:text-2xl text-muted-foreground leading-relaxed mb-12 max-w-2xl mx-auto"
          >
            Transform ideas into production-ready code. AI-powered architecture design that understands your vision.
          </p>
          
          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/workflow">
              <Button size="lg" className="h-16 px-10 text-lg rounded-2xl bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 shadow-2xl shadow-black/30 hover:scale-105 transition-transform">
                Start building free
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="h-16 px-10 text-lg rounded-2xl border-2 hover:scale-105 transition-transform">
                See how it works
              </Button>
            </Link>
          </div>
        </div>

        <div 
          ref={visualRef}
          className="mt-24 relative"
        >
          <div className="aspect-video max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border border-white/10">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="/assets/12777809_3840_2160_30fps.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-500 border-2 border-black" />
                ))}
              </div>
              <span className="text-white/80 text-sm">2,000+ developers shipping faster</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement[]>([]);
  const numbersRef = useRef<HTMLSpanElement[]>([]);
  const linesRef = useRef<HTMLDivElement[]>([]);
  const iconsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
        },
      });

      tl.fromTo(
        titleRef.current,
        { y: 100, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 1, ease: "power4.out" }
      );

      stepsRef.current.forEach((step, i) => {
        const stepTl = gsap.timeline({
          scrollTrigger: {
            trigger: step,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        });

        stepTl
          .fromTo(
            step,
            { 
              opacity: 0, 
              x: i % 2 === 0 ? -150 : 150,
              rotateY: i % 2 === 0 ? -15 : 15,
            },
            { 
              opacity: 1, 
              x: 0, 
              rotateY: 0,
              duration: 1.2, 
              ease: "power4.out" 
            }
          )
          .fromTo(
            numbersRef.current[i],
            { scale: 0, rotation: -180 },
            { scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.7)" },
            "-=0.8"
          )
          .fromTo(
            iconsRef.current[i],
            { scale: 0, y: 20 },
            { scale: 1, y: 0, duration: 0.6, ease: "back.out(2)" },
            "-=0.4"
          );

        if (linesRef.current[i]) {
          gsap.fromTo(
            linesRef.current[i],
            { scaleY: 0 },
            {
              scaleY: 1,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: {
                trigger: step,
                start: "bottom 70%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }

        gsap.to(step, {
          y: -10,
          scrollTrigger: {
            trigger: step,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      num: "01",
      title: "Describe your vision",
      desc: "Tell us what you want to build in plain English. Our AI understands context, constraints, and best practices.",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
      video: "/assets/13678999_1920_1080_25fps.mp4",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      num: "02",
      title: "Watch it come alive",
      desc: "See your architecture visualized in real-time. Drag, drop, and refine until it's perfect.",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/10 to-pink-500/10",
      video: "/assets/14471955_3840_2160_30fps.mp4",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      num: "03",
      title: "Ship with confidence",
      desc: "Export production-ready code. TypeScript, tested, documented, and following your conventions.",
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-500/10 to-red-500/10",
      video: "/assets/6346217-uhd_4096_2160_25fps.mp4",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  return (
    <section ref={sectionRef} id="how-it-works" className="py-32 lg:py-48 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2" />
      
      <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
        <div ref={titleRef} className="text-center mb-32">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">How it works</p>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight">
            Three steps to
            <br />
            <span className="bg-gradient-to-r from-accent via-purple-500 to-pink-500 bg-clip-text text-transparent">
              production
            </span>
          </h2>
        </div>
        
        <div className="relative">
          {steps.map((step, i) => (
            <div key={step.num} className="relative">
              <div
                ref={(el) => { if (el) stepsRef.current[i] = el; }}
                className={`relative rounded-3xl bg-gradient-to-br ${step.bgGradient} border border-border/50 backdrop-blur-sm mb-8 group hover:scale-[1.01] transition-transform duration-500 overflow-hidden`}
                style={{ perspective: "1000px" }}
              >
                <div className="flex flex-col lg:flex-row">
                  <div className="flex-1 p-8 lg:p-12">
                    <div className="flex items-center gap-6 mb-6">
                      <span 
                        ref={(el) => { if (el) numbersRef.current[i] = el; }}
                        className={`text-6xl lg:text-8xl font-bold bg-gradient-to-br ${step.gradient} bg-clip-text text-transparent`}
                      >
                        {step.num}
                      </span>
                      <div 
                        ref={(el) => { if (el) iconsRef.current[i] = el; }}
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white shadow-lg`}
                      >
                        {step.icon}
                      </div>
                    </div>
                    <h3 className="text-2xl lg:text-4xl font-bold mb-4">{step.title}</h3>
                    <p className="text-lg lg:text-xl text-muted-foreground max-w-md leading-relaxed">{step.desc}</p>
                  </div>
                  <div className="lg:w-1/2 h-64 lg:h-auto relative">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    >
                      <source src={step.video} type="video/mp4" />
                    </video>
                    <div className={`absolute inset-0 bg-gradient-to-r ${step.gradient} opacity-20`} />
                  </div>
                </div>
                
                <div className={`absolute -inset-px rounded-3xl bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 -z-10`} />
              </div>
              
              {i < steps.length - 1 && (
                <div 
                  ref={(el) => { if (el) linesRef.current[i] = el; }}
                  className="w-1 h-16 mx-auto bg-gradient-to-b from-border to-transparent origin-top"
                />
              )}
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
          { y: 80, opacity: 0, rotateX: 15 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 1,
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
    { icon: "✦", title: "AI-powered generation", desc: "Context-aware code that understands your project", gradient: "from-blue-500 to-cyan-500" },
    { icon: "◈", title: "Visual workflows", desc: "Drag-and-drop architecture builder", gradient: "from-purple-500 to-pink-500" },
    { icon: "◎", title: "Voice control", desc: "Speak your architecture into existence", gradient: "from-orange-500 to-red-500" },
    { icon: "⬡", title: "GitHub integration", desc: "Push to repos, create branches, manage PRs", gradient: "from-green-500 to-emerald-500" },
    { icon: "◉", title: "Live preview", desc: "See changes instantly with hot reload", gradient: "from-yellow-500 to-orange-500" },
    { icon: "◇", title: "Type safety", desc: "Full TypeScript with automatic inference", gradient: "from-indigo-500 to-purple-500" },
  ];

  return (
    <section ref={sectionRef} id="features" className="py-32 lg:py-40 relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/assets/pexels-picjumbo-com-55570-196644.jpg"
          alt=""
          fill
          className="object-cover opacity-10 dark:opacity-5"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
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
              className="group p-8 rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-border/50 hover:border-transparent transition-all duration-500 hover:shadow-2xl hover:shadow-accent/20 relative overflow-hidden"
              style={{ perspective: "1000px" }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              <div className={`text-4xl mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
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
          { y: 100, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.2,
            delay: i * 0.15,
            ease: "power4.out",
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
      image: "/assets/pexels-cottonbro-9665180.jpg",
    },
    {
      quote: "The AI understands exactly what I need. It's like having a senior architect always available.",
      name: "Marcus Johnson",
      role: "Tech Lead at Stripe",
      image: "/assets/pexels-cottonbro-9667824.jpg",
    },
    {
      quote: "Finally, a tool that bridges the gap between ideation and implementation without compromise.",
      name: "Emily Rodriguez",
      role: "Founder at TechFlow",
      image: "/assets/pexels-jakubzerdzicki-29521529.jpg",
    },
  ];

  return (
    <section ref={sectionRef} id="testimonials" className="py-32 lg:py-40 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      
      <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
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
              className="group relative rounded-3xl overflow-hidden"
            >
              <div className="absolute inset-0">
                <Image
                  src={t.image}
                  alt={t.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
              </div>
              <div className="relative p-8 pt-48">
                <p className="text-lg text-white/90 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-bold text-white">{t.name}</p>
                  <p className="text-sm text-white/60">{t.role}</p>
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
          { y: 100, opacity: 0, rotateY: i === 1 ? 0 : (i === 0 ? 10 : -10) },
          {
            y: 0,
            opacity: 1,
            rotateY: 0,
            duration: 1,
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
    <section ref={sectionRef} id="pricing" className="py-32 lg:py-40 relative overflow-hidden">
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-10 dark:opacity-5"
        >
          <source src="/assets/12981875_2160_4096_60fps.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/10 rounded-full blur-3xl" />
      
      <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="pricing-title text-center mb-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">Pricing</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-muted-foreground">Start free. Scale as you grow.</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8" style={{ perspective: "1000px" }}>
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              ref={(el) => { if (el) cardsRef.current[i] = el; }}
              className={`p-8 rounded-3xl border backdrop-blur-sm transition-all duration-500 hover:scale-105 ${
                plan.featured
                  ? "bg-gradient-to-br from-black to-black/90 dark:from-white dark:to-white/90 text-white dark:text-black border-transparent shadow-2xl shadow-accent/30 scale-105 lg:-mt-4 lg:mb-4"
                  : "bg-white/80 dark:bg-white/5 border-border/50 hover:border-accent/50"
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
                  className={`w-full h-12 rounded-2xl font-medium transition-transform hover:scale-105 ${
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
        { y: 80, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
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
        <div className="cta-content relative rounded-[2.5rem] overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/assets/12575318_3840_2160_30fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/70 dark:bg-black/80" />
          <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-purple-500/30" />
          
          <div className="relative z-10 p-12 lg:p-24 text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-white">
              Ready to ship faster?
            </h2>
            <p className="text-xl lg:text-2xl text-white/70 mb-12 max-w-2xl mx-auto">
              Join thousands of developers building smarter with Architex.
            </p>
            <Link href="/workflow">
              <Button size="lg" className="h-16 px-12 text-lg rounded-2xl bg-white text-black hover:bg-white/90 shadow-2xl hover:scale-105 transition-transform">
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
