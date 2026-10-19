import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Clock,
} from "lucide-react";

interface AdminComingSoonProps {
  moduleName: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function AdminComingSoon({
  moduleName,
  description,
  icon: Icon = Clock,
}: AdminComingSoonProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="relative max-w-xl w-full rounded-3xl border border-border/80 bg-card p-8 sm:p-10 shadow-lg text-center overflow-hidden">
        {/* Subtle decorative gold glow background */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Emblem with Sacred Diya / Icon */}
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F8F1E3] to-[#E8DCC8] dark:from-[#241A12] dark:to-[#1A130D] ring-1 ring-primary/40 shadow-sm">
            <Icon className="h-8 w-8 text-primary" />
          </div>

          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Module Restructuring • Coming Soon</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {moduleName}
          </h1>

          {/* Description */}
          <p className="mt-4 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
            {description ||
              "This module is undergoing administrative restructuring to enhance performance and consolidate core workflows. It will be reintroduced in a future phase."}
          </p>

          {/* Divider */}
          <div className="my-7 flex items-center justify-center gap-3 w-full max-w-xs">
            <div className="h-px flex-1 bg-border/70" />
            <span className="text-primary text-xs select-none">✦</span>
            <div className="h-px flex-1 bg-border/70" />
          </div>

          {/* Primary Quick Links */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Executive Dashboard</span>
            </Link>

            <Link
              href="/admin/orders"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-all"
            >
              <Package className="h-4 w-4 text-primary" />
              <span>Orders</span>
            </Link>

            <Link
              href="/admin/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-all"
            >
              <ShoppingBag className="h-4 w-4 text-primary" />
              <span>Products</span>
            </Link>
          </div>

          {/* Secondary helper text */}
          <div className="mt-6 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Looking for storefront banners & offers?</span>
            <Link
              href="/admin/cms/homepage"
              className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5"
            >
              <span>Homepage Sections</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
