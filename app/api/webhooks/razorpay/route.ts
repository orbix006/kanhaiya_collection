import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyWebhookSignature, RAZORPAY_WEBHOOK_SECRET } from "@/lib/razorpay";
import { getDemoOrdersStore } from "@/lib/data/orders";
import { getDemoCartStore } from "@/lib/data/cart";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    // 1. Cryptographic HMAC verification of webhook signature
    const isValid = verifyWebhookSignature({
      rawBody,
      signature,
      secret: RAZORPAY_WEBHOOK_SECRET,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook cryptographic signature" },
        { status: 400 }
      );
    }

    const eventData = JSON.parse(rawBody);
    const eventType = eventData.event;
    const payload = eventData.payload;

    let razorpayOrderId: string | null = null;
    let razorpayPaymentId: string | null = null;

    if (payload?.payment?.entity) {
      razorpayPaymentId = payload.payment.entity.id;
      razorpayOrderId = payload.payment.entity.order_id;
    } else if (payload?.order?.entity) {
      razorpayOrderId = payload.order.entity.id;
    }

    if (!razorpayOrderId) {
      return NextResponse.json(
        { status: "ignored_no_order_id", event: eventType },
        { status: 200 }
      );
    }

    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

    if (!isConfigured) {
      // Demo store handling with strict idempotency
      const ordersStore = getDemoOrdersStore();
      let matchedOrder = null;
      let matchedUserId = null;

      for (const [uid, orders] of ordersStore.entries()) {
        const found = orders.find((o) => o.razorpay_order_id === razorpayOrderId);
        if (found) {
          matchedOrder = found;
          matchedUserId = uid;
          break;
        }
      }

      if (!matchedOrder) {
        return NextResponse.json(
          { status: "order_not_found_in_store", razorpayOrderId },
          { status: 200 }
        );
      }

      // Idempotency Check: if already processed and marked paid/confirmed, safely ignore
      if (
        (eventType === "order.paid" || eventType === "payment.captured") &&
        matchedOrder.payment_status === "paid" &&
        matchedOrder.status === "confirmed"
      ) {
        return NextResponse.json(
          {
            status: "idempotent_duplicate_ignored",
            orderNumber: matchedOrder.order_number,
            event: eventType,
          },
          { status: 200 }
        );
      }

      if (eventType === "order.paid" || eventType === "payment.captured") {
        matchedOrder.payment_status = "paid";
        matchedOrder.status = "confirmed";
        matchedOrder.can_cancel = false;
        if (razorpayPaymentId) {
          matchedOrder.razorpay_payment_id = razorpayPaymentId;
        }
        if (matchedUserId) {
          getDemoCartStore().delete(matchedUserId);
        }
      } else if (eventType === "payment.failed") {
        matchedOrder.payment_status = "failed";
      }

      return NextResponse.json(
        {
          status: "processed",
          orderNumber: matchedOrder.order_number,
          event: eventType,
        },
        { status: 200 }
      );
    }

    // Remote database handling with idempotency (using elevated service client for background webhook)
    const supabase = createServiceClient();

    // 2. Locate order by razorpay_order_id
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("id, user_id, order_number, status, payment_status, razorpay_order_id")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();

    if (fetchErr || !order) {
      console.warn(`[Razorpay Webhook] Order not found for razorpay_order_id: ${razorpayOrderId}`);
      return NextResponse.json(
        { status: "order_not_found", razorpayOrderId },
        { status: 200 }
      );
    }

    // 3. IDEMPOTENCY GUARD: If order is already paid and confirmed, ignore duplicate webhook safely
    if (
      (eventType === "order.paid" || eventType === "payment.captured") &&
      order.payment_status === "paid" &&
      order.status === "confirmed"
    ) {
      return NextResponse.json(
        {
          status: "idempotent_duplicate_ignored",
          orderNumber: order.order_number,
          event: eventType,
        },
        { status: 200 }
      );
    }

    // 4. Update order state based on verified webhook event
    if (eventType === "order.paid" || eventType === "payment.captured") {
      const updateData: {
        payment_status: "paid";
        status: "confirmed";
        updated_at: string;
        razorpay_payment_id?: string;
      } = {
        payment_status: "paid",
        status: "confirmed",
        updated_at: new Date().toISOString(),
      };
      if (razorpayPaymentId) {
        updateData.razorpay_payment_id = razorpayPaymentId;
      }

      await supabase.from("orders").update(updateData).eq("id", order.id);

      // Clear user cart if still present
      await supabase.from("cart_items").delete().eq("user_id", order.user_id);
    } else if (eventType === "payment.failed") {
      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
    }

    return NextResponse.json(
      {
        status: "processed",
        orderNumber: order.order_number,
        event: eventType,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[Razorpay Webhook Handler Error]:", err);
    return NextResponse.json(
      { error: "Webhook handler failed", details: err.message },
      { status: 500 }
    );
  }
}
