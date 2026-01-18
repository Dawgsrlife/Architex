"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthFromCallback } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (token) {
      setAuthFromCallback(token).then(() => {
        router.replace("/dashboard");
      });
    } else {
      router.replace("/login?error=auth_failed");
    }
  }, [searchParams, setAuthFromCallback, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
        <p className="text-stone-400 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
