"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminCaller } from "@/lib/auth/admin";
import {
  generateSlug,
  isSafeParent,
  getDescendantCategoryIds,
} from "@/lib/data/categories";
import type { Category } from "@/lib/data/homepage";

export interface CategoryPayload {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  parent_id?: string | null;
  image_url?: string | null;
  display_order: number;
  is_active: boolean;
  show_on_homepage: boolean;
}

export async function saveCategoryAction(payload: CategoryPayload) {
  const name = payload.name?.trim();
  if (!name) {
    return { error: "Category name is required." };
  }

  // Ensure slug is formatted; auto-generate from name if omitted
  let slug = payload.slug?.trim() ? generateSlug(payload.slug) : generateSlug(name);
  if (!slug) {
    slug = generateSlug(name) || "category";
  }

  const parentId = payload.parent_id || null;

  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  const supabase = auth.supabase;
  const isConfigured = !auth.isDemo;

  if (!isConfigured) {
    // In local development / unseeded mode, simulate validation
    if (payload.id && parentId === payload.id) {
      return { error: "A category cannot be its own parent." };
    }
    revalidatePath("/admin/categories");
    revalidatePath("/shop");
    revalidatePath("/");
    return {
      success: true,
      message: `[Demo Mode] Category '${name}' saved successfully.`,
      category: { ...payload, id: payload.id || `demo-cat-${Date.now()}`, name, slug, parent_id: parentId },
    };
  }

  // 1. Fetch existing categories to validate safe parent and duplicate slug
  const { data: allCategories, error: fetchError } = await supabase
    .from("categories")
    .select("*");

  if (fetchError) {
    return { error: `Failed to verify category hierarchy: ${fetchError.message}` };
  }

  const existingList = (allCategories || []) as Category[];

  // 2. Safe parent picker validation: strictly prevent selecting itself or descendants
  const parentSafety = isSafeParent(payload.id, parentId, existingList);
  if (!parentSafety.safe) {
    return { error: parentSafety.reason || "Invalid parent category selection." };
  }

  // 3. Friendly duplicate-slug check
  const duplicate = existingList.find(
    (c) => c.slug.toLowerCase() === slug.toLowerCase() && c.id !== payload.id
  );
  if (duplicate) {
    return {
      error: `A category with the slug "${slug}" already exists (matching "${duplicate.name}"). Please choose a unique slug.`,
    };
  }

  // 4. Upsert / insert into categories table
  const categoryRecord = {
    name,
    slug,
    description: payload.description?.trim() || null,
    parent_id: parentId,
    image_url: payload.image_url?.trim() || null,
    display_order: Number(payload.display_order) || 0,
    is_active: Boolean(payload.is_active),
    show_on_homepage: Boolean(payload.show_on_homepage),
  };

  if (payload.id) {
    // Update existing category
    const { data: updated, error: updateError } = await supabase
      .from("categories")
      .update(categoryRecord)
      .eq("id", payload.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === "23505") {
        return {
          error: `A category with the slug "${slug}" already exists. Please choose a unique slug.`,
        };
      }
      return { error: `Failed to update category: ${updateError.message}` };
    }

    revalidatePath("/admin/categories");
    revalidatePath("/shop");
    revalidatePath("/");
    return { success: true, message: `Category '${name}' updated successfully.`, category: updated };
  } else {
    // Insert new category
    const { data: created, error: insertError } = await supabase
      .from("categories")
      .insert(categoryRecord)
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return {
          error: `A category with the slug "${slug}" already exists. Please choose a unique slug.`,
        };
      }
      return { error: `Failed to create category: ${insertError.message}` };
    }

    revalidatePath("/admin/categories");
    revalidatePath("/shop");
    revalidatePath("/");
    return { success: true, message: `Category '${name}' created successfully.`, category: created };
  }
}

export async function deleteCategoryAction(categoryId: string) {
  if (!categoryId) {
    return { error: "Category ID is required for deletion." };
  }

  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  const supabase = auth.supabase;
  const isConfigured = !auth.isDemo;

  if (!isConfigured) {
    revalidatePath("/admin/categories");
    revalidatePath("/shop");
    revalidatePath("/");
    return {
      success: true,
      message: "[Demo Mode] Category and any descendants deleted.",
    };
  }

  // 1. Fetch categories to calculate cascade count
  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, name, parent_id");

  const existingList = (allCategories || []) as Category[];
  const targetCategory = existingList.find((c) => c.id === categoryId);
  const descendantIds = getDescendantCategoryIds(categoryId, existingList);

  // 2. Delete the category (PostgreSQL FK ON DELETE CASCADE handles child rows)
  const { error: deleteError } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (deleteError) {
    return { error: `Failed to delete category: ${deleteError.message}` };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/");

  const targetName = targetCategory?.name || "Category";
  const cascadeNote =
    descendantIds.length > 0
      ? ` and its ${descendantIds.length} descendant subcategory(ies)`
      : "";

  return {
    success: true,
    message: `Successfully deleted '${targetName}'${cascadeNote}.`,
    cascadeCount: descendantIds.length,
  };
}
