import crypto from "crypto";
import Razorpay from "razorpay";

export const RAZORPAY_KEY_ID =
  process.env.RAZORPAY_KEY_ID ||
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
  "rzp_test_placeholder_key";

export const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET || "rzp_test_placeholder_secret";

export const RAZORPAY_WEBHOOK_SECRET =
  process.env.RAZORPAY_WEBHOOK_SECRET || "rzp_test_placeholder_webhook_secret";

export function isRazorpayConfigured(): boolean {
  return (
    Boolean(process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) &&
    Boolean(process.env.RAZORPAY_KEY_SECRET) &&
    process.env.RAZORPAY_KEY_SECRET !== "rzp_test_placeholder_secret"
  );
}

export function getRazorpayClient(): Razorpay | null {
  if (!isRazorpayConfigured()) {
    return null;
  }
  return new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
}

export interface CreateOrderParams {
  amount: number; // in paise
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string | null;
  status: string;
  isTestMode?: boolean;
}

/**
 * Creates a Razorpay Order server-side
 */
export async function createRazorpayOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
  const { amount, currency = "INR", receipt, notes } = params;

  if (amount <= 0) {
    throw new Error("Invalid order amount for Razorpay payment.");
  }

  const client = getRazorpayClient();

  if (client) {
    try {
      const order = await client.orders.create({
        amount: Math.round(amount),
        currency,
        receipt: receipt || undefined,
        notes: notes || {},
      });
      return {
        id: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        receipt: order.receipt || null,
        status: order.status,
      };
    } catch (err: any) {
      console.error("[Razorpay Order Creation Error]:", err);
      throw new Error(err.message || "Failed to initiate Razorpay order.");
    }
  }

  // Development sandbox fallback if live keys aren't configured
  const mockId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    id: mockId,
    amount: Math.round(amount),
    currency,
    receipt: receipt || null,
    status: "created",
    isTestMode: true,
  };
}

/**
 * Verifies Razorpay HMAC-SHA256 signature server-side
 */
export function verifyRazorpaySignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  secret = RAZORPAY_KEY_SECRET,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  secret?: string;
}): boolean {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  try {
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const actualBuffer = Buffer.from(razorpaySignature, "utf8");

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (err) {
    console.error("[Signature Verification Error]:", err);
    return false;
  }
}

/**
 * Verifies Razorpay Webhook signature server-side
 */
export function verifyWebhookSignature({
  rawBody,
  signature,
  secret = RAZORPAY_WEBHOOK_SECRET,
}: {
  rawBody: string;
  signature: string;
  secret?: string;
}): boolean {
  if (!rawBody || !signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const actualBuffer = Buffer.from(signature, "utf8");

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (err) {
    console.error("[Webhook Signature Verification Error]:", err);
    return false;
  }
}
