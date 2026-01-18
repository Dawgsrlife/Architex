"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useArchitectureStore } from "@/stores/architecture-store";
import { useAuth } from "@/contexts/AuthContext";

export default function NewProjectPage() {
  const router = useRouter();
  const { clearCanvas } = useArchitectureStore();
  const { isAuthenticated, isLoading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
      if (isLoading) return;

      if (!isAuthenticated) {
        localStorage.setItem("redirect_after_login", "/projects");
        router.replace("/login");
        return;
      }

      clearCanvas();
      setIsInitialized(true);
      router.replace("/workflow");
    }, [isAuthenticated, isLoading, clearCanvas, router]);

  if (isLoading || !isAuthenticated || !isInitialized) {
    return null;
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-stone-950">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
        <p className="text-stone-400 text-sm">Setting up your project...</p>
      </div>
    </div>
  );
}
