"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useArchitectureStore } from "@/stores/architecture-store";

export default function NewProjectPage() {
  const router = useRouter();
  const { clearCanvas } = useArchitectureStore();

  useEffect(() => {
    clearCanvas();
    router.replace("/projects/new");
  }, [clearCanvas, router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-stone-950">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
        <p className="text-stone-400 text-sm">Creating new project...</p>
      </div>
    </div>
  );
}
