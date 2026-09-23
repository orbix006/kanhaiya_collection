"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  getUserCart,
  getUserCartCount,
  getDemoCartStore,
  type AddToCartInput,
  type UpdateQuantityInput,
} from "@/lib/data/cart";
import { FALLBACK_PRODUCT_DETAILS } from "@/lib/data/products";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  const userId = user?.id || (!isConfigured ? "demo-user-id" : null);

  if (!userId) {
    return { error: "Please sign in to view your shopping cart.", requiresAuth: true };
  }

  const cart = await getUserCart(userId);
  return { success: true, cart };
}

/**
 * Add product or variant to cart with strict stock validation
 */
export async function addToCartAction(input: AddToCartInput) {
  const { productId, variantId = null, quantity } = input;

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

  const userId = user?.id || (!isConfigured ? "demo-user-id" : null);

  if (!userId) {
    return {
      error: "Please sign in to add items to your shopping cart.",
      requiresAuth: true,
    };
  }

  try {
    if (!isConfigured) {
      // Local dev / offline fallback
      const fallbackProd = FALLBACK_PRODUCT_DETAILS.find((p) => p.id === productId);
      if (!fallbackProd || !fallbackProd.is_active) {
        return { error: "Product not found or unavailable." };
      }

      let availableStock = fallbackProd.stock_quantity;
      if (variantId) {
        const v = fallbackProd.variants.find((vr) => vr.id === variantId);
        if (!v || !v.is_active) {
          return { error: "Selected product variant is unavailable." };
        }
        availableStock = v.stock_quantity;
      }

      if (availableStock <= 0) {
        return { error: "This item is currently out of stock." };
      }

      const store = getDemoCartStore();
      const userItems = store.get(userId) || [];
      const existingIdx = userItems.findIndex(
        (it) => it.product_id === productId && it.variant_id === (variantId || null)
      );

      const currentQty = existingIdx >= 0 ? userItems[existingIdx].quantity : 0;
      const requestedTotal = currentQty + quantity;

      if (requestedTotal > availableStock) {
        return {
          error: `Only ${availableStock} items are available in stock. You currently have ${currentQty} in your cart.`,
        };
      }

      if (existingIdx >= 0) {
        userItems[existingIdx].quantity = requestedTotal;
      } else {
        userItems.push({
          id: `cart-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          user_id: userId,
          product_id: productId,
          variant_id: variantId || null,
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

    // 1. Fetch live stock from database
    let availableStock = 0;

    if (variantId) {
      const { data: variant, error: vErr } = await supabase
        .from("product_variants")
        .select("stock_quantity, is_active")
        .eq("id", variantId)
        .eq("product_id", productId)
        .maybeSingle();

      if (vErr || !variant || !variant.is_active) {
        return { error: "The selected variant is no longer available." };
      }
      availableStock = variant.stock_quantity;
    } else {
      const { data: product, error: pErr } = await supabase
        .from("products")
        .select("stock_quantity, is_active")
        .eq("id", productId)
        .maybeSingle();

      if (pErr || !product || !product.is_active) {
        return { error: "The product is no longer available." };
      }
      availableStock = product.stock_quantity;
    }

    if (availableStock <= 0) {
      return { error: "This item is currently out of stock." };
    }

    // 2. Check existing cart row for this user
    let query = supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (variantId) {
      query = query.eq("variant_id", variantId);
    } else {
      query = query.is("variant_id", null);
    }

    const { data: existingCartItem } = await query.maybeSingle();

    const currentCartQty = existingCartItem ? existingCartItem.quantity : 0;
    const requestedTotalQty = currentCartQty + quantity;

    if (requestedTotalQty > availableStock) {
      return {
        error: `Only ${availableStock} items are available in stock. You currently have ${currentCartQty} in your cart.`,
      };
    }

    // 3. Insert or update cart item
    if (existingCartItem) {
      const { error: updateErr } = await supabase
        .from("cart_items")
        .update({
          quantity: requestedTotalQty,
          added_at: new Date().toISOString(),
        })
        .eq("id", existingCartItem.id);

      if (updateErr) {
        return { error: updateErr.message };
      }
    } else {
      const { error: insertErr } = await supabase.from("cart_items").insert({
        user_id: userId,
        product_id: productId,
        variant_id: variantId || null,
        quantity: quantity,
      });

      if (insertErr) {
        return { error: insertErr.message };
      }
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
  } catch (err: any) {
    return { error: err.message || "Failed to add item to cart." };
  }
}

/**
 * Update quantity for an existing cart item with live stock checks
 */
export async function updateCartQuantityAction(input: UpdateQuantityInput) {
  const { cartItemId, quantity } = input;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  const userId = user?.id || (!isConfigured ? "demo-user-id" : null);

  if (!userId) {
    return { error: "Authentication required." };
  }

  // If quantity <= 0, remove item
  if (quantity <= 0) {
    return removeCartItemAction(cartItemId);
  }

  try {
    if (!isConfigured) {
      const store = getDemoCartStore();
      const userItems = store.get(userId) || [];
      const item = userItems.find((it) => it.id === cartItemId);

      if (!item) {
        return { error: "Cart item not found." };
      }

      const prod = FALLBACK_PRODUCT_DETAILS.find((p) => p.id === item.product_id);
      const v = item.variant_id
        ? prod?.variants.find((vr) => vr.id === item.variant_id)
        : null;

      const availableStock = v ? v.stock_quantity : (prod ? prod.stock_quantity : 0);

      if (quantity > availableStock) {
        return {
          error: `Cannot update quantity to ${quantity}. Only ${availableStock} items are available in stock.`,
        };
      }

      item.quantity = quantity;
      store.set(userId, userItems);

      const newCartCount = userItems.reduce((acc, i) => acc + i.quantity, 0);
      safeRevalidate("/cart");
      safeRevalidate("/checkout");
      safeRevalidate("/", "layout");

      return { success: true, newCartCount };
    }

    // 1. Fetch cart item with product & variant info to check live stock
    const { data: cartItem, error: fetchErr } = await supabase
      .from("cart_items")
      .select(`
        id,
        user_id,
        product_id,
        variant_id,
        products (stock_quantity, is_active),
        product_variants (stock_quantity, is_active)
      `)
      .eq("id", cartItemId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchErr || !cartItem) {
      return { error: "Cart item not found." };
    }

    const prod = (cartItem as any).products;
    const variant = (cartItem as any).product_variants;

    const availableStock = variant
      ? variant.stock_quantity
      : (prod ? prod.stock_quantity : 0);

    if (quantity > availableStock) {
      return {
        error: `Cannot update quantity to ${quantity}. Only ${availableStock} items are available in stock.`,
      };
    }

    const { error: updateErr } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", cartItemId)
      .eq("user_id", userId);

    if (updateErr) {
      return { error: updateErr.message };
    }

    const newCartCount = await getUserCartCount(userId);

    safeRevalidate("/cart");
    safeRevalidate("/checkout");
    safeRevalidate("/", "layout");

    return { success: true, newCartCount };
  } catch (err: any) {
    return { error: err.message || "Failed to update quantity." };
  }
}

/**
 * Remove an item from the cart
 */
export async function removeCartItemAction(cartItemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  const userId = user?.id || (!isConfigured ? "demo-user-id" : null);

  if (!userId) {
    return { error: "Authentication required." };
  }

  try {
    if (!isConfigured) {
      const store = getDemoCartStore();
      const userItems = store.get(userId) || [];
      const filtered = userItems.filter((it) => it.id !== cartItemId);
      store.set(userId, filtered);

      const newCartCount = filtered.reduce((acc, i) => acc + i.quantity, 0);
      safeRevalidate("/cart");
      safeRevalidate("/checkout");
      safeRevalidate("/", "layout");

      return { success: true, newCartCount };
    }

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId)
      .eq("user_id", userId);

    if (error) {
      return { error: error.message };
    }

    const newCartCount = await getUserCartCount(userId);

    safeRevalidate("/cart");
    safeRevalidate("/checkout");
    safeRevalidate("/", "layout");

    return { success: true, newCartCount };
  } catch (err: any) {
    return { error: err.message || "Failed to remove item." };
  }
}

/**
 * Clear all items from user's cart
 */
export async function clearCartAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  const userId = user?.id || (!isConfigured ? "demo-user-id" : null);

  if (!userId) {
    return { error: "Authentication required." };
  }

  try {
    if (!isConfigured) {
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

    safeRevalidate("/cart");
    safeRevalidate("/checkout");
    safeRevalidate("/", "layout");

    return { success: true, newCartCount: 0 };
  } catch (err: any) {
    return { error: err.message || "Failed to clear cart." };
  }
}
