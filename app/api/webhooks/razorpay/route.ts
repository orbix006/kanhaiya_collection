import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyWebhookSignature, RAZORPAY_WEBHOOK_SECRET } from "@/lib/razorpay";
import { getDemoOrdersStore } from "@/lib/data/orders";
import { getDemoCartStore } from "@/lib/data/cart";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";
    const eventId = request.headers.get("x-razorpay-event-id") || `evt_${Date.now()}`;

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
    let amountMinor: number = 0;
    let currency: string = "INR";
    let paymentMethod: string = "online";
    let errorCode: string | null = null;
    let errorDescription: string | null = null;

    if (payload?.payment?.entity) {
      const p = payload.payment.entity;
      razorpayPaymentId = p.id;
      razorpayOrderId = p.order_id;
      amountMinor = p.amount || 0;
      currency = p.currency || "INR";
      paymentMethod = p.method || "online";
      errorCode = p.error_code || null;
      errorDescription = p.error_description || null;
    } else if (payload?.order?.entity) {
      razorpayOrderId = payload.order.entity.id;
      amountMinor = payload.order.entity.amount || 0;
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
      let matchedOrder: any = null;
      let matchedUserId: any = null;

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

      if (eventType === "order.paid" || eventType === "payment.captured") {
        matchedOrder.payment_status = "paid";
        matchedOrder.status = "in_progress";
        matchedOrder.can_cancel = false;
        if (razorpayPaymentId) matchedOrder.razorpay_payment_id = razorpayPaymentId;

        const cartStore = getDemoCartStore();
        if (matchedUserId) cartStore.delete(matchedUserId);
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

    // Authoritative PostgreSQL service_role client
    const supabase = createServiceClient();

    // Call public.apply_payment_event RPC
    const { data: res, error: rpcErr } = await (supabase.rpc as any)("apply_payment_event", {
      p_provider: "razorpay",
      p_event_id: eventId,
      p_event_type: eventType,
      p_provider_order_id: razorpayOrderId,
      p_provider_payment_id: razorpayPaymentId,
      p_amount_minor: amountMinor,
      p_currency: currency,
      p_raw: eventData,
      p_method: paymentMethod,
      p_error_code: errorCode,
      p_error_description: errorDescription,
      p_parent_payment_id: null,
      p_order_id: null,
    });

    if (rpcErr) {
      console.error("[Razorpay Webhook apply_payment_event error]:", rpcErr.message);
    }

    return NextResponse.json(
      {
        status: "processed",
        event: eventType,
        result: res || null,
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
