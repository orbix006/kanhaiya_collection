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

  if (!shippingAddress || !shippingAddress.full_name || !shippingAddress.phone || !shippingAddress.address_line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postal_code) {
    return { error: "Please provide a complete shipping address." };
  }

  const effectiveBillingAddress = useSameBilling
    ? shippingAddress
    : (billingAddress || shippingAddress);

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
        error: `Item "${item.product.name}${item.variant ? ` (${item.variant.variant_name})` : ""}" exceeds available stock (${item.available_stock} available). Please adjust your cart.`,
      };
    }
  }

  // 3. Server calculated totals (never trust client amounts)
  const { subtotal, shipping_fee, tax, discount, total } = cart;
  const orderNumber = generateOrderNumber();
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  try {
    if (!isConfigured) {
      // Offline / demo store fallback
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
        billing_address: effectiveBillingAddress,
        placed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: cart.items.map((it) => ({
          id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          order_id: orderId,
          product_id: it.product_id,
          variant_id: it.variant_id,
          product_name: it.product.name,
          variant_name: it.variant ? it.variant.variant_name : null,
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

    // 4. Atomic Order Creation in Supabase
    const { data: newOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        order_number: orderNumber,
        status: "pending",
        payment_status: "pending",
        payment_method: "cod",
        subtotal,
        discount,
        shipping_fee,
        tax,
        total,
        shipping_address: shippingAddress as any,
        billing_address: effectiveBillingAddress as any,
      })
      .select("id, order_number")
      .single();

    if (orderErr || !newOrder) {
      console.error("[placeCodOrderAction] Order insert error:", orderErr?.message);
      return { error: orderErr?.message || "Failed to place order." };
    }

    // 5. Insert order items snapshot
    const orderItemRows = cart.items.map((it) => ({
      order_id: newOrder.id,
      product_id: it.product_id,
      variant_id: it.variant_id,
      product_name: it.product.name,
      variant_name: it.variant ? it.variant.variant_name : null,
      unit_price: it.unit_price,
      quantity: it.quantity,
      subtotal: it.subtotal,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItemRows);

    if (itemsErr) {
      console.error("[placeCodOrderAction] Order items insert error:", itemsErr.message);
      // Clean up order if items failed
      await supabase.from("orders").delete().eq("id", newOrder.id);
      return { error: "Failed to save order items. Please try again." };
    }

    // 6. Clear user's cart ONLY after successful order and item insertion
    await supabase.from("cart_items").delete().eq("user_id", userId);

    safeRevalidate("/cart");
    safeRevalidate("/checkout");
    safeRevalidate("/account/orders");
    safeRevalidate("/", "layout");

    return {
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.order_number,
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

  if (!shippingAddress || !shippingAddress.full_name || !shippingAddress.phone || !shippingAddress.address_line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postal_code) {
    return { error: "Please provide a complete shipping address." };
  }

  const effectiveBillingAddress = useSameBilling
    ? shippingAddress
    : (billingAddress || shippingAddress);

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
        error: `Item "${item.product.name}" exceeds available stock. Please adjust your cart.`,
      };
    }
  }

  const { subtotal, shipping_fee, tax, discount, total } = cart;
  const orderNumber = generateOrderNumber();
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  try {
    // 1. Create order on Razorpay server-side
    const rzpOrder = await createRazorpayOrder({
      amount: Math.round(total * 100), // paise
      currency: "INR",
      receipt: orderNumber,
      notes: {
        user_id: userId,
        order_number: orderNumber,
      },
    });

    if (!isConfigured) {
      const demoOrder: OrderDetails = {
        id: orderId,
        user_id: userId,
        order_number: orderNumber,
        status: "pending",
        payment_status: "pending",
        payment_method: "razorpay",
        razorpay_order_id: rzpOrder.id,
        razorpay_payment_id: null,
        razorpay_signature: null,
        subtotal,
        discount,
        shipping_fee,
        tax,
        total,
        shipping_address: shippingAddress,
        billing_address: effectiveBillingAddress,
        placed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: cart.items.map((it) => ({
          id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          order_id: orderId,
          product_id: it.product_id,
          variant_id: it.variant_id,
          product_name: it.product.name,
          variant_name: it.variant ? it.variant.variant_name : null,
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

    // 2. Create pending order in database
    const { data: newOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        order_number: orderNumber,
        status: "pending",
        payment_status: "pending",
        payment_method: "razorpay",
        razorpay_order_id: rzpOrder.id,
        subtotal,
        discount,
        shipping_fee,
        tax,
        total,
        shipping_address: shippingAddress as any,
        billing_address: effectiveBillingAddress as any,
      })
      .select("id, order_number")
      .single();

    if (orderErr || !newOrder) {
      return { error: orderErr?.message || "Failed to initialize order." };
    }

    // 3. Insert order items snapshot
    const orderItemRows = cart.items.map((it) => ({
      order_id: newOrder.id,
      product_id: it.product_id,
      variant_id: it.variant_id,
      product_name: it.product.name,
      variant_name: it.variant ? it.variant.variant_name : null,
      unit_price: it.unit_price,
      quantity: it.quantity,
      subtotal: it.subtotal,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItemRows);
    if (itemsErr) {
      await supabase.from("orders").delete().eq("id", newOrder.id);
      return { error: "Failed to record order items." };
    }

    // Return safe payload to client
    return {
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.order_number,
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

      if (order.razorpay_order_id !== razorpayOrderId) {
        return { error: "Mismatched Razorpay order identifier." };
      }

      // Verify signature
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
      order.status = "confirmed";
      order.razorpay_payment_id = razorpayPaymentId;
      order.razorpay_signature = razorpaySignature;
      order.can_cancel = false; // Confirmed orders cannot be cancelled

      // Clear user cart only after successful payment verification
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
      .select("id, order_number, user_id, status, payment_status, razorpay_order_id")
      .eq("id", orderId)
      .eq("user_id", userId)
      .single();

    if (fetchErr || !order) {
      return { error: "Order not found or unauthorized." };
    }

    if (order.razorpay_order_id !== razorpayOrderId) {
      return { error: "Mismatched Razorpay order identifier." };
    }

    // 2. Cryptographic HMAC-SHA256 signature verification
    const isValidSignature = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValidSignature) {
      // Mark payment failed, do NOT clear cart
      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      return {
        error: "Payment verification failed: Invalid cryptographic signature. Transaction rejected.",
      };
    }

    // 3. Mark payment as paid and status as confirmed
    // The DB trigger `trg_order_confirmation` will automatically decrement stock and increment sold_count
    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        status: "confirmed",
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateErr) {
      return { error: updateErr.message };
    }

    // 4. Clear cart ONLY after successful order & payment confirmation
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
