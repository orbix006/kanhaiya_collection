import { createClient } from "@/lib/supabase/server";
import { FALLBACK_PRODUCT_DETAILS, type ProductDetail } from "@/lib/data/products";

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
  cartItemId: string;
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

export interface CartSummary {
  items: CartItemWithDetails[];
  item_count: number;
  distinct_count: number;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  tax: number;
  total: number;
  has_out_of_stock: boolean;
  has_stock_exceeded: boolean;
  free_shipping_threshold: number;
  amount_for_free_shipping: number;
}

export const FREE_SHIPPING_THRESHOLD = 1999;
export const STANDARD_SHIPPING_FEE = 99;

// In-memory demo cart storage for offline development resilience
const demoCartStore: Map<string, Array<{ id: string; user_id: string; product_id: string; variant_id: string | null; quantity: number; added_at: string }>> = new Map();

/**
 * Calculates deterministic pricing totals server-side directly from item data
 */
export function calculateCartTotals(items: CartItemWithDetails[]): Omit<CartSummary, "items" | "item_count" | "distinct_count" | "has_out_of_stock" | "has_stock_exceeded"> {
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const shipping_fee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING_FEE;
  const discount = 0;
  const tax = 0; // Prices are tax-inclusive
  const total = subtotal - discount + shipping_fee + tax;
  const amount_for_free_shipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shipping_fee,
    discount,
    tax,
    total: Math.round(total * 100) / 100,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    amount_for_free_shipping: Math.round(amount_for_free_shipping * 100) / 100,
  };
}

/**
 * Fetches user's cart from database backed by `cart_items` with live stock and server-calculated totals
 */
export async function getUserCart(userId: string): Promise<CartSummary> {
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    // Offline / local development fallback
    const rawItems = demoCartStore.get(userId) || [];
    const detailedItems: CartItemWithDetails[] = [];

    for (const item of rawItems) {
      const fallbackProd = FALLBACK_PRODUCT_DETAILS.find((p) => p.id === item.product_id);
      if (!fallbackProd) continue;

      const fallbackVariant = item.variant_id
        ? fallbackProd.variants.find((v) => v.id === item.variant_id) || null
        : null;

      const unitPrice = fallbackVariant?.price ?? fallbackProd.base_price;
      const availableStock = fallbackVariant
        ? fallbackVariant.stock_quantity
        : fallbackProd.stock_quantity;

      const primaryImage =
        fallbackProd.images.find((img) => img.is_primary)?.image_url ||
        fallbackProd.images[0]?.image_url ||
        null;

      detailedItems.push({
        id: item.id,
        user_id: userId,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        added_at: item.added_at,
        product: {
          id: fallbackProd.id,
          name: fallbackProd.name,
          slug: fallbackProd.slug,
          base_price: fallbackProd.base_price,
          compare_at_price: fallbackProd.compare_at_price,
          stock_quantity: fallbackProd.stock_quantity,
          is_active: fallbackProd.is_active,
          primary_image: primaryImage,
        },
        variant: fallbackVariant
          ? {
              id: fallbackVariant.id,
              variant_name: fallbackVariant.variant_name,
              price: fallbackVariant.price,
              compare_at_price: fallbackVariant.compare_at_price,
              stock_quantity: fallbackVariant.stock_quantity,
              is_active: fallbackVariant.is_active,
            }
          : null,
        unit_price: unitPrice,
        subtotal: unitPrice * item.quantity,
        available_stock: availableStock,
        is_out_of_stock: availableStock <= 0,
        exceeds_stock: item.quantity > availableStock,
      });
    }

    const totals = calculateCartTotals(detailedItems);
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

  const { data: cartRows, error: cartError } = await supabase
    .from("cart_items")
    .select(`
      id,
      user_id,
      product_id,
      variant_id,
      quantity,
      added_at,
      products (
        id,
        name,
        slug,
        base_price,
        compare_at_price,
        stock_quantity,
        is_active,
        product_images (
          image_url,
          is_primary,
          display_order
        )
      ),
      product_variants (
        id,
        variant_name,
        price,
        compare_at_price,
        stock_quantity,
        is_active
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

    const variant = row.product_variants || null;
    const unitPrice = Number(variant?.price ?? prod.base_price);
    const availableStock = variant ? Number(variant.stock_quantity) : Number(prod.stock_quantity);

    const images = prod.product_images || [];
    const primaryImg =
      images.find((img: any) => img.is_primary)?.image_url ||
      images.sort((a: any, b: any) => a.display_order - b.display_order)[0]?.image_url ||
      null;

    const qty = Number(row.quantity);

    detailedItems.push({
      id: row.id,
      user_id: row.user_id,
      product_id: row.product_id,
      variant_id: row.variant_id,
      quantity: qty,
      added_at: row.added_at,
      product: {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        base_price: Number(prod.base_price),
        compare_at_price: prod.compare_at_price ? Number(prod.compare_at_price) : null,
        stock_quantity: Number(prod.stock_quantity),
        is_active: prod.is_active,
        primary_image: primaryImg,
      },
      variant: variant
        ? {
            id: variant.id,
            variant_name: variant.variant_name,
            price: variant.price ? Number(variant.price) : null,
            compare_at_price: variant.compare_at_price ? Number(variant.compare_at_price) : null,
            stock_quantity: Number(variant.stock_quantity),
            is_active: variant.is_active,
          }
        : null,
      unit_price: unitPrice,
      subtotal: unitPrice * qty,
      available_stock: availableStock,
      is_out_of_stock: availableStock <= 0,
      exceeds_stock: qty > availableStock,
    });
  }

  const totals = calculateCartTotals(detailedItems);
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

  if (!isConfigured) {
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
    return data.reduce((acc, row) => acc + Number(row.quantity), 0);
  } catch {
    return 0;
  }
}

// Helpers for demo mode fallback
export function getDemoCartStore() {
  return demoCartStore;
}
