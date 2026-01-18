"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  ArrowLeft, 
  Layers, 
  Code2, 
  Zap, 
  Shield, 
  GitBranch, 
  Cloud,
  Database,
  Server,
  Globe,
  Cpu,
  ArrowRight,
  Check
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Layers,
    title: "Visual Architecture Design",
    description: "Drag and drop components to design your system architecture visually. Build with real infrastructure components."
  },
  {
    icon: Code2,
    title: "Code Generation",
    description: "Generate production-ready code including infrastructure as code, API endpoints, and service configurations."
  },
  {
    icon: Zap,
    title: "Multi-Language Support",
    description: "Generate code in your preferred language and framework. Support for Node.js, Python, Go, Rust, and more."
  },
  {
    icon: Cloud,
    title: "Instant Deployment",
    description: "Deploy directly to major cloud providers with a single click. Architex handles the complexity."
  },
  {
    icon: Shield,
    title: "Security First",
    description: "Security best practices are automatically applied. From authentication to data encryption."
  },
  {
    icon: GitBranch,
    title: "Version Control",
    description: "Seamlessly integrate with GitHub, GitLab, and Bitbucket. Track changes alongside your code."
  }
];

const components = [
  { icon: Server, name: "Backend", desc: "FastAPI, Express, Django, Spring Boot, NestJS, Go/Gin, Rails" },
  { icon: Globe, name: "Frontend", desc: "Next.js, React, Vue, Angular, Svelte" },
  { icon: Database, name: "Databases", desc: "PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch" },
  { icon: Cloud, name: "Cloud", desc: "AWS, GCP, Azure, Vercel, Railway" },
  { icon: Cpu, name: "Infrastructure", desc: "Docker, Kubernetes, Terraform" },
];

const steps = [
  { num: "01", title: "Design", desc: "Drag components onto the canvas and connect them to define your system architecture." },
  { num: "02", title: "Configure", desc: "Set specifications for each component - database schemas, API endpoints, service configurations." },
  { num: "03", title: "Generate", desc: "Production-ready code is generated based on your architecture design." },
  { num: "04", title: "Deploy", desc: "Deploy to your preferred cloud provider with infrastructure automatically provisioned." },
];

export default function LearnMorePage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".hero-content > *",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }
      );

      gsap.fromTo(".feature-card",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.06,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".features-grid",
            start: "top 85%",
          }
        }
      );

      gsap.fromTo(".step-card",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".steps-section",
            start: "top 85%",
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[11px] tracking-widest uppercase font-medium">Home</span>
              </Link>
              <div className="h-4 w-px bg-stone-200" />
              <Link href="/" className="text-sm font-display font-bold tracking-tight text-stone-900">
                Architex
              </Link>
            </div>
            <Link 
              href="/login" 
              className="px-5 py-2 bg-stone-900 text-white rounded-full text-[11px] tracking-widest uppercase font-medium hover:bg-stone-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section ref={heroRef} className="pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-8 lg:px-12">
          <div className="hero-content max-w-3xl">
            <p className="text-[11px] tracking-widest uppercase text-stone-400 font-medium mb-6">
              Documentation
            </p>
            
            <h1 className="text-4xl lg:text-5xl font-display font-medium tracking-tight text-stone-900 leading-[1.15] mb-6">
              Design systems visually.
              <br />
              <span className="text-stone-400">Generate production code.</span>
            </h1>
            
            <p className="text-lg text-stone-500 leading-relaxed mb-10 max-w-2xl">
              Architex transforms the way developers build software. Design your system architecture visually, 
              and generate production-ready code, infrastructure, and deployments.
            </p>

            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-[11px] tracking-widest uppercase font-medium transition-colors"
              >
                Start Building
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-2 px-6 py-3 text-stone-500 hover:text-stone-900 text-[11px] tracking-widest uppercase font-medium transition-colors"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-stone-100">
        <div className="max-w-6xl mx-auto px-8 lg:px-12">
          <div className="mb-12">
            <h2 className="text-2xl font-display font-medium text-stone-900 mb-2">
              Features
            </h2>
            <p className="text-stone-400">
              Everything you need to build modern software systems.
            </p>
          </div>

          <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card group p-6 border border-stone-100 rounded-lg hover:border-stone-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-stone-50 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-stone-500" />
                </div>
                <h3 className="text-sm font-medium text-stone-900 mb-2">{feature.title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-stone-50">
        <div className="max-w-6xl mx-auto px-8 lg:px-12">
          <div className="mb-12">
            <h2 className="text-2xl font-display font-medium text-stone-900 mb-2">
              Supported Components
            </h2>
            <p className="text-stone-400">
              Build with the technologies you know and love.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {components.map((comp, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-5 bg-white border border-stone-100 rounded-lg"
              >
                <div className="w-9 h-9 rounded-lg bg-stone-50 flex items-center justify-center flex-shrink-0">
                  <comp.icon className="w-4 h-4 text-stone-500" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-stone-900 mb-0.5">{comp.name}</h4>
                  <p className="text-stone-400 text-xs">{comp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="steps-section py-20 border-t border-stone-100">
        <div className="max-w-6xl mx-auto px-8 lg:px-12">
          <div className="mb-12">
            <h2 className="text-2xl font-display font-medium text-stone-900 mb-2">
              How it works
            </h2>
            <p className="text-stone-400">
              From concept to production in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="step-card relative p-6 border border-stone-100 rounded-lg"
              >
                <span className="text-5xl font-display font-medium text-stone-100 absolute top-4 right-6">
                  {step.num}
                </span>
                <div className="relative">
                  <h3 className="text-sm font-medium text-stone-900 mb-2">{step.title}</h3>
                  <p className="text-stone-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-stone-100">
        <div className="max-w-6xl mx-auto px-8 lg:px-12">
          <div className="bg-stone-900 rounded-2xl p-10 lg:p-16 text-center">
            <h2 className="text-2xl lg:text-3xl font-display font-medium text-white mb-3">
              Ready to build something?
            </h2>
            <p className="text-stone-400 mb-8 max-w-md mx-auto">
              Join developers who are already building with Architex.
            </p>
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-stone-900 rounded-full text-[11px] tracking-widest uppercase font-medium hover:bg-stone-100 transition-colors"
            >
              Get Started Free
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-stone-500">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-stone-400" />
                Free tier
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-stone-400" />
                No credit card
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 border-t border-stone-100">
        <div className="max-w-6xl mx-auto px-8 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="text-sm font-display font-bold tracking-tight text-stone-900">
              Architex
            </Link>
            <p className="text-stone-400 text-xs">
              &copy; {new Date().getFullYear()} Architex
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-stone-400 hover:text-stone-900 text-xs transition-colors">Privacy</Link>
              <Link href="#" className="text-stone-400 hover:text-stone-900 text-xs transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
