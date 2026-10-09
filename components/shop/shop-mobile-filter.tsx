"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Category } from "@/lib/data/homepage";
import { ShopSidebar } from "./shop-sidebar";

interface ShopMobileFilterProps {
  categories: Category[];
  currentCategorySlug?: string;
  minPriceParam?: number;
  maxPriceParam?: number;
  activeFilterCount: number;
}

export function ShopMobileFilter({
  categories,
  currentCategorySlug,
  minPriceParam,
  maxPriceParam,
  activeFilterCount,
}: ShopMobileFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 h-10 px-4 rounded-xl border border-border/80 bg-card hover:bg-muted text-xs font-semibold text-foreground shadow-2xs transition-colors cursor-pointer"
      >
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        <span>Filter & Refine</span>
        {activeFilterCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Slide-over Drawer Backdrop & Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-background p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <span className="font-bold text-base text-foreground">Filters</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ShopSidebar
              categories={categories}
              currentCategorySlug={currentCategorySlug}
              minPriceParam={minPriceParam}
              maxPriceParam={maxPriceParam}
              onFilterChange={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
