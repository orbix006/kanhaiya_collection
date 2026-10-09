"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  type OrderStatus,
  type PaymentStatus,
  canTransitionOrderStatus,
  canTransitionPaymentStatus,
  getDemoOrdersStore,
} from "@/lib/data/orders";

function safeRevalidate(path: string, type?: "layout" | "page") {
  try {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  } catch {
    // Standalone or script fallback
  }
}

/**
 * Updates an order status with strict business transitions.
 * Guarantees transition into 'confirmed' is ONLY allowed from 'pending',
 * preventing re-confirmation side effects on stock and sold counts.
 * Terminal states ('cancelled', 'refunded') cannot transition further.
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success?: boolean; message?: string; error?: string }> {
  if (!orderId || !newStatus) {
    return { error: "Missing required order ID or new status parameter." };
  }

  const supabase = await createClient();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    // Demo store mode
    const store = getDemoOrdersStore();
    let targetOrder: any = null;
    for (const list of store.values()) {
      const found = list.find((o) => o.id === orderId || o.order_number === orderId);
      if (found) {
        targetOrder = found;
        break;
      }
    }

    if (!targetOrder) {
      return { error: `Order #${orderId} was not found.` };
    }

    const currentStatus = targetOrder.status as OrderStatus;

    if (!canTransitionOrderStatus(currentStatus, newStatus)) {
      return {
        error: `Invalid status transition from '${currentStatus}' to '${newStatus}'. Transition into 'confirmed' is only allowed once from 'pending' to prevent duplicate stock deduction.`,
      };
    }

    targetOrder.status = newStatus;
    targetOrder.updated_at = new Date().toISOString();
    targetOrder.can_cancel = newStatus === "pending";

    safeRevalidate("/admin/orders");
    safeRevalidate(`/admin/orders/${orderId}`);
    safeRevalidate("/admin");
    safeRevalidate("/account/orders");

    return {
      success: true,
      message: `[Demo Mode] Order status updated from '${currentStatus}' to '${newStatus}'.`,
    };
  }

  // 1. Verify acting user is authenticated
  const {
    data: { user: caller },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !caller) {
    return { error: "Unauthorized: You must be logged in to manage orders." };
  }

  // 2. Verify acting user is an administrator
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (profileErr || !profile || profile.role !== "admin") {
    return { error: "Forbidden: Administrator privileges required to manage orders." };
  }

  // 3. Fetch current order status from database
  const { data: currentOrder, error: fetchErr } = await supabase
    .from("orders")
    .select("id, order_number, status")
    .or(`id.eq.${orderId},order_number.eq.${orderId}`)
    .single();

  if (fetchErr || !currentOrder) {
    return { error: "Order not found in database." };
  }

  const currentStatus = currentOrder.status as OrderStatus;

  // 4. Validate transition: strict business transition rules
  if (!canTransitionOrderStatus(currentStatus, newStatus)) {
    return {
      error: `Invalid transition from '${currentStatus}' to '${newStatus}'. Confirmed status can only be entered once from 'pending' to safeguard stock deduction.`,
    };
  }

  // 5. Update status (triggers schema trg_order_confirmation when status becomes 'confirmed')
  const { error: updateErr } = await supabase
    .from("orders")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentOrder.id);

  if (updateErr) {
    return { error: `Failed to update order status: ${updateErr.message}` };
  }

  safeRevalidate("/admin/orders");
  safeRevalidate(`/admin/orders/${currentOrder.id}`);
  safeRevalidate(`/admin/orders/${currentOrder.order_number}`);
  safeRevalidate("/admin");
  safeRevalidate("/account/orders");
  safeRevalidate("/shop");

  return {
    success: true,
    message: `Order #${currentOrder.order_number} status updated to '${newStatus}'.`,
  };
}

/**
 * Updates an order payment status (e.g. marking COD as paid upon collection, or marking refunded)
 */
export async function updateOrderPaymentStatusAction(
  orderId: string,
  newPaymentStatus: PaymentStatus
): Promise<{ success?: boolean; message?: string; error?: string }> {
  if (!orderId || !newPaymentStatus) {
    return { error: "Missing required order ID or payment status parameter." };
  }

  const supabase = await createClient();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    const store = getDemoOrdersStore();
    let targetOrder: any = null;
    for (const list of store.values()) {
      const found = list.find((o) => o.id === orderId || o.order_number === orderId);
      if (found) {
        targetOrder = found;
        break;
      }
    }

    if (!targetOrder) {
      return { error: `Order #${orderId} was not found.` };
    }

    const currentPayment = targetOrder.payment_status as PaymentStatus;
    if (!canTransitionPaymentStatus(currentPayment, newPaymentStatus)) {
      return {
        error: `Invalid payment status transition from '${currentPayment}' to '${newPaymentStatus}'.`,
      };
    }

    targetOrder.payment_status = newPaymentStatus;
    targetOrder.updated_at = new Date().toISOString();

    safeRevalidate("/admin/orders");
    safeRevalidate(`/admin/orders/${orderId}`);
    return {
      success: true,
      message: `[Demo Mode] Payment status updated to '${newPaymentStatus}'.`,
    };
  }

  // 1. Verify acting user is admin
  const {
    data: { user: caller },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !caller) {
    return { error: "Unauthorized: You must be logged in to manage payments." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Forbidden: Administrator privileges required." };
  }

  // 2. Fetch current payment status
  const { data: currentOrder, error: fetchErr } = await supabase
    .from("orders")
    .select("id, order_number, payment_status")
    .or(`id.eq.${orderId},order_number.eq.${orderId}`)
    .single();

  if (fetchErr || !currentOrder) {
    return { error: "Order not found." };
  }

  const currentPayment = currentOrder.payment_status as PaymentStatus;
  if (!canTransitionPaymentStatus(currentPayment, newPaymentStatus)) {
    return {
      error: `Invalid payment status transition from '${currentPayment}' to '${newPaymentStatus}'.`,
    };
  }

  // 3. Update payment status
  const { error: updateErr } = await supabase
    .from("orders")
    .update({
      payment_status: newPaymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentOrder.id);

  if (updateErr) {
    return { error: `Failed to update payment status: ${updateErr.message}` };
  }

  safeRevalidate("/admin/orders");
  safeRevalidate(`/admin/orders/${currentOrder.id}`);
  safeRevalidate(`/admin/orders/${currentOrder.order_number}`);
  safeRevalidate("/account/orders");

  return {
    success: true,
    message: `Payment status for Order #${currentOrder.order_number} updated to '${newPaymentStatus}'.`,
  };
}
