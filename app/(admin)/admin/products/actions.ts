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
import { generateSlug, resolveUniqueProductSlug } from "@/lib/data/categories";
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
  sub_subcategory_id?: string | null;
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

    const finalSlug = saveRes.product?.slug || slug;
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/categories");
    revalidatePath(`/shop/product/${finalSlug}`);
    revalidatePath(`/product/${finalSlug}`);
    revalidatePath(`/products/${finalSlug}`);
    revalidatePath("/");
    revalidatePath("/", "layout");

    return {
      success: true,
      message: `Product '${name}' saved successfully.`,
      product: saveRes.product,
    };
  }

  // 5. Database operations (Supabase configured)
  try {
    // Check slug uniqueness and resolve unique suffix if collision exists
    const { data: matchingSlugProducts } = await supabase
      .from("products")
      .select("id, slug")
      .or(`slug.eq.${slug},slug.like.${slug}-%`);

    if (matchingSlugProducts && matchingSlugProducts.length > 0) {
      slug = resolveUniqueProductSlug(slug, payload.id, matchingSlugProducts);
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
      sub_subcategory_id: payload.sub_subcategory_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.sub_subcategory_id) ? payload.sub_subcategory_id : undefined,
      batch_no: payload.batch_number?.trim() || undefined,
      price: Number(payload.base_price),
      stock: Number(payload.stock_quantity),
      is_active: Boolean(payload.is_active),
      images: rpcImages,
    };

    const { data: rpcResult, error: rpcError } = await supabase.rpc("admin_save_product", {
      p: rpcPayload,
    });

    if (rpcError) {
      console.warn("[saveProductAction] RPC admin_save_product warning:", rpcError.message);
    } else if (rpcResult?.product) {
      revalidatePath("/admin/products");
      revalidatePath("/admin/inventory");
      revalidatePath("/shop");
      revalidatePath("/categories");
      revalidatePath(`/shop/product/${slug}`);
      revalidatePath(`/product/${slug}`);
      revalidatePath(`/products/${slug}`);
      revalidatePath("/");
      revalidatePath("/", "layout");

      const resProd = rpcResult.product;
      const normalizedRpcProduct = {
        ...resProd,
        brand: payload.brand || "Kanhaiya Collection",
        base_price: Number(resProd.base_price ?? resProd.price ?? payload.base_price),
        stock_quantity: Number(resProd.stock_quantity ?? resProd.stock ?? payload.stock_quantity),
        image_url:
          resProd.image_url ||
          sanitizedImages.find((i) => i.is_primary)?.image_url ||
          sanitizedImages[0]?.image_url ||
          null,
      };

      return {
        success: true,
        message: `Product '${name}' persisted successfully to Supabase.`,
        product: normalizedRpcProduct,
      };
    }

    // Direct table operations fallback (when RPC not available or direct table write permitted)
    const isValidUUID = (val: string | null | undefined): boolean =>
      Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()));

    const safeCategoryId = isValidUUID(payload.category_id) ? payload.category_id : null;
    const safeSubcategoryId = isValidUUID(payload.subcategory_id) ? payload.subcategory_id : null;
    const safeSubSubcategoryId = isValidUUID(payload.sub_subcategory_id) ? payload.sub_subcategory_id : null;

    // Build database-aligned record strictly matching public.products schema
    // Schema columns: name, slug, description, category_id, subcategory_id, sub_subcategory_id, sku, price, stock, is_active, batch_no
    const productRecord: Record<string, any> = {
      name,
      slug,
      description: payload.description?.trim() || null,
      category_id: safeCategoryId,
      price: Number(payload.base_price),
      stock: Number(payload.stock_quantity),
      is_active: Boolean(payload.is_active),
    };

    if (safeSubcategoryId) {
      productRecord.subcategory_id = safeSubcategoryId;
    }
    if (safeSubSubcategoryId) {
      productRecord.sub_subcategory_id = safeSubSubcategoryId;
    }
    if (payload.sku?.trim()) {
      productRecord.sku = payload.sku.trim();
    }
    if (payload.batch_number?.trim()) {
      productRecord.batch_no = payload.batch_number.trim();
    }

    let targetProductId = payload.id;

    if (payload.id) {
      // Update product
      let { error: updateError } = await (supabase
        .from("products")
        .update as any)(productRecord)
        .eq("id", payload.id);

      if (updateError) {
        let retryNeeded = false;
        const msg = updateError.message || "";
        if (msg.includes("batch_no") && productRecord.batch_no) {
          delete productRecord.batch_no;
          retryNeeded = true;
        }
        if (msg.includes("sub_subcategory_id") && productRecord.sub_subcategory_id) {
          delete productRecord.sub_subcategory_id;
          retryNeeded = true;
        }
        if (msg.includes("subcategory_id") && productRecord.subcategory_id) {
          delete productRecord.subcategory_id;
          retryNeeded = true;
        }
        if (retryNeeded) {
          const retry = await (supabase.from("products").update as any)(productRecord).eq("id", payload.id);
          updateError = retry.error;
        }
      }

      if (updateError) {
        return { error: `Failed to update product: ${updateError.message}` };
      }
    } else {
      // Insert product
      const insertRecord: Record<string, any> = { ...productRecord };
      if (authCheck.user?.id) {
        insertRecord.created_by = authCheck.user.id;
      }

      let insertResult = await (supabase
        .from("products")
        .insert as any)(insertRecord)
        .select("id")
        .single();

      if (insertResult.error) {
        let retryNeeded = false;
        const msg = insertResult.error.message || "";
        if (msg.includes("created_by") && "created_by" in insertRecord) {
          delete insertRecord.created_by;
          retryNeeded = true;
        }
        if (msg.includes("batch_no") && insertRecord.batch_no) {
          delete insertRecord.batch_no;
          retryNeeded = true;
        }
        if (msg.includes("sub_subcategory_id") && insertRecord.sub_subcategory_id) {
          delete insertRecord.sub_subcategory_id;
          retryNeeded = true;
        }
        if (msg.includes("subcategory_id") && insertRecord.subcategory_id) {
          delete insertRecord.subcategory_id;
          retryNeeded = true;
        }
        if (retryNeeded) {
          insertResult = await (supabase
            .from("products")
            .insert as any)(insertRecord)
            .select("id")
            .single();
        }
      }

      if (insertResult.error || !insertResult.data) {
        return { error: `Failed to create product: ${insertResult.error?.message || "Unknown error"}` };
      }

      targetProductId = insertResult.data.id;
    }

    if (!targetProductId) {
      return { error: "Product ID was not resolved." };
    }

    // 6. Synchronize product_images matching public.product_images schema (url, storage_path, sort_order, is_primary)
    const keepImageIds = sanitizedImages.map((img) => img.id).filter(Boolean) as string[];

    if (payload.id) {
      try {
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
      } catch (delErr) {
        console.warn("[saveProductAction] image delete warning:", delErr);
      }
    }

    // Insert or update images using exact schema columns: url, sort_order, is_primary, storage_path
    for (const img of sanitizedImages) {
      const imgRecord: Record<string, any> = {
        product_id: targetProductId,
        url: img.image_url,
        sort_order: img.display_order,
        is_primary: Boolean(img.is_primary),
      };
      if ((img as any).storage_path) {
        imgRecord.storage_path = (img as any).storage_path;
      }

      try {
        if (img.id && isValidUUID(img.id)) {
          const { error: imgErr } = await supabase
            .from("product_images")
            .update(imgRecord)
            .eq("id", img.id);
          if (imgErr) {
            await supabase.from("product_images").insert(imgRecord);
          }
        } else {
          await supabase.from("product_images").insert(imgRecord);
        }
      } catch (imgErr) {
        console.warn("[saveProductAction] image write warning:", imgErr);
      }
    }

    // 7. Synchronize product_variants (safe execution if table exists, otherwise non-fatal)
    if (sanitizedVariants.length > 0) {
      try {
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

        for (const v of sanitizedVariants) {
          if (v.id && isValidUUID(v.id)) {
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
      } catch (variantErr) {
        console.warn("[saveProductAction] product_variants table omitted or error:", variantErr);
      }
    }

    // Always mirror to mock/local store to keep catalog in sync across rendering contexts
    try {
      const { upsertProductInStore } = await import("@/lib/mock-data/admin-store");
      upsertProductInStore({
        ...payload,
        id: targetProductId,
        name,
        slug,
        images: sanitizedImages as any,
        variants: sanitizedVariants as any,
      });
    } catch { }

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/categories");
    revalidatePath(`/shop/product/${slug}`);
    revalidatePath(`/product/${slug}`);
    revalidatePath(`/products/${slug}`);
    revalidatePath("/");
    revalidatePath("/", "layout");

    const primaryImgUrl =
      sanitizedImages.find((i) => i.is_primary)?.image_url ||
      sanitizedImages[0]?.image_url ||
      null;

    return {
      success: true,
      message: `Product "${name}" saved successfully.`,
      productId: targetProductId,
      product: {
        ...payload,
        id: targetProductId,
        name,
        slug,
        brand: payload.brand || "Kanhaiya Collection",
        base_price: Number(payload.base_price),
        stock_quantity: Number(payload.stock_quantity),
        image_url: primaryImgUrl,
        images: sanitizedImages,
        variants: sanitizedVariants,
      },
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
 * Permanently deletes a product and its associated media from the catalog and database.
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
    const { deleteProductFromStore } = await import("@/lib/mock-data/admin-store");
    const delRes = deleteProductFromStore(productId);
    if (!delRes.success) {
      return { error: delRes.error || `Product '${productId}' not found in catalog store.` };
    }

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/categories");
    revalidatePath("/");
    revalidatePath("/", "layout");
    return {
      success: true,
      deleted: true,
      message: `Product has been permanently deleted from catalog.`,
    };
  }

  try {
    // 1. Try atomic RPC public.admin_delete_product()
    const { data: rpcData, error: rpcError } = await supabase.rpc("admin_delete_product", {
      p_id: productId,
    });

    if (rpcError) {
      // Direct table delete fallback:
      // First delete associated product_images
      await supabase
        .from("product_images")
        .delete()
        .eq("product_id", productId);

      // Delete the product record permanently
      const { error: delError } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (delError) {
        return { error: `Failed to delete product: ${delError.message}` };
      }
    }

    // Also remove from local/mock store so state stays synchronized
    try {
      const { deleteProductFromStore } = await import("@/lib/mock-data/admin-store");
      deleteProductFromStore(productId);
    } catch { }

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/categories");
    revalidatePath("/");
    revalidatePath("/shop/product", "layout");
    revalidatePath("/", "layout");

    return {
      success: true,
      deleted: true,
      message: "Product has been permanently deleted from database and store catalog.",
    };
  } catch (err: any) {
    return { error: err.message || "Failed to delete product." };
  }
}
