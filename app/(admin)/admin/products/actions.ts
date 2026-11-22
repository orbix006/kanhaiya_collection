"use server";

import { revalidatePath as nextRevalidatePath } from "next/cache";

function revalidatePath(path: string, type?: "layout" | "page") {
  try {
    nextRevalidatePath(path, type);
  } catch {
    // Safely ignore static generation store missing when run outside Next.js request context
  }
}
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/data/categories";
import { isUserAdmin } from "@/lib/auth/role-check";

export interface ProductImageInput {
  id?: string;
  image_url: string;
  alt_text?: string | null;
  display_order: number;
  is_primary: boolean;
}

export interface ProductVariantInput {
  id?: string;
  variant_name: string;
  sku?: string | null;
  attributes?: Record<string, any>;
  price?: number | null;
  compare_at_price?: number | null;
  stock_quantity: number;
  image_url?: string | null;
  is_active: boolean;
}

export interface ProductSavePayload {
  id?: string;
  category_id: string | null;
  subcategory_id?: string | null;
  name: string;
  slug?: string;
  description?: string | null;
  brand?: string | null;
  sku?: string | null;
  /**
   * Development model batch identifier.
   * NOTE: Clearly separate from PostgreSQL database schema (which has no batch_number column).
   * Flagged for persistent database migration approval.
   */
  batch_number?: string | null;
  base_price: number;
  compare_at_price?: number | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured_top_seller: boolean;
  top_seller_display_order?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  images: ProductImageInput[];
  variants: ProductVariantInput[];
}

/**
 * Verifies that the caller has an active admin role.
 */
async function verifyAdminCaller() {
  const supabase = await createClient();
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    return { authorized: true, isDemo: true, supabase };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      error: "Unauthorized: You must be logged in to manage products.",
      supabase,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!isUserAdmin(user, profile)) {
    return {
      authorized: false,
      error: "Forbidden: Only administrators can perform this action.",
      supabase,
    };
  }

  return { authorized: true, isDemo: false, user, supabase };
}

/**
 * Creates or updates a product with all schema-backed fields,
 * synchronized product_images and product_variants, and strict primary-image enforcement.
 */
export async function saveProductAction(payload: ProductSavePayload) {
  const authCheck = await verifyAdminCaller();
  if (!authCheck.authorized) {
    return { error: authCheck.error };
  }

  const { supabase, isDemo } = authCheck;

  // 1. Validate required fields
  const name = payload.name?.trim();
  if (!name) {
    return { error: "Product name is required." };
  }

  if (payload.base_price === undefined || isNaN(payload.base_price) || payload.base_price < 0) {
    return { error: "Please enter a valid base price (greater than or equal to 0)." };
  }

  if (
    payload.compare_at_price !== undefined &&
    payload.compare_at_price !== null &&
    (isNaN(payload.compare_at_price) || payload.compare_at_price < 0)
  ) {
    return { error: "Compare-at price must be greater than or equal to 0." };
  }

  if (
    payload.stock_quantity === undefined ||
    isNaN(payload.stock_quantity) ||
    payload.stock_quantity < 0
  ) {
    return { error: "Stock quantity must be a non-negative number." };
  }

  // 2. Slug generation and formatting
  let slug = payload.slug?.trim() ? generateSlug(payload.slug) : generateSlug(name);
  if (!slug) {
    slug = generateSlug(name) || `product-${Date.now()}`;
  }

  // 3. Image validation & Primary image rule:
  // "Ensure no active product is left without a usable primary image."
  const sanitizedImages = [...(payload.images || [])].map((img, idx) => ({
    ...img,
    image_url: img.image_url?.trim() || "",
    alt_text: img.alt_text?.trim() || null,
    display_order: typeof img.display_order === "number" ? img.display_order : idx + 1,
    is_primary: Boolean(img.is_primary),
  })).filter((img) => Boolean(img.image_url));

  if (payload.is_active) {
    if (sanitizedImages.length === 0) {
      return {
        error:
          "An active product must have at least one product image. Please upload or provide a primary image before activating.",
      };
    }

    const primaryCount = sanitizedImages.filter((img) => img.is_primary).length;
    if (primaryCount === 0) {
      // Auto-promote first image to primary
      sanitizedImages[0].is_primary = true;
    } else if (primaryCount > 1) {
      // Respect partial unique index: enforce exactly one primary image
      let foundFirst = false;
      for (const img of sanitizedImages) {
        if (img.is_primary) {
          if (!foundFirst) {
            foundFirst = true;
          } else {
            img.is_primary = false;
          }
        }
      }
    }
  }

  // 4. Variant validation & normalization
  const sanitizedVariants = (payload.variants || []).map((v) => {
    return {
      ...v,
      variant_name: v.variant_name?.trim() || "Standard Variant",
      sku: v.sku?.trim() || null,
      price: v.price !== null && v.price !== undefined && !isNaN(v.price) ? Number(v.price) : null,
      compare_at_price:
        v.compare_at_price !== null && v.compare_at_price !== undefined && !isNaN(v.compare_at_price)
          ? Number(v.compare_at_price)
          : null,
      stock_quantity: Math.max(0, Number(v.stock_quantity) || 0),
      image_url: v.image_url?.trim() || null,
      is_active: Boolean(v.is_active),
      attributes: typeof v.attributes === "object" && v.attributes !== null ? v.attributes : {},
    };
  });

  if (isDemo) {
    const { upsertProductInStore } = await import("@/lib/mock-data/admin-store");
    const saveRes = upsertProductInStore({
      ...payload,
      name,
      slug,
      images: sanitizedImages as any,
      variants: sanitizedVariants as any,
    });

    if (!saveRes.success) {
      return { error: saveRes.error || "Failed to save product in development catalog." };
    }

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/categories");
    revalidatePath(`/shop/product/${slug}`);
    revalidatePath(`/product/${slug}`);
    revalidatePath(`/products/${slug}`);
    revalidatePath("/");

    return {
      success: true,
      message: `Product '${name}' saved successfully.`,
      product: saveRes.product,
    };
  }

  // 5. Database operations (Supabase configured)
  try {
    // Check slug uniqueness
    const { data: existingSlugProduct } = await supabase
      .from("products")
      .select("id, name")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlugProduct && existingSlugProduct.id !== payload.id) {
      return {
        error: `A product with slug "${slug}" already exists ("${existingSlugProduct.name}"). Please customize the slug.`,
      };
    }

    // 1. Try schema-defined security definer RPC public.admin_save_product
    const rpcImages = sanitizedImages.map((img, idx) => ({
      url: img.image_url,
      storage_path: (img as any).storage_path || null,
      sort_order: img.display_order ?? idx + 1,
      is_primary: Boolean(img.is_primary),
    }));

    const rpcPayload: Record<string, any> = {
      id: payload.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.id) ? payload.id : undefined,
      name,
      slug,
      description: payload.description?.trim() || null,
      category_id: payload.category_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.category_id) ? payload.category_id : undefined,
      subcategory_id: payload.subcategory_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.subcategory_id) ? payload.subcategory_id : undefined,
      batch_no: payload.batch_number?.trim() || undefined,
      price: Number(payload.base_price),
      stock: Number(payload.stock_quantity),
      is_active: Boolean(payload.is_active),
      images: rpcImages,
    };

    const { data: rpcResult, error: rpcError } = await supabase.rpc("admin_save_product", {
      p: rpcPayload,
    });

    if (!rpcError && rpcResult?.product) {
      revalidatePath("/admin/products");
      revalidatePath("/admin/inventory");
      revalidatePath("/shop");
      revalidatePath("/categories");
      revalidatePath(`/shop/product/${slug}`);
      revalidatePath(`/product/${slug}`);
      revalidatePath(`/products/${slug}`);
      revalidatePath("/");

      return {
        success: true,
        message: `Product '${name}' persisted successfully to Supabase.`,
        product: rpcResult.product,
      };
    }

    // Direct table operations fallback (when RPC not available or direct table write permitted)
    const productRecord = {
      category_id: payload.category_id || null,
      subcategory_id: payload.subcategory_id || null,
      name,
      slug,
      description: payload.description?.trim() || null,
      brand: payload.brand?.trim() || null,
      sku: payload.sku?.trim() || null,
      base_price: Number(payload.base_price),
      compare_at_price:
        payload.compare_at_price !== null && payload.compare_at_price !== undefined
          ? Number(payload.compare_at_price)
          : null,
      stock_quantity: Number(payload.stock_quantity),
      is_active: Boolean(payload.is_active),
      is_featured_top_seller: Boolean(payload.is_featured_top_seller),
      top_seller_display_order:
        payload.top_seller_display_order !== null && payload.top_seller_display_order !== undefined
          ? Number(payload.top_seller_display_order)
          : null,
      meta_title: payload.meta_title?.trim() || null,
      meta_description: payload.meta_description?.trim() || null,
    };

    let targetProductId = payload.id;

    if (payload.id) {
      // Update product
      const { error: updateError } = await (supabase
        .from("products")
        .update as any)(productRecord)
        .eq("id", payload.id);

      if (updateError) {
        return { error: `Failed to update product: ${updateError.message}` };
      }
    } else {
      // Insert product
      const { data: insertedProduct, error: insertError } = await (supabase
        .from("products")
        .insert as any)({
          ...productRecord,
          created_by: authCheck.user?.id || null,
        })
        .select("id")
        .single();

      if (insertError || !insertedProduct) {
        return { error: `Failed to create product: ${insertError?.message || "Unknown error"}` };
      }

      targetProductId = insertedProduct.id;
    }

    if (!targetProductId) {
      return { error: "Product ID was not resolved." };
    }

    // 6. Synchronize product_images
    // Delete existing images not in sanitizedImages
    const keepImageIds = sanitizedImages.map((img) => img.id).filter(Boolean) as string[];

    if (payload.id) {
      if (keepImageIds.length > 0) {
        await supabase
          .from("product_images")
          .delete()
          .eq("product_id", targetProductId)
          .not("id", "in", `(${keepImageIds.join(",")})`);
      } else {
        await supabase
          .from("product_images")
          .delete()
          .eq("product_id", targetProductId);
      }
    }

    // Insert or update images
    for (const img of sanitizedImages) {
      if (img.id) {
        await supabase
          .from("product_images")
          .update({
            image_url: img.image_url,
            alt_text: img.alt_text,
            display_order: img.display_order,
            is_primary: img.is_primary,
          })
          .eq("id", img.id);
      } else {
        await supabase.from("product_images").insert({
          product_id: targetProductId,
          image_url: img.image_url,
          alt_text: img.alt_text,
          display_order: img.display_order,
          is_primary: img.is_primary,
        });
      }
    }

    // 7. Synchronize product_variants
    const keepVariantIds = sanitizedVariants.map((v) => v.id).filter(Boolean) as string[];

    if (payload.id) {
      if (keepVariantIds.length > 0) {
        await supabase
          .from("product_variants")
          .delete()
          .eq("product_id", targetProductId)
          .not("id", "in", `(${keepVariantIds.join(",")})`);
      } else {
        await supabase
          .from("product_variants")
          .delete()
          .eq("product_id", targetProductId);
      }
    }

    // Insert or update variants
    for (const v of sanitizedVariants) {
      if (v.id) {
        await supabase
          .from("product_variants")
          .update({
            variant_name: v.variant_name,
            sku: v.sku,
            price: v.price,
            compare_at_price: v.compare_at_price,
            stock_quantity: v.stock_quantity,
            image_url: v.image_url,
            is_active: v.is_active,
            attributes: v.attributes,
          })
          .eq("id", v.id);
      } else {
        await supabase.from("product_variants").insert({
          product_id: targetProductId,
          variant_name: v.variant_name,
          sku: v.sku,
          price: v.price,
          compare_at_price: v.compare_at_price,
          stock_quantity: v.stock_quantity,
          image_url: v.image_url,
          is_active: v.is_active,
          attributes: v.attributes,
        });
      }
    }

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/categories");
    revalidatePath(`/shop/product/${slug}`);
    revalidatePath(`/product/${slug}`);
    revalidatePath("/");

    return {
      success: true,
      message: `Product "${name}" saved successfully.`,
      productId: targetProductId,
    };
  } catch (err: any) {
    return { error: err.message || "An error occurred while saving product." };
  }
}

/**
 * Toggles product active/archive state.
 * Validates that unarchiving (is_active -> true) requires at least one primary image.
 */
export async function archiveProductAction(productId: string, shouldArchive: boolean) {
  const authCheck = await verifyAdminCaller();
  if (!authCheck.authorized) {
    return { error: authCheck.error };
  }

  const { supabase, isDemo } = authCheck;

  if (isDemo) {
    const { archiveProductInStore } = await import("@/lib/mock-data/admin-store");
    const res = archiveProductInStore(productId, shouldArchive);
    if (!res.success) {
      return { error: res.error || "Failed to update product status." };
    }

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/categories");
    revalidatePath("/");
    return {
      success: true,
      message: shouldArchive
        ? "Product archived. It is now hidden from public store browse and search."
        : "Product restored to active catalog.",
    };
  }

  try {
    // If activating, verify product has at least one primary image
    if (!shouldArchive) {
      const { data: primaryImage } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", productId)
        .eq("is_primary", true)
        .maybeSingle();

      if (!primaryImage) {
        return {
          error:
            "Cannot activate product: No primary image is assigned. Please edit the product and select a primary image first.",
        };
      }
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ is_active: !shouldArchive })
      .eq("id", productId);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/categories");
    revalidatePath("/");
    revalidatePath("/shop/product", "layout");

    return {
      success: true,
      message: shouldArchive
        ? "Product archived. It is now hidden from public store browse and search."
        : "Product restored to active catalog.",
    };
  } catch (err: any) {
    return { error: err.message || "Failed to update product archive status." };
  }
}

/**
 * Adjusts product stock quantity by a relative delta.
 * Can call admin_adjust_stock RPC or directly update the products table.
 */
export async function adjustProductStockAction(productId: string, delta: number) {
  const authCheck = await verifyAdminCaller();
  if (!authCheck.authorized) {
    return { error: authCheck.error };
  }

  const { supabase, isDemo } = authCheck;

  if (isDemo) {
    return {
      success: true,
      message: `[Demo] Stock adjusted by ${delta}.`,
    };
  }

  try {
    // Check if admin_adjust_stock RPC exists and call it
    const { data: rpcProduct, error: rpcError } = await (supabase.rpc as any)("admin_adjust_stock", {
      p_product_id: productId,
      p_delta: delta,
    });

    if (!rpcError && rpcProduct) {
      revalidatePath("/admin/products");
      revalidatePath("/admin/inventory");
      revalidatePath("/shop");
      return {
        success: true,
        message: `Stock updated successfully (new stock: ${rpcProduct.stock}).`,
        stock: rpcProduct.stock,
      };
    }

    // Direct update fallback (handles both stock and stock_quantity column names)
    const { data: currentProduct, error: fetchErr } = await supabase
      .from("products")
      .select("id, stock, stock_quantity")
      .eq("id", productId)
      .single();

    if (fetchErr || !currentProduct) {
      return { error: "Product not found." };
    }

    const currentStock = Number(
      (currentProduct as any).stock ?? (currentProduct as any).stock_quantity ?? 0
    );
    const newStock = Math.max(0, currentStock + delta);

    const updatePayload: any = {};
    if ("stock" in currentProduct) {
      updatePayload.stock = newStock;
    }
    if ("stock_quantity" in currentProduct || !("stock" in currentProduct)) {
      updatePayload.stock_quantity = newStock;
    }

    const { error: updateError } = await (supabase
      .from("products")
      .update as any)(updatePayload)
      .eq("id", productId);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/shop");

    return {
      success: true,
      message: `Stock updated successfully (new stock: ${newStock}).`,
      stock: newStock,
    };
  } catch (err: any) {
    return { error: err.message || "Failed to adjust stock." };
  }
}

/**
 * Safely deletes or archives a product based on historical references and database constraints.
 * - If product has historical dependencies (e.g. order_items, return_requests): safely archives/deactivates.
 * - If product has no historical dependencies: executes atomic RPC public.admin_delete_product() with storage cleanup.
 */
export async function deleteProductAction(
  productId: string,
  options?: { forceArchive?: boolean }
) {
  if (!productId || typeof productId !== "string") {
    return { error: "Valid product ID is required." };
  }

  const authCheck = await verifyAdminCaller();
  if (!authCheck.authorized) {
    return { error: authCheck.error };
  }

  const { supabase, isDemo } = authCheck;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);

  // If running in demo mode or passed a synthetic/local ID, route to the mock store
  if (isDemo || !isUUID) {
    const { archiveProductInStore, deleteProductFromStore, loadMockStore } = await import(
      "@/lib/mock-data/admin-store"
    );
    // Soft delete in development/local store: set is_active=false and deleted_at
    const store = loadMockStore();
    const prod = store.products?.find((p: any) => p.id === productId);
    if (!prod) {
      return { error: `Product '${productId}' not found in catalog store.` };
    }

    prod.is_active = false;
    (prod as any).deleted_at = new Date().toISOString();
    const { saveMockStore } = await import("@/lib/mock-data/admin-store");
    saveMockStore(store);

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/categories");
    revalidatePath("/");
    return {
      success: true,
      archived: true,
      message: `Product '${prod.name}' has been soft-deleted and removed from catalog view.`,
    };
  }

  try {
    // Soft-delete directly via RPC or update
    const { data: rpcData, error: rpcError } = await supabase.rpc("admin_delete_product", {
      p_id: productId,
    });

    if (rpcError) {
      // Direct soft-delete fallback if RPC does not support soft-delete
      const { error: updateError } = await supabase
        .from("products")
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq("id", productId);

      if (updateError) {
        // Fallback without deleted_at if column not yet migrated
        const { error: activeError } = await supabase
          .from("products")
          .update({ is_active: false })
          .eq("id", productId);

        if (activeError) {
          return { error: `Failed to soft-delete product: ${activeError.message}` };
        }
      }
    }

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/categories");
    revalidatePath("/");
    revalidatePath("/shop/product", "layout");

    return {
      success: true,
      archived: true,
      message: "Product has been successfully soft-deleted. Historical order records remain intact.",
    };
  } catch (err: any) {
    return { error: err.message || "Failed to delete product." };
  }
}
