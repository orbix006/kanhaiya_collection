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

import { isUUID } from "@/lib/utils/uuid";

export interface CategoryPayload {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  parent_id?: string | null;
  image_url?: string | null;
  thumbnail_path?: string | null;
  display_order?: number;
  is_active?: boolean;
  show_on_homepage?: boolean;
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

  const rawParentId = payload.parent_id && payload.parent_id !== "none" ? payload.parent_id.trim() : null;

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
      parent_id: rawParentId,
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

  // 1. Fetch existing categories from Supabase to validate safe parent and duplicate slug
  const { data: allCategories, error: fetchError } = await supabase
    .from("categories")
    .select("*");

  if (fetchError) {
    return { error: `Failed to verify category hierarchy: ${fetchError.message}` };
  }

  const existingList = (allCategories || []) as Category[];

  // 2. Resolve parent_id to a valid Supabase UUID
  let resolvedParentId: string | null = null;
  if (rawParentId) {
    if (isUUID(rawParentId)) {
      const foundInDb = existingList.find((c) => c.id === rawParentId);
      resolvedParentId = foundInDb ? foundInDb.id : rawParentId;
    } else {
      // Local ID passed (e.g. cat-1795342422969-yfla)
      const { loadMockStore, saveMockStore } = await import("@/lib/mock-data/admin-store");
      const store = loadMockStore();
      const localParent = store.categories.find(
        (c: any) => c.id === rawParentId || c.slug.toLowerCase() === rawParentId.toLowerCase()
      );

      if (localParent) {
        // Check if this parent category already exists in Supabase by slug or name
        const dbParent = existingList.find(
          (c) =>
            c.slug.toLowerCase() === localParent.slug.toLowerCase() ||
            c.name.toLowerCase() === localParent.name.toLowerCase()
        );

        if (dbParent && isUUID(dbParent.id)) {
          resolvedParentId = dbParent.id;
          if (localParent.id !== dbParent.id) {
            const oldId = localParent.id;
            localParent.id = dbParent.id;
            store.categories.forEach((c: any) => {
              if (c.parent_id === oldId) c.parent_id = dbParent.id;
            });
            saveMockStore(store);
          }
        } else {
          // Parent does not yet exist in Supabase! Auto-create parent category in Supabase first
          const { data: newDbParent, error: parentInsertErr } = await supabase
            .from("categories")
            .insert({
              name: localParent.name,
              slug: localParent.slug,
              description: localParent.description || null,
              thumbnail_url: localParent.image_url || "/images/default-category.svg",
              thumbnail_path: (localParent as any).thumbnail_path || null,
              sort_order: Number(localParent.display_order) || 0,
              is_active: localParent.is_active ?? true,
              is_visible: localParent.show_on_homepage ?? true,
              parent_id: null,
            })
            .select()
            .single();

          if (!parentInsertErr && newDbParent && isUUID(newDbParent.id)) {
            resolvedParentId = newDbParent.id;
            existingList.push(newDbParent as Category);
            const oldId = localParent.id;
            localParent.id = newDbParent.id;
            store.categories.forEach((c: any) => {
              if (c.parent_id === oldId) c.parent_id = newDbParent.id;
            });
            saveMockStore(store);
          }
        }
      }
    }
  }

  // 3. Safe parent picker validation: strictly prevent selecting itself or descendants
  const parentSafety = isSafeParent(payload.id, resolvedParentId || rawParentId, existingList);
  if (!parentSafety.safe) {
    return { error: parentSafety.reason || "Invalid parent category selection." };
  }

  // 4. Resolve target UUID if editing an existing category
  let targetUuid: string | null = null;
  if (payload.id && isUUID(payload.id)) {
    targetUuid = payload.id;
  } else if (payload.id) {
    const existingMatch = existingList.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
    if (existingMatch && isUUID(existingMatch.id)) {
      targetUuid = existingMatch.id;
    }
  }

  // 5. Hierarchy-aware duplicate check:
  // Root categories must be unique among root categories (parent_id is null).
  // Subcategories / sub-subcategories must be unique within their own parent category.
  // The exact same name and slug are ALLOWED under different parents.
  const targetParent = resolvedParentId || rawParentId || null;
  const duplicate = existingList.find((c) => {
    const sameParent = (c.parent_id || null) === targetParent;
    const sameSlug = c.slug.toLowerCase() === slug.toLowerCase();
    const sameName = c.name.toLowerCase() === name.toLowerCase();
    const isDifferentRecord = c.id !== (targetUuid || payload.id);
    return sameParent && (sameSlug || sameName) && isDifferentRecord;
  });

  if (duplicate) {
    return {
      error: `A category named "${name}" already exists under ${
        targetParent ? "this parent category" : "main categories"
      } (matching "${duplicate.name}"). Please choose a unique name.`,
    };
  }

  // 6. Upsert / insert into Supabase categories table
  const categoryRecord = {
    name,
    slug,
    description: payload.description?.trim() || null,
    parent_id: resolvedParentId,
    thumbnail_url: payload.image_url?.trim() || "/images/default-category.svg",
    thumbnail_path: payload.thumbnail_path?.trim() || null,
    sort_order: Number(payload.display_order) || 0,
    is_active: Boolean(payload.is_active),
    is_visible: Boolean(payload.is_active),
  };

  let savedRecord: any = null;

  if (targetUuid) {
    // Update existing category in Supabase
    const { data: updated, error: updateError } = await supabase
      .from("categories")
      .update(categoryRecord)
      .eq("id", targetUuid)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === "23505") {
        return {
          error: `A category named "${name}" already exists under this parent category. Please choose a unique name.`,
        };
      }
      return { error: `Failed to update category: ${updateError.message}` };
    }
    savedRecord = updated;
  } else {
    // Insert new category - PostgreSQL automatically generates a fresh UUID via gen_random_uuid()
    let { data: created, error: insertError } = await supabase
      .from("categories")
      .insert(categoryRecord)
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        // If the database still has the legacy global unique constraint on slug (categories_slug_key)
        // before migration 005 is applied in Supabase:
        if (
          insertError.message?.includes("categories_slug_key") ||
          (insertError.details && insertError.details.includes("categories_slug_key"))
        ) {
          // Disambiguate slug by prefixing parent slug so creation succeeds seamlessly in Supabase
          const parentCat = existingList.find((c) => c.id === resolvedParentId);
          const parentPrefix = parentCat ? generateSlug(parentCat.name) : "sub";
          const disambiguatedSlug = `${parentPrefix}-${slug}`;

          const retryRecord = { ...categoryRecord, slug: disambiguatedSlug };
          const { data: retryCreated, error: retryErr } = await supabase
            .from("categories")
            .insert(retryRecord)
            .select()
            .single();

          if (!retryErr && retryCreated) {
            savedRecord = retryCreated;
          } else {
            return {
              error: `A category named "${name}" already exists under this parent category. Please choose a unique name.`,
            };
          }
        } else {
          return {
            error: `A category named "${name}" already exists under this parent category. Please choose a unique name.`,
          };
        }
      } else {
        return { error: `Failed to create category: ${insertError.message}` };
      }
    } else {
      savedRecord = created;
    }
  }

  // 7. Synchronize local store so local store categories carry the exact Supabase UUID
  const { upsertCategoryInStore } = await import("@/lib/mock-data/admin-store");
  upsertCategoryInStore({
    id: savedRecord.id,
    name: savedRecord.name,
    slug: savedRecord.slug,
    description: savedRecord.description,
    parent_id: savedRecord.parent_id,
    image_url: savedRecord.thumbnail_url || savedRecord.image_url,
    display_order: savedRecord.sort_order ?? savedRecord.display_order,
    is_active: savedRecord.is_active,
    show_on_homepage: savedRecord.is_visible ?? savedRecord.show_on_homepage,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/");
  return {
    success: true,
    message: `Category '${name}' ${targetUuid ? "updated" : "created"} successfully.`,
    category: savedRecord,
  };
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
  const targetIsUUID = isUUID(categoryId);
  const isConfigured = !auth.isDemo && targetIsUUID;

  if (!isConfigured) {
    const { deleteCategoryFromStore, loadMockStore } = await import("@/lib/mock-data/admin-store");
    const store = loadMockStore();
    const target = store.categories.find((c) => c.id === categoryId);
    if (!target) {
      if (targetIsUUID && !auth.isDemo) {
        // Fall through to Supabase deletion below
      } else {
        return { error: `Category '${categoryId}' not found.` };
      }
    } else {
      const res = deleteCategoryFromStore(categoryId);
      if (!res.success) {
        return { error: res.error || `Failed to delete category '${categoryId}'.` };
      }

      // If connected to Supabase, also clean up matching record by slug if one exists
      if (!auth.isDemo) {
        try {
          const { data: dbMatch } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", target.slug)
            .maybeSingle();

          if (dbMatch && isUUID(dbMatch.id)) {
            await supabase.from("categories").delete().eq("id", dbMatch.id);
          }
        } catch {
          // Non-fatal
        }
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
      const safeTargetParentId = isUUID(targetParentId) ? targetParentId : null;
      // 1. Fetch current categories to build the full reorder payload
      const { data: allCategories, error: fetchError } = await supabase
        .from("categories")
        .select("id, parent_id, sort_order")
        .order("sort_order", { ascending: true });

      if (!fetchError && allCategories && isUUID(categoryId)) {
        // Enforce 3-level hierarchy depth: Category > Subcategory > Sub-subcategory
        if (safeTargetParentId) {
          const targetParent = allCategories.find((c: any) => c.id === safeTargetParentId);
          if (targetParent && targetParent.parent_id) {
            const targetGrandparent = allCategories.find((c: any) => c.id === targetParent.parent_id);
            if (targetGrandparent && targetGrandparent.parent_id) {
              return { error: "Only three levels supported: category > subcategory > sub-subcategory." };
            }
          }
        }

        // Build new reorder payload
        const reorderPayload = allCategories.map((c: any) => {
          if (c.id === categoryId) {
            return {
              id: c.id,
              parent_id: safeTargetParentId || null,
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
              parent_id: safeTargetParentId || null,
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
      const payload = updates
        .filter((u) => isUUID(u.id))
        .map((u) => ({
          id: u.id,
          parent_id: isUUID(u.parent_id) ? u.parent_id : null,
          sort_order: u.display_order,
        }));

      if (payload.length > 0) {
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
