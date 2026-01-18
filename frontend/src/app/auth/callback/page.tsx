"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      localStorage.setItem("access_token", token);
      
      const redirectPath = localStorage.getItem("redirect_after_login");
      localStorage.removeItem("redirect_after_login");
      
      router.push(redirectPath || "/projects");
    } else {
      router.push("/");
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-stone-600 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-medium text-white mb-2">Authenticating...</h1>
        <p className="text-stone-400 text-sm">Please wait while we log you in.</p>
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
