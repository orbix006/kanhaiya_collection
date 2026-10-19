import { createClient } from "@/lib/supabase/server";

export type {
  OrderStatus,
  PaymentStatus,
  AddressSnapshot,
  OrderItemSnapshot,
  OrderCustomerInfo,
  OrderDetails,
  AdminOrderFilterParams,
  AdminOrderListResult,
} from "./order-types";
export {
  VALID_ORDER_TRANSITIONS,
  canTransitionOrderStatus,
  VALID_PAYMENT_TRANSITIONS,
  canTransitionPaymentStatus,
} from "./order-types";
import type {
  OrderStatus,
  PaymentStatus,
  AddressSnapshot,
  OrderItemSnapshot,
  OrderCustomerInfo,
  OrderDetails,
  AdminOrderFilterParams,
  AdminOrderListResult,
} from "./order-types";
import {
  VALID_ORDER_TRANSITIONS,
  canTransitionOrderStatus,
  VALID_PAYMENT_TRANSITIONS,
  canTransitionPaymentStatus,
} from "./order-types";

import { SEED_ORDERS } from "@/lib/mock-data/admin-store";

// In-memory demo store for offline development / test resilience
const demoOrdersStore: Map<string, OrderDetails[]> = new Map();

// Helper to seed initial demo orders
function initDemoOrdersIfEmpty(): OrderDetails[] {
  let allOrders: OrderDetails[] = [];
  for (const list of demoOrdersStore.values()) {
    allOrders.push(...list);
  }

  if (allOrders.length > 0) return allOrders;

  const defaultSeedOrders: OrderDetails[] = SEED_ORDERS;

  for (const o of defaultSeedOrders) {
    const userList = demoOrdersStore.get(o.user_id) || [];
    userList.push(o);
    demoOrdersStore.set(o.user_id, userList);
  }

  return defaultSeedOrders;
}

/**
 * Returns all orders for a specific user ordered by newest first
 */
export async function getUserOrders(userId: string): Promise<OrderDetails[]> {
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    initDemoOrdersIfEmpty();
    const list = demoOrdersStore.get(userId) || [];
    return [...list].sort(
      (a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()
    );
  }

  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      user_id,
      order_number,
      status,
      payment_status,
      payment_method,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subtotal,
      discount,
      shipping_fee,
      tax,
      total,
      shipping_address,
      billing_address,
      placed_at,
      updated_at,
      order_items (
        id,
        order_id,
        product_id,
        variant_id,
        product_name,
        variant_name,
        unit_price,
        quantity,
        subtotal
      )
    `)
    .eq("user_id", userId)
    .order("placed_at", { ascending: false });

  if (error || !orders) {
    console.error("[getUserOrders] Query error:", error?.message);
    return [];
  }

  return orders.map((o: any) => ({
    id: o.id,
    user_id: o.user_id,
    order_number: o.order_number,
    status: o.status as OrderStatus,
    payment_status: o.payment_status as PaymentStatus,
    payment_method: o.payment_method,
    razorpay_order_id: o.razorpay_order_id,
    razorpay_payment_id: o.razorpay_payment_id,
    razorpay_signature: o.razorpay_signature,
    subtotal: Number(o.subtotal),
    discount: Number(o.discount),
    shipping_fee: Number(o.shipping_fee),
    tax: Number(o.tax),
    total: Number(o.total),
    shipping_address: o.shipping_address as unknown as AddressSnapshot,
    billing_address: o.billing_address as unknown as AddressSnapshot | null,
    placed_at: o.placed_at,
    updated_at: o.updated_at,
    items: (o.order_items || []).map((it: any) => ({
      id: it.id,
      order_id: it.order_id,
      product_id: it.product_id,
      variant_id: it.variant_id,
      product_name: it.product_name,
      variant_name: it.variant_name,
      unit_price: Number(it.unit_price),
      quantity: Number(it.quantity),
      subtotal: Number(it.subtotal),
    })),
    can_cancel: o.status === "pending",
  }));
}

/**
 * Returns a single order by ID for the authorized user
 */
export async function getOrderById(
  orderId: string,
  userId: string
): Promise<OrderDetails | null> {
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    initDemoOrdersIfEmpty();
    const list = demoOrdersStore.get(userId) || [];
    const found = list.find((o) => o.id === orderId || o.order_number === orderId);
    return found ? { ...found, can_cancel: found.status === "pending" } : null;
  }

  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      user_id,
      order_number,
      status,
      payment_status,
      payment_method,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subtotal,
      discount,
      shipping_fee,
      tax,
      total,
      shipping_address,
      billing_address,
      placed_at,
      updated_at,
      order_items (
        id,
        order_id,
        product_id,
        variant_id,
        product_name,
        variant_name,
        unit_price,
        quantity,
        subtotal
      )
    `)
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !order) {
    return null;
  }

  return {
    id: order.id,
    user_id: order.user_id,
    order_number: order.order_number,
    status: order.status as OrderStatus,
    payment_status: order.payment_status as PaymentStatus,
    payment_method: order.payment_method,
    razorpay_order_id: order.razorpay_order_id,
    razorpay_payment_id: order.razorpay_payment_id,
    razorpay_signature: order.razorpay_signature,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shipping_fee: Number(order.shipping_fee),
    tax: Number(order.tax),
    total: Number(order.total),
    shipping_address: order.shipping_address as unknown as AddressSnapshot,
    billing_address: order.billing_address as unknown as AddressSnapshot | null,
    placed_at: order.placed_at,
    updated_at: order.updated_at,
    items: (order.order_items || []).map((it: any) => ({
      id: it.id,
      order_id: it.order_id,
      product_id: it.product_id,
      variant_id: it.variant_id,
      product_name: it.product_name,
      variant_name: it.variant_name,
      unit_price: Number(it.unit_price),
      quantity: Number(it.quantity),
      subtotal: Number(it.subtotal),
    })),
    can_cancel: order.status === "pending",
  };
}

/**
 * Returns all orders across all customers for store administration
 */
export async function getAdminOrders(
  filterParams?: AdminOrderFilterParams
): Promise<AdminOrderListResult> {
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    const all = initDemoOrdersIfEmpty();
    let filtered = [...all];

    if (filterParams?.status && filterParams.status !== "all") {
      filtered = filtered.filter((o) => o.status === filterParams.status);
    }

    if (filterParams?.paymentStatus && filterParams.paymentStatus !== "all") {
      filtered = filtered.filter((o) => o.payment_status === filterParams.paymentStatus);
    }

    if (filterParams?.paymentMethod && filterParams.paymentMethod !== "all") {
      filtered = filtered.filter((o) => o.payment_method === filterParams.paymentMethod);
    }

    if (filterParams?.searchQuery?.trim()) {
      const q = filterParams.searchQuery.toLowerCase().trim();
      filtered = filtered.filter((o) => {
        const orderNum = o.order_number.toLowerCase();
        const custName = (o.customer?.full_name || o.shipping_address.full_name || "").toLowerCase();
        const phone = (o.shipping_address.phone || "").toLowerCase();
        const city = (o.shipping_address.city || "").toLowerCase();
        return (
          orderNum.includes(q) ||
          custName.includes(q) ||
          phone.includes(q) ||
          city.includes(q)
        );
      });
    }

    filtered.sort(
      (a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()
    );

    const counts = {
      pending: all.filter((o) => o.status === "pending").length,
      confirmed: all.filter((o) => o.status === "confirmed").length,
      processing: all.filter((o) => o.status === "processing").length,
      shipped: all.filter((o) => o.status === "shipped").length,
      delivered: all.filter((o) => o.status === "delivered").length,
      cancelled: all.filter((o) => o.status === "cancelled").length,
      refunded: all.filter((o) => o.status === "refunded").length,
    };

    const totalRevenue = all
      .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
      .reduce((sum, o) => sum + o.total, 0);

    return {
      orders: filtered,
      totalCount: filtered.length,
      pendingCount: counts.pending,
      confirmedCount: counts.confirmed,
      processingCount: counts.processing,
      shippedCount: counts.shipped,
      deliveredCount: counts.delivered,
      cancelledCount: counts.cancelled,
      refundedCount: counts.refunded,
      totalRevenue,
    };
  }

  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select(`
      id,
      user_id,
      order_number,
      status,
      payment_status,
      payment_method,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subtotal,
      discount,
      shipping_fee,
      tax,
      total,
      shipping_address,
      billing_address,
      placed_at,
      updated_at,
      profiles:profiles(id, full_name, avatar_url, phone),
      order_items (
        id,
        order_id,
        product_id,
        variant_id,
        product_name,
        variant_name,
        unit_price,
        quantity,
        subtotal
      )
    `)
    .order("placed_at", { ascending: false });

  if (filterParams?.status && filterParams.status !== "all") {
    query = query.eq("status", filterParams.status);
  }

  if (filterParams?.paymentStatus && filterParams.paymentStatus !== "all") {
    query = query.eq("payment_status", filterParams.paymentStatus);
  }

  if (filterParams?.paymentMethod && filterParams.paymentMethod !== "all") {
    query = query.eq("payment_method", filterParams.paymentMethod);
  }

  const { data: dbOrders, error } = await query;

  if (error || !dbOrders) {
    console.error("[getAdminOrders] Error fetching orders:", error?.message);
    return {
      orders: [],
      totalCount: 0,
      pendingCount: 0,
      confirmedCount: 0,
      processingCount: 0,
      shippedCount: 0,
      deliveredCount: 0,
      cancelledCount: 0,
      refundedCount: 0,
      totalRevenue: 0,
    };
  }

  let mapped: OrderDetails[] = dbOrders.map((o: any) => {
    const rawProfile = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles;
    return {
      id: o.id,
      user_id: o.user_id,
      order_number: o.order_number,
      status: o.status as OrderStatus,
      payment_status: o.payment_status as PaymentStatus,
      payment_method: o.payment_method,
      razorpay_order_id: o.razorpay_order_id,
      razorpay_payment_id: o.razorpay_payment_id,
      razorpay_signature: o.razorpay_signature,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      shipping_fee: Number(o.shipping_fee),
      tax: Number(o.tax),
      total: Number(o.total),
      shipping_address: o.shipping_address as unknown as AddressSnapshot,
      billing_address: o.billing_address as unknown as AddressSnapshot | null,
      placed_at: o.placed_at,
      updated_at: o.updated_at,
      customer: rawProfile
        ? {
            id: rawProfile.id,
            full_name: rawProfile.full_name,
            email: null,
            phone: rawProfile.phone,
            avatar_url: rawProfile.avatar_url,
          }
        : null,
      items: (o.order_items || []).map((it: any) => ({
        id: it.id,
        order_id: it.order_id,
        product_id: it.product_id,
        variant_id: it.variant_id,
        product_name: it.product_name,
        variant_name: it.variant_name,
        unit_price: Number(it.unit_price),
        quantity: Number(it.quantity),
        subtotal: Number(it.subtotal),
      })),
      can_cancel: o.status === "pending",
    };
  });

  if (filterParams?.searchQuery?.trim()) {
    const q = filterParams.searchQuery.toLowerCase().trim();
    mapped = mapped.filter((o) => {
      const orderNum = o.order_number.toLowerCase();
      const custName = (o.customer?.full_name || o.shipping_address?.full_name || "").toLowerCase();
      const phone = (o.shipping_address?.phone || "").toLowerCase();
      const city = (o.shipping_address?.city || "").toLowerCase();
      return (
        orderNum.includes(q) ||
        custName.includes(q) ||
        phone.includes(q) ||
        city.includes(q)
      );
    });
  }

  // Calculate status counts
  const { data: allStatuses } = await supabase
    .from("orders")
    .select("status, total");

  let pendingCount = 0;
  let confirmedCount = 0;
  let processingCount = 0;
  let shippedCount = 0;
  let deliveredCount = 0;
  let cancelledCount = 0;
  let refundedCount = 0;
  let totalRevenue = 0;

  if (allStatuses) {
    for (const row of allStatuses) {
      if (row.status === "pending") pendingCount++;
      else if (row.status === "confirmed") confirmedCount++;
      else if (row.status === "processing") processingCount++;
      else if (row.status === "shipped") shippedCount++;
      else if (row.status === "delivered") deliveredCount++;
      else if (row.status === "cancelled") cancelledCount++;
      else if (row.status === "refunded") refundedCount++;

      if (row.status !== "cancelled" && row.status !== "refunded") {
        totalRevenue += Number(row.total || 0);
      }
    }
  }

  return {
    orders: mapped,
    totalCount: mapped.length,
    pendingCount,
    confirmedCount,
    processingCount,
    shippedCount,
    deliveredCount,
    cancelledCount,
    refundedCount,
    totalRevenue,
  };
}

/**
 * Returns full details for a single order by ID or order_number for admin inspection
 */
export async function getAdminOrderById(orderId: string): Promise<OrderDetails | null> {
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    const all = initDemoOrdersIfEmpty();
    const found = all.find((o) => o.id === orderId || o.order_number === orderId);
    return found || null;
  }

  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      user_id,
      order_number,
      status,
      payment_status,
      payment_method,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subtotal,
      discount,
      shipping_fee,
      tax,
      total,
      shipping_address,
      billing_address,
      placed_at,
      updated_at,
      profiles:profiles(id, full_name, avatar_url, phone),
      order_items (
        id,
        order_id,
        product_id,
        variant_id,
        product_name,
        variant_name,
        unit_price,
        quantity,
        subtotal
      )
    `)
    .or(`id.eq.${orderId},order_number.eq.${orderId}`)
    .maybeSingle();

  if (error || !order) {
    return null;
  }

  const rawProfile = Array.isArray(order.profiles)
    ? order.profiles[0]
    : order.profiles;

  return {
    id: order.id,
    user_id: order.user_id,
    order_number: order.order_number,
    status: order.status as OrderStatus,
    payment_status: order.payment_status as PaymentStatus,
    payment_method: order.payment_method,
    razorpay_order_id: order.razorpay_order_id,
    razorpay_payment_id: order.razorpay_payment_id,
    razorpay_signature: order.razorpay_signature,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shipping_fee: Number(order.shipping_fee),
    tax: Number(order.tax),
    total: Number(order.total),
    shipping_address: order.shipping_address as unknown as AddressSnapshot,
    billing_address: order.billing_address as unknown as AddressSnapshot | null,
    placed_at: order.placed_at,
    updated_at: order.updated_at,
    customer: rawProfile
      ? {
          id: rawProfile.id,
          full_name: rawProfile.full_name,
          email: null,
          phone: rawProfile.phone,
          avatar_url: rawProfile.avatar_url,
        }
      : null,
    items: (order.order_items || []).map((it: any) => ({
      id: it.id,
      order_id: it.order_id,
      product_id: it.product_id,
      variant_id: it.variant_id,
      product_name: it.product_name,
      variant_name: it.variant_name,
      unit_price: Number(it.unit_price),
      quantity: Number(it.quantity),
      subtotal: Number(it.subtotal),
    })),
    can_cancel: order.status === "pending",
  };
}

export function getDemoOrdersStore() {
  return demoOrdersStore;
}
