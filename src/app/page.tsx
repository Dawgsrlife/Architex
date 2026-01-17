import Link from "next/link";
import { Button } from "@/components/ui/button";

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#C4A77D] to-[#8B7355] rounded-lg" />
              <div className="absolute inset-[3px] bg-background rounded-[5px]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold bg-gradient-to-br from-[#C4A77D] to-[#8B7355] bg-clip-text text-transparent">A</span>
              </div>
            </div>
            <span className="text-xl font-semibold tracking-tight">Architex</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/workflow">
              <Button size="sm" className="bg-[#C4A77D] hover:bg-[#B39770] text-white">Get started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5F0E8] via-background to-background" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-[#C4A77D]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#C4A77D]/5 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C4A77D]/10 border border-[#C4A77D]/20 text-sm text-[#8B7355] mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C4A77D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C4A77D]"></span>
              </span>
              Now in public beta
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
              Your{" "}
              <span className="font-serif italic text-[#C4A77D]">advanced</span>
              <br />
              architecture assistant
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8">
              Transform your ideas into production-ready code with AI-powered architecture design. 
              Build faster, smarter, and with confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/workflow">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-lg px-8 h-12">
                  Start building free
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 h-12">
                  See how it works
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-8 mt-10 pt-10 border-t border-border/50">
              <div>
                <div className="text-3xl font-semibold text-foreground">100+</div>
                <div className="text-sm text-muted-foreground">Projects created</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <div className="text-3xl font-semibold text-foreground">10x</div>
                <div className="text-sm text-muted-foreground">Faster development</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <div className="text-3xl font-semibold text-foreground">AI-first</div>
                <div className="text-sm text-muted-foreground">Code generation</div>
              </div>
            </div>
          </div>
          
          <div className="relative lg:h-[600px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C4A77D]/20 to-transparent rounded-3xl" />
            <div className="relative h-full rounded-3xl overflow-hidden border border-border/50 bg-card shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-12 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="pt-16 p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#C4A77D] flex-shrink-0 flex items-center justify-center text-white text-sm font-medium">A</div>
                  <div className="bg-muted rounded-2xl rounded-tl-none p-4 max-w-[80%]">
                    <p className="text-sm">Create a REST API for a task management app with user authentication</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none p-4 max-w-[80%]">
                    <p className="text-sm mb-2">I'll create a complete architecture for you:</p>
                    <div className="bg-white/10 rounded-lg p-3 font-mono text-xs">
                      <div className="text-green-300">├── /api/auth</div>
                      <div className="text-green-300">│   ├── login</div>
                      <div className="text-green-300">│   └── register</div>
                      <div className="text-green-300">├── /api/tasks</div>
                      <div className="text-green-300">│   ├── [id]</div>
                      <div className="text-green-300">│   └── index</div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoCloud() {
  const logos = [
    { name: "Next.js", svg: "N" },
    { name: "React", svg: "R" },
    { name: "TypeScript", svg: "TS" },
    { name: "Node.js", svg: "N" },
    { name: "MongoDB", svg: "M" },
  ];
  
  return (
    <section className="py-12 border-y border-border/50 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground mb-8">Trusted by developers using modern technologies</p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {logos.map((logo) => (
            <div key={logo.name} className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                {logo.svg}
              </div>
              <span className="text-lg font-medium">{logo.name}</span>
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
      title: "Describe your idea",
      description: "Tell us what you want to build in plain English. Our AI understands context and requirements.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      number: "02",
      title: "Review architecture",
      description: "Visualize your project structure with interactive diagrams. Make adjustments as needed.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Generate code",
      description: "Get production-ready code instantly. Clean, typed, and following best practices.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="section-padding">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            Building is{" "}
            <span className="font-serif italic text-[#C4A77D]">easy</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Three simple steps to transform your ideas into working code
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative group">
              <div className="absolute -top-4 -left-4 text-8xl font-serif text-[#C4A77D]/10 select-none">
                {step.number}
              </div>
              <div className="relative bg-card rounded-2xl p-8 border border-border/50 hover:border-[#C4A77D]/50 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#C4A77D]/10 text-[#C4A77D] flex items-center justify-center mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: "AI Code Generation",
      description: "Powered by Google Gemini for intelligent, context-aware code generation that understands your project.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: "Visual Workflows",
      description: "Create and manage complex architectures with intuitive drag-and-drop workflow builder.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      title: "Voice Control",
      description: "Speak your architecture into existence with advanced voice-to-code capabilities.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
    },
    {
      title: "GitHub Integration",
      description: "Push directly to repositories, create branches, and manage your codebase seamlessly.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
    {
      title: "Real-time Preview",
      description: "See your changes instantly with live preview and hot module replacement.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      title: "Type Safety",
      description: "Full TypeScript support with automatic type inference and validation.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="section-padding bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            Everything you need to{" "}
            <span className="font-serif italic text-[#C4A77D]">build faster</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A comprehensive toolkit designed for modern development workflows
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-card rounded-2xl p-8 border border-border/50 hover:border-[#C4A77D]/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[#C4A77D]/10 text-[#C4A77D] flex items-center justify-center mb-6 group-hover:bg-[#C4A77D] group-hover:text-white transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Architex has completely transformed how I approach new projects. What used to take days now takes hours.",
      author: "Sarah Chen",
      role: "Senior Developer",
      avatar: "SC",
    },
    {
      quote: "The AI understands exactly what I need. It's like having a senior architect always available to help.",
      author: "Marcus Johnson",
      role: "Tech Lead",
      avatar: "MJ",
    },
    {
      quote: "Finally, a tool that bridges the gap between ideation and implementation. Absolutely game-changing.",
      author: "Emily Rodriguez",
      role: "Startup Founder",
      avatar: "ER",
    },
  ];

  return (
    <section id="testimonials" className="section-padding">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            Real people.{" "}
            <span className="font-serif italic text-[#C4A77D]">Real results.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            See what developers are saying about Architex
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="bg-card rounded-2xl p-8 border border-border/50 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-[#C4A77D]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-lg leading-relaxed mb-6">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#C4A77D]/20 flex items-center justify-center text-[#C4A77D] font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
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
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for exploring and small projects",
      features: [
        "5 AI generations per day",
        "Basic code templates",
        "Community support",
        "Public projects only",
      ],
      cta: "Get started",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "For serious developers and teams",
      features: [
        "Unlimited AI generations",
        "Advanced code templates",
        "Priority support",
        "Private projects",
        "GitHub integration",
        "Voice commands",
      ],
      cta: "Start free trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large teams with custom needs",
      features: [
        "Everything in Pro",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantee",
        "On-premise option",
        "Team management",
      ],
      cta: "Contact sales",
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="section-padding bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            Simple,{" "}
            <span className="font-serif italic text-[#C4A77D]">transparent</span>{" "}
            pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that works best for you
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? "bg-primary text-primary-foreground shadow-xl scale-105"
                  : "bg-card border border-border/50"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#C4A77D] text-white text-sm font-medium px-4 py-1 rounded-full">
                  Most popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}>
                    {plan.period}
                  </span>
                </div>
                <p className={`mt-2 ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? "text-[#C4A77D]" : "text-[#C4A77D]"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.highlighted ? "text-primary-foreground/90" : ""}>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/workflow">
                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
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
  return (
    <section className="section-padding">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="relative rounded-3xl bg-primary text-primary-foreground p-12 lg:p-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#C4A77D]/20 to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C4A77D]/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mb-6">
              Ready to build{" "}
              <span className="font-serif italic text-[#C4A77D]">faster</span>?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Join thousands of developers who are already building smarter with Architex.
              Start for free today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/workflow">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 h-12">
                  Get started free
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 h-12">
                  Learn more
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const links = {
    Product: ["Features", "Pricing", "Roadmap", "Changelog"],
    Company: ["About", "Blog", "Careers", "Contact"],
    Resources: ["Documentation", "API Reference", "Guides", "Support"],
    Legal: ["Privacy", "Terms", "Security"],
  };

  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#C4A77D] to-[#8B7355] rounded-lg" />
                <div className="absolute inset-[3px] bg-background rounded-[5px]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold bg-gradient-to-br from-[#C4A77D] to-[#8B7355] bg-clip-text text-transparent">A</span>
                </div>
              </div>
              <span className="text-xl font-semibold">Architex</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Transform your ideas into production-ready code with AI-powered architecture design.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
          
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4">{category}</h3>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-border/50 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Architex. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <LogoCloud />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
