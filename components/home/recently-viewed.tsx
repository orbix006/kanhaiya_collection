"use client";

import React, { useEffect, useState } from "react";
import { Product, Category } from "@/lib/store";
import { HorizontalProductRow } from "@/components/ui/horizontal-product-row";
import { History } from "lucide-react";

interface RecentlyViewedProps {
  allProducts: Product[];
  categories: Category[];
}

export function RecentlyViewed({ allProducts, categories }: RecentlyViewedProps) {
  const [viewedProducts, setViewedProducts] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const productMap = new Map(allProducts.map((p) => [p.id, p]));

  const loadViewed = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("kanhaiya_recently_viewed");
      if (!stored) {
        setViewedProducts([]);
        return;
      }
      const ids: string[] = JSON.parse(stored);
      if (!Array.isArray(ids)) {
        setViewedProducts([]);
        return;
      }

      // Map IDs to products, deduplicate, limit to 10
      const matched: Product[] = [];
      for (const id of ids) {
        const item = productMap.get(id);
        if (item && item.is_active && !matched.some((m) => m.id === item.id)) {
          matched.push(item);
        }
        if (matched.length >= 10) break;
      }

      setViewedProducts(matched);
    } catch {
      setViewedProducts([]);
    }
  };

  useEffect(() => {
    setIsClient(true);
    loadViewed();

    const handleUpdate = () => {
      loadViewed();
    };

    window.addEventListener("recently_viewed_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("recently_viewed_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [allProducts]);

  // Don't render until client loads or if empty (requirement: prefer hiding when empty)
  if (!isClient || viewedProducts.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Recently Viewed Products"
      className="py-12 sm:py-16 bg-[#FFFDF7] border-b border-[#E8DCC8]/60 transition-colors"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#C8891A] font-medium font-sans mb-1">
              <History className="h-3.5 w-3.5" />
              <span>Continue Exploring</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-[#3B2416]">
              Recently Viewed
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#806B57] font-sans font-normal">
            Swipe to see all {viewedProducts.length} items →
          </p>
        </div>

        {/* Horizontal Scrollable Product Row */}
        <HorizontalProductRow
          products={viewedProducts}
          categoryMap={categoryMap}
        />
      </div>
    </section>
  );
}
