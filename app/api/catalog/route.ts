import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdminCaller } from "@/lib/auth/admin";
import {
  loadMockStore,
  saveMockStore,
  upsertProductInStore,
  deleteProductFromStore,
  archiveProductInStore,
  upsertCategoryInStore,
  deleteCategoryFromStore,
  moveCategoryInStore,
  swapCategoryOrderInStore,
  changeCategoryHierarchyLevelInStore,
  reorderCategoriesInStore,
} from "@/lib/mock-data/admin-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = loadMockStore();
    return NextResponse.json({
      success: true,
      products: store.products,
      categories: store.categories,
      timestamp: Date.now(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load catalog." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminCaller(req);
    if (!auth.authorized) {
      const isUnauthenticated = Boolean(auth.error?.includes("Unauthorized"));
      return NextResponse.json(
        { error: auth.error || "Administrator authorization required." },
        { status: isUnauthenticated ? 401 : 403 }
      );
    }

    if (process.env.NODE_ENV === "production" && auth.isDemo) {
      return NextResponse.json(
        { error: "Local mock catalog mutations are prohibited in production." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, payload, productId, categoryId, shouldArchive, targetParentId, position, targetSiblingId, direction, levelAction, updates } = body;

    let result: { success: boolean; error?: string } = { success: false };

    // Product Actions
    if (action === "upsert") {
      result = upsertProductInStore(payload);
    } else if (action === "archive") {
      result = archiveProductInStore(productId, shouldArchive);
    } else if (action === "delete") {
      result = deleteProductFromStore(productId);
    }
    // Category Actions
    else if (action === "upsert_category") {
      result = upsertCategoryInStore(payload);
    } else if (action === "delete_category") {
      result = deleteCategoryFromStore(categoryId);
    } else if (action === "move_category") {
      result = moveCategoryInStore(categoryId, targetParentId, position, targetSiblingId);
    } else if (action === "swap_category_order") {
      result = swapCategoryOrderInStore(categoryId, direction);
    } else if (action === "change_category_hierarchy_level") {
      result = changeCategoryHierarchyLevelInStore(categoryId, levelAction);
    } else if (action === "reorder_categories") {
      result = reorderCategoriesInStore(updates);
    } else if (action === "sync_store") {
      // Sync full store from client
      if (body.store && Array.isArray(body.store.products)) {
        saveMockStore(body.store);
        result = { success: true };
      }
    } else {
      return NextResponse.json(
        { error: "Invalid or unsupported catalog action." },
        { status: 400 }
      );
    }

    if (result.success) {
      try {
        revalidatePath("/admin/categories");
        revalidatePath("/admin/products");
        revalidatePath("/shop");
        revalidatePath("/categories");
        revalidatePath("/");
        if (payload?.slug) {
          revalidatePath(`/shop/product/${payload.slug}`);
          revalidatePath(`/product/${payload.slug}`);
          revalidatePath(`/products/${payload.slug}`);
        }
      } catch {
        // Revalidation is non-fatal in standalone/script contexts
      }
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Catalog update failed." },
      { status: 500 }
    );
  }
}
