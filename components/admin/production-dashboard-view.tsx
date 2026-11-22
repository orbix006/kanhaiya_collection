"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  FolderTree,
  Users,
  Eye,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import type { DashboardKPIData, UnreadOrderRow } from "@/lib/data/admin-dashboard";
import { StatCard } from "@/components/admin/stat-card";
import { PageHeader } from "@/components/admin/page-header";
import { UnreadOrdersTable } from "@/components/admin/dashboard/unread-orders-table";

interface ProductionDashboardViewProps {
  stats: DashboardKPIData;
  unreadOrders: UnreadOrderRow[];
}

export function ProductionDashboardView({
  stats,
  unreadOrders,
}: ProductionDashboardViewProps) {
  return (
    <div className="space-y-8 font-sans">
      {/* 1. Dashboard Heading with Short Description */}
      <PageHeader
        title="Administrative Overview"
        description="Real-time operational dashboard for Kanhaiya Collection. Track revenue, monitor order fulfillment, view catalog departments, and review customer engagement."
        badge={{
          text: "Live Storefront Data",
          variant: "gold",
        }}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
            >
              <Package className="h-4 w-4" />
              <span>All Orders ({stats.totalOrders})</span>
            </Link>
          </div>
        }
      />

      {/* 2. EXACTLY FOUR PRIMARY KPI CARDS */}
      <section aria-labelledby="kpi-heading" className="space-y-3">
        <h2 id="kpi-heading" className="sr-only">Primary Key Performance Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* KPI 1: Total Revenue */}
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
            icon={TrendingUp}
            variant="success"
            description="Excludes cancelled, rejected, and failed-payment orders"
          />

          {/* KPI 2: Total Orders */}
          <StatCard
            title="Total Orders"
            value={stats.totalOrders.toLocaleString("en-IN")}
            icon={Package}
            variant="blue"
            description={`${stats.unreadOrdersCount} unread • ${stats.totalOrders} total recorded`}
            href="/admin/orders"
          />

          {/* KPI 3: Total Categories */}
          <StatCard
            title="Total Categories"
            value={stats.totalCategories.toLocaleString("en-IN")}
            icon={FolderTree}
            variant="amber"
            description="Parent departments only (subcategories excluded)"
            href="/admin/categories"
          />

          {/* KPI 4: Total Website Visitors */}
          <StatCard
            title="Total Website Visitors"
            value={stats.totalVisitors.toLocaleString("en-IN")}
            icon={Users}
            variant="purple"
            description={`${stats.pageViews.toLocaleString("en-IN")} page views • ${stats.sessions.toLocaleString("en-IN")} sessions`}
          />
        </div>
      </section>

      {/* 3. NEW ORDERS REQUIRING ACTION SECTION */}
      <section aria-labelledby="unread-orders-heading">
        <h2 id="unread-orders-heading" className="sr-only">New Orders Requiring Action</h2>
        <UnreadOrdersTable initialOrders={unreadOrders} />
      </section>
    </div>
  );
}
