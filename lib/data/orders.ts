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
  let allOrders: OrderDetails[] = [];
  for (const list of demoOrdersStore.values()) {
    allOrders.push(...list);
  }

  if (allOrders.length > 0) return allOrders;

  const defaultSeedOrders: OrderDetails[] = [
    {
      id: "ord-demo-001",
      user_id: "demo-user-1",
      order_number: "ORD-20260920-00101",
      status: "pending",
      payment_status: "pending",
      payment_method: "cod",
      razorpay_order_id: null,
      razorpay_payment_id: null,
      razorpay_signature: null,
      subtotal: 4999,
      discount: 0,
      shipping_fee: 0,
      tax: 250,
      total: 5249,
      shipping_address: {
        full_name: "Aarav Sharma",
        phone: "+91 98765 43210",
        address_line1: "Flat 402, Royal Palms, MG Road",
        address_line2: "Near Indiranagar Metro",
        city: "Bengaluru",
        state: "Karnataka",
        postal_code: "560038",
        country: "India",
        type: "shipping",
      },
      billing_address: null,
      placed_at: "2026-09-20T10:15:00.000Z",
      updated_at: "2026-09-20T10:15:00.000Z",
      customer: {
        id: "demo-user-1",
        full_name: "Aarav Sharma",
        email: "aarav.sharma@example.com",
        phone: "+91 98765 43210",
        avatar_url: null,
      },
      items: [
        {
          id: "item-demo-101",
          order_id: "ord-demo-001",
          product_id: "prod-1",
          variant_id: "var-1",
          product_name: "Royal Heritage Embroidered Sherwani",
          variant_name: "Ivory Silk / Size 42",
          unit_price: 4999,
          quantity: 1,
          subtotal: 4999,
        },
      ],
      can_cancel: true,
    },
    {
      id: "ord-demo-002",
      user_id: "demo-user-2",
      order_number: "ORD-20260918-00085",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "razorpay",
      razorpay_order_id: "order_KnhYp982341",
      razorpay_payment_id: "pay_KnzLm091823",
      razorpay_signature: "a98f7e6d5c4b3a210fedcba987654321",
      subtotal: 12499,
      discount: 1000,
      shipping_fee: 0,
      tax: 625,
      total: 12124,
      shipping_address: {
        full_name: "Pooja Hegde",
        phone: "+91 91234 56789",
        address_line1: "Villa 12, Gulmohar Enclave",
        address_line2: "Banjara Hills, Road No. 10",
        city: "Hyderabad",
        state: "Telangana",
        postal_code: "500034",
        country: "India",
        type: "shipping",
      },
      billing_address: null,
      placed_at: "2026-09-18T14:45:00.000Z",
      updated_at: "2026-09-18T15:00:00.000Z",
      customer: {
        id: "demo-user-2",
        full_name: "Pooja Hegde",
        email: "pooja.h@example.com",
        phone: "+91 91234 56789",
        avatar_url: null,
      },
      items: [
        {
          id: "item-demo-102",
          order_id: "ord-demo-002",
          product_id: "prod-7",
          variant_id: "var-7",
          product_name: "Pure Banarasi Kanjeevaram Saree",
          variant_name: "Crimson Gold / Free Size",
          unit_price: 12499,
          quantity: 1,
          subtotal: 12499,
        },
      ],
      can_cancel: false,
    },
    {
      id: "ord-demo-003",
      user_id: "demo-user-3",
      order_number: "ORD-20260915-00042",
      status: "processing",
      payment_status: "paid",
      payment_method: "razorpay",
      razorpay_order_id: "order_KnhYp774411",
      razorpay_payment_id: "pay_KnzLm552233",
      razorpay_signature: "e5d4c3b2a10fedcba987654321098765",
      subtotal: 6998,
      discount: 500,
      shipping_fee: 0,
      tax: 350,
      total: 6848,
      shipping_address: {
        full_name: "Vikram Malhotra",
        phone: "+91 99887 76655",
        address_line1: "15-B, Sector 18, Chandigarh",
        address_line2: null,
        city: "Chandigarh",
        state: "Punjab",
        postal_code: "160018",
        country: "India",
        type: "shipping",
      },
      billing_address: null,
      placed_at: "2026-09-15T09:30:00.000Z",
      updated_at: "2026-09-16T11:20:00.000Z",
      customer: {
        id: "demo-user-3",
        full_name: "Vikram Malhotra",
        email: "vikram.m@example.com",
        phone: "+91 99887 76655",
        avatar_url: null,
      },
      items: [
        {
          id: "item-demo-103",
          order_id: "ord-demo-003",
          product_id: "prod-2",
          variant_id: "var-2",
          product_name: "Handwoven Chanderi Kurta Set",
          variant_name: "Sage Green / M",
          unit_price: 3499,
          quantity: 2,
          subtotal: 6998,
        },
      ],
      can_cancel: false,
    },
    {
      id: "ord-demo-004",
      user_id: "demo-user-4",
      order_number: "ORD-20260912-00019",
      status: "shipped",
      payment_status: "paid",
      payment_method: "razorpay",
      razorpay_order_id: "order_KnhYp332211",
      razorpay_payment_id: "pay_KnzLm114477",
      razorpay_signature: "f1e2d3c4b5a60987654321fedcba9876",
      subtotal: 3599,
      discount: 0,
      shipping_fee: 0,
      tax: 180,
      total: 3779,
      shipping_address: {
        full_name: "Ananya Deshmukh",
        phone: "+91 98220 12345",
        address_line1: "Row House 7, Kalyani Nagar",
        address_line2: "Opposite Joggers Park",
        city: "Pune",
        state: "Maharashtra",
        postal_code: "411006",
        country: "India",
        type: "shipping",
      },
      billing_address: null,
      placed_at: "2026-09-12T16:20:00.000Z",
      updated_at: "2026-09-14T08:00:00.000Z",
      customer: {
        id: "demo-user-4",
        full_name: "Ananya Deshmukh",
        email: "ananya.d@example.com",
        phone: "+91 98220 12345",
        avatar_url: null,
      },
      items: [
        {
          id: "item-demo-104",
          order_id: "ord-demo-004",
          product_id: "prod-3",
          variant_id: "var-3",
          product_name: "Artisan Silk Nehru Jacket",
          variant_name: "Midnight Navy / 40",
          unit_price: 3599,
          quantity: 1,
          subtotal: 3599,
        },
      ],
      can_cancel: false,
    },
    {
      id: "ord-demo-005",
      user_id: "demo-user-1",
      order_number: "ORD-20260905-00004",
      status: "delivered",
      payment_status: "paid",
      payment_method: "razorpay",
      razorpay_order_id: "order_KnhYp998877",
      razorpay_payment_id: "pay_KnzLm443322",
      razorpay_signature: "1234567890abcdef1234567890abcdef",
      subtotal: 8999,
      discount: 0,
      shipping_fee: 0,
      tax: 450,
      total: 9449,
      shipping_address: {
        full_name: "Aarav Sharma",
        phone: "+91 98765 43210",
        address_line1: "Flat 402, Royal Palms, MG Road",
        address_line2: "Near Indiranagar Metro",
        city: "Bengaluru",
        state: "Karnataka",
        postal_code: "560038",
        country: "India",
        type: "shipping",
      },
      billing_address: null,
      placed_at: "2026-09-05T11:00:00.000Z",
      updated_at: "2026-09-09T17:30:00.000Z",
      customer: {
        id: "demo-user-1",
        full_name: "Aarav Sharma",
        email: "aarav.sharma@example.com",
        phone: "+91 98765 43210",
        avatar_url: null,
      },
      items: [
        {
          id: "item-demo-105",
          order_id: "ord-demo-005",
          product_id: "prod-8",
          variant_id: "var-8",
          product_name: "Handcrafted Zardozi Lehenga Choli",
          variant_name: "Ruby Pink / L",
          unit_price: 8999,
          quantity: 1,
          subtotal: 8999,
        },
      ],
      can_cancel: false,
    },
    {
      id: "ord-demo-006",
      user_id: "demo-user-5",
      order_number: "ORD-20260901-00001",
      status: "cancelled",
      payment_status: "failed",
      payment_method: "razorpay",
      razorpay_order_id: "order_KnhYp000111",
      razorpay_payment_id: null,
      razorpay_signature: null,
      subtotal: 2199,
      discount: 0,
      shipping_fee: 100,
      tax: 110,
      total: 2409,
      shipping_address: {
        full_name: "Karan Johar",
        phone: "+91 90000 11111",
        address_line1: "Bandra West, Hill Road",
        address_line2: null,
        city: "Mumbai",
        state: "Maharashtra",
        postal_code: "400050",
        country: "India",
        type: "shipping",
      },
      billing_address: null,
      placed_at: "2026-09-01T08:15:00.000Z",
      updated_at: "2026-09-01T08:30:00.000Z",
      customer: {
        id: "demo-user-5",
        full_name: "Karan Johar",
        email: "karan.j@example.com",
        phone: "+91 90000 11111",
        avatar_url: null,
      },
      items: [
        {
          id: "item-demo-106",
          order_id: "ord-demo-006",
          product_id: "prod-4",
          variant_id: "var-4",
          product_name: "Cotton Silk Bandhgala",
          variant_name: "Jet Black / 42",
          unit_price: 2199,
          quantity: 1,
          subtotal: 2199,
        },
      ],
      can_cancel: false,
    },
  ];

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
