"use server";

import { trackPublicOrder } from "@/lib/data/orders";
import type { OrderDetails } from "@/lib/data/order-types";

export async function trackOrderLookupAction(
  orderNumber: string,
  contact: string
): Promise<{ success?: boolean; order?: OrderDetails | null; error?: string }> {
  try {
    const cleanNum = orderNumber?.trim().toUpperCase();
    const cleanContact = contact?.trim();

    if (!cleanNum) {
      return { error: "Order number is required." };
    }
    if (!cleanContact) {
      return { error: "Registered phone or email is required for verification." };
    }

    const order = await trackPublicOrder(cleanNum, cleanContact);
    if (!order) {
      return {
        error:
          "No matching order found for this reference and contact. Please verify your order number.",
      };
    }

    return {
      success: true,
      order,
    };
  } catch (err: any) {
    return {
      error: err?.message || "Failed to retrieve order tracking information.",
    };
  }
}
