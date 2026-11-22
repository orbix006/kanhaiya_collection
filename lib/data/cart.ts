import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getLocalSession } from "@/lib/auth/local-auth";
import { getProductById } from "@/lib/store";

/**
 * Resolves the active user ID for cart operations across Supabase auth,
 * local development auth, or persistent guest cookie session.
 */
export async function getCartUserId(): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isConfigured =
    Boolean(supabaseUrl) &&
    supabaseUrl !== "https://placeholder-project.supabase.co" &&
    supabaseUrl?.startsWith("http");

  if (isConfigured) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) return user.id;
    } catch {
      // Continue
    }
  }

  // Check local development auth session
  try {
    const session = await getLocalSession();
    if (session?.id) return session.id;
  } catch {
    // Continue
  }

  // Check guest cart cookie
  try {
    const cookieStore = await cookies();
    const guestCookie = cookieStore.get("guest_cart_id")?.value;
    if (guestCookie) return guestCookie;
  } catch {
    // Continue
  }

  return "demo-user-id";
}

export interface CartProductSnapshot {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  is_active: boolean;
  primary_image: string | null;
}

export interface CartVariantSnapshot {
  id: string;
  variant_name: string;
  price: number | null;
  compare_at_price: number | null;
  stock_quantity: number;
  is_active: boolean;
}

export interface AddToCartInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface UpdateQuantityInput {
  cartItemId: string; // productId or synthetic id
  quantity: number;
}

export interface CartItemWithDetails {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  added_at: string;
  product: CartProductSnapshot;
  variant: CartVariantSnapshot | null;
  unit_price: number;
  subtotal: number;
  available_stock: number;
  is_out_of_stock: boolean;
  exceeds_stock: boolean;
}

export interface CartAppliedCoupon {
  code: string;
  discount: number;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  description: string | null;
}

export interface CartSummary {
  items: CartItemWithDetails[];
  item_count: number;
  distinct_count: number;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  tax: number;
  total: number;
  applied_coupon?: CartAppliedCoupon;
  has_out_of_stock: boolean;
  has_stock_exceeded: boolean;
  free_shipping_threshold: number;
  amount_for_free_shipping: number;
}

// In-memory fallback for local demo guest sessions
interface DemoCartRow {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  added_at: string;
}

const demoCartStore = new Map<string, DemoCartRow[]>();

export const FREE_SHIPPING_THRESHOLD = 999;
export const STANDARD_SHIPPING_FEE = 99;

/**
 * Calculates cart totals including subtotal, coupon discount, shipping, tax, and final payable amount.
 */
export function calculateCartTotals(
  items: CartItemWithDetails[],
  couponCode?: string | null
): Pick<
  CartSummary,
  | "subtotal"
  | "shipping_fee"
  | "discount"
  | "tax"
  | "total"
  | "applied_coupon"
  | "free_shipping_threshold"
  | "amount_for_free_shipping"
> {
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);

  let discount = 0;
  let appliedCoupon: CartAppliedCoupon | undefined = undefined;

  if (couponCode && subtotal > 0) {
    const { validateCoupon } = require("@/lib/data/coupons");
    const result = validateCoupon(couponCode, subtotal);
    if (result.valid && result.coupon) {
      discount = result.discount;
      appliedCoupon = {
        code: result.coupon.code,
        discount: result.discount,
        discount_type: result.coupon.discount_type,
        discount_value: result.coupon.discount_value,
        description: result.coupon.description,
      };
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);

  let shipping_fee = 0;
  let amount_for_free_shipping = 0;

  if (items.length > 0) {
    if (discountedSubtotal >= FREE_SHIPPING_THRESHOLD) {
      shipping_fee = 0;
      amount_for_free_shipping = 0;
    } else {
      shipping_fee = STANDARD_SHIPPING_FEE;
      amount_for_free_shipping = FREE_SHIPPING_THRESHOLD - discountedSubtotal;
    }
  }

  const tax = 0; // Tax is inclusive in catalog pricing
  const total = Math.max(0, discountedSubtotal + shipping_fee);

  return {
    subtotal,
    shipping_fee,
    discount,
    tax,
    total,
    applied_coupon: appliedCoupon,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    amount_for_free_shipping,
  };
}

/**
 * Reads user's active cart with live pricing and stock validation from the database.
 */
export async function getUserCart(
  userId: string,
  couponCodeOverride?: string | null
): Promise<CartSummary> {
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  let activeCouponCode: string | null = null;
  if (couponCodeOverride !== undefined) {
    activeCouponCode = couponCodeOverride;
  } else {
    try {
      const cookieStore = await cookies();
      activeCouponCode = cookieStore.get("applied_coupon_code")?.value || null;
    } catch {
      activeCouponCode = null;
    }
  }

  // Guest / local fallback
  if (!isConfigured || userId.startsWith("guest_") || userId === "demo-user-id") {
    const rawItems = demoCartStore.get(userId) || [];
    const detailedItems: CartItemWithDetails[] = [];

    for (const raw of rawItems) {
      const prod = await getProductById(raw.product_id);
      if (!prod) continue;

      const unitPrice = prod.base_price;
      const availableStock = prod.stock_quantity;
      const primaryImg = (prod as any).primary_image || (prod.images && prod.images[0]?.image_url) || null;

      detailedItems.push({
        id: raw.id,
        user_id: raw.user_id,
        product_id: raw.product_id,
        variant_id: null,
        quantity: raw.quantity,
        added_at: raw.added_at,
        product: {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          base_price: prod.base_price,
          compare_at_price: prod.compare_at_price || null,
          stock_quantity: prod.stock_quantity,
          is_active: prod.is_active,
          primary_image: primaryImg,
        },
        variant: null,
        unit_price: unitPrice,
        subtotal: unitPrice * raw.quantity,
        available_stock: availableStock,
        is_out_of_stock: availableStock <= 0,
        exceeds_stock: raw.quantity > availableStock,
      });
    }

    const totals = calculateCartTotals(detailedItems, activeCouponCode);
    const itemCount = detailedItems.reduce((acc, i) => acc + i.quantity, 0);

    return {
      items: detailedItems,
      item_count: itemCount,
      distinct_count: detailedItems.length,
      ...totals,
      has_out_of_stock: detailedItems.some((i) => i.is_out_of_stock),
      has_stock_exceeded: detailedItems.some((i) => i.exceeds_stock),
    };
  }

  const supabase = await createClient();

  // Primary key on cart_items is (user_id, product_id)
  const { data: cartRows, error: cartError } = await supabase
    .from("cart_items")
    .select(`
      user_id,
      product_id,
      quantity,
      added_at,
      products (
        id,
        name,
        slug,
        price,
        stock,
        is_active,
        product_images (
          url,
          is_primary,
          sort_order
        )
      )
    `)
    .eq("user_id", userId)
    .order("added_at", { ascending: false });

  if (cartError || !cartRows) {
    console.error("[getUserCart] Query error:", cartError?.message);
    return {
      items: [],
      item_count: 0,
      distinct_count: 0,
      subtotal: 0,
      shipping_fee: 0,
      discount: 0,
      tax: 0,
      total: 0,
      has_out_of_stock: false,
      has_stock_exceeded: false,
      free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
      amount_for_free_shipping: FREE_SHIPPING_THRESHOLD,
    };
  }

  const detailedItems: CartItemWithDetails[] = [];

  for (const row of cartRows as any[]) {
    const prod = row.products;
    if (!prod) continue;

    const unitPrice = Number(prod.price ?? 0);
    const availableStock = Number(prod.stock ?? 0);

    const images = (prod.product_images || []) as { url: string; is_primary?: boolean; sort_order?: number }[];
    const primaryImg =
      images.find((img) => img.is_primary)?.url ||
      images.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url ||
      null;

    const qty = Number(row.quantity);

    detailedItems.push({
      id: `${row.user_id}_${row.product_id}`,
      user_id: row.user_id,
      product_id: row.product_id,
      variant_id: null,
      quantity: qty,
      added_at: row.added_at,
      product: {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        base_price: unitPrice,
        compare_at_price: null,
        stock_quantity: availableStock,
        is_active: prod.is_active,
        primary_image: primaryImg,
      },
      variant: null,
      unit_price: unitPrice,
      subtotal: unitPrice * qty,
      available_stock: availableStock,
      is_out_of_stock: availableStock <= 0,
      exceeds_stock: qty > availableStock,
    });
  }

  const totals = calculateCartTotals(detailedItems, activeCouponCode);
  const itemCount = detailedItems.reduce((acc, i) => acc + i.quantity, 0);

  return {
    items: detailedItems,
    item_count: itemCount,
    distinct_count: detailedItems.length,
    ...totals,
    has_out_of_stock: detailedItems.some((i) => i.is_out_of_stock),
    has_stock_exceeded: detailedItems.some((i) => i.exceeds_stock),
  };
}

/**
 * Returns total quantity count of items in user's cart for live header display
 */
export async function getUserCartCount(userId: string): Promise<number> {
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured || userId.startsWith("guest_") || userId === "demo-user-id") {
    const rawItems = demoCartStore.get(userId) || [];
    return rawItems.reduce((acc, i) => acc + i.quantity, 0);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("user_id", userId);

    if (error || !data) return 0;
    return data.reduce((acc: number, row: any) => acc + Number(row.quantity), 0);
  } catch {
    return 0;
  }
}

// Helpers for demo mode fallback
export function getDemoCartStore() {
  return demoCartStore;
}
