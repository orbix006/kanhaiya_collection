"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Package, Layers } from "lucide-react";
import { loadMockStore, type MockProductDetail, type MockCategory } from "@/lib/mock-data/admin-store";

interface SearchBarProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

const PLACEHOLDERS = ["Search sacred idols & diyas", "Search by category or SKU"];

export function SearchBar({ isMobile = false, onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [products, setProducts] = useState<MockProductDetail[]>([]);
  const [categories, setCategories] = useState<MockCategory[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic rotating placeholder
  useEffect(() => {
    if (isFocused || query) return;

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setIsFading(false);
      }, 250);
    }, 3200);

    return () => clearInterval(interval);
  }, [isFocused, query]);

  // Sync with shared mock store and listen for real-time updates
  useEffect(() => {
    const syncCatalog = () => {
      const store = loadMockStore();
      if (store.products) {
        // Public storefront search only returns ACTIVE products
        setProducts(store.products.filter((p) => p.is_active));
      }
      if (store.categories) {
        setCategories(store.categories.filter((c) => c.is_active));
      }
    };

    syncCatalog();
    window.addEventListener("catalog_updated", syncCatalog);
    return () => window.removeEventListener("catalog_updated", syncCatalog);
  }, []);

  // Click outside listener to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmed = query.trim().toLowerCase();

  // Category map for fast lookup
  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat.name);
  }

  // Filter matching active products and categories
  const matchedProducts = trimmed
    ? products
        .filter((p) => {
          const nameMatch = p.name?.toLowerCase().includes(trimmed);
          const descMatch = p.description?.toLowerCase().includes(trimmed);
          const skuMatch = p.sku?.toLowerCase().includes(trimmed);
          const brandMatch = p.brand?.toLowerCase().includes(trimmed);
          const catName = p.category_id ? categoryMap.get(p.category_id)?.toLowerCase() : "";
          const catMatch = catName?.includes(trimmed);
          return nameMatch || descMatch || skuMatch || brandMatch || catMatch;
        })
        .slice(0, 6)
    : [];

  const matchedCategories = trimmed
    ? categories
        .filter((c) => c.name?.toLowerCase().includes(trimmed) || c.slug?.toLowerCase().includes(trimmed))
        .slice(0, 4)
    : [];

  const hasResults = matchedProducts.length > 0 || matchedCategories.length > 0;
  const showDropdown = isFocused && trimmed.length > 0;

  const handleItemClick = () => {
    setIsFocused(false);
    setQuery("");
    onNavigate?.();
  };

  return (
    <div ref={containerRef} className={`relative font-sans ${isMobile ? "w-full" : "w-full max-w-md lg:max-w-lg"}`}>
      {/* Search Input Container */}
      <div
        className={`relative flex items-center w-full h-10 px-3.5 rounded-full border transition-all duration-200 ${
          isFocused
            ? "border-[#C8891A] bg-[#FFFDF7] ring-2 ring-[#C8891A]/15 shadow-sm"
            : "border-[#E8DCC8] bg-[#F8F1E3]/55 hover:bg-[#F8F1E3] hover:border-[#C8891A]/40"
        }`}
      >
        <Search className="h-4 w-4 text-[#806B57] shrink-0" aria-hidden="true" />

        {/* Text Input with Dynamic Animated Rotating Placeholder */}
        <div className="relative flex-1 h-full mx-2 flex items-center overflow-hidden">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            aria-label="Search products and categories"
            className="w-full h-full bg-transparent text-sm text-[#3B2416] placeholder-transparent font-normal focus:outline-none"
          />

          {/* Animated Rotating Placeholder overlay when input is empty */}
          {!query && (
            <span
              className={`pointer-events-none absolute left-0 text-xs sm:text-sm text-[#806B57]/75 font-normal transition-all duration-250 ${
                isFading ? "opacity-0 -translate-y-1.5" : "opacity-100 translate-y-0"
              }`}
            >
              {PLACEHOLDERS[placeholderIndex]}
            </span>
          )}
        </div>

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search query"
            className="p-1 rounded-full text-[#806B57] hover:text-[#3B2416] hover:bg-[#E8DCC8]/50 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Live Search Results Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#FFFDF7] border border-[#E8DCC8] rounded-2xl shadow-xl overflow-hidden p-3 animate-in fade-in-50 slide-in-from-top-1 duration-150 max-h-[75vh] overflow-y-auto font-sans">
          {hasResults ? (
            <div className="space-y-4">
              {/* Category Search Results */}
              {matchedCategories.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium tracking-wider uppercase text-[#C8891A]">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Categories</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {matchedCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/shop?category=${cat.slug}`}
                        onClick={handleItemClick}
                        className="group flex items-center justify-between p-2 rounded-xl text-xs text-[#3B2416] hover:bg-[#F8F1E3] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[#C8891A]">→</span>
                          <span className="font-medium text-sm group-hover:text-[#C8891A] transition-colors">
                            {cat.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#806B57] bg-[#E8DCC8]/40 px-2 py-0.5 rounded-full font-normal">
                          Browse Collection
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Search Results */}
              {matchedProducts.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium tracking-wider uppercase text-[#C8891A]">
                    <Package className="h-3.5 w-3.5" />
                    <span>Products ({matchedProducts.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {matchedProducts.map((prod) => {
                      const primaryImg =
                        prod.images?.find((img) => img.is_primary)?.image_url ||
                        prod.images?.[0]?.image_url ||
                        "/images/preview-murti.jpg";

                      const catName = prod.category_id ? categoryMap.get(prod.category_id) : null;

                      return (
                        <Link
                          key={prod.id}
                          href={`/shop/product/${prod.slug}`}
                          onClick={handleItemClick}
                          className="group flex items-center justify-between p-2 rounded-xl text-xs text-[#3B2416] hover:bg-[#F8F1E3] transition-colors gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-[#F8F1E3] border border-[#E8DCC8]/60">
                              <Image
                                src={primaryImg}
                                alt={prod.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm text-[#3B2416] group-hover:text-[#C8891A] transition-colors truncate">
                                  {prod.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-[#806B57]">
                                {catName && (
                                  <span className="text-[#C8891A] font-medium">{catName}</span>
                                )}
                                {prod.sku && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono text-[10px]">{prod.sku}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0">
                            <span className="font-semibold text-xs text-[#8B4513]">
                              ₹{prod.base_price.toLocaleString("en-IN")}
                            </span>
                            {prod.compare_at_price && prod.compare_at_price > prod.base_price && (
                              <span className="text-[10px] text-muted-foreground line-through">
                                ₹{prod.compare_at_price.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 px-4 text-center">
              <p className="text-sm font-medium text-[#3B2416]">No active products found</p>
              <p className="text-xs text-[#806B57] mt-1 font-normal">
                No items or categories matching &ldquo;{query}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
