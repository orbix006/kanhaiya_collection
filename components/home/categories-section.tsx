"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Category } from "@/lib/store";
import { ChevronDown, ChevronRight, Compass } from "lucide-react";

interface CategoriesSectionProps {
  categories?: Category[];
}

export function CategoriesSection({ categories = [] }: CategoriesSectionProps) {
  const safeCategories = Array.isArray(categories) ? categories : [];
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  if (safeCategories.length === 0) return null;

  // Filter main root categories (parent_id is null)
  const rootCategories = safeCategories.filter((c) => !c.parent_id && c.is_active);
  const getSubcategories = (parentId: string) =>
    safeCategories.filter((c) => c.parent_id === parentId && c.is_active);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCats((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section
      aria-label="Sacred Categories"
      className="py-12 sm:py-16 lg:py-20 bg-[#FFFDF7] transition-colors"
    >
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#C8891A] font-semibold font-sans mb-1.5">
              <Compass className="h-3.5 w-3.5" />
              <span>Sacred Collections</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#3B2416]">
              Sacred Categories
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#806B57] font-sans font-normal max-w-md">
              Discover artisan murtis, puja essentials, temple brassware, and altar textiles.
            </p>
          </div>

          <Link
            href="/categories"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#C8891A] hover:text-[#B37814] transition-colors py-1 font-sans shrink-0"
          >
            <span>View All Categories</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1 stroke-[2.2]" />
          </Link>
        </div>

        {/* Horizontal Category Directory List (Single large container, clean rows) */}
        <div className="divide-y divide-[#E8DCC8] rounded-2xl sm:rounded-3xl border border-[#E8DCC8] bg-white shadow-sm overflow-hidden">
          {rootCategories.map((cat) => {
            const subcats = getSubcategories(cat.id);
            const hasSubs = subcats.length > 0;
            const isExpanded = Boolean(expandedCats[cat.id]);

            return (
              <div key={cat.id} className="transition-colors hover:bg-[#FFFDF7]/60">
                {/* Main Category Row */}
                <div className="flex items-center justify-between min-h-[76px] sm:min-h-[82px] px-5 sm:px-8 py-3">
                  {/* LEFT: [ ↓ / • ] Category Name (Navigates to /categories) */}
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
                        href="/categories"
                        className="font-serif text-lg sm:text-[20px] font-bold text-[#3B2416] hover:text-[#C8891A] transition-colors truncate leading-snug"
                      >
                        {cat.name}
                      </Link>
                      {hasSubs && (
                        <span className="text-[12px] text-[#806B57] font-normal mt-0.5">
                          {subcats.length} {subcats.length === 1 ? "subcategory" : "subcategories"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Right-facing chevron ONLY (Navigates to /categories) */}
                  <div className="flex items-center shrink-0 ml-4">
                    <Link
                      href="/categories"
                      aria-label={`View ${cat.name} on categories directory`}
                      className="p-2 -mr-2 text-[#C8891A] hover:translate-x-1 transition-transform"
                    >
                      <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.2]" />
                    </Link>
                  </div>
                </div>

                {/* Subcategories (Revealed underneath parent on expand, navigates to /categories) */}
                {hasSubs && isExpanded && (
                  <div className="bg-[#FFFDF7] px-6 sm:px-14 py-3 border-t border-[#E8DCC8]/70">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {subcats.map((sub) => (
                        <Link
                          key={sub.id}
                          href="/categories"
                          className="flex items-center justify-between py-1.5 px-3 rounded-xl hover:bg-white text-xs sm:text-sm font-semibold text-[#3B2416] hover:text-[#C8891A] transition-all group"
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
          })}
        </div>
      </div>
    </section>
  );
}