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
} from "lucide-react";
import type { Category } from "@/lib/data/homepage";

interface CategoryDirectoryClientProps {
  categories: Category[];
  totalProductsCount: number;
}

export function CategoryDirectoryClient({
  categories = [],
}: CategoryDirectoryClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "main" | "sub">("all");
  const [selectedSidebarSlug, setSelectedSidebarSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [sidebarExpandedCats, setSidebarExpandedCats] = useState<Record<string, boolean>>({});
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parent_id && c.is_active),
    [categories]
  );
  const subCategories = useMemo(
    () => categories.filter((c) => Boolean(c.parent_id) && c.is_active),
    [categories]
  );

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCats((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleSidebarExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSidebarExpandedCats((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId && c.is_active);

  // Filter root categories based on search and sidebar selection
  const filteredRootCategories = useMemo(() => {
    let list = rootCategories;

    // Filter by sidebar selection if user selected a specific main category
    if (selectedSidebarSlug) {
      list = list.filter((r) => r.slug === selectedSidebarSlug);
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((root) => {
      const matchRoot = root.name.toLowerCase().includes(q);
      const subcats = getSubcategories(root.id);
      const matchSubs = subcats.some((s) => s.name.toLowerCase().includes(q));
      return matchRoot || matchSubs;
    });
  }, [rootCategories, selectedSidebarSlug, searchQuery, categories]);

  const filteredSubCategories = useMemo(() => {
    let list = subCategories;
    if (selectedSidebarSlug) {
      const selectedParent = rootCategories.find((r) => r.slug === selectedSidebarSlug);
      if (selectedParent) {
        list = list.filter((s) => s.parent_id === selectedParent.id);
      }
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((sub) => sub.name.toLowerCase().includes(q));
  }, [subCategories, selectedSidebarSlug, searchQuery, rootCategories]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] py-10 sm:py-14 font-sans">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 1. HEADER AREA */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F8F1E3] border border-[#E8DCC8] px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#C8891A] mb-3">
            <Compass className="h-3.5 w-3.5" />
            <span>SACRED COLLECTIONS</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#3B2416]">
            Sacred Categories
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#806B57] font-normal leading-relaxed">
            Browse our complete collection of handcrafted deity poshak, sacred sringar, mandir decor, and devotional accessories.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-6 max-w-md mx-auto relative">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-[#806B57] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories (e.g. Poshak, Mukut, Diya)..."
                className="w-full h-11 pl-10 pr-9 rounded-2xl border border-[#E8DCC8] bg-white text-xs sm:text-sm text-[#3B2416] placeholder:text-[#806B57]/80 focus:outline-hidden focus:border-[#C8891A] focus:ring-1 focus:ring-[#C8891A] shadow-xs transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 p-1 rounded-full text-[#806B57] hover:text-[#3B2416] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Three Filter Options */}
          <div className="mt-6 inline-flex p-1 rounded-2xl bg-white border border-[#E8DCC8] shadow-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setSelectedSidebarSlug(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "all" && !selectedSidebarSlug
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
                setSelectedSidebarSlug(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "main" && !selectedSidebarSlug
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
                setSelectedSidebarSlug(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "sub" && !selectedSidebarSlug
                  ? "bg-[#C8891A] text-white shadow-xs"
                  : "text-[#3B2416]/80 hover:text-[#3B2416] hover:bg-[#F8F1E3]"
              }`}
            >
              Subcategories ({subCategories.length})
            </button>
          </div>
        </div>

        {/* Mobile Toggle Button for Left Sidebar */}
        <div className="lg:hidden mb-4">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#E8DCC8] text-xs font-bold text-[#3B2416] shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#C8891A]" />
              <span>Category Navigation Filter</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-[#C8891A] transition-transform ${
                mobileSidebarOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* 2. TWO-COLUMN DIRECTORY LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT SIDEBAR (Category Filters & Vertical Tree) */}
          <aside
            className={`lg:col-span-4 lg:block ${
              mobileSidebarOpen ? "block" : "hidden"
            } bg-white rounded-2xl sm:rounded-3xl border border-[#E8DCC8] p-5 shadow-xs sticky top-24`}
          >
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-[#E8DCC8]">
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-[#C8891A]" />
                <h3 className="font-serif text-base font-bold text-[#3B2416]">
                  Category Hierarchy
                </h3>
              </div>
              {selectedSidebarSlug && (
                <button
                  type="button"
                  onClick={() => setSelectedSidebarSlug(null)}
                  className="text-[11px] font-semibold text-[#C8891A] hover:underline"
                >
                  View All
                </button>
              )}
            </div>

            <nav className="flex flex-col space-y-1 max-h-[70vh] overflow-y-auto pr-1">
              {/* Show All option */}
              <button
                type="button"
                onClick={() => {
                  setSelectedSidebarSlug(null);
                  setMobileSidebarOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                  selectedSidebarSlug === null
                    ? "bg-[#C8891A] text-white shadow-2xs"
                    : "text-[#3B2416] hover:bg-[#F8F1E3]"
                }`}
              >
                <span>All Sacred Offerings</span>
                <span className="text-[11px] opacity-80">{categories.length}</span>
              </button>

              {/* Main Categories Vertical Hierarchy */}
              {rootCategories.map((cat) => {
                const subcats = getSubcategories(cat.id);
                const hasSubs = subcats.length > 0;
                const isSelected = selectedSidebarSlug === cat.slug;
                const isExpanded = Boolean(sidebarExpandedCats[cat.id]);

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
                        onClick={() => {
                          setSelectedSidebarSlug(cat.slug);
                          setMobileSidebarOpen(false);
                        }}
                        className="flex-1 text-left truncate cursor-pointer hover:text-[#C8891A]"
                      >
                        {cat.name}
                      </button>

                      {hasSubs && (
                        <button
                          type="button"
                          onClick={(e) => toggleSidebarExpand(cat.id, e)}
                          className="p-1 rounded text-[#806B57] hover:text-[#C8891A] cursor-pointer ml-1"
                        >
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform duration-200 ${
                              isExpanded ? "rotate-180 text-[#C8891A]" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Subcategories in sidebar */}
                    {hasSubs && isExpanded && (
                      <div className="pl-4 py-1 flex flex-col space-y-0.5 border-l-2 border-[#E8DCC8] ml-3 my-0.5">
                        {subcats.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/shop?category=${sub.slug}`}
                            onClick={() => setMobileSidebarOpen(false)}
                            className="py-1 px-2 rounded-lg text-[11px] font-medium text-[#806B57] hover:text-[#C8891A] hover:bg-[#F8F1E3] transition-colors truncate"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* RIGHT CONTENT AREA (Horizontal Category Rows, Left Expand Control, Far-Right Gold Arrow) */}
          <main className="lg:col-span-8 w-full">
            {categories.length === 0 ? (
              <div className="rounded-3xl border border-[#E8DCC8] bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F8F1E3] text-[#C8891A]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-medium text-[#3B2416]">
                  No Categories Available
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#806B57]">
                  Sacred collections are currently being refreshed. Please check back shortly.
                </p>
                <Link
                  href="/shop"
                  className="mt-6 inline-flex items-center justify-center h-10 px-5 rounded-xl bg-[#C8891A] text-xs font-semibold text-white hover:bg-[#B37814] transition-colors shadow-sm"
                >
                  Browse All Offerings
                </Link>
              </div>
            ) : activeTab === "sub" ? (
              /* Subcategories List View */
              <div className="divide-y divide-[#E8DCC8] rounded-2xl sm:rounded-3xl border border-[#E8DCC8] bg-white shadow-sm overflow-hidden">
                {filteredSubCategories.length === 0 ? (
                  <div className="p-8 text-center text-[#806B57] text-sm">
                    No subcategories found matching &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  filteredSubCategories.map((sub) => {
                    const parentCat = categories.find((c) => c.id === sub.parent_id);
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between min-h-[76px] sm:min-h-[82px] px-5 sm:px-7 hover:bg-[#FFFDF7] transition-colors group"
                      >
                        <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0 py-3">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0">
                            <span className="h-2 w-2 rounded-full bg-[#C8891A]" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <Link
                              href={`/shop?category=${sub.slug}`}
                              className="font-serif text-lg sm:text-[19px] font-bold text-[#3B2416] group-hover:text-[#C8891A] transition-colors truncate"
                            >
                              {sub.name}
                            </Link>
                            {parentCat && (
                              <span className="text-[12px] text-[#806B57] truncate mt-0.5">
                                In {parentCat.name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Far right: ONLY gold right-facing chevron */}
                        <Link
                          href={`/shop?category=${sub.slug}`}
                          aria-label={`View ${sub.name}`}
                          className="p-2 -mr-2 text-[#C8891A] hover:translate-x-1 transition-transform shrink-0"
                        >
                          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.2]" />
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Main Category Directory (Horizontal Rows, Left Expand Control, Far-Right Gold Arrow) */
              <div className="divide-y divide-[#E8DCC8] rounded-2xl sm:rounded-3xl border border-[#E8DCC8] bg-white shadow-sm overflow-hidden">
                {filteredRootCategories.length === 0 ? (
                  <div className="p-8 text-center text-[#806B57] text-sm">
                    No categories found matching &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  filteredRootCategories.map((cat) => {
                    const subcats = getSubcategories(cat.id);
                    const hasSubs = subcats.length > 0;
                    const isExpanded = Boolean(
                      searchQuery.trim() ? true : expandedCats[cat.id]
                    );

                    return (
                      <div key={cat.id} className="transition-colors hover:bg-[#FFFDF7]/60">
                        {/* Main Category Row */}
                        <div className="flex items-center justify-between min-h-[78px] sm:min-h-[84px] px-5 sm:px-7 py-3">
                          {/* LEFT: Square expand/collapse button + Name + Subcategory count */}
                          <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                            {hasSubs ? (
                              <button
                                type="button"
                                onClick={(e) => toggleExpand(cat.id, e)}
                                aria-label={isExpanded ? `Collapse ${cat.name}` : `Expand ${cat.name}`}
                                className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg border border-[#E8DCC8] bg-[#FFFDF7] hover:bg-[#F8F1E3] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                              >
                                <ChevronDown
                                  className={`h-4 w-4 text-[#C8891A] stroke-[2.2] transition-transform duration-200 ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            ) : (
                              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center shrink-0">
                                <span className="h-2 w-2 rounded-full bg-[#C8891A]" />
                              </div>
                            )}

                            <div className="flex flex-col min-w-0">
                              <Link
                                href={`/shop?category=${cat.slug}`}
                                className="font-serif text-lg sm:text-[20px] font-bold text-[#3B2416] hover:text-[#C8891A] transition-colors truncate leading-snug"
                              >
                                {cat.name}
                              </Link>
                              {hasSubs && (
                                <span className="text-[12px] sm:text-[13px] text-[#806B57] font-normal mt-0.5">
                                  {subcats.length} {subcats.length === 1 ? "subcategory" : "subcategories"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* RIGHT: Far-Right Gold Arrow ONLY (No Explore text) */}
                          <div className="flex items-center shrink-0 ml-4">
                            <Link
                              href={`/shop?category=${cat.slug}`}
                              aria-label={`View ${cat.name}`}
                              className="p-2 -mr-2 text-[#C8891A] hover:translate-x-1 transition-transform"
                            >
                              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.2]" />
                            </Link>
                          </div>
                        </div>

                        {/* Subcategories (Revealed below parent with indentation) */}
                        {hasSubs && isExpanded && (
                          <div className="bg-[#FFFDF7] px-6 sm:px-12 py-3 border-t border-[#E8DCC8]/70">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {subcats.map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={`/shop?category=${sub.slug}`}
                                  className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white text-xs sm:text-sm font-semibold text-[#3B2416] hover:text-[#C8891A] transition-all group"
                                >
                                  <span className="truncate">{sub.name}</span>
                                  <ChevronRight className="h-3.5 w-3.5 text-[#C8891A] group-hover:translate-x-0.5 transition-transform shrink-0" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}