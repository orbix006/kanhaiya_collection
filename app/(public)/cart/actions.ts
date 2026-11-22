"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  getUserCart,
  getUserCartCount,
  getDemoCartStore,
  getCartUserId,
  type AddToCartInput,
  type UpdateQuantityInput,
} from "@/lib/data/cart";
import { getProductById } from "@/lib/store";

function safeRevalidate(path: string, type?: "layout" | "page") {
  try {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  } catch {
    // Standalone script context fallback
  }
}

/**
 * Server action to fetch the user's authenticated cart
 */
export async function getCartAction() {
  const userId = await getCartUserId();
  const cart = await getUserCart(userId);
  return { success: true, cart };
}

/**
 * Add product to cart with strict stock validation (matches schema.txt cart_items)
 */
export async function addToCartAction(input: AddToCartInput): Promise<{
  success?: boolean;
  message?: string;
  newCartCount?: number;
  error?: string;
  requiresAuth?: boolean;
}> {
  const { productId, quantity } = input;

  if (!productId || typeof quantity !== "number" || quantity <= 0) {
    return { error: "Invalid product or quantity specified." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  const userId = await getCartUserId();

  // If this is a guest user, ensure the guest cookie is initialized
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get("guest_cart_id") && !user) {
      cookieStore.set("guest_cart_id", userId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }
  } catch {
    // Non-fatal
  }

  try {
    if (!isConfigured || userId.startsWith("guest_") || userId === "demo-user-id") {
      // Local dev / guest fallback
      const prod = await getProductById(productId);
      if (!prod || !prod.is_active) {
        return { error: "Product not found or unavailable." };
      }

      const availableStock = prod.stock_quantity;
      if (availableStock <= 0) {
        return { error: "This item is currently out of stock." };
      }

      const store = getDemoCartStore();
      const userItems = store.get(userId) || [];
      const existingIdx = userItems.findIndex((it) => it.product_id === productId);

      const currentQty = existingIdx >= 0 ? userItems[existingIdx].quantity : 0;
      const requestedTotalQty = currentQty + quantity;

      if (requestedTotalQty > availableStock) {
        return {
          error: `Only ${availableStock} items are available in stock. You already have ${currentQty} in your cart.`,
        };
      }

      if (existingIdx >= 0) {
        userItems[existingIdx].quantity = requestedTotalQty;
      } else {
        userItems.push({
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: userId,
          product_id: productId,
          variant_id: null,
          quantity: quantity,
          added_at: new Date().toISOString(),
        });
      }

      store.set(userId, userItems);

      const newCartCount = userItems.reduce((acc, i) => acc + i.quantity, 0);
      safeRevalidate("/cart");
      safeRevalidate("/checkout");
      safeRevalidate("/", "layout");

      return {
        success: true,
        message: "Added to your shopping bag!",
        newCartCount,
      };
    }

    // Authenticated Supabase flow:
    // 1. Fetch live stock from database
    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("stock, is_active, name")
      .eq("id", productId)
      .maybeSingle();

    if (pErr || !product || !product.is_active) {
      return { error: "The product is no longer available." };
    }
    const availableStock = product.stock;

    if (availableStock <= 0) {
      return { error: "This item is currently out of stock." };
    }

    // 2. Check existing cart row for this user
    const { data: existingCartItem } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();

    const currentCartQty = existingCartItem ? existingCartItem.quantity : 0;
    const requestedTotalQty = currentCartQty + quantity;

    if (requestedTotalQty > availableStock) {
      return {
        error: `Only ${availableStock} items are available in stock. You currently have ${currentCartQty} in your cart.`,
      };
    }

    // 3. Upsert cart item (primary key: user_id, product_id)
    const { error: upsertErr } = await supabase.from("cart_items").upsert({
      user_id: userId,
      product_id: productId,
      quantity: requestedTotalQty,
      added_at: new Date().toISOString(),
    });

    if (upsertErr) {
      return { error: upsertErr.message };
    }

    const newCartCount = await getUserCartCount(userId);

    safeRevalidate("/cart");
    safeRevalidate("/checkout");
    safeRevalidate("/", "layout");

    return {
      success: true,
      message: "Added to your shopping bag!",
      newCartCount,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add item to cart.";
    return { error: message };
  }
}

/**
 * Update quantity for an existing cart item with live stock checks
 */
export async function updateCartQuantityAction(input: UpdateQuantityInput) {
  const { cartItemId, quantity } = input;

  const supabase = await createClient();
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  const userId = await getCartUserId();

  try {
    if (!isConfigured || userId.startsWith("guest_") || userId === "demo-user-id") {
      const store = getDemoCartStore();
      const userItems = store.get(userId) || [];
      const itemIdx = userItems.findIndex((it) => it.id === cartItemId || it.product_id === cartItemId);

      if (itemIdx === 0 && userItems.length === 0) {
        return { error: "Cart item not found." };
      }
      if (itemIdx < 0) {
        return { error: "Cart item not found." };
      }

      const item = userItems[itemIdx];
      const prod = await getProductById(item.product_id);
      if (!prod) return { error: "Product not found." };

      const availableStock = prod.stock_quantity;
      if (quantity > availableStock) {
        return {
          error: `Cannot update quantity to ${quantity}. Only ${availableStock} available in stock.`,
        };
      }

      userItems[itemIdx].quantity = quantity;
      store.set(userId, userItems);

      const newCartCount = userItems.reduce((acc, i) => acc + i.quantity, 0);
      safeRevalidate("/cart");
      safeRevalidate("/checkout");
      safeRevalidate("/", "layout");

      return { success: true, newCartCount };
    }

    // For Supabase: cartItemId is either product_id or user_id_product_id
    const targetProductId = cartItemId.includes("_") ? cartItemId.split("_")[1] : cartItemId;

    // 1. Fetch stock
    const { data: prod, error: fetchErr } = await supabase
      .from("products")
      .select("stock, is_active")
      .eq("id", targetProductId)
      .maybeSingle();

    if (fetchErr || !prod || !prod.is_active) {
      return { error: "Product not found or unavailable." };
    }

    const availableStock = prod.stock;
    if (quantity > availableStock) {
      return {
        error: `Cannot update quantity to ${quantity}. Only ${availableStock} items are available in stock.`,
      };
    }

    const { error: updateErr } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("user_id", userId)
      .eq("product_id", targetProductId);

    if (updateErr) {
      return { error: updateErr.message };
    }

    const newCartCount = await getUserCartCount(userId);

    safeRevalidate("/cart");
    safeRevalidate("/checkout");
    safeRevalidate("/", "layout");

    return { success: true, newCartCount };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update quantity.";
    return { error: message };
  }
}

/**
 * Remove an item from the cart
 */
export async function removeCartItemAction(cartItemId: string) {
  const supabase = await createClient();
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  const userId = await getCartUserId();

  try {
    if (!isConfigured || userId.startsWith("guest_") || userId === "demo-user-id") {
      const store = getDemoCartStore();
      const userItems = store.get(userId) || [];
      const filtered = userItems.filter(
        (it) => it.id !== cartItemId && it.product_id !== cartItemId
      );
      store.set(userId, filtered);

      const newCartCount = filtered.reduce((acc, i) => acc + i.quantity, 0);
      safeRevalidate("/cart");
      safeRevalidate("/checkout");
      safeRevalidate("/", "layout");

      return { success: true, newCartCount };
    }

    const targetProductId = cartItemId.includes("_") ? cartItemId.split("_")[1] : cartItemId;

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", targetProductId);

    if (error) {
      return { error: error.message };
    }

    const newCartCount = await getUserCartCount(userId);

    safeRevalidate("/cart");
    safeRevalidate("/checkout");
    safeRevalidate("/", "layout");

    return { success: true, newCartCount };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to remove item.";
    return { error: message };
  }
}

/**
 * Clear all items from user's cart
 */
export async function clearCartAction() {
  const supabase = await createClient();
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  const userId = await getCartUserId();

  try {
    if (!isConfigured || userId.startsWith("guest_") || userId === "demo-user-id") {
      const store = getDemoCartStore();
      store.delete(userId);

      safeRevalidate("/cart");
      safeRevalidate("/checkout");
      safeRevalidate("/", "layout");

      return { success: true, newCartCount: 0 };
    }

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId);

    if (error) {
      return { error: error.message };
    }

    try {
      const cookieStore = await cookies();
      cookieStore.delete("applied_coupon_code");
    } catch {
      // Continue
    }

    safeRevalidate("/cart");
    safeRevalidate("/checkout");
    safeRevalidate("/", "layout");

    return { success: true, newCartCount: 0 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to clear cart.";
    return { error: message };
  }
}

/**
 * Apply a promotional coupon to the active shopping session
 */
export async function applyCouponAction(couponCode: string) {
  try {
    const userId = await getCartUserId();
    // Fetch cart with null to evaluate against pre-coupon subtotal
    const cart = await getUserCart(userId, null);

    if (cart.items.length === 0) {
      return { error: "Please add products to your bag before applying a coupon." };
    }

    const { validateCoupon } = await import("@/lib/data/coupons");
    const result = validateCoupon(couponCode, cart.subtotal);

    if (!result.valid || !result.coupon) {
      return { error: result.error || "Invalid coupon code." };
    }

    try {
      const cookieStore = await cookies();
      cookieStore.set("applied_coupon_code", result.coupon.code, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    } catch {
      // Context without cookies
    }

    safeRevalidate("/cart");
    safeRevalidate("/checkout");

    return {
      success: true,
      coupon: {
        code: result.coupon.code,
        discount: result.discount,
        discount_type: result.coupon.discount_type,
        discount_value: result.coupon.discount_value,
        description: result.coupon.description,
      },
      discount: result.discount,
      message: `Coupon "${result.coupon.code}" applied successfully! You saved ₹${result.discount.toLocaleString("en-IN")}.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to apply coupon.";
    return { error: msg };
  }
}

/**
 * Remove the applied promotional coupon from the active session
 */
export async function removeCouponAction() {
  try {
    try {
      const cookieStore = await cookies();
      cookieStore.delete("applied_coupon_code");
    } catch {
      // Context without cookies
    }

    safeRevalidate("/cart");
    safeRevalidate("/checkout");

    return { success: true, message: "Coupon removed." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to remove coupon.";
    return { error: msg };
  }
}
