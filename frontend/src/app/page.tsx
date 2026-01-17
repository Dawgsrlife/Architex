"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();

  const handleGitHubLogin = () => {
    window.location.href = "http://localhost:8000/api/auth/github";
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24">
      <div className="z-10 max-w-6xl w-full">
        <div className="flex flex-col items-center gap-12">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Architex
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Transform architectural intent into production-ready code through AI-powered workflows
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={handleGitHubLogin}
            >
              Get Started with GitHub
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn More
            </Button>
          </div>

          <div id="features" className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
            <div className="p-8 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="font-bold text-xl mb-3">AI Code Generation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Leverage Google Gemini AI to generate complete codebases from architectural specifications
              </p>
            </div>
            <div className="p-8 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">🔄</div>
              <h3 className="font-bold text-xl mb-3">Visual Workflows</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Design architecture using React Flow diagrams that directly translate to code
              </p>
            </div>
            <div className="p-8 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="font-bold text-xl mb-3">GitHub Integration</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Automatically push generated code to GitHub repositories with full version control
              </p>
            </div>
          </div>

          <div className="mt-16 w-full max-w-4xl p-8 rounded-lg border bg-muted/20">
            <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Login with GitHub</h4>
                  <p className="text-sm">Authenticate securely using your GitHub account</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Create Workflow</h4>
                  <p className="text-sm">Design your architecture using the visual workflow builder</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Generate Code</h4>
                  <p className="text-sm">AI processes your workflow asynchronously and generates production code</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Deploy to GitHub</h4>
                  <p className="text-sm">Code is automatically committed and pushed to your repository</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
