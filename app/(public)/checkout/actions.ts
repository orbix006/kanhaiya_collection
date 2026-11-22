"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserCart, getDemoCartStore } from "@/lib/data/cart";
import { getDemoOrdersStore, type AddressSnapshot, type OrderDetails } from "@/lib/data/orders";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  RAZORPAY_KEY_ID,
} from "@/lib/razorpay";

function safeRevalidate(path: string, type?: "layout" | "page") {
  try {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  } catch {
    // Standalone script context fallback
  }
}

export interface PlaceOrderInput {
  shippingAddress: AddressSnapshot;
  billingAddress?: AddressSnapshot | null;
  useSameBilling?: boolean;
}

export interface VerifyPaymentInput {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${dateStr}-${randomSuffix}`;
}

/**
 * Place a Cash on Delivery (COD) order
 */
export async function placeCodOrderAction(input: PlaceOrderInput) {
  const { shippingAddress, billingAddress, useSameBilling = true } = input;

  if (
    !shippingAddress ||
    !shippingAddress.full_name ||
    !shippingAddress.phone ||
    !shippingAddress.address_line1 ||
    !shippingAddress.city ||
    !shippingAddress.state ||
    !shippingAddress.postal_code
  ) {
    return { error: "Please provide a complete shipping address." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  const userId = user?.id || (!isConfigured ? "demo-user-id" : null);

  if (!userId) {
    return { error: "Authentication required to place an order.", requiresAuth: true };
  }

  // 1. Fetch live cart items with current database pricing & stock
  const cart = await getUserCart(userId);

  if (cart.items.length === 0) {
    return { error: "Your shopping bag is empty. Please add products to continue." };
  }

  // 2. Validate current live stock for every cart item
  for (const item of cart.items) {
    if (item.is_out_of_stock || item.exceeds_stock) {
      return {
        error: `Item "${item.product.name}" exceeds available stock (${item.available_stock} available). Please adjust your cart.`,
      };
    }
  }

  // Format shipping address according to schema.txt expectations:
  // {"full_name","phone","line1","line2","city","state","postal_code","country"}
  const shippingJson = {
    full_name: shippingAddress.full_name,
    phone: shippingAddress.phone,
    line1: shippingAddress.address_line1,
    line2: shippingAddress.address_line2 || null,
    city: shippingAddress.city,
    state: shippingAddress.state,
    postal_code: shippingAddress.postal_code,
    country: shippingAddress.country || "IN",
  };

  const pItems = cart.items.map((it) => ({
    product_id: it.product_id,
    quantity: it.quantity,
  }));

  try {
    if (!isConfigured) {
      // Offline / demo store fallback
      const orderNumber = generateOrderNumber();
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const { subtotal, shipping_fee, tax, discount, total } = cart;

      const demoOrder: OrderDetails = {
        id: orderId,
        user_id: userId,
        order_number: orderNumber,
        status: "pending",
        payment_status: "pending",
        payment_method: "cod",
        razorpay_order_id: null,
        razorpay_payment_id: null,
        razorpay_signature: null,
        subtotal,
        discount,
        shipping_fee,
        tax,
        total,
        shipping_address: shippingAddress,
        billing_address: useSameBilling ? shippingAddress : billingAddress || shippingAddress,
        placed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: cart.items.map((it) => ({
          id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          order_id: orderId,
          product_id: it.product_id,
          variant_id: null,
          product_name: it.product.name,
          variant_name: null,
          unit_price: it.unit_price,
          quantity: it.quantity,
          subtotal: it.subtotal,
          image_url: it.product.primary_image,
        })),
        can_cancel: true,
      };

      const ordersStore = getDemoOrdersStore();
      const userOrders = ordersStore.get(userId) || [];
      userOrders.unshift(demoOrder);
      ordersStore.set(userId, userOrders);

      // Clear user cart only after successful order placement
      const cartStore = getDemoCartStore();
      cartStore.delete(userId);

      safeRevalidate("/cart");
      safeRevalidate("/checkout");
      safeRevalidate("/account/orders");
      safeRevalidate("/", "layout");

      return {
        success: true,
        orderId: demoOrder.id,
        orderNumber: demoOrder.order_number,
      };
    }

    // Call authoritative PostgreSQL place_order() RPC
    const { data: orderData, error: rpcErr } = await (supabase.rpc as any)("place_order", {
      p_items: pItems,
      p_shipping: shippingJson,
      p_payment_method: "cod",
      p_coupon_code: cart.applied_coupon?.code || null,
      p_notes: null,
      p_idempotency_key: null,
    });

    if (rpcErr || !orderData) {
      console.error("[placeCodOrderAction] place_order RPC error:", rpcErr?.message);
      return { error: rpcErr?.message || "Failed to place order." };
    }

    // Cart is automatically cleared in database or can be cleared:
    await supabase.from("cart_items").delete().eq("user_id", userId);

    safeRevalidate("/cart");
    safeRevalidate("/checkout");
    safeRevalidate("/account/orders");
    safeRevalidate("/", "layout");

    return {
      success: true,
      orderId: orderData.id,
      orderNumber: orderData.order_number,
    };
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred while placing your order." };
  }
}

/**
 * Initialize Razorpay order server-side and return safe client payload
 */
export async function createRazorpayOrderAction(input: PlaceOrderInput) {
  const { shippingAddress, billingAddress, useSameBilling = true } = input;

  if (
    !shippingAddress ||
    !shippingAddress.full_name ||
    !shippingAddress.phone ||
    !shippingAddress.address_line1 ||
    !shippingAddress.city ||
    !shippingAddress.state ||
    !shippingAddress.postal_code
  ) {
    return { error: "Please provide a complete shipping address." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  const userId = user?.id || (!isConfigured ? "demo-user-id" : null);

  if (!userId) {
    return { error: "Authentication required to checkout.", requiresAuth: true };
  }

  const cart = await getUserCart(userId);
  if (cart.items.length === 0) {
    return { error: "Your shopping bag is empty." };
  }

  for (const item of cart.items) {
    if (item.is_out_of_stock || item.exceeds_stock) {
      return {
        error: `Item "${item.product.name}" exceeds available stock (${item.available_stock} available). Please adjust your cart.`,
      };
    }
  }

  const shippingJson = {
    full_name: shippingAddress.full_name,
    phone: shippingAddress.phone,
    line1: shippingAddress.address_line1,
    line2: shippingAddress.address_line2 || null,
    city: shippingAddress.city,
    state: shippingAddress.state,
    postal_code: shippingAddress.postal_code,
    country: shippingAddress.country || "IN",
  };

  const pItems = cart.items.map((it) => ({
    product_id: it.product_id,
    quantity: it.quantity,
  }));

  try {
    if (!isConfigured) {
      const orderNumber = generateOrderNumber();
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const { subtotal, shipping_fee, tax, discount, total } = cart;

      const rzpOrder = await createRazorpayOrder({
        amount: Math.round(total * 100),
        currency: "INR",
        receipt: orderNumber,
        notes: {
          order_id: orderId,
          user_id: userId,
        },
      });

      const demoOrder: OrderDetails = {
        id: orderId,
        user_id: userId,
        order_number: orderNumber,
        status: "pending",
        payment_status: "pending",
        payment_method: "online",
        razorpay_order_id: rzpOrder.id,
        razorpay_payment_id: null,
        razorpay_signature: null,
        subtotal,
        discount,
        shipping_fee,
        tax,
        total,
        shipping_address: shippingAddress,
        billing_address: useSameBilling ? shippingAddress : billingAddress || shippingAddress,
        placed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: cart.items.map((it) => ({
          id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          order_id: orderId,
          product_id: it.product_id,
          variant_id: null,
          product_name: it.product.name,
          variant_name: null,
          unit_price: it.unit_price,
          quantity: it.quantity,
          subtotal: it.subtotal,
          image_url: it.product.primary_image,
        })),
        can_cancel: true,
      };

      const ordersStore = getDemoOrdersStore();
      const userOrders = ordersStore.get(userId) || [];
      userOrders.unshift(demoOrder);
      ordersStore.set(userId, userOrders);

      return {
        success: true,
        orderId: demoOrder.id,
        orderNumber: demoOrder.order_number,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: RAZORPAY_KEY_ID,
        isTestMode: rzpOrder.isTestMode,
        prefill: {
          name: shippingAddress.full_name,
          contact: shippingAddress.phone,
          email: user?.email || "customer@example.com",
        },
      };
    }

    // 1. Atomically place order with payment_method: 'online'
    const { data: orderData, error: rpcErr } = await (supabase.rpc as any)("place_order", {
      p_items: pItems,
      p_shipping: shippingJson,
      p_payment_method: "online",
      p_coupon_code: cart.applied_coupon?.code || null,
      p_notes: null,
      p_idempotency_key: null,
    });

    if (rpcErr || !orderData) {
      return { error: rpcErr?.message || "Failed to initialize online order." };
    }

    // 2. Call begin_online_payment RPC
    const { data: paySession, error: payErr } = await (supabase.rpc as any)("begin_online_payment", {
      p_order_id: orderData.id,
    });

    if (payErr) {
      return { error: payErr.message || "Failed to begin online payment session." };
    }

    let rzpOrderId = paySession?.razorpay_order_id;
    const amountMinor = Math.round(Number(orderData.total) * 100);

    if (!rzpOrderId) {
      const rzpOrder = await createRazorpayOrder({
        amount: amountMinor,
        currency: "INR",
        receipt: orderData.order_number,
        notes: {
          order_id: orderData.id,
          user_id: userId,
        },
      });
      rzpOrderId = rzpOrder.id;

      // Attach razorpay order in database payments table
      await (supabase.rpc as any)("attach_razorpay_order", {
        p_order_id: orderData.id,
        p_rzp_order_id: rzpOrderId,
        p_amount_minor: amountMinor,
      });
    }

    return {
      success: true,
      orderId: orderData.id,
      orderNumber: orderData.order_number,
      razorpayOrderId: rzpOrderId,
      amount: amountMinor,
      currency: "INR",
      keyId: RAZORPAY_KEY_ID,
      isTestMode: true,
      prefill: {
        name: shippingAddress.full_name,
        contact: shippingAddress.phone,
        email: user?.email || "customer@example.com",
      },
    };
  } catch (err: any) {
    return { error: err.message || "Failed to create online payment session." };
  }
}

/**
 * Verifies Razorpay payment signature server-side and confirms the order
 */
export async function verifyRazorpayPaymentAction(input: VerifyPaymentInput) {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return { error: "Missing required payment verification details." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  const userId = user?.id || (!isConfigured ? "demo-user-id" : null);

  if (!userId) {
    return { error: "Authentication required." };
  }

  try {
    if (!isConfigured) {
      const ordersStore = getDemoOrdersStore();
      const userOrders = ordersStore.get(userId) || [];
      const order = userOrders.find((o) => o.id === orderId);

      if (!order) {
        return { error: "Order not found." };
      }

      const isValid = verifyRazorpaySignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      if (!isValid) {
        order.payment_status = "failed";
        return { error: "Payment signature verification failed. Tampered payment data rejected." };
      }

      order.payment_status = "paid";
      order.status = "in_progress" as any;
      order.razorpay_payment_id = razorpayPaymentId;
      order.razorpay_signature = razorpaySignature;
      order.can_cancel = false;

      const cartStore = getDemoCartStore();
      cartStore.delete(userId);

      safeRevalidate("/cart");
      safeRevalidate("/checkout");
      safeRevalidate("/account/orders");
      safeRevalidate(`/account/orders/${orderId}`);
      safeRevalidate("/", "layout");

      return {
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
      };
    }

    // 1. Fetch order from database
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("id, order_number, user_id, status, payment_status, total")
      .eq("id", orderId)
      .eq("user_id", userId)
      .single();

    if (fetchErr || !order) {
      return { error: "Order not found or unauthorized." };
    }

    // 2. Cryptographic signature check
    const isValidSignature = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValidSignature) {
      return {
        error: "Payment verification failed: Invalid cryptographic signature. Transaction rejected.",
      };
    }

    // 3. Record capture event in ledger via apply_payment_event RPC
    const amountMinor = Math.round(Number(order.total) * 100);
    const { error: eventErr } = await (supabase.rpc as any)("apply_payment_event", {
      p_provider: "razorpay",
      p_event_id: `client:${razorpayPaymentId}`,
      p_event_type: "payment.captured",
      p_provider_order_id: razorpayOrderId,
      p_provider_payment_id: razorpayPaymentId,
      p_amount_minor: amountMinor,
      p_currency: "INR",
      p_raw: { client_verified: true, razorpay_signature: razorpaySignature },
      p_method: "online",
      p_error_code: null,
      p_error_description: null,
      p_parent_payment_id: null,
      p_order_id: order.id,
    });

    if (eventErr) {
      console.error("[verifyRazorpayPaymentAction] apply_payment_event error:", eventErr.message);
    }

    // Clear cart after payment
    await supabase.from("cart_items").delete().eq("user_id", userId);

    safeRevalidate("/cart");
    safeRevalidate("/checkout");
    safeRevalidate("/account/orders");
    safeRevalidate(`/account/orders/${orderId}`);
    safeRevalidate("/", "layout");

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
    };
  } catch (err: any) {
    return { error: err.message || "Payment verification encountered an unexpected error." };
  }
}
