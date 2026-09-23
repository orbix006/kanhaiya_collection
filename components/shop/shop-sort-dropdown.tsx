"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

interface ShopSortDropdownProps {
  currentSort?: string;
}

const SORT_OPTIONS = [
  { value: "featured", label: "Featured & Best Sellers" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest Arrivals" },
  { value: "top_rated", label: "Highest Customer Rating" },
];

export function ShopSortDropdown({ currentSort = "featured" }: ShopSortDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSort === "featured") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }
    // Keep page intact or reset to 1
    params.delete("page");

    const queryStr = params.toString();
    router.push(`/shop${queryStr ? `?${queryStr}` : ""}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="shop-sort-select"
        className="hidden sm:flex items-center gap-1 text-xs font-semibold text-muted-foreground whitespace-nowrap"
      >
        <ArrowUpDown className="h-3.5 w-3.5" />
        <span>Sort by:</span>
      </label>

      <select
        id="shop-sort-select"
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
        className="h-10 px-3 rounded-xl border border-border/80 bg-card text-xs font-semibold text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary shadow-2xs transition-colors cursor-pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
