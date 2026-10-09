"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X, Package, Layers } from "lucide-react";
import { SEARCH_CATALOG, type SearchProduct, type SearchCategory } from "@/lib/constants";

interface SearchBarProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

const PLACEHOLDERS = ["Search by product", "Search by category"];

export function SearchBar({ isMobile = false, onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic rotating placeholder between "Search by product" and "Search by category"
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

  // Filter matching products and categories
  const matchedProducts: SearchProduct[] = trimmed
    ? SEARCH_CATALOG.products.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmed) ||
          p.description.toLowerCase().includes(trimmed) ||
          p.category.toLowerCase().includes(trimmed)
      )
    : [];

  const matchedCategories: SearchCategory[] = trimmed
    ? SEARCH_CATALOG.categories.filter((c) => c.name.toLowerCase().includes(trimmed))
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
            className="p-1 rounded-full text-[#806B57] hover:text-[#3B2416] hover:bg-[#E8DCC8]/50 transition-colors"
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
                        href="/categories"
                        onClick={handleItemClick}
                        className="group flex items-center justify-between p-2 rounded-xl text-xs text-[#3B2416] hover:bg-[#F8F1E3] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[#C8891A]">→</span>
                          <span className="font-medium text-sm group-hover:text-[#C8891A] transition-colors">
                            {cat.name}
                          </span>
                        </div>
                        {cat.itemCount && (
                          <span className="text-[10px] text-[#806B57] bg-[#E8DCC8]/40 px-2 py-0.5 rounded-full font-normal">
                            {cat.itemCount}
                          </span>
                        )}
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
                    <span>Products</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {matchedProducts.map((prod) => (
                      <Link
                        key={prod.id}
                        href="/shop"
                        onClick={handleItemClick}
                        className="group flex items-center justify-between p-2 rounded-xl text-xs text-[#3B2416] hover:bg-[#F8F1E3] transition-colors"
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[#C8891A]">→</span>
                            <span className="font-medium text-sm group-hover:text-[#C8891A] transition-colors">
                              {prod.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#806B57] pl-4 truncate max-w-[280px] font-normal">
                            {prod.description}
                          </span>
                        </div>
                        {prod.price && (
                          <span className="font-medium text-xs text-[#8B4513] shrink-0">
                            {prod.price}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 px-4 text-center">
              <p className="text-sm font-medium text-[#3B2416]">No results found</p>
              <p className="text-xs text-[#806B57] mt-1 font-normal">
                No products or categories matching &ldquo;{query}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
