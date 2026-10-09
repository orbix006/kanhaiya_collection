import type { Metadata } from "next";
import { getAdminOrders } from "@/lib/data/orders";
import { OrderManager } from "@/components/admin/orders/order-manager";
import { Package, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Management & Fulfillment | Admin Dashboard",
  description:
    "Search, filter, inspect immutable historical order snapshots, and execute controlled business status workflows.",
};

export default async function AdminOrdersPage() {
  const result = await getAdminOrders();

  return (
    <div className="space-y-8">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Store Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Customer Orders & Fulfillment
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Search orders, inspect immutable item and address snapshots, and execute controlled status transitions.
          </p>
        </div>
      </div>

      {/* Main Order Manager */}
      <OrderManager
        initialOrders={result.orders}
        stats={{
          totalCount: result.totalCount,
          pendingCount: result.pendingCount,
          confirmedCount: result.confirmedCount,
          processingCount: result.processingCount,
          shippedCount: result.shippedCount,
          deliveredCount: result.deliveredCount,
          cancelledCount: result.cancelledCount,
          refundedCount: result.refundedCount,
          totalRevenue: result.totalRevenue,
        }}
      />
    </div>
  );
}
