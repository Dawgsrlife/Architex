"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      console.log("[AuthCallback] Token received:", token ? `${token.slice(0, 20)}...` : "none");

      if (token) {
        // Store token first
        localStorage.setItem("access_token", token);
        console.log("[AuthCallback] Token stored in localStorage");
        
        // Refresh user to update AuthContext
        try {
          await refreshUser();
          console.log("[AuthCallback] User refreshed successfully");
          setStatus("success");
          
          // Get redirect path
          const redirectPath = localStorage.getItem("redirect_after_login") || "/dashboard";
          localStorage.removeItem("redirect_after_login");
          console.log("[AuthCallback] Redirecting to:", redirectPath);
          
          // Small delay to ensure state updates propagate
          setTimeout(() => {
            router.push(redirectPath);
          }, 100);
        } catch (error) {
          console.error("[AuthCallback] Failed to refresh user:", error);
          setStatus("error");
          localStorage.removeItem("access_token");
          setTimeout(() => router.push("/login"), 2000);
        }
      } else {
        console.log("[AuthCallback] No token in URL, redirecting to home");
        setStatus("error");
        router.push("/");
      }
    };

    handleCallback();
  }, [searchParams, router, refreshUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-stone-600 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-medium text-white mb-2">
          {status === "loading" && "Authenticating..."}
          {status === "success" && "Login successful!"}
          {status === "error" && "Authentication failed"}
        </h1>
        <p className="text-stone-400 text-sm">
          {status === "loading" && "Please wait while we log you in."}
          {status === "success" && "Redirecting to dashboard..."}
          {status === "error" && "Redirecting to login..."}
        </p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-stone-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-600 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-medium text-white mb-2">Authenticating...</h1>
          <p className="text-stone-400 text-sm">Please wait while we log you in.</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
