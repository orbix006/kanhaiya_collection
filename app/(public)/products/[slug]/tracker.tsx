"use client";

import { useEffect } from "react";

export function ProductTracker({ productId }: { productId: string }) {
  useEffect(() => {
    if (!productId || typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("kanhaiya_recently_viewed");
      const list: string[] = stored ? JSON.parse(stored) : [];

      // Remove if already present (deduplicate)
      const filtered = list.filter((id) => id !== productId);

      // Unshift to most recent position
      filtered.unshift(productId);

      // Limit to 10
      const capped = filtered.slice(0, 10);

      localStorage.setItem("kanhaiya_recently_viewed", JSON.stringify(capped));
      window.dispatchEvent(new Event("recently_viewed_updated"));
    } catch {
      // Non-fatal client storage error
    }
  }, [productId]);

  return null;
}
