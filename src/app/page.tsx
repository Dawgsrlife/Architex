import Link from "next/link";
import { Button } from "@/components/ui/button";

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="text-base font-medium">Architex</span>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/workflow">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="pt-28 pb-20 lg:pt-36 lg:pb-28">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight leading-[1.15] mb-6">
            Build production-ready
            <br />
            architecture with AI
          </h1>
          
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
            Describe what you want to build. Get clean, typed, production-ready code in seconds.
          </p>
          
          <div className="flex gap-3">
            <Link href="/workflow">
              <Button size="lg" className="h-11 px-6">
                Start building
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="h-11 px-6">
                How it works
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">How it works</p>
        <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mb-20 max-w-xl">
          From idea to production in three steps
        </h2>
        
        <div className="space-y-0">
          <div className="grid md:grid-cols-[1fr,2fr] gap-8 py-12 border-t border-border">
            <div className="text-6xl font-light text-muted-foreground/30">01</div>
            <div>
              <h3 className="text-xl font-medium mb-3">Describe</h3>
              <p className="text-muted-foreground max-w-md">
                Tell us what you want to build. Plain English, technical specs, or anything in between.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-[1fr,2fr] gap-8 py-12 border-t border-border">
            <div className="text-6xl font-light text-muted-foreground/30">02</div>
            <div>
              <h3 className="text-xl font-medium mb-3">Review</h3>
              <p className="text-muted-foreground max-w-md">
                See your architecture visualized. Adjust components, connections, and structure as needed.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-[1fr,2fr] gap-8 py-12 border-t border-b border-border">
            <div className="text-6xl font-light text-muted-foreground/30">03</div>
            <div>
              <h3 className="text-xl font-medium mb-3">Generate</h3>
              <p className="text-muted-foreground max-w-md">
                Get production-ready code. Clean, typed, tested, and following your preferred conventions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-muted/30">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Capabilities</p>
        <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mb-6 max-w-xl">
          Built for developers who ship
        </h2>
        <p className="text-muted-foreground mb-16 max-w-xl">
          Everything you need to go from concept to deployment, without the usual friction.
        </p>
        
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
          <div>
            <h3 className="text-base font-medium mb-2">AI-powered generation</h3>
            <p className="text-sm text-muted-foreground">Context-aware code that understands your project structure and conventions.</p>
          </div>
          <div>
            <h3 className="text-base font-medium mb-2">Visual workflows</h3>
            <p className="text-sm text-muted-foreground">Drag-and-drop architecture builder with real-time preview.</p>
          </div>
          <div>
            <h3 className="text-base font-medium mb-2">Voice control</h3>
            <p className="text-sm text-muted-foreground">Speak your architecture into existence. Hands-free development.</p>
          </div>
          <div>
            <h3 className="text-base font-medium mb-2">GitHub integration</h3>
            <p className="text-sm text-muted-foreground">Push to repos, create branches, manage PRs directly from the editor.</p>
          </div>
          <div>
            <h3 className="text-base font-medium mb-2">Live preview</h3>
            <p className="text-sm text-muted-foreground">See changes instantly with hot reload and real-time collaboration.</p>
          </div>
          <div>
            <h3 className="text-base font-medium mb-2">Type safety</h3>
            <p className="text-sm text-muted-foreground">Full TypeScript support with automatic inference and validation.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 lg:py-32">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">What people say</p>
        <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mb-20 max-w-xl">
          Trusted by developers
        </h2>
        
        <div className="space-y-16">
          <blockquote className="border-l-2 border-foreground/20 pl-8">
            <p className="text-xl lg:text-2xl font-light leading-relaxed mb-6">
              "Architex has completely transformed how I approach new projects. What used to take days now takes hours."
            </p>
            <footer className="text-sm text-muted-foreground">
              Sarah Chen, Senior Developer
            </footer>
          </blockquote>
          
          <blockquote className="border-l-2 border-foreground/20 pl-8">
            <p className="text-xl lg:text-2xl font-light leading-relaxed mb-6">
              "The AI understands exactly what I need. It's like having a senior architect always available."
            </p>
            <footer className="text-sm text-muted-foreground">
              Marcus Johnson, Tech Lead
            </footer>
          </blockquote>
          
          <blockquote className="border-l-2 border-foreground/20 pl-8">
            <p className="text-xl lg:text-2xl font-light leading-relaxed mb-6">
              "Finally, a tool that bridges the gap between ideation and implementation."
            </p>
            <footer className="text-sm text-muted-foreground">
              Emily Rodriguez, Startup Founder
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-muted/30">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Pricing</p>
        <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mb-6 max-w-xl">
          Simple pricing
        </h2>
        <p className="text-muted-foreground mb-16 max-w-xl">
          Start free. Upgrade when you need to.
        </p>
        
        <div className="grid md:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden">
          <div className="bg-card p-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Free</h3>
            <div className="text-3xl font-medium mb-1">$0</div>
            <p className="text-sm text-muted-foreground mb-8">Forever</p>
            <ul className="space-y-3 text-sm mb-8">
              <li>5 generations/day</li>
              <li>Basic templates</li>
              <li>Community support</li>
            </ul>
            <Link href="/workflow">
              <Button variant="outline" className="w-full">Get started</Button>
            </Link>
          </div>
          
          <div className="bg-card p-8 ring-1 ring-foreground/10">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Pro</h3>
            <div className="text-3xl font-medium mb-1">$29</div>
            <p className="text-sm text-muted-foreground mb-8">per month</p>
            <ul className="space-y-3 text-sm mb-8">
              <li>Unlimited generations</li>
              <li>Advanced templates</li>
              <li>GitHub integration</li>
              <li>Voice commands</li>
              <li>Priority support</li>
            </ul>
            <Link href="/workflow">
              <Button className="w-full">Start trial</Button>
            </Link>
          </div>
          
          <div className="bg-card p-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Enterprise</h3>
            <div className="text-3xl font-medium mb-1">Custom</div>
            <p className="text-sm text-muted-foreground mb-8">Contact us</p>
            <ul className="space-y-3 text-sm mb-8">
              <li>Everything in Pro</li>
              <li>Custom integrations</li>
              <li>SLA guarantee</li>
              <li>Dedicated support</li>
            </ul>
            <Link href="/workflow">
              <Button variant="outline" className="w-full">Contact sales</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mb-6">
          Ready to ship faster?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Join developers who are building smarter with Architex.
        </p>
        <Link href="/workflow">
          <Button size="lg" className="h-12 px-8">
            Get started free
          </Button>
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-medium">Architex</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              AI-powered architecture design.
            </p>
          </div>
          
          <div className="flex gap-12 text-sm">
            <div className="space-y-3">
              <a href="#features" className="block text-muted-foreground hover:text-foreground">Features</a>
              <a href="#pricing" className="block text-muted-foreground hover:text-foreground">Pricing</a>
            </div>
            <div className="space-y-3">
              <a href="#" className="block text-muted-foreground hover:text-foreground">GitHub</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground">Twitter</a>
            </div>
            <div className="space-y-3">
              <a href="#" className="block text-muted-foreground hover:text-foreground">Privacy</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground">Terms</a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Architex
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
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
