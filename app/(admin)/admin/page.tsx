import React from "react";
import { getAdminDashboardStats, getUnreadOrdersAction } from "@/lib/data/admin-dashboard";
import { ProductionDashboardView } from "@/components/admin/production-dashboard-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard | Kanhaiya Collection",
  description: "Executive Administration & Operations Control Center for Kanhaiya Collection",
};

export default async function AdminDashboardPage() {
  const [stats, unreadOrders] = await Promise.all([
    getAdminDashboardStats(),
    getUnreadOrdersAction(),
  ]);

  return (
    <ProductionDashboardView
      stats={stats}
      unreadOrders={unreadOrders}
    />
  );
}
