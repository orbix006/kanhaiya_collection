"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Package,
  ShoppingBag,
  FolderTree,
  Layers,
  ShieldCheck,
  Mail,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";

interface SearchItem {
  title: string;
  category: "Overview" | "Store Catalog" | "Storefront Content" | "Audience & Legal";
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    title: "Executive Dashboard",
    category: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    keywords: "metrics, revenue, stats, overview, sales, activity, performance",
  },
  {
    title: "Customer Orders & Fulfillment",
    category: "Store Catalog",
    href: "/admin/orders",
    icon: Package,
    keywords: "sales, customer orders, shipping, cod, pending, tracking, invoices",
  },
  {
    title: "Product Catalog",
    category: "Store Catalog",
    href: "/admin/products",
    icon: ShoppingBag,
    keywords: "items, silk, idols, sarees, kurtas, thalis, stock, prices",
  },
  {
    title: "Categories & Hierarchy",
    category: "Store Catalog",
    href: "/admin/categories",
    icon: FolderTree,
    keywords: "subcategories, hierarchy, taxonomy, display order, slugs",
  },
  {
    title: "Homepage Sections",
    category: "Storefront Content",
    href: "/admin/cms/homepage",
    icon: Layers,
    keywords: "hero images, banners, carousel, offers, festive campaigns, discounts, announcements",
  },
  {
    title: "Site Policies & Legal Documents",
    category: "Audience & Legal",
    href: "/admin/cms/policies",
    icon: ShieldCheck,
    keywords: "terms of service, privacy policy, cancellation policy, refund policy, legal",
  },
  {
    title: "Contact Inquiries & Leads",
    category: "Audience & Legal",
    href: "/admin/inbox",
    icon: Mail,
    keywords: "customer messages, inquiries, newsletter leads, captured subscribers, contact form",
  },
];

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Keyboard shortcut listener: Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = SEARCH_ITEMS.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.keywords && item.keywords.toLowerCase().includes(q))
    );
  });

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 font-sans animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-border/70 bg-muted/20">
          <Search className="h-5 w-5 text-primary shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search primary admin modules (e.g., Orders, Products, Homepage...)"
            className="w-full h-14 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden"
            autoFocus
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border border-border">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No matching admin modules found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => handleSelect(item.href)}
                  type="button"
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {item.category}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="p-3 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground px-4">
          <div className="flex items-center gap-2">
            <span>Navigate:</span>
            <span className="font-semibold text-foreground">7 Primary Modules</span>
          </div>
          <div>Press ESC to close</div>
        </div>
      </div>
    </div>
  );
}
