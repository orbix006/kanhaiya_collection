/**
 * Promo Coupons & Discount Evaluation Engine
 * Handles deterministic coupon validation, minimum order requirements,
 * expiry checking, and percentage/fixed discount calculations.
 */

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order: number;
  max_discount?: number | null;
  is_active: boolean;
  expires_at?: string | null;
  description?: string | null;
}

export const SEED_COUPONS: Coupon[] = [
  {
    id: "cpn-welcome10",
    code: "WELCOME10",
    discount_type: "percentage",
    discount_value: 10,
    min_order: 999,
    max_discount: 1000,
    is_active: true,
    expires_at: "2026-12-31T23:59:59.000Z",
    description: "10% off on your order above ₹999",
  },
  {
    id: "cpn-festival20",
    code: "FESTIVAL20",
    discount_type: "percentage",
    discount_value: 20,
    min_order: 1999,
    max_discount: 2000,
    is_active: true,
    expires_at: "2026-12-31T23:59:59.000Z",
    description: "20% off on festive purchases above ₹1,999",
  },
  {
    id: "cpn-krishna25",
    code: "KRISHNA25",
    discount_type: "percentage",
    discount_value: 25,
    min_order: 2499,
    max_discount: 2500,
    is_active: true,
    expires_at: "2026-12-31T23:59:59.000Z",
    description: "25% off on sacred offerings above ₹2,499",
  },
];

/**
 * Returns all configured coupons from the administrative store
 */
export function getAllCoupons(): Coupon[] {
  try {
    const { loadMockStore } = require("@/lib/mock-data/admin-store");
    const store = loadMockStore();
    if (Array.isArray(store.coupons) && store.coupons.length > 0) {
      return store.coupons;
    }
  } catch {
    // Fallback to canonical seed coupons
  }
  return SEED_COUPONS;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discount: number;
  error?: string;
}

/**
 * Validates a coupon code against current subtotal with strict checks for:
 * 1. Existence
 * 2. Active status
 * 3. Expiration date
 * 4. Minimum order subtotal threshold
 */
export function validateCoupon(
  code: string,
  subtotal: number
): CouponValidationResult {
  const normalized = code ? code.trim().toUpperCase() : "";
  if (!normalized) {
    return { valid: false, discount: 0, error: "Please enter a valid coupon code." };
  }

  const coupons = getAllCoupons();
  const found = coupons.find((c) => c.code.toUpperCase() === normalized);

  if (!found) {
    return {
      valid: false,
      discount: 0,
      error: `Coupon code "${normalized}" is invalid or does not exist.`,
    };
  }

  if (!found.is_active) {
    return {
      valid: false,
      discount: 0,
      error: `Coupon code "${normalized}" is currently inactive.`,
    };
  }

  if (found.expires_at) {
    const exp = new Date(found.expires_at).getTime();
    if (Date.now() > exp) {
      return {
        valid: false,
        discount: 0,
        error: `Coupon code "${normalized}" has expired.`,
      };
    }
  }

  if (subtotal < found.min_order) {
    return {
      valid: false,
      discount: 0,
      error: `Coupon "${normalized}" requires a minimum order subtotal of ₹${found.min_order.toLocaleString("en-IN")}.`,
    };
  }

  let discount = 0;
  if (found.discount_type === "percentage") {
    const rawDiscount = Math.round((subtotal * found.discount_value) / 100);
    discount = found.max_discount ? Math.min(rawDiscount, found.max_discount) : rawDiscount;
  } else {
    discount = Math.min(subtotal, found.discount_value);
  }

  return { valid: true, coupon: found, discount };
}
