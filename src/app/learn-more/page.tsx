"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  ArrowLeft, 
  ArrowRight,
  Layers, 
  Sparkles, 
  Code2, 
  GitBranch, 
  Zap, 
  Shield,
  Globe,
  Cpu,
  Database,
  Cloud,
  Terminal,
  Box
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-950/90 backdrop-blur-xl border-b border-stone-800/30">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-display font-bold tracking-tight text-white cursor-pointer">
              Architex
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login"
              className="text-sm text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              Sign in
            </Link>
            <Link 
              href="/projects/new"
              className="px-4 py-2 bg-white text-stone-950 rounded-full text-sm font-medium hover:bg-stone-100 transition-all active:scale-95 cursor-pointer"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".hero-content", 
        { opacity: 0, y: 40 }, 
        { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.1 }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative pt-32 pb-20 bg-stone-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-stone-700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <Link href="/" className="hero-content inline-flex items-center gap-2 text-stone-400 hover:text-white transition-colors mb-8 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to home</span>
        </Link>

        <h1 className="hero-content text-5xl lg:text-7xl font-display font-medium tracking-tight text-white mb-6">
          What is Architex?
        </h1>
        
        <p className="hero-content text-xl lg:text-2xl text-stone-400 max-w-3xl leading-relaxed mb-10">
          Architex is an AI-powered platform that transforms visual system designs into production-ready code. Design your architecture visually, and let AI handle the implementation.
        </p>

        <div className="hero-content flex flex-wrap gap-4">
          <Link 
            href="/projects/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-stone-950 rounded-full text-sm font-medium hover:bg-stone-100 transition-all active:scale-95 cursor-pointer"
          >
            Start Building
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a 
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3 border border-stone-800 text-white rounded-full text-sm font-medium hover:bg-stone-900 transition-all cursor-pointer"
          >
            How it works
          </a>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Layers,
      title: "Visual Architecture Design",
      description: "Drag and drop components to design your system architecture. Connect services, databases, and APIs with an intuitive visual interface."
    },
    {
      icon: Sparkles,
      title: "AI-Powered Code Generation",
      description: "Our AI analyzes your architecture and generates production-ready code, including boilerplate, configurations, and best practices."
    },
    {
      icon: Code2,
      title: "Multi-Language Support",
      description: "Generate code in your preferred language and framework. Support for TypeScript, Python, Go, and more coming soon."
    },
    {
      icon: GitBranch,
      title: "Version Control Integration",
      description: "Seamlessly integrate with GitHub. Push generated code directly to your repositories with proper branching."
    },
    {
      icon: Zap,
      title: "Real-time Collaboration",
      description: "Work together with your team in real-time. See changes as they happen and collaborate on architecture decisions."
    },
    {
      icon: Shield,
      title: "Security Best Practices",
      description: "Generated code follows security best practices. Automatic vulnerability scanning and secure defaults included."
    }
  ];

  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".feature-card", 
        { opacity: 0, y: 30 }, 
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%"
          }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-stone-950 border-t border-stone-800/30">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-display font-medium tracking-tight text-white mb-4">
            Everything you need to build faster
          </h2>
          <p className="text-stone-400 text-lg max-w-2xl mx-auto">
            Architex combines visual design with AI to accelerate your development workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="feature-card p-6 bg-stone-900/40 border border-stone-800/40 rounded-2xl hover:border-stone-700/60 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-stone-800/80 flex items-center justify-center mb-5 group-hover:bg-stone-800 transition-colors">
                <feature.icon className="w-6 h-6 text-stone-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-white font-medium text-lg mb-2">{feature.title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Design Your Architecture",
      description: "Use our visual canvas to design your system. Drag components like databases, APIs, services, and queues. Connect them to define relationships and data flow.",
      icon: Layers
    },
    {
      number: "02",
      title: "Configure Components",
      description: "Customize each component with specific settings. Define database schemas, API endpoints, environment variables, and deployment configurations.",
      icon: Terminal
    },
    {
      number: "03",
      title: "Generate Code",
      description: "Click Generate and watch as AI transforms your visual design into production-ready code. Get complete project structure, configurations, and documentation.",
      icon: Sparkles
    },
    {
      number: "04",
      title: "Deploy & Iterate",
      description: "Push to GitHub, deploy to your preferred platform, and iterate. Changes to your architecture automatically sync with your codebase.",
      icon: Cloud
    }
  ];

  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".step-item", 
        { opacity: 0, x: -30 }, 
        { 
          opacity: 1, 
          x: 0, 
          duration: 0.6, 
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%"
          }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="py-24 bg-stone-900/30 border-t border-stone-800/30">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-display font-medium tracking-tight text-white mb-4">
            How Architex Works
          </h2>
          <p className="text-stone-400 text-lg max-w-2xl mx-auto">
            From visual design to deployed code in four simple steps.
          </p>
        </div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="step-item flex items-start gap-6 p-6 bg-stone-950/50 border border-stone-800/40 rounded-2xl hover:border-stone-700/60 transition-all group">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-stone-800/80 flex items-center justify-center group-hover:bg-stone-800 transition-colors">
                <step.icon className="w-7 h-7 text-stone-400 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-stone-600">{step.number}</span>
                  <h3 className="text-white font-medium text-xl">{step.title}</h3>
                </div>
                <p className="text-stone-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComponentsSection() {
  const components = [
    { icon: Database, name: "Databases", items: ["PostgreSQL", "MongoDB", "Redis", "MySQL"] },
    { icon: Globe, name: "APIs", items: ["REST", "GraphQL", "gRPC", "WebSocket"] },
    { icon: Cpu, name: "Services", items: ["Auth", "Payment", "Notification", "Analytics"] },
    { icon: Cloud, name: "Infrastructure", items: ["AWS", "GCP", "Vercel", "Docker"] },
  ];

  return (
    <section className="py-24 bg-stone-950 border-t border-stone-800/30">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-display font-medium tracking-tight text-white mb-4">
            Supported Components
          </h2>
          <p className="text-stone-400 text-lg max-w-2xl mx-auto">
            A growing library of components to build any system architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {components.map((category, index) => (
            <div key={index} className="p-6 bg-stone-900/40 border border-stone-800/40 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-stone-800/80 flex items-center justify-center mb-4">
                <category.icon className="w-5 h-5 text-stone-400" />
              </div>
              <h3 className="text-white font-medium mb-3">{category.name}</h3>
              <ul className="space-y-2">
                {category.items.map((item, i) => (
                  <li key={i} className="text-sm text-stone-500 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-stone-700" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 bg-stone-900/30 border-t border-stone-800/30">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-3xl lg:text-5xl font-display font-medium tracking-tight text-white mb-6">
          Ready to build faster?
        </h2>
        <p className="text-stone-400 text-lg mb-10 max-w-2xl mx-auto">
          Join developers who are using Architex to design and ship production-ready systems in minutes, not weeks.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link 
            href="/projects/new"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-stone-950 rounded-full text-sm font-medium hover:bg-stone-100 transition-all active:scale-95 cursor-pointer"
          >
            Start Building Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 border border-stone-800 text-white rounded-full text-sm font-medium hover:bg-stone-900 transition-all cursor-pointer"
          >
            Sign in with GitHub
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 bg-stone-950 border-t border-stone-800/30">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-display font-bold text-white">Architex</span>
            <span className="text-stone-600 text-sm">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-stone-500">
            <a href="#" className="hover:text-white transition-colors cursor-pointer">Privacy</a>
            <a href="#" className="hover:text-white transition-colors cursor-pointer">Terms</a>
            <a href="#" className="hover:text-white transition-colors cursor-pointer">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LearnMorePage() {
  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);

  return (
    <main className="min-h-screen bg-stone-950">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ComponentsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
