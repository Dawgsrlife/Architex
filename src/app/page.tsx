import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-6xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Architex
          </h1>
          <p className="text-xl text-center text-muted-foreground max-w-2xl">
            A powerful architect support to seamlessly convert intent into code
          </p>
          
          <div className="flex gap-4 mt-8">
            <Link href="/workflow">
              <Button size="lg" className="text-lg">
                Get Started
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="text-lg">
                Dashboard
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
            <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
              <h3 className="font-bold text-lg mb-2">AI Code Generation</h3>
              <p className="text-sm text-muted-foreground">
                Powered by Google Gemini for intelligent code generation
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
              <h3 className="font-bold text-lg mb-2">Visual Workflows</h3>
              <p className="text-sm text-muted-foreground">
                Create and manage workflows with React Flow
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
              <h3 className="font-bold text-lg mb-2">Voice Control</h3>
              <p className="text-sm text-muted-foreground">
                Voice-to-architecture with ElevenLabs TTS
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
