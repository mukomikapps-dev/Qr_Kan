"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Client component to handle OAuth callback code from URL
 * Redirects to /api/auth/callback if code is present
 */
export default function OAuthCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = searchParams.get("code");
    
    if (code) {
      // Redirect to callback route with the code
      const next = searchParams.get("next") || "/dashboard/profile";
      router.replace(`/api/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`);
    }
  }, [searchParams, router]);

  return null; // This component doesn't render anything
}
