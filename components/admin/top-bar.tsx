"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  ChevronRight,
} from "lucide-react";
import { NotificationsDropdown } from "./notifications-dropdown";
import { ProfileDropdown } from "./profile-dropdown";
import { GlobalSearchModal } from "./global-search-modal";

interface TopBarProps {
  userEmail?: string;
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
    role?: string;
  } | null;
  onOpenMobileMenu: () => void;
}

const ROUTE_TITLES: Record<string, { title: string; section: string }> = {
  "/admin": { title: "Executive Dashboard", section: "Overview" },
  "/admin/orders": { title: "Customer Orders & Fulfillment", section: "Store" },
  "/admin/products": { title: "Product Catalog Management", section: "Store" },
  "/admin/categories": { title: "Categories & Hierarchy", section: "Store" },
  "/admin/cms/homepage": { title: "Homepage Sections & Content", section: "Storefront" },
  "/admin/cms/policies": { title: "Site Policies & Legal Documents", section: "Governance" },
  "/admin/inbox": { title: "Contact Inquiries & Captured Leads", section: "Audience" },
  "/admin/inbox/contact": { title: "Contact Inquiries & Captured Leads", section: "Audience" },
  "/admin/inbox/leads": { title: "Contact Inquiries & Captured Leads", section: "Audience" },
  // Legacy routes for route safety
  "/admin/inventory": { title: "Inventory & Stock Control (Restructuring)", section: "Store" },
  "/admin/reviews": { title: "Review Moderation (Restructuring)", section: "Store" },
  "/admin/users": { title: "Customers & Role Access (Restructuring)", section: "Store" },
  "/admin/offers": { title: "Promotions & Offers (Moved to Homepage Sections)", section: "Storefront" },
  "/admin/cms/banners": { title: "Hero Banners (Moved to Homepage Sections)", section: "Storefront" },
  "/admin/cms/testimonials": { title: "Wall of Love (Restructuring)", section: "Storefront" },
  "/admin/cms/about": { title: "About Us Story (Restructuring)", section: "Storefront" },
  "/admin/cms/faqs": { title: "FAQs & Help (Restructuring)", section: "Storefront" },
  "/admin/cms/settings": { title: "Site Settings (Restructuring)", section: "Storefront" },
};

export function AdminTopBar({
  userEmail,
  profile,
  onOpenMobileMenu,
}: TopBarProps) {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Determine current breadcrumbs and title
  const currentRouteInfo =
    ROUTE_TITLES[pathname] ||
    (pathname.startsWith("/admin/orders/")
      ? { title: "Order Details Inspector", section: "Orders" }
      : { title: "Management Suite", section: "Admin" });

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 sm:h-20 w-full items-center justify-between border-b border-border/70 bg-background/95 backdrop-blur px-4 sm:px-6 lg:px-8 shadow-2xs font-sans">
        {/* Left: Mobile hamburger + Breadcrumbs / Title */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label="Open navigation sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumbs & Title */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <Link href="/admin" className="hover:text-foreground transition-colors">
                Admin
              </Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              <span className="text-primary font-bold truncate">
                {currentRouteInfo.section}
              </span>
            </div>
            <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-foreground truncate leading-tight">
              {currentRouteInfo.title}
            </h1>
          </div>
        </div>

        {/* Center: Global Search Interface */}
        <div className="hidden md:flex items-center max-w-xs lg:max-w-md w-full mx-4">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="w-full h-10 px-3.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs flex items-center justify-between transition-all group shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <Search className="h-4 w-4 text-primary" />
              <span>Search primary modules...</span>
            </div>
            <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-background text-muted-foreground border border-border">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right: Quick Search icon (mobile) + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile search trigger */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-muted/40 text-foreground hover:bg-muted transition-colors"
            aria-label="Open search"
          >
            <Search className="h-4 w-4 text-primary" />
          </button>

          {/* Notifications Dropdown */}
          <NotificationsDropdown />

          {/* Admin Profile Dropdown */}
          <ProfileDropdown userEmail={userEmail} profile={profile} />
        </div>
      </header>

      {/* Global Command/Search Palette Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
