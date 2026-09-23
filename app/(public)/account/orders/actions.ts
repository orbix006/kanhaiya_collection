"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getDemoOrdersStore } from "@/lib/data/orders";

function safeRevalidate(path: string, type?: "layout" | "page") {
  try {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  } catch {
    // Standalone script context fallback
  }
}

/**
 * Cancels an eligible customer order (strictly limited to pending orders)
 */
export async function cancelOrderAction(orderId: string) {
  if (!orderId) {
    return { error: "Invalid order ID specified." };
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
    return { error: "Authentication required to manage orders." };
  }

  try {
    if (!isConfigured) {
      const ordersStore = getDemoOrdersStore();
      const userOrders = ordersStore.get(userId) || [];
      const order = userOrders.find((o) => o.id === orderId);

      if (!order) {
        return { error: "Order not found." };
      }

      if (order.status !== "pending") {
        return {
          error: `Cannot cancel order #${order.order_number}. Only orders with 'pending' status are eligible for cancellation (current status: '${order.status}').`,
        };
      }

      order.status = "cancelled";
      order.can_cancel = false;
      order.updated_at = new Date().toISOString();

      safeRevalidate("/account/orders");
      safeRevalidate(`/account/orders/${orderId}`);
      safeRevalidate("/", "layout");

      return { success: true, message: "Order has been cancelled successfully." };
    }

    // 1. Fetch current order status to verify eligibility
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("id, order_number, status, user_id")
      .eq("id", orderId)
      .eq("user_id", userId)
      .single();

    if (fetchErr || !order) {
      return { error: "Order not found or access denied." };
    }

    if (order.status !== "pending") {
      return {
        error: `Cannot cancel order #${order.order_number}. Only pending orders are eligible for cancellation. This order is currently '${order.status}'.`,
      };
    }

    // 2. Update status to 'cancelled' (respects RLS policy orders_user_cancel_pending)
    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("user_id", userId);

    if (updateErr) {
      return { error: updateErr.message };
    }

    safeRevalidate("/account/orders");
    safeRevalidate(`/account/orders/${orderId}`);
    safeRevalidate("/", "layout");

    return {
      success: true,
      message: `Order #${order.order_number} has been cancelled successfully.`,
    };
  } catch (err: any) {
    return { error: err.message || "Failed to cancel order." };
  }
}
