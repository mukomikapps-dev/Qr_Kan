"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HashRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Handle old format /#username redirect to /@username
    // Use router.replace for instant client-side navigation (no full page reload)
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.slice(1).trim(); // Remove # and trim
      if (hash && !hash.includes("/") && !hash.startsWith("@") && !hash.includes(" ")) {
        // Use router.replace for faster client-side redirect
        router.replace(`/@${hash}`);
      }
    }
  }, [router]);

  return null;
}


