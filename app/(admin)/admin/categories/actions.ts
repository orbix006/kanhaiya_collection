"use server";

import { revalidatePath as nextRevalidatePath } from "next/cache";

function revalidatePath(path: string, type?: "layout" | "page") {
  try {
    nextRevalidatePath(path, type);
  } catch {
    // Safely ignore static generation store missing when run outside Next.js request context
  }
}
import { verifyAdminCaller } from "@/lib/auth/admin";
import {
  generateSlug,
  isSafeParent,
  getDescendantCategoryIds,
} from "@/lib/data/categories";
import {
  moveCategoryInStore,
  swapCategoryOrderInStore,
  changeCategoryHierarchyLevelInStore,
  reorderCategoriesInStore,
} from "@/lib/mock-data/admin-store";
import type { Category } from "@/lib/data/homepage";

export interface CategoryPayload {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  parent_id?: string | null;
  image_url?: string | null;
  thumbnail_path?: string | null;
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
    const { upsertCategoryInStore } = await import("@/lib/mock-data/admin-store");
    const storeRes = upsertCategoryInStore({
      ...payload,
      name,
      slug,
      parent_id: parentId,
      image_url: payload.image_url?.trim() || "/images/default-category.svg",
    });
    if (!storeRes.success) {
      return { error: storeRes.error || "Failed to save category." };
    }
    revalidatePath("/admin/categories");
    revalidatePath("/shop");
    revalidatePath("/");
    return { success: true, message: `Category '${name}' saved successfully.`, category: storeRes.category };
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
    thumbnail_url: payload.image_url?.trim() || "/images/default-category.svg",
    thumbnail_path: payload.thumbnail_path?.trim() || null,
    sort_order: Number(payload.display_order) || 0,
    is_active: Boolean(payload.is_active),
    is_visible: Boolean(payload.is_active),
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

export async function deleteCategoryAction(
  categoryId: string,
  options?: {
    reassignTargetId?: string | null;
  }
) {
  if (!categoryId || typeof categoryId !== "string") {
    return { error: "Valid Category ID is required for deletion." };
  }

  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  const supabase = auth.supabase;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId);
  const isConfigured = !auth.isDemo && isUUID;

  if (!isConfigured) {
    const { deleteCategoryFromStore, loadMockStore } = await import("@/lib/mock-data/admin-store");
    const store = loadMockStore();
    const target = store.categories.find((c) => c.id === categoryId);
    if (!target) {
      if (isUUID && !auth.isDemo) {
        // Fall through to Supabase deletion below
      } else {
        return { error: `Category '${categoryId}' not found.` };
      }
    } else {
      const res = deleteCategoryFromStore(categoryId);
      if (!res.success) {
        return { error: res.error || `Failed to delete category '${categoryId}'.` };
      }

      revalidatePath("/admin/categories");
      revalidatePath("/shop");
      revalidatePath("/");
      return {
        success: true,
        message: `Successfully deleted category '${target.name}' and its descendants.`,
      };
    }
  }

  // 1. Fetch categories to check subcategories
  const { data: allCategories, error: fetchErr } = await supabase
    .from("categories")
    .select("id, name, parent_id");

  if (fetchErr) {
    return { error: `Failed to inspect categories: ${fetchErr.message}` };
  }

  const existingList = (allCategories || []) as Category[];
  const targetCategory = existingList.find((c) => c.id === categoryId);
  if (!targetCategory) return { error: "Category not found." };

  const descendantIds = getDescendantCategoryIds(categoryId, existingList);
  const targetIds = [categoryId, ...descendantIds];

  // 2. Check for linked products and handle reassignment if requested
  const reassignId = options?.reassignTargetId;
  if (reassignId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reassignId)) {
    // Reassign products to the specified category
    await supabase
      .from("products")
      .update({ category_id: reassignId })
      .in("category_id", targetIds);

    await supabase
      .from("products")
      .update({ subcategory_id: null })
      .in("subcategory_id", targetIds);
  } else {
    // Check if products still reference these categories
    const { count: prodCount } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .or(`category_id.in.(${targetIds.join(",")}),subcategory_id.in.(${targetIds.join(",")})`);

    if (prodCount && prodCount > 0) {
      return {
        error: `Cannot delete category: ${prodCount} products are assigned to '${targetCategory.name}' or its subcategories. Reassign products before deleting.`,
      };
    }
  }

  // 3. Delete subcategories first to respect foreign key restrict constraints, then root
  if (descendantIds.length > 0) {
    const { error: subDeleteError } = await supabase
      .from("categories")
      .delete()
      .in("id", descendantIds);

    if (subDeleteError) {
      return { error: `Failed to delete subcategories: ${subDeleteError.message}` };
    }
  }

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

  return {
    success: true,
    message: `Successfully deleted category '${targetCategory.name}' and all descendants.`,
  };
}

export async function moveCategoryAction(
  categoryId: string,
  targetParentId?: string | null,
  position?: "before" | "after" | "inside",
  targetSiblingId?: string
) {
  if (!categoryId) return { error: "Category ID is required." };

  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  // Always sync with mock store for client-side optimistic reflection
  const localRes = moveCategoryInStore(categoryId, targetParentId, position, targetSiblingId);

  if (!auth.isDemo) {
    const supabase = auth.supabase;
    try {
      // 1. Fetch current categories to build the full reorder payload
      const { data: allCategories, error: fetchError } = await supabase
        .from("categories")
        .select("id, parent_id, sort_order")
        .order("sort_order", { ascending: true });

      if (!fetchError && allCategories) {
        // Enforce 2-level hierarchy depth: if targetParentId has a parent, disallow
        if (targetParentId) {
          const targetParent = allCategories.find((c: any) => c.id === targetParentId);
          if (targetParent && targetParent.parent_id) {
            return { error: "Only two levels supported: category > subcategory." };
          }
        }

        // Build new reorder payload
        const reorderPayload = allCategories.map((c: any) => {
          if (c.id === categoryId) {
            return {
              id: c.id,
              parent_id: targetParentId || null,
              sort_order: c.sort_order,
            };
          }
          return {
            id: c.id,
            parent_id: c.parent_id,
            sort_order: c.sort_order,
          };
        });

        // Call schema reorder_categories RPC
        const { error: rpcError } = await (supabase.rpc as any)("reorder_categories", {
          p_items: reorderPayload,
        });

        if (rpcError) {
          // Fallback direct table update if RPC had validation mismatch
          await supabase
            .from("categories")
            .update({
              parent_id: targetParentId || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", categoryId);
        }
      }
    } catch (err: any) {
      console.error("[moveCategoryAction] Supabase error:", err);
    }
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/categories");
  revalidatePath("/");

  return { success: true, category: localRes?.category };
}

export async function swapCategoryOrderAction(categoryId: string, direction: "up" | "down") {
  if (!categoryId) return { error: "Category ID is required." };

  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  const localRes = swapCategoryOrderInStore(categoryId, direction);
  if (!localRes.success) {
    return { error: localRes.error || "Failed to swap category order." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/categories");
  revalidatePath("/");

  return { success: true };
}

export async function changeCategoryHierarchyLevelAction(categoryId: string, action: "indent" | "outdent") {
  if (!categoryId) return { error: "Category ID is required." };

  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  const localRes = changeCategoryHierarchyLevelInStore(categoryId, action);
  if (!localRes.success) {
    return { error: localRes.error || "Failed to change category hierarchy level." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/categories");
  revalidatePath("/");

  return { success: true };
}

export async function reorderCategoriesAction(
  updates: Array<{ id: string; parent_id: string | null; display_order: number }>
) {
  if (!Array.isArray(updates) || updates.length === 0) {
    return { error: "Updates list is required." };
  }

  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  const localRes = reorderCategoriesInStore(updates);

  if (!auth.isDemo) {
    const supabase = auth.supabase;
    try {
      const payload = updates.map((u) => ({
        id: u.id,
        parent_id: u.parent_id,
        sort_order: u.display_order,
      }));

      const { error: rpcError } = await (supabase.rpc as any)("reorder_categories", {
        p_items: payload,
      });

      if (rpcError) {
        // Fallback update in batch
        for (const it of payload) {
          await supabase
            .from("categories")
            .update({
              parent_id: it.parent_id,
              sort_order: it.sort_order,
            })
            .eq("id", it.id);
        }
      }
    } catch (err: any) {
      console.error("[reorderCategoriesAction] Error updating categories in database:", err);
    }
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/categories");
  revalidatePath("/");

  return { success: true };
}
