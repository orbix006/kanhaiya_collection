"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ProductCard } from "@/components/ui/product-card";
import { AIEmptyState } from "@/components/ui/ai-empty-state";
import { AlertCircle, RotateCw } from "lucide-react";
import type { ProductItem } from "@/lib/data/homepage";

interface LiveProductGridProps {
  initialProducts?: ProductItem[];
  categorySlug?: string;
  searchQuery?: string;
  categoryMap?: Map<string, string>;
  pageSize?: number;
}

export function LiveProductGrid({
  initialProducts,
  categorySlug,
  searchQuery,
  categoryMap,
  pageSize = 12,
}: LiveProductGridProps) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts || []);
  const [loading, setLoading] = useState<boolean>(!initialProducts);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (categorySlug) params.set("category", categorySlug);
      if (searchQuery) params.set("q", searchQuery);
      if (pageSize) params.set("pageSize", String(pageSize));

      const queryStr = params.toString();
      const res = await fetch(`/api/products${queryStr ? `?${queryStr}` : ""}`, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      const items = Array.isArray(json?.products)
        ? json.products
        : (Array.isArray(json?.data) ? json.data : []);

      setProducts(items);
    } catch (err: any) {
      setError(
        err?.message || "Unable to reach the catalog service. Please check your network connection."
      );
    } finally {
      setLoading(false);
    }
  }, [categorySlug, searchQuery, pageSize]);

  useEffect(() => {
    // Only fetch on mount if no initialProducts were provided or parameters changed
    if (!initialProducts || initialProducts.length === 0) {
      fetchProducts();
    }
  }, [fetchProducts, initialProducts]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-3xl border border-[#E8DCC8]/60 bg-white p-3 shadow-2xs animate-pulse"
          >
            <div className="aspect-square w-full rounded-2xl bg-[#F8F1E3]/80 mb-3" />
            <div className="h-4 w-3/4 rounded bg-[#E8DCC8]/50 mb-2" />
            <div className="h-3 w-1/2 rounded bg-[#E8DCC8]/40 mb-4" />
            <div className="mt-auto flex items-center justify-between pt-2">
              <div className="h-4 w-16 rounded bg-[#E8DCC8]/50" />
              <div className="h-8 w-8 rounded-full bg-[#E8DCC8]/50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error State with Clear Retry Action
  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50/60 p-8 sm:p-12 text-center text-red-900 shadow-xs">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="font-serif text-lg font-medium">Catalog Service Interrupted</h3>
        <p className="mt-2 text-xs sm:text-sm text-red-700 max-w-md mx-auto leading-relaxed">
          {error}
        </p>
        <button
          type="button"
          onClick={fetchProducts}
          className="mt-6 inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  // Empty State
  if (!products || products.length === 0) {
    return (
      <AIEmptyState
        hasFilters={Boolean(categorySlug || searchQuery)}
        clearFiltersHref="/shop"
        actionHref="/categories"
        actionText="Explore Sacred Categories"
        onRefresh={fetchProducts}
      />
    );
  }

  // Active Products Grid
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          categoryName={
            product.category_id && categoryMap ? categoryMap.get(product.category_id) : undefined
          }
        />
      ))}
    </div>
  );
}

