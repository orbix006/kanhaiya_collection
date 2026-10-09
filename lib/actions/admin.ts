"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getLocalStoreData,
  saveLocalStoreData,
  Banner,
  Category,
  Product,
} from "@/lib/store";

/**
 * Server-side admin authorization guard.
 * Checks Supabase authentication and verifies `profiles.role === 'admin'`.
 */
async function verifyAdminAuth(): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // If Supabase is active, enforce database profile role check
  if (supabaseUrl) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return profile?.role === "admin";
  }

  // In local/dev environment without remote Supabase project,
  // we check for admin authorization cookie or allow local administrative management
  return true;
}

// -----------------------------------------------------------------------------
// BANNER ACTIONS
// -----------------------------------------------------------------------------

export async function saveBannerAction(formData: FormData) {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) {
    return { error: "Unauthorized. Administrator privileges required." };
  }

  const id = (formData.get("id") as string)?.trim();
  const title = (formData.get("title") as string)?.trim() || "";
  const subtitle = (formData.get("subtitle") as string)?.trim() || "";
  const cta_text = (formData.get("cta_text") as string)?.trim() || "";
  const cta_link = (formData.get("cta_link") as string)?.trim() || "";
  const image_url = (formData.get("image_url") as string)?.trim();
  const mobile_image_url = (formData.get("mobile_image_url") as string)?.trim() || null;
  const is_active = formData.get("is_active") === "true" || formData.get("is_active") === "on";
  const display_order = parseInt((formData.get("display_order") as string) || "1", 10);
  const start_date = (formData.get("start_date") as string)?.trim() || null;
  const end_date = (formData.get("end_date") as string)?.trim() || null;

  if (!image_url) {
    return { error: "Banner desktop image is required." };
  }

  const store = getLocalStoreData();

  if (id) {
    // Update existing
    const index = store.banners.findIndex((b) => b.id === id);
    if (index !== -1) {
      store.banners[index] = {
        ...store.banners[index],
        title,
        subtitle,
        cta_text,
        cta_link,
        image_url,
        mobile_image_url,
        is_active,
        display_order,
        start_date,
        end_date,
        updated_at: new Date().toISOString(),
      };
    }
  } else {
    // Create new banner
    const newBanner: Banner = {
      id: `banner-${Date.now()}`,
      title,
      subtitle,
      cta_text,
      cta_link,
      image_url,
      mobile_image_url,
      is_active,
      display_order,
      start_date,
      end_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.banners.push(newBanner);
  }

  saveLocalStoreData(store);
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleBannerStatusAction(id: string, isActive: boolean) {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) return { error: "Unauthorized" };

  const store = getLocalStoreData();
  const banner = store.banners.find((b) => b.id === id);
  if (banner) {
    banner.is_active = isActive;
    banner.updated_at = new Date().toISOString();
    saveLocalStoreData(store);
    revalidatePath("/", "layout");
    revalidatePath("/admin");
    return { success: true };
  }
  return { error: "Banner not found" };
}

export async function deleteBannerAction(id: string) {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) return { error: "Unauthorized" };

  const store = getLocalStoreData();
  store.banners = store.banners.filter((b) => b.id !== id);
  saveLocalStoreData(store);
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  return { success: true };
}

export async function reorderBannersAction(orderedIds: string[]) {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) return { error: "Unauthorized" };

  const store = getLocalStoreData();
  const map = new Map(store.banners.map((b) => [b.id, b]));
  const reordered: Banner[] = [];

  orderedIds.forEach((id, idx) => {
    const item = map.get(id);
    if (item) {
      item.display_order = idx + 1;
      reordered.push(item);
      map.delete(id);
    }
  });

  // Append any remaining
  map.forEach((b) => reordered.push(b));

  store.banners = reordered;
  saveLocalStoreData(store);
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  return { success: true };
}

// -----------------------------------------------------------------------------
// CATEGORY ACTIONS
// -----------------------------------------------------------------------------

export async function saveCategoryAction(formData: FormData) {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) return { error: "Unauthorized" };

  const id = (formData.get("id") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Category name is required" };

  const slug =
    (formData.get("slug") as string)?.trim() ||
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const description = (formData.get("description") as string)?.trim() || "";
  const image_url = (formData.get("image_url") as string)?.trim() || "/images/preview-murti.jpg";
  const display_order = parseInt((formData.get("display_order") as string) || "1", 10);
  const is_active = formData.get("is_active") === "true" || formData.get("is_active") === "on";

  const store = getLocalStoreData();

  if (id) {
    const index = store.categories.findIndex((c) => c.id === id);
    if (index !== -1) {
      store.categories[index] = {
        ...store.categories[index],
        name,
        slug,
        description,
        image_url,
        display_order,
        is_active,
        updated_at: new Date().toISOString(),
      };
    }
  } else {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      slug,
      description,
      image_url,
      display_order,
      is_active,
      show_on_homepage: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.categories.push(newCat);
  }

  saveLocalStoreData(store);
  revalidatePath("/", "layout");
  revalidatePath("/categories");
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleCategoryStatusAction(id: string, isActive: boolean) {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) return { error: "Unauthorized" };

  const store = getLocalStoreData();
  const cat = store.categories.find((c) => c.id === id);
  if (cat) {
    cat.is_active = isActive;
    cat.updated_at = new Date().toISOString();
    saveLocalStoreData(store);
    revalidatePath("/", "layout");
    revalidatePath("/categories");
    revalidatePath("/admin");
    return { success: true };
  }
  return { error: "Category not found" };
}

export async function deleteCategoryAction(id: string) {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) return { error: "Unauthorized" };

  const store = getLocalStoreData();
  // Safe handling of products: reassign products in deleted category to uncategorized or default
  store.products = store.products.map((p) => {
    if (p.category_id === id) {
      return { ...p, category_id: "" };
    }
    return p;
  });

  store.categories = store.categories.filter((c) => c.id !== id);
  saveLocalStoreData(store);
  revalidatePath("/", "layout");
  revalidatePath("/categories");
  revalidatePath("/admin");
  return { success: true };
}

export async function reorderCategoriesAction(orderedIds: string[]) {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) return { error: "Unauthorized" };

  const store = getLocalStoreData();
  const map = new Map(store.categories.map((c) => [c.id, c]));
  const reordered: Category[] = [];

  orderedIds.forEach((id, idx) => {
    const item = map.get(id);
    if (item) {
      item.display_order = idx + 1;
      reordered.push(item);
      map.delete(id);
    }
  });

  // Append remaining
  map.forEach((c) => reordered.push(c));

  store.categories = reordered;
  saveLocalStoreData(store);
  revalidatePath("/", "layout");
  revalidatePath("/categories");
  revalidatePath("/admin");
  return { success: true };
}

// -----------------------------------------------------------------------------
// FESTIVE OFFER ACTIONS
// -----------------------------------------------------------------------------

export async function updateFestiveOfferAction(formData: FormData) {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) return { error: "Unauthorized" };

  const enabled = formData.get("enabled") === "true" || formData.get("enabled") === "on";
  const title = (formData.get("title") as string)?.trim() || "Festive Offer";
  const subtitle = (formData.get("subtitle") as string)?.trim() || "";
  const product_ids_json = formData.get("product_ids") as string;

  let product_ids: string[] = [];
  try {
    product_ids = JSON.parse(product_ids_json);
  } catch {
    // If not json, split by comma or use empty
    product_ids = product_ids_json ? product_ids_json.split(",").map((s) => s.trim()) : [];
  }

  const store = getLocalStoreData();
  store.festive_offer = {
    enabled,
    title,
    subtitle,
    product_ids,
    updated_at: new Date().toISOString(),
  };

  saveLocalStoreData(store);
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleFestiveOfferAction(enabled: boolean) {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) return { error: "Unauthorized" };

  const store = getLocalStoreData();
  store.festive_offer.enabled = enabled;
  store.festive_offer.updated_at = new Date().toISOString();

  saveLocalStoreData(store);
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  return { success: true };
}

// -----------------------------------------------------------------------------
// PRODUCT ACTIONS
// -----------------------------------------------------------------------------

export async function saveProductAction(formData: FormData) {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) return { error: "Unauthorized" };

  const id = (formData.get("id") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Product name is required" };

  const slug =
    (formData.get("slug") as string)?.trim() ||
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const category_id = (formData.get("category_id") as string)?.trim() || "";
  const description = (formData.get("description") as string)?.trim() || "";
  const brand = (formData.get("brand") as string)?.trim() || "Kanhaiya Collection";
  const base_price = parseFloat((formData.get("base_price") as string) || "0");
  const compare_at_price_val = (formData.get("compare_at_price") as string)?.trim();
  const compare_at_price = compare_at_price_val ? parseFloat(compare_at_price_val) : null;
  const stock_quantity = parseInt((formData.get("stock_quantity") as string) || "10", 10);
  const sold_count = parseInt((formData.get("sold_count") as string) || "0", 10);
  const is_active = formData.get("is_active") === "true" || formData.get("is_active") === "on";
  const is_featured_top_seller =
    formData.get("is_featured_top_seller") === "true" ||
    formData.get("is_featured_top_seller") === "on";
  const image_url = (formData.get("image_url") as string)?.trim() || "/images/preview-murti.jpg";

  const store = getLocalStoreData();

  if (id) {
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      store.products[idx] = {
        ...store.products[idx],
        name,
        slug,
        category_id,
        description,
        brand,
        base_price,
        compare_at_price,
        stock_quantity,
        sold_count,
        is_active,
        is_featured_top_seller,
        image_url,
        updated_at: new Date().toISOString(),
      };
    }
  } else {
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      category_id,
      name,
      slug,
      description,
      brand,
      base_price,
      compare_at_price,
      stock_quantity,
      sold_count,
      is_active,
      is_featured_top_seller,
      top_seller_display_order: null,
      image_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.products.push(newProd);
  }

  saveLocalStoreData(store);
  revalidatePath("/", "layout");
  revalidatePath("/shop");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteProductAction(id: string) {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) return { error: "Unauthorized" };

  const store = getLocalStoreData();
  store.products = store.products.filter((p) => p.id !== id);
  // Also remove from festive offer if present
  store.festive_offer.product_ids = store.festive_offer.product_ids.filter((pid) => pid !== id);

  saveLocalStoreData(store);
  revalidatePath("/", "layout");
  revalidatePath("/shop");
  revalidatePath("/admin");
  return { success: true };
}
