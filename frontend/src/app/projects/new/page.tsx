"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useArchitectureStore } from "@/stores/architecture-store";

export default function NewProjectPage() {
  const router = useRouter();
  const { clearCanvas } = useArchitectureStore();

  useEffect(() => {
    clearCanvas();
    router.replace("/projects/new/editor");
  }, [clearCanvas, router]);

  return null;
}
