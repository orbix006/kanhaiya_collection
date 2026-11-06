"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Compass,
  Search,
  X,
  FolderTree,
  Filter,
  DollarSign,
  FilterX,
  Layers,
  ArrowUpDown,
  ShoppingBag,
} from "lucide-react";
import type { Category } from "@/lib/data/homepage";
import type { Product } from "@/lib/store";
import { ProductCard } from "@/components/ui/product-card";

interface CategoryDiscoveryClientProps {
  categories: Category[];
  products: Product[];
}

const PRICE_PRESETS = [
  { label: "Under ₹1,000", min: 0, max: 1000 },
  { label: "₹1,000 – ₹3,000", min: 1000, max: 3000 },
  { label: "₹3,000 – ₹5,000", min: 3000, max: 5000 },
  { label: "Above ₹5,000", min: 5000, max: 50000 },
];

export function CategoryDiscoveryClient({
  categories = [],
  products = [],
}: CategoryDiscoveryClientProps) {
  const router = useRouter();

  // Top Tabs: all, main, sub
  const [activeTab, setActiveTab] = useState<"all" | "main" | "sub">("all");

  // Filter & Search states
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in-stock" | "out-of-stock">("all");
  const [pricePreset, setPricePreset] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "newest">("featured");

  // Expandable Category Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState<Record<string, boolean>>({});
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Group root & subcategories
  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parent_id && c.is_active),
    [categories]
  );
  const subCategories = useMemo(
    () => categories.filter((c) => Boolean(c.parent_id) && c.is_active),
    [categories]
  );

  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId && c.is_active);

  const toggleSidebarExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSidebarExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Map category IDs to names for ProductCard labels
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  // Handle category selection
  const handleSelectCategory = (slug: string | null) => {
    setSelectedCategorySlug(slug);
    setMobileFilterOpen(false);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCategorySlug(null);
    setSearchQuery("");
    setStockFilter("all");
    setPricePreset(null);
    setMinPrice(null);
    setMaxPrice(null);
    setSortBy("featured");
    setActiveTab("all");
  };

  const hasActiveFilters = Boolean(
    selectedCategorySlug ||
    searchQuery ||
    stockFilter !== "all" ||
    minPrice !== null ||
    maxPrice !== null ||
    activeTab !== "all"
  );

  // Dynamic Product Filtering & Sorting
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Category Tab / Hierarchy Filtering
    if (selectedCategorySlug) {
      const selectedCat = categories.find((c) => c.slug === selectedCategorySlug);
      if (selectedCat) {
        // Collect selected category ID and all its child subcategory IDs
        const childIds = new Set<string>();
        childIds.add(selectedCat.id);
        const findDescendants = (parentId: string) => {
          categories.filter((c) => c.parent_id === parentId).forEach((child) => {
            childIds.add(child.id);
            findDescendants(child.id);
          });
        };
        findDescendants(selectedCat.id);

        result = result.filter((p) => p.category_id && childIds.has(p.category_id));
      }
    } else if (activeTab === "main") {
      // Products belonging to root categories or their children
      const rootIds = new Set(rootCategories.map((r) => r.id));
      result = result.filter((p) => p.category_id && rootIds.has(p.category_id));
    } else if (activeTab === "sub") {
      // Products belonging directly to subcategories
      const subIds = new Set(subCategories.map((s) => s.id));
      result = result.filter((p) => p.category_id && subIds.has(p.category_id));
    }

    // 2. Search Query Filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      );
    }

    // 3. Stock Availability Filtering
    if (stockFilter === "in-stock") {
      result = result.filter((p) => p.stock_quantity > 0);
    } else if (stockFilter === "out-of-stock") {
      result = result.filter((p) => p.stock_quantity <= 0);
    }

    // 4. Price Range Filtering
    if (minPrice !== null) {
      result = result.filter((p) => p.base_price >= minPrice);
    }
    if (maxPrice !== null) {
      result = result.filter((p) => p.base_price <= maxPrice);
    }

    // 5. Sorting
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.base_price - b.base_price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.base_price - a.base_price);
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      // Featured: bestsellers first
      result.sort((a, b) => {
        if (a.is_featured_top_seller !== b.is_featured_top_seller) {
          return a.is_featured_top_seller ? -1 : 1;
        }
        return b.sold_count - a.sold_count;
      });
    }

    return result;
  }, [
    products,
    categories,
    selectedCategorySlug,
    activeTab,
    rootCategories,
    subCategories,
    searchQuery,
    stockFilter,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  return (
    <div className="min-h-screen bg-[#FFFDF7] py-8 sm:py-12 font-sans">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HEADER AREA */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F8F1E3] border border-[#E8DCC8] px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#C8891A] mb-3">
            <Compass className="h-3.5 w-3.5" />
            <span>SACRED COLLECTIONS</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#3B2416]">
            Sacred Categories & Offerings
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#806B57] font-normal leading-relaxed">
            Browse our complete sacred collection of handcrafted deity poshak, sringar, mandir decor, and spiritual essentials.
          </p>

          {/* 2. TOP CATEGORY TABS */}
          <div className="mt-6 inline-flex p-1 rounded-2xl bg-white border border-[#E8DCC8] shadow-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setSelectedCategorySlug(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "all" && !selectedCategorySlug
                  ? "bg-[#C8891A] text-white shadow-xs"
                  : "text-[#3B2416]/80 hover:text-[#3B2416] hover:bg-[#F8F1E3]"
              }`}
            >
              All Categories ({categories.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("main");
                setSelectedCategorySlug(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "main" && !selectedCategorySlug
                  ? "bg-[#C8891A] text-white shadow-xs"
                  : "text-[#3B2416]/80 hover:text-[#3B2416] hover:bg-[#F8F1E3]"
              }`}
            >
              Main Collections ({rootCategories.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("sub");
                setSelectedCategorySlug(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "sub" && !selectedCategorySlug
                  ? "bg-[#C8891A] text-white shadow-xs"
                  : "text-[#3B2416]/80 hover:text-[#3B2416] hover:bg-[#F8F1E3]"
              }`}
            >
              Subcategories ({subCategories.length})
            </button>
          </div>
        </div>

        {/* MOBILE FILTER TOGGLE BUTTON */}
        <div className="lg:hidden mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl bg-white border border-[#E8DCC8] text-xs font-bold text-[#3B2416] shadow-2xs"
          >
            <Filter className="h-4 w-4 text-[#C8891A]" />
            <span>Filter Categories & Price</span>
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="h-11 px-4 rounded-2xl bg-[#F8F1E3] border border-[#E8DCC8] text-xs font-semibold text-[#B91C1C] flex items-center gap-1"
            >
              <FilterX className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* 1. TWO-COLUMN LAYOUT: Left (~28%) + Right (~72%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 3. LEFT SIDEBAR (Category Hierarchy & Product Filters) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-24">
            {/* Category Hierarchy Box */}
            <div className="bg-white rounded-3xl border border-[#E8DCC8] p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8DCC8]">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-[#C8891A]" />
                  <h3 className="font-serif text-base font-bold text-[#3B2416]">
                    Category Hierarchy
                  </h3>
                </div>
                {selectedCategorySlug && (
                  <button
                    type="button"
                    onClick={() => handleSelectCategory(null)}
                    className="text-[11px] font-semibold text-[#C8891A] hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                )}
              </div>

              <div className="flex flex-col space-y-1 max-h-[340px] overflow-y-auto pr-1">
                {/* All Sacred Offerings button */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory(null)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                    selectedCategorySlug === null
                      ? "bg-[#C8891A] text-white shadow-2xs"
                      : "text-[#3B2416] hover:bg-[#F8F1E3]"
                  }`}
                >
                  <span>All Sacred Offerings</span>
                  <span className="text-[11px] opacity-80">{products.length}</span>
                </button>

                {/* Root categories with expandable subcategories */}
                {rootCategories.map((cat) => {
                  const subcats = getSubcategories(cat.id);
                  const hasSubs = subcats.length > 0;
                  const isSelected = selectedCategorySlug === cat.slug;
                  const isExpanded = Boolean(sidebarExpanded[cat.id]);

                  return (
                    <div key={cat.id} className="flex flex-col pt-0.5">
                      <div
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          isSelected
                            ? "bg-[#F8F1E3] text-[#C8891A] font-bold border border-[#E8DCC8]"
                            : "text-[#3B2416] hover:bg-[#FFFDF7]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectCategory(cat.slug)}
                          className="flex-1 text-left truncate cursor-pointer hover:text-[#C8891A]"
                        >
                          {cat.name}
                        </button>

                        {hasSubs && (
                          <button
                            type="button"
                            onClick={(e) => toggleSidebarExpand(cat.id, e)}
                            className="p-1 rounded text-[#806B57] hover:text-[#C8891A] cursor-pointer ml-1"
                            aria-label={isExpanded ? `Collapse ${cat.name}` : `Expand ${cat.name}`}
                          >
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-[#C8891A]" : ""
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Subcategories */}
                      {hasSubs && isExpanded && (
                        <div className="pl-4 py-1 flex flex-col space-y-0.5 border-l-2 border-[#E8DCC8] ml-3 my-0.5">
                          {subcats.map((sub) => {
                            const isSubSelected = selectedCategorySlug === sub.slug;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => handleSelectCategory(sub.slug)}
                                className={`text-left py-1 px-2 rounded-lg text-[11px] font-medium transition-colors truncate cursor-pointer ${
                                  isSubSelected
                                    ? "bg-[#C8891A] text-white font-semibold"
                                    : "text-[#806B57] hover:text-[#C8891A] hover:bg-[#F8F1E3]"
                                }`}
                              >
                                {sub.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Product Filters: Availability & Price Range */}
            <div className="bg-white rounded-3xl border border-[#E8DCC8] p-5 shadow-xs space-y-5">
              {/* Reset All Filters */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E8DCC8]">
                <h3 className="font-serif text-base font-bold text-[#3B2416]">
                  Filter Products
                </h3>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs font-semibold text-[#B91C1C] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <FilterX className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Stock Availability */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#806B57]">
                  Availability
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStockFilter("all")}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      stockFilter === "all"
                        ? "bg-[#C8891A] text-white"
                        : "bg-[#FFFDF7] border border-[#E8DCC8] text-[#3B2416] hover:bg-[#F8F1E3]"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockFilter("in-stock")}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      stockFilter === "in-stock"
                        ? "bg-[#C8891A] text-white"
                        : "bg-[#FFFDF7] border border-[#E8DCC8] text-[#3B2416] hover:bg-[#F8F1E3]"
                    }`}
                  >
                    In Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockFilter("out-of-stock")}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      stockFilter === "out-of-stock"
                        ? "bg-[#C8891A] text-white"
                        : "bg-[#FFFDF7] border border-[#E8DCC8] text-[#3B2416] hover:bg-[#F8F1E3]"
                    }`}
                  >
                    Sold Out
                  </button>
                </div>
              </div>

              {/* Price Range Presets */}
              <div className="space-y-2 pt-2 border-t border-[#E8DCC8]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#806B57]">
                    Price Range (₹)
                  </label>
                  {(minPrice !== null || maxPrice !== null) && (
                    <button
                      type="button"
                      onClick={() => {
                        setMinPrice(null);
                        setMaxPrice(null);
                        setPricePreset(null);
                      }}
                      className="text-[11px] text-[#B91C1C] hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {PRICE_PRESETS.map((preset) => {
                    const isActive = pricePreset === preset.label;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            setPricePreset(null);
                            setMinPrice(null);
                            setMaxPrice(null);
                          } else {
                            setPricePreset(preset.label);
                            setMinPrice(preset.min);
                            setMaxPrice(preset.max);
                          }
                        }}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border text-center transition-all cursor-pointer truncate ${
                          isActive
                            ? "bg-[#C8891A] text-white border-[#C8891A] shadow-2xs"
                            : "border-[#E8DCC8] bg-[#FFFDF7] text-[#3B2416] hover:bg-[#F8F1E3]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* 4. RIGHT SECTION: PRODUCT SEARCH, SORT & PRODUCT GRID (~72%) */}
          <main className="lg:col-span-9 w-full">
            {/* Top Toolbar: Search, Product Count & Sort Dropdown */}
            <div className="bg-white rounded-3xl border border-[#E8DCC8] p-4 sm:p-5 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Product Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#806B57] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by title, sku or tags..."
                  className="w-full h-10 pl-10 pr-9 rounded-2xl border border-[#E8DCC8] bg-[#FFFDF7] text-xs sm:text-sm text-[#3B2416] placeholder:text-[#806B57]/80 focus:outline-hidden focus:border-[#C8891A] focus:bg-white shadow-2xs transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#806B57] hover:text-[#3B2416] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Right: Product Count & Sort Dropdown */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <span className="text-xs font-bold text-[#806B57]">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"}
                </span>

                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5 text-[#806B57]" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="h-10 px-3 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-xs font-semibold text-[#3B2416] focus:border-[#C8891A] focus:outline-hidden cursor-pointer"
                  >
                    <option value="featured">Featured & Best Sellers</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest Arrivals</option>
                  </select>
                </div>
              </div>
            </div>

            {/* PRODUCT GRID: 3-4 columns on desktop, 2-3 on tablet, 2 on mobile */}
            {filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-[#E8DCC8] bg-white p-12 text-center shadow-xs">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F8F1E3] text-[#C8891A]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-medium text-[#3B2416]">
                  No Sacred Products Found
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#806B57] max-w-sm mx-auto">
                  We couldn&apos;t find any offerings matching your current filter criteria. Try resetting your search or filters.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-6 inline-flex items-center justify-center h-10 px-5 rounded-xl bg-[#C8891A] text-xs font-semibold text-white hover:bg-[#B37814] transition-colors shadow-sm cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product) => {
                  const catName = product.category_id
                    ? categoryMap.get(product.category_id)
                    : undefined;
                  return (
                    <ProductCard
                      key={product.id}
                      product={{
                        id: product.id,
                        slug: product.slug,
                        name: product.name,
                        base_price: product.base_price,
                        compare_at_price: product.compare_at_price,
                        image_url: product.image_url,
                      }}
                      categoryName={catName}
                      className="bg-white rounded-2xl border border-[#E8DCC8] shadow-xs hover:border-[#C8891A]/60 hover:shadow-md transition-all duration-300"
                    />
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE FILTER MODAL DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="ml-auto w-full max-w-xs h-full bg-white p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8DCC8]">
                <h3 className="font-serif text-lg font-bold text-[#3B2416]">
                  Filter Catalog
                </h3>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-full text-[#806B57]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Categories */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#806B57] block mb-2">
                  Categories
                </span>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => handleSelectCategory(null)}
                    className={`w-full text-left py-1.5 px-2 rounded-lg text-xs font-semibold ${
                      selectedCategorySlug === null
                        ? "bg-[#C8891A] text-white"
                        : "text-[#3B2416] hover:bg-[#F8F1E3]"
                    }`}
                  >
                    All Sacred Offerings
                  </button>
                  {rootCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCategory(c.slug)}
                      className={`w-full text-left py-1.5 px-2 rounded-lg text-xs font-semibold ${
                        selectedCategorySlug === c.slug
                          ? "bg-[#C8891A] text-white"
                          : "text-[#3B2416] hover:bg-[#F8F1E3]"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#806B57] block mb-2">
                  Availability
                </span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setStockFilter("all")}
                    className={`py-1 text-xs rounded-lg font-semibold ${
                      stockFilter === "all" ? "bg-[#C8891A] text-white" : "border border-[#E8DCC8]"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockFilter("in-stock")}
                    className={`py-1 text-xs rounded-lg font-semibold ${
                      stockFilter === "in-stock" ? "bg-[#C8891A] text-white" : "border border-[#E8DCC8]"
                    }`}
                  >
                    In Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockFilter("out-of-stock")}
                    className={`py-1 text-xs rounded-lg font-semibold ${
                      stockFilter === "out-of-stock" ? "bg-[#C8891A] text-white" : "border border-[#E8DCC8]"
                    }`}
                  >
                    Sold Out
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8DCC8] space-y-2">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full h-10 rounded-xl bg-[#C8891A] text-white font-bold text-xs"
              >
                Apply Filters
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full h-10 rounded-xl border border-[#E8DCC8] text-[#B91C1C] font-semibold text-xs"
                >
                  Reset All
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
