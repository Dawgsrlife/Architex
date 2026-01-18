"use client";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export default function LoginPage() {
    const handleLogin = () => {
        window.location.href = "http://localhost:8000/api/auth/github";
    };

    return (
        <div className="flex h-screen items-center justify-center bg-stone-950 text-white">
            <div className="w-full max-w-md space-y-8 p-8 border border-stone-800 rounded-2xl bg-stone-900/50 backdrop-blur-xl">
                <div className="text-center">
                    <h1 className="text-3xl font-display font-medium tracking-tight">Welcome back</h1>
                    <p className="mt-2 text-stone-400">Sign in to continue building</p>
                </div>

                <div className="mt-8">
                    <Button
                        onClick={handleLogin}
                        className="w-full h-12 bg-white text-stone-950 hover:bg-stone-200 font-medium text-base transition-colors flex items-center justify-center gap-3"
                    >
                        <Github className="w-5 h-5" />
                        Continue with GitHub
                    </Button>
                </div>

                <p className="text-center text-xs text-stone-500 mt-8">
                    By clicking continue, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
