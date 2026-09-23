"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X, Tag, Search, DollarSign, ArrowUpDown } from "lucide-react";
import type { Category } from "@/lib/data/homepage";

interface ShopActiveFiltersProps {
  categories: Category[];
}

export function ShopActiveFilters({ categories }: ShopActiveFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categorySlug = searchParams.get("category");
  const searchQuery = searchParams.get("q");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort");

  const currentCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete("page");
    const queryStr = params.toString();
    router.push(`/shop${queryStr ? `?${queryStr}` : ""}`);
  };

  const removePriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("page");
    const queryStr = params.toString();
    router.push(`/shop${queryStr ? `?${queryStr}` : ""}`);
  };

  const clearAllFilters = () => {
    router.push("/shop");
  };

  const hasAnyFilter = Boolean(
    categorySlug || searchQuery || minPrice || maxPrice || sort
  );

  if (!hasAnyFilter) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <span className="text-xs font-semibold text-muted-foreground mr-1">
        Active Filters:
      </span>

      {/* Category Filter Chip */}
      {categorySlug && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary animate-in fade-in">
          <Tag className="h-3 w-3" />
          <span>Category: {currentCategory?.name || categorySlug}</span>
          <button
            type="button"
            onClick={() => removeFilter("category")}
            className="p-0.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
            aria-label="Remove category filter"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {/* Search Filter Chip */}
      {searchQuery && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary animate-in fade-in">
          <Search className="h-3 w-3" />
          <span>Search: &ldquo;{searchQuery}&rdquo;</span>
          <button
            type="button"
            onClick={() => removeFilter("q")}
            className="p-0.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
            aria-label="Remove search query"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {/* Price Range Filter Chip */}
      {(minPrice || maxPrice) && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary animate-in fade-in">
          <DollarSign className="h-3 w-3" />
          <span>
            Price: {minPrice ? `₹${minPrice}` : "₹0"} –{" "}
            {maxPrice ? `₹${maxPrice}` : "Any"}
          </span>
          <button
            type="button"
            onClick={removePriceFilter}
            className="p-0.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
            aria-label="Remove price filter"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {/* Sort Chip */}
      {sort && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium text-foreground animate-in fade-in">
          <ArrowUpDown className="h-3 w-3" />
          <span>
            Sort:{" "}
            {sort === "price_asc"
              ? "Price: Low to High"
              : sort === "price_desc"
              ? "Price: High to Low"
              : sort === "newest"
              ? "Newest Arrivals"
              : sort === "top_rated"
              ? "Top Rated"
              : sort}
          </span>
          <button
            type="button"
            onClick={() => removeFilter("sort")}
            className="p-0.5 rounded-full hover:bg-background transition-colors cursor-pointer"
            aria-label="Reset sort"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {/* Clear All button */}
      <button
        type="button"
        onClick={clearAllFilters}
        className="text-xs font-bold text-destructive hover:underline ml-2 cursor-pointer"
      >
        Clear All
      </button>
    </div>
  );
}
