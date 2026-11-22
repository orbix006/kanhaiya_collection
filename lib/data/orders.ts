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



// In-memory demo store for offline development / test resilience
const demoOrdersStore: Map<string, OrderDetails[]> = new Map();

// Helper to seed initial demo orders
function initDemoOrdersIfEmpty(): OrderDetails[] {
  const allOrders: OrderDetails[] = [];
  for (const list of demoOrdersStore.values()) {
    allOrders.push(...list);
  }
  return allOrders;
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
    user_id: order.user_id || "",
    order_number: order.order_number,
    status: order.status as OrderStatus,
    payment_status: order.payment_status as PaymentStatus,
    payment_method: order.payment_method,
    razorpay_order_id: (order as any).razorpay_order_id || null,
    razorpay_payment_id: (order as any).razorpay_payment_id || null,
    razorpay_signature: (order as any).razorpay_signature || null,
    subtotal: Number(order.subtotal),
    discount: Number((order as any).discount_total || (order as any).discount || 0),
    shipping_fee: Number(order.shipping_fee || 0),
    tax: Number((order as any).tax_total || (order as any).tax || 0),
    total: Number(order.total),
    shipping_address: order.shipping_address as unknown as AddressSnapshot,
    billing_address: ((order as any).billing_address || order.shipping_address) as unknown as AddressSnapshot | null,
    placed_at: (order as any).created_at || (order as any).placed_at,
    updated_at: order.updated_at,
    items: ((order as any).order_items || []).map((it: any) => ({
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
      is_read,
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
    query = query.eq("status", filterParams.status as any);
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
      is_read: Boolean(o.is_read),
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
    .select("status, is_read, total");

  let pendingCount = 0;
  let confirmedCount = 0;
  let processingCount = 0;
  let shippedCount = 0;
  let deliveredCount = 0;
  let cancelledCount = 0;
  let refundedCount = 0;
  let totalRevenue = 0;

  // Exact KPIs as required:
  // 1. Total Orders: Count all orders received
  // 2. New Orders: is_read = false
  // 3. Delivered Orders: status = 'delivered'
  // 4. In Progress Orders: is_read = true AND status not in ('delivered', 'cancelled')
  let kpiTotalOrders = 0;
  let kpiNewOrders = 0;
  let kpiDeliveredOrders = 0;
  let kpiInProgressOrders = 0;

  if (allStatuses) {
    kpiTotalOrders = allStatuses.length;
    for (const row of allStatuses) {
      const isRead = Boolean(row.is_read);
      if (!isRead) {
        kpiNewOrders++;
      }
      if (row.status === "delivered") {
        kpiDeliveredOrders++;
        deliveredCount++;
        shippedCount++;
      } else if (row.status === "pending") {
        pendingCount++;
        if (isRead) {
          kpiInProgressOrders++;
        }
      } else if (row.status === "in_progress") {
        confirmedCount++;
        processingCount++;
        if (isRead) {
          kpiInProgressOrders++;
        }
      } else if (row.status === "cancelled") {
        cancelledCount++;
      } else {
        if (isRead && row.status !== "refunded") {
          kpiInProgressOrders++;
        }
      }

      if (row.status !== "cancelled") {
        totalRevenue += Number((row as any).total || 0);
      }
    }
  }

  // Also query admin_order_stats if available for ultimate database consistency
  try {
    const { data: rpcStats } = await supabase.rpc("admin_order_stats" as any);
    if (rpcStats && typeof rpcStats === "object") {
      const s = rpcStats as any;
      if (typeof s.total_orders === "number") kpiTotalOrders = s.total_orders;
      if (typeof s.new_orders === "number") kpiNewOrders = s.new_orders;
      if (typeof s.delivered_orders === "number") kpiDeliveredOrders = s.delivered_orders;
      if (typeof s.in_progress === "number") kpiInProgressOrders = s.in_progress;
    }
  } catch {
    // If RPC unavailable or permissions check, fallback values from table scan are already computed
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
    kpis: {
      totalOrders: kpiTotalOrders,
      newOrders: kpiNewOrders,
      deliveredOrders: kpiDeliveredOrders,
      inProgressOrders: kpiInProgressOrders,
    },
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
    user_id: order.user_id || "",
    order_number: order.order_number,
    status: order.status as OrderStatus,
    payment_status: order.payment_status as PaymentStatus,
    payment_method: order.payment_method,
    razorpay_order_id: (order as any).razorpay_order_id || null,
    razorpay_payment_id: (order as any).razorpay_payment_id || null,
    razorpay_signature: (order as any).razorpay_signature || null,
    subtotal: Number(order.subtotal),
    discount: Number((order as any).discount_total || (order as any).discount || 0),
    shipping_fee: Number(order.shipping_fee || 0),
    tax: Number((order as any).tax_total || (order as any).tax || 0),
    total: Number(order.total),
    shipping_address: order.shipping_address as unknown as AddressSnapshot,
    billing_address: ((order as any).billing_address || order.shipping_address) as unknown as AddressSnapshot | null,
    placed_at: (order as any).created_at || (order as any).placed_at,
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
    items: ((order as any).order_items || []).map((it: any) => ({
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
 * Public Order Tracking Lookup:
 * Allows a patron to look up order status and milestone progression by order_number and phone/email verification.
 * Verifies contact against shipping_address phone or email to prevent unauthorized data exposure.
 */
export async function trackPublicOrder(
  orderNumber: string,
  contact: string
): Promise<OrderDetails | null> {
  const cleanOrderNumber = orderNumber.trim().toUpperCase();
  const cleanContact = contact.trim().toLowerCase().replace(/[\s\-\(\)\+]/g, "");

  if (!cleanOrderNumber || !cleanContact) {
    return null;
  }

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    initDemoOrdersIfEmpty();
    const allOrders: OrderDetails[] = [];
    for (const list of demoOrdersStore.values()) {
      allOrders.push(...list);
    }

    const found = allOrders.find(
      (o) => o.order_number.toUpperCase() === cleanOrderNumber || o.id === orderNumber.trim()
    );

    if (!found) return null;

    // Contact verification
    const phone = (found.shipping_address?.phone || "").replace(/[\s\-\(\)\+]/g, "");
    const email = (found.customer?.email || "").toLowerCase();
    const phoneMatches = phone && (phone.endsWith(cleanContact) || cleanContact.endsWith(phone));
    const emailMatches = email && email === contact.trim().toLowerCase();

    // If contact is roughly matching or demo phone is present
    if (!phoneMatches && !emailMatches && !phone.includes(cleanContact)) {
      return null;
    }

    return found;
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
    .ilike("order_number", cleanOrderNumber)
    .maybeSingle();

  if (error || !order) {
    return null;
  }

  const shippingAddr = order.shipping_address as any;
  const billingAddr = order.billing_address as any;
  const phone = (shippingAddr?.phone || billingAddr?.phone || "").replace(/[\s\-\(\)\+]/g, "");
  const shippingEmail = (shippingAddr?.email || billingAddr?.email || "").trim().toLowerCase();
  const phoneMatches = phone && (phone.endsWith(cleanContact) || cleanContact.endsWith(phone));
  const emailMatches = shippingEmail && shippingEmail === contact.trim().toLowerCase();

  if (!phoneMatches && !emailMatches) {
    if (order.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", order.user_id)
        .maybeSingle();

      const profilePhone = (profile?.phone || "").replace(/[\s\-\(\)\+]/g, "");
      const profilePhoneMatches = profilePhone && (profilePhone.endsWith(cleanContact) || cleanContact.endsWith(profilePhone));

      if (!profilePhoneMatches) {
        return null;
      }
    } else {
      return null;
    }
  }

  return {
    id: order.id,
    user_id: order.user_id || "",
    order_number: order.order_number,
    status: order.status as OrderStatus,
    payment_status: order.payment_status as PaymentStatus,
    payment_method: order.payment_method,
    razorpay_order_id: (order as any).razorpay_order_id || null,
    razorpay_payment_id: (order as any).razorpay_payment_id || null,
    razorpay_signature: (order as any).razorpay_signature || null,
    subtotal: Number(order.subtotal),
    discount: Number((order as any).discount_total || (order as any).discount || 0),
    shipping_fee: Number(order.shipping_fee || 0),
    tax: Number((order as any).tax_total || (order as any).tax || 0),
    total: Number(order.total),
    shipping_address: order.shipping_address as unknown as AddressSnapshot,
    billing_address: ((order as any).billing_address || order.shipping_address) as unknown as AddressSnapshot | null,
    placed_at: (order as any).created_at || (order as any).placed_at,
    updated_at: order.updated_at,
    items: ((order as any).order_items || []).map((it: any) => ({
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

