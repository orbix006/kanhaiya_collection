"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, HelpCircle, X, RotateCcw } from "lucide-react";
import type { Faq } from "@/lib/data/cms";

interface FaqBrowserProps {
  faqs: Faq[];
}

export function FaqBrowser({ faqs }: FaqBrowserProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [openFaqIds, setOpenFaqIds] = useState<Set<string>>(() => {
    return faqs.length > 0 ? new Set([faqs[0].id]) : new Set();
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return ["All", ...Array.from(set)];
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    let result = faqs;
    if (selectedCategory !== "All") {
      result = result.filter((f) => (f.category || "General") === selectedCategory);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q) ||
          (f.category && f.category.toLowerCase().includes(q))
      );
    }
    return result;
  }, [faqs, selectedCategory, searchTerm]);

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
  };

  if (faqs.length === 0) {
    return (
      <div className="text-center py-16 p-8 rounded-3xl bg-card border border-border/80 max-w-xl mx-auto space-y-3">
        <HelpCircle className="h-10 w-10 mx-auto text-primary/60" />
        <h3 className="text-lg font-bold text-foreground font-serif">Frequently Asked Questions Being Curated</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Our customer service guide is currently being updated with new queries. Please check back shortly or connect with our royal concierge directly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div role="search" aria-label="Search FAQs" className="relative max-w-xl mx-auto">
        <label htmlFor="faq-search-input" className="sr-only">
          Search frequently asked questions
        </label>
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          id="faq-search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search questions about delivery, silk care, returns..."
          className="h-11 w-full rounded-2xl border border-border bg-card pl-11 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-xs transition-all"
        />
        {searchTerm.trim().length > 0 && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            aria-label="Clear search query"
            className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      {categories.length > 1 && (
        <div
          role="tablist"
          aria-label="FAQ categories"
          className="flex items-center justify-center gap-2 flex-wrap"
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Accordion List */}
      <div className="max-w-3xl mx-auto space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 p-6 rounded-2xl bg-card border border-border space-y-3">
            <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">No matching questions found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No FAQs match your search &ldquo;{searchTerm}&rdquo; in category &ldquo;{selectedCategory}&rdquo;.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border bg-muted/60 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Search & Filters</span>
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = openFaqIds.has(faq.id);
            const buttonId = `faq-btn-${faq.id}`;
            const panelId = `faq-panel-${faq.id}`;

            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs transition-all"
              >
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 pr-4">
                    {faq.category && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">
                        {faq.category}
                      </span>
                    )}
                    <span className="text-xs sm:text-sm font-bold text-foreground">
                      {faq.question}
                    </span>
                  </div>

                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary bg-primary/10" : ""
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-5 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
