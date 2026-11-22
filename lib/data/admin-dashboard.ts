import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface DashboardKPIData {
  totalRevenue: number;
  grossCollected: number;
  refunded: number;
  totalOrders: number;
  totalCategories: number;
  totalVisitors: number;
  pageViews: number;
  sessions: number;
  unreadOrdersCount: number;
}

export interface UnreadOrderRow {
  id: string;
  order_number: string;
  order_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total: number;
  status: "pending" | "in_progress" | "delivered" | "cancelled";
  payment_method: string;
  payment_status: string;
  created_at: string;
  is_read: boolean;
}

/**
 * Fetches authoritative dashboard KPIs directly from Supabase.
 * Uses stored procedure public.admin_dashboard_stats() or exact table aggregations.
 */
export async function getAdminDashboardStats(): Promise<DashboardKPIData> {
  const isConfigured = isSupabaseConfigured();

  if (!isConfigured) {
    // Offline / Demo store fallback
    const { loadMockStore } = await import("@/lib/mock-data/admin-store");
    const store = loadMockStore();

    // 1. Total revenue: confirmed/delivered orders excluding cancelled/refunded
    const validOrders = store.orders.filter(
      (o) => o.status !== "cancelled" && o.status !== "refunded" && o.payment_status !== "failed"
    );
    const totalRev = validOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const rootCats = store.categories.filter((c) => !c.parent_id);

    return {
      totalRevenue: totalRev,
      grossCollected: totalRev,
      refunded: 0,
      totalOrders: store.orders.length,
      totalCategories: rootCats.length,
      totalVisitors: 1240,
      pageViews: 4890,
      sessions: 1680,
      unreadOrdersCount: store.orders.filter((o) => (o as any).is_read === false || o.status === "pending").length,
    };
  }

  const supabase = await createClient();

  // Try authoritative RPC public.admin_dashboard_stats()
  try {
    const { data: rpcData, error: rpcErr } = await (supabase.rpc as any)("admin_dashboard_stats");
    if (!rpcErr && rpcData) {
      const { count: unreadCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      return {
        totalRevenue: Number(rpcData.total_revenue || 0),
        grossCollected: Number(rpcData.gross_collected || 0),
        refunded: Number(rpcData.refunded || 0),
        totalOrders: Number(rpcData.total_orders || 0),
        totalCategories: Number(rpcData.total_categories || 0),
        totalVisitors: Number(rpcData.total_visitors || 0),
        pageViews: Number(rpcData.page_views || 0),
        sessions: Number(rpcData.sessions || 0),
        unreadOrdersCount: unreadCount ?? 0,
      };
    }
  } catch (err) {
    console.warn("[getAdminDashboardStats] RPC call failed, falling back to direct table queries:", err);
  }

  // Fallback to direct queries on public.payments, public.orders, public.categories, public.analytics_daily
  // KPI 1: Total Revenue from public.payments (charges succeeded minus refunds succeeded) or orders
  let totalRevenue = 0;
  let grossCollected = 0;
  let refunded = 0;

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, kind, status")
    .eq("status", "succeeded");

  if (payments && payments.length > 0) {
    for (const p of payments) {
      const amt = Number(p.amount) || 0;
      if (p.kind === "charge") grossCollected += amt;
      else if (p.kind === "refund") refunded += amt;
    }
    totalRevenue = Math.max(0, grossCollected - refunded);
  } else {
    // If payments ledger isn't populated for all legacy orders, calculate from orders:
    // Exclude cancelled and refunded orders and failed payment status
    const { data: orders } = await supabase
      .from("orders")
      .select("total, status, payment_status")
      .not("status", "in", '("cancelled")')
      .not("payment_status", "in", '("failed","voided")');

    if (orders) {
      totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      grossCollected = totalRevenue;
    }
  }

  // KPI 2: Total Orders
  const { count: totalOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  // KPI 3: Total Root Categories (parent_id IS NULL)
  const { count: totalCategories } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .is("parent_id", null);

  // KPI 4: Total Unique Visitors from public.analytics_daily
  const { data: analyticsRows } = await supabase
    .from("analytics_daily")
    .select("unique_visitors, page_views, sessions");

  let totalVisitors = 0;
  let pageViews = 0;
  let sessions = 0;

  if (analyticsRows && analyticsRows.length > 0) {
    for (const row of analyticsRows) {
      totalVisitors += Number(row.unique_visitors) || 0;
      pageViews += Number(row.page_views) || 0;
      sessions += Number(row.sessions) || 0;
    }
  } else {
    // If analytics_daily has not aggregated yet, check site_visitors count
    const { count: visitorCount } = await supabase
      .from("site_visitors")
      .select("*", { count: "exact", head: true });
    totalVisitors = visitorCount ?? 0;
  }

  // Unread orders count
  const { count: unreadOrdersCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);

  return {
    totalRevenue,
    grossCollected,
    refunded,
    totalOrders: totalOrders ?? 0,
    totalCategories: totalCategories ?? 0,
    totalVisitors,
    pageViews,
    sessions,
    unreadOrdersCount: unreadOrdersCount ?? 0,
  };
}

/**
 * Fetches unread orders (is_read = false) requiring administrator action.
 */
export async function getUnreadOrdersAction(): Promise<UnreadOrderRow[]> {
  const isConfigured = isSupabaseConfigured();

  if (!isConfigured) {
    const { loadMockStore } = await import("@/lib/mock-data/admin-store");
    const store = loadMockStore();
    return store.orders
      .filter((o) => (o as any).is_read === false || o.status === "pending")
      .map((o) => ({
        id: o.id,
        order_number: o.order_number,
        order_name: o.order_number,
        customer_name: (o.customer as any)?.name || (o.customer as any)?.full_name || (o as any).customer_name || "Customer",
        customer_email: (o.customer as any)?.email || (o as any).customer_email || "customer@example.com",
        customer_phone: (o.customer as any)?.phone || (o as any).customer_phone || null,
        total: o.total,
        status: o.status as any,
        payment_method: o.payment_method || "cod",
        payment_status: o.payment_status,
        created_at: o.placed_at,
        is_read: false,
      }));
  }

  const supabase = await createClient();

  // Try RPC public.admin_unread_orders
  try {
    const { data: rpcRes, error: rpcErr } = await (supabase.rpc as any)("admin_unread_orders", {
      p_page: 1,
      p_page_size: 50,
    });
    if (!rpcErr && rpcRes?.rows) {
      return rpcRes.rows.map((r: any) => ({
        id: r.id,
        order_number: r.order_number,
        order_name: r.order_name || r.order_number,
        customer_name: r.customer_name,
        customer_email: r.customer_email,
        customer_phone: r.customer_phone,
        total: Number(r.total),
        status: r.status,
        payment_method: r.payment_method,
        payment_status: r.payment_status,
        created_at: r.created_at,
        is_read: false,
      }));
    }
  } catch {
    // Fall back to direct table select
  }

  const { data: rows, error } = await supabase
    .from("orders")
    .select("id, order_number, order_name, customer_name, customer_email, customer_phone, total, status, payment_method, payment_status, created_at, is_read")
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !rows) {
    console.error("[getUnreadOrdersAction] Query error:", error?.message);
    return [];
  }

  return rows.map((r: any) => ({
    id: r.id,
    order_number: r.order_number,
    order_name: r.order_name || r.order_number,
    customer_name: r.customer_name,
    customer_email: r.customer_email,
    customer_phone: r.customer_phone,
    total: Number(r.total),
    status: r.status,
    payment_method: r.payment_method,
    payment_status: r.payment_status,
    created_at: r.created_at,
    is_read: false,
  }));
}
