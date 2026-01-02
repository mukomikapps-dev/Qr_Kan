"use client";

import { useEffect } from "react";

export default function TrackImpression({ variantId }: { variantId: string }) {
  useEffect(() => {
    // Track impression asynchronously
    fetch(`/api/track-impression`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId }),
    }).catch(() => {
      // Ignore errors
    });
  }, [variantId]);

  return null;
}






