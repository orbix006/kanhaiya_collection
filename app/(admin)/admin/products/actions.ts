"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/data/categories";

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
  name: string;
  slug?: string;
  description?: string | null;
  brand?: string | null;
  sku?: string | null;
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

  if (profileError || !profile || profile.role !== "admin") {
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
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath(`/shop/product/${slug}`);
    revalidatePath(`/product/${slug}`);
    revalidatePath("/");

    return {
      success: true,
      message: `[Demo Mode] Product '${name}' saved successfully.`,
      product: {
        id: payload.id || `demo-prod-${Date.now()}`,
        ...payload,
        name,
        slug,
        images: sanitizedImages,
        variants: sanitizedVariants,
      },
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

    // Prepare product payload matching schema columns exactly
    const productRecord = {
      category_id: payload.category_id || null,
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
      const { error: updateError } = await supabase
        .from("products")
        .update(productRecord)
        .eq("id", payload.id);

      if (updateError) {
        return { error: `Failed to update product: ${updateError.message}` };
      }
    } else {
      // Insert product
      const { data: insertedProduct, error: insertError } = await supabase
        .from("products")
        .insert({
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
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/");
    return {
      success: true,
      message: `[Demo Mode] Product status changed to ${shouldArchive ? "Archived" : "Active"}.`,
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
    revalidatePath("/");

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
 * Permanently deletes a product and all cascading images and variants.
 */
export async function deleteProductAction(productId: string) {
  const authCheck = await verifyAdminCaller();
  if (!authCheck.authorized) {
    return { error: authCheck.error };
  }

  const { supabase, isDemo } = authCheck;

  if (isDemo) {
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/");
    return {
      success: true,
      message: "[Demo Mode] Product deleted successfully.",
    };
  }

  try {
    const { error } = await supabase.from("products").delete().eq("id", productId);

    if (error) {
      return { error: `Failed to delete product: ${error.message}` };
    }

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/");

    return {
      success: true,
      message: "Product permanently removed from store catalog.",
    };
  } catch (err: any) {
    return { error: err.message || "Failed to delete product." };
  }
}
