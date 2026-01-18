"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    console.log("[ProtectedRoute] State:", { isLoading, isAuthenticated, pathname });
    
    if (!isLoading && !isAuthenticated && !isRedirecting) {
      console.log("[ProtectedRoute] Not authenticated, redirecting to login");
      setIsRedirecting(true);
      // Save current path to redirect back after login
      localStorage.setItem("redirect_after_login", pathname);
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router, pathname, isRedirecting]);

  // Show loading while auth is being checked
  if (isLoading) {
    console.log("[ProtectedRoute] Loading auth state...");
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-600 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-medium text-white mb-2">Loading...</h1>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    console.log("[ProtectedRoute] Not authenticated, showing redirect screen");
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-600 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-medium text-white mb-2">Redirecting to login...</h1>
        </div>
      </div>
    );
  }

  console.log("[ProtectedRoute] Authenticated, rendering children");
  return <>{children}</>;
}
