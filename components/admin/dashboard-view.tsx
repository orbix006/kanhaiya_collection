"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  FolderTree,
  RotateCcw,
  Plus,
  Layers,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  ArrowRight,
  Percent,
  CheckCircle2,
} from "lucide-react";

import {
  MockAdminStore,
  loadMockStore,
  resetMockStore,
  getDashboardKPIs,
} from "@/lib/mock-data/admin-store";
import type { FestiveOffer } from "@/lib/store";
import { StatCard } from "@/components/admin/stat-card";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import { MonthlyVisitorChart } from "@/components/admin/analytics/monthly-visitor-chart";
import { NewOrdersQueue } from "@/components/admin/dashboard/new-orders-queue";

interface DashboardViewProps {
  initialStore: MockAdminStore;
  festiveOffer: FestiveOffer;
}

export function DashboardView({
  initialStore,
  festiveOffer,
}: DashboardViewProps) {
  // 1. Safe Client Hydration State
  const [store, setStore] = useState<MockAdminStore>(initialStore);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Synchronize with localStorage on client mount without hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStore(loadMockStore());
  }, []);

  // Callback to refresh store when an order is actioned or modified
  const handleStoreUpdated = useCallback(() => {
    const fresh = loadMockStore();
    setStore(fresh);
  }, []);

  // 2. Exactly Four Primary KPI Cards calculated from mock store
  const kpis = useMemo(() => {
    return getDashboardKPIs(store);
  }, [store]);

  // Handle resetting mock store to canonical seed defaults
  const handleConfirmReset = () => {
    const fresh = resetMockStore();
    setStore(fresh);
    setIsResetDialogOpen(false);
    setResetSuccessMessage("Demo data has been reset to baseline defaults with pending orders restored.");
    setTimeout(() => setResetSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Reset Success Banner */}
      {resetSuccessMessage && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{resetSuccessMessage}</span>
          </div>
          <button
            onClick={() => setResetSuccessMessage(null)}
            className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Header with Title, Dev Preview Badge & Quick Actions */}
      <PageHeader
        title="Executive Performance & Operations"
        description="Comprehensive administrative control center for Kanhaiya Collection. Monitor revenue velocity, visitor engagement, customer orders, and sacred catalog health."
        badge={{
          text: "Dev Preview Active — Mock Store",
          variant: "gold",
        }}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsResetDialogOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-card-foreground text-xs font-semibold hover:bg-muted hover:text-foreground transition-all shadow-2xs cursor-pointer"
              title="Reset mock store to default demo records"
            >
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Reset Demo Data</span>
            </button>

            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </Link>

            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card text-card-foreground text-xs font-semibold hover:bg-muted transition-all shadow-2xs"
            >
              <Package className="h-4 w-4 text-primary" />
              <span>All Orders</span>
            </Link>
          </div>
        }
      />

      {/* 2. EXACTLY FOUR PRIMARY KPI CARDS (Phase 1 Requirement A) */}
      <section aria-labelledby="kpi-heading" className="space-y-2">
        <h2 id="kpi-heading" className="sr-only">Primary Key Performance Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Revenue */}
          <StatCard
            title="Total Revenue"
            value={`₹${kpis.totalRevenue.toLocaleString("en-IN")}`}
            icon={TrendingUp}
            variant="success"
            badge={`${kpis.totalOrders} Orders`}
            description={`₹${kpis.settledRevenue.toLocaleString("en-IN")} confirmed • ₹${kpis.pendingRevenue.toLocaleString("en-IN")} pending`}
          />

          {/* Card 2: Total Orders */}
          <StatCard
            title="Total Orders"
            value={kpis.totalOrders}
            icon={Package}
            variant="blue"
            description={`${kpis.pendingCount} pending • ${kpis.confirmedCount} confirmed • ${kpis.deliveredCount} delivered`}
            href="/admin/orders"
          />

          {/* Card 3: Active Products */}
          <StatCard
            title="Active Products"
            value={kpis.activeProducts}
            icon={ShoppingBag}
            variant="purple"
            description={`${kpis.activeProducts} active items (${kpis.inactiveProducts} archived/hidden)`}
            href="/admin/products"
          />

          {/* Card 4: Total Categories */}
          <StatCard
            title="Total Categories"
            value={kpis.totalCategories}
            icon={FolderTree}
            variant="amber"
            description={`${kpis.totalCategories} top-level departments (${kpis.totalSubcategories} subcategories excluded)`}
            href="/admin/categories"
          />
        </div>
      </section>

      {/* 3. MONTHLY VISITOR GRAPH (Phase 1 Requirement B) */}
      <section aria-labelledby="visitor-chart-heading">
        <h2 id="visitor-chart-heading" className="sr-only">Monthly Visitor Graph</h2>
        <MonthlyVisitorChart initialYear={2026} initialMonth={10} />
      </section>

      {/* 4. NEW ORDERS QUEUE (Phase 1 Requirement C) */}
      <section aria-labelledby="new-orders-heading">
        <h2 id="new-orders-heading" className="sr-only">New Customer Orders Requiring Action</h2>
        <NewOrdersQueue orders={store.orders} onOrderUpdated={handleStoreUpdated} />
      </section>

      {/* 5. QUICK ADMINISTRATION HUB & FESTIVE CAMPAIGN STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
        {/* Core Administrative Navigation Modules */}
        <div className="lg:col-span-8 rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Primary Modules Hub
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quick access shortcuts to all primary administrative centers
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              7 Active Modules
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Link
              href="/admin/orders"
              className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-muted/40 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Orders & Fulfillment</div>
                  <div className="text-[10px] text-muted-foreground">{store.orders.length} total customer orders</div>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/admin/products"
              className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-muted/40 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Catalog & Products</div>
                  <div className="text-[10px] text-muted-foreground">{kpis.activeProducts} active items</div>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/admin/categories"
              className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-muted/40 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <FolderTree className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Categories & Hierarchy</div>
                  <div className="text-[10px] text-muted-foreground">{kpis.totalCategories} root departments</div>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/admin/cms/homepage"
              className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-muted/40 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Homepage Sections</div>
                  <div className="text-[10px] text-muted-foreground">Hero, Offers & Festive Banners</div>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/admin/cms/policies"
              className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-muted/40 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Site Policies & Legal</div>
                  <div className="text-[10px] text-muted-foreground">Terms, Privacy, Cancellation, Refund</div>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/admin/inbox"
              className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-muted/40 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Contact Inquiries & Leads</div>
                  <div className="text-[10px] text-muted-foreground">{store.contactSubmissions.length} submissions • {store.leads.length} leads</div>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>

        {/* Right Side: Festive Campaign Card + Offline Notice */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Festive Campaign Card */}
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/50 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                <Percent className="h-4 w-4 text-rose-600" />
                <span>Festive Discount Campaign</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  festiveOffer.enabled
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-stone-200 text-stone-700"
                }`}
              >
                {festiveOffer.enabled ? "Active on Store" : "Disabled"}
              </span>
            </div>
            <div>
              <div className="font-bold text-foreground text-sm">
                {festiveOffer.title || "Festive Grand Sale"}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {festiveOffer.subtitle || "Flat 25% Off on Sacred Brass Idols & Temple Thalis"}
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/admin/cms/homepage?tab=festive"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-2xs"
              >
                <span>Configure Campaign</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Local Development Mode Info Box */}
          <div className="rounded-2xl border border-amber-300/80 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
              <ShieldCheck className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              <span>Offline Mock Store Operation</span>
            </div>
            <p className="text-[11px] text-[#806B57] dark:text-amber-200/80 leading-relaxed">
              Supabase backend is NOT connected. Order actions, inventory updates, and visitor tracking are stored locally in browser storage (<code className="font-mono text-[10px]">localStorage</code>) with zero external network requests.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Resetting Mock Data */}
      <ConfirmationDialog
        isOpen={isResetDialogOpen}
        title="Reset Demo Data to Defaults?"
        description="This will clear any local edits and restore all products, orders, categories, and pending order queues to the baseline canonical dataset."
        confirmText="Yes, Reset Data"
        cancelText="Cancel"
        variant="warning"
        onConfirm={handleConfirmReset}
        onClose={() => setIsResetDialogOpen(false)}
      />
    </div>
  );
}
