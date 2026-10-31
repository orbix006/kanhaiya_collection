"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, PackageOpen, RotateCw, Compass, ArrowRight } from "lucide-react";

interface AIEmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onRefresh?: () => void;
  hasFilters?: boolean;
  clearFiltersHref?: string;
}

export function AIEmptyState({
  title = "Catalog is Currently Empty",
  description = "Our sacred artisan collections are currently being curated and replenished. Consecrated brassware, hand-hammered idols, and temple essentials will appear here as soon as new inventory is published.",
  actionText = "Explore Categories",
  actionHref = "/categories",
  onRefresh,
  hasFilters = false,
  clearFiltersHref = "/shop",
}: AIEmptyStateProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        router.refresh();
      }
    } catch {
      // Non-fatal
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-[#E8DCC8] bg-gradient-to-b from-[#FFFDF7] via-[#FFFBF0] to-[#F8F1E3]/50 p-8 sm:p-12 md:p-16 text-center shadow-xs transition-all">
      {/* Decorative Background Glows */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#C8891A]/10 to-transparent blur-2xl" />

      {/* Modern AI / Devotional Visual Indicator Badge */}
      <div className="relative mx-auto mb-6 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[#C8891A]/10 animate-ping opacity-40 duration-1000" />
        <div className="relative flex h-full w-full items-center justify-center rounded-3xl bg-gradient-to-br from-[#FFFDF7] to-[#F8F1E3] border border-[#C8891A]/30 shadow-[0_8px_24px_rgba(200,137,26,0.12)]">
          <PackageOpen className="h-9 w-9 sm:h-11 sm:w-11 text-[#C8891A]" strokeWidth={1.75} />
          <div className="absolute -top-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#C8891A] text-white shadow-xs">
            <Sparkles className="h-4 w-4 animate-spin-slow" />
          </div>
        </div>
      </div>

      {/* Clear Typography Header & Secondary Message */}
      <div className="mx-auto max-w-lg">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F1E3] border border-[#E8DCC8] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#C8891A] mb-3">
          <Sparkles className="h-3 w-3" />
          <span>Real-time Inventory Discovery</span>
        </span>

        <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#3B2416]">
          {hasFilters ? "No Offerings Match Your Search" : title}
        </h3>

        <p className="mt-3 text-xs sm:text-sm text-[#806B57] leading-relaxed font-sans font-normal">
          {hasFilters
            ? "We couldn't find items matching your active filter criteria. Try adjusting your parameters or clear filters to view all sacred items."
            : description}
        </p>
      </div>

      {/* Interactive Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 font-sans">
        {hasFilters && clearFiltersHref ? (
          <Link
            href={clearFiltersHref}
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#C8891A] text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#B37814] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Clear All Filters</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#C8891A] text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#B37814] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Compass className="h-4 w-4" />
            <span>{actionText}</span>
          </Link>
        )}

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-[#E8DCC8] bg-white hover:bg-[#F8F1E3] text-xs sm:text-sm font-semibold text-[#3B2416] transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
        >
          <RotateCw className={`h-4 w-4 text-[#C8891A] ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Checking Inventory..." : "Refresh Catalog"}</span>
        </button>
      </div>
    </div>
  );
}

