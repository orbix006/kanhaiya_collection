"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  FolderTree,
  DollarSign,
  FilterX,
  Sparkles,
  Layers,
} from "lucide-react";
import type { Category } from "@/lib/data/homepage";
import { buildCategoryTree, type CategoryTreeNode } from "@/lib/data/categories";

interface ShopSidebarProps {
  categories: Category[];
  currentCategorySlug?: string;
  minPriceParam?: number;
  maxPriceParam?: number;
  onFilterChange?: () => void; // Optional callback for mobile closing
}

const PRICE_PRESETS = [
  { label: "Under ₹2,000", min: 0, max: 2000 },
  { label: "₹2,000 – ₹5,000", min: 2000, max: 5000 },
  { label: "₹5,000 – ₹10,000", min: 5000, max: 10000 },
  { label: "Above ₹10,000", min: 10000, max: 50000 },
];

export function ShopSidebar({
  categories,
  currentCategorySlug,
  minPriceParam,
  maxPriceParam,
  onFilterChange,
}: ShopSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Price inputs state initialized from URL
  const [minPriceInput, setMinPriceInput] = useState<string>(
    minPriceParam !== undefined && minPriceParam > 0 ? String(minPriceParam) : ""
  );
  const [maxPriceInput, setMaxPriceInput] = useState<string>(
    maxPriceParam !== undefined && maxPriceParam > 0 ? String(maxPriceParam) : ""
  );

  // Category collapse state
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const tree = buildCategoryTree(categories.filter((c) => c.is_active));

  const toggleCategoryCollapse = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCollapsedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  /**
   * Helper to build updated URL query string while preserving other search params
   */
  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset pagination to 1 whenever filters change
    params.delete("page");

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const queryStr = params.toString();
    router.push(`/shop${queryStr ? `?${queryStr}` : ""}`);
    if (onFilterChange) onFilterChange();
  };

  const handleCategorySelect = (slug: string | null) => {
    updateQuery({ category: slug });
  };

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const min = minPriceInput ? Number(minPriceInput) : null;
    const max = maxPriceInput ? Number(maxPriceInput) : null;

    updateQuery({
      minPrice: min !== null && min > 0 ? String(min) : null,
      maxPrice: max !== null && max > 0 ? String(max) : null,
    });
  };

  const handlePresetSelect = (min: number, max: number) => {
    setMinPriceInput(min > 0 ? String(min) : "");
    setMaxPriceInput(max > 0 ? String(max) : "");
    updateQuery({
      minPrice: min > 0 ? String(min) : null,
      maxPrice: max > 0 ? String(max) : null,
    });
  };

  const handleResetPrice = () => {
    setMinPriceInput("");
    setMaxPriceInput("");
    updateQuery({
      minPrice: null,
      maxPrice: null,
    });
  };

  const handleClearAll = () => {
    setMinPriceInput("");
    setMaxPriceInput("");
    router.push("/shop");
    if (onFilterChange) onFilterChange();
  };

  const hasActiveFilters =
    Boolean(currentCategorySlug) ||
    Boolean(searchParams.get("q")) ||
    Boolean(searchParams.get("minPrice")) ||
    Boolean(searchParams.get("maxPrice")) ||
    Boolean(searchParams.get("sort"));

  const renderCategoryNode = (node: CategoryTreeNode) => {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = currentCategorySlug === node.slug;
    const isChildSelected = node.children.some(
      (child) =>
        child.slug === currentCategorySlug ||
        child.children.some((sub) => sub.slug === currentCategorySlug)
    );
    const isCollapsed = collapsedCategories[node.id] ?? (!isSelected && !isChildSelected);

    return (
      <div key={node.id} className="flex flex-col">
        <div
          className={`group flex items-center justify-between py-1.5 px-2 rounded-xl text-xs font-medium transition-all ${
            isSelected
              ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
              : isChildSelected
              ? "text-primary font-semibold bg-primary/10"
              : "text-foreground/80 hover:bg-muted/70 hover:text-foreground"
          }`}
          style={{ paddingLeft: `${node.level * 16 + 8}px` }}
        >
          <button
            type="button"
            onClick={() => handleCategorySelect(node.slug)}
            className="flex items-center gap-2 flex-1 text-left truncate cursor-pointer py-0.5"
          >
            {node.level === 0 && <Layers className="h-3.5 w-3.5 shrink-0 opacity-70" />}
            <span className="truncate">{node.name}</span>
          </button>

          {hasChildren && (
            <button
              type="button"
              onClick={(e) => toggleCategoryCollapse(node.id, e)}
              className="p-1 rounded-md hover:bg-background/20 text-current transition-colors"
              aria-label={isCollapsed ? `Expand ${node.name}` : `Collapse ${node.name}`}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {hasChildren && !isCollapsed && (
          <div className="flex flex-col space-y-0.5 mt-0.5">
            {node.children.map((child) => renderCategoryNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-full flex flex-col gap-6 text-sm">
      {/* Header with Clear All */}
      <div className="flex items-center justify-between pb-3 border-b border-border/70">
        <div className="flex items-center gap-2 font-bold text-base text-foreground">
          <FolderTree className="h-4 w-4 text-primary" />
          <span>Filter Catalog</span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1 text-xs font-semibold text-destructive hover:underline cursor-pointer"
          >
            <FilterX className="h-3.5 w-3.5" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Category Tree Section */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Categories
          </span>
          {currentCategorySlug && (
            <button
              type="button"
              onClick={() => handleCategorySelect(null)}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              View All
            </button>
          )}
        </div>

        <div className="flex flex-col space-y-0.5">
          {/* All Categories Option */}
          <button
            type="button"
            onClick={() => handleCategorySelect(null)}
            className={`flex items-center gap-2 py-1.5 px-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
              !currentCategorySlug
                ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                : "text-foreground/80 hover:bg-muted/70 hover:text-foreground font-medium"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span>All Categories</span>
          </button>

          {/* Render category tree */}
          {tree.map((rootNode) => renderCategoryNode(rootNode))}
        </div>
      </div>

      {/* Price Filter Section */}
      <div className="flex flex-col gap-3 pt-4 border-t border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Price (₹)</span>
          </div>
          {(minPriceParam || maxPriceParam) && (
            <button
              type="button"
              onClick={handleResetPrice}
              className="text-[11px] font-medium text-destructive hover:underline"
            >
              Clear Price
            </button>
          )}
        </div>

        {/* Quick Price Range Presets */}
        <div className="grid grid-cols-2 gap-1.5">
          {PRICE_PRESETS.map((preset) => {
            const isPresetActive =
              minPriceParam === preset.min && maxPriceParam === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePresetSelect(preset.min, preset.max)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-medium border text-center transition-all cursor-pointer truncate ${
                  isPresetActive
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                    : "border-border/70 bg-card text-foreground/80 hover:bg-muted hover:border-border"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Min / Max Price Inputs */}
        <form onSubmit={handleApplyPrice} className="flex flex-col gap-2.5 mt-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                ₹
              </span>
              <input
                type="number"
                placeholder="Min"
                min="0"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="w-full h-9 pl-6 pr-2 rounded-xl border border-border/80 bg-muted/40 text-xs text-foreground focus:border-primary focus:bg-background focus:outline-hidden"
              />
            </div>
            <span className="text-xs text-muted-foreground font-semibold">–</span>
            <div className="flex-1 relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                ₹
              </span>
              <input
                type="number"
                placeholder="Max"
                min="0"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="w-full h-9 pl-6 pr-2 rounded-xl border border-border/80 bg-muted/40 text-xs text-foreground focus:border-primary focus:bg-background focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            Apply Price Filter
          </button>
        </form>
      </div>
    </aside>
  );
}
