import React from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { InventoryManager, type InventoryItem } from "@/components/admin/inventory/inventory-manager";
import { Boxes, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inventory & Stock Control | Kanhaiya Admin",
  description: "Monitor catalog stock levels, low-stock alerts, HSN codes, batch tracking, and warehouse adjustments.",
};

export default async function AdminInventoryPage() {
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  let inventoryItems: InventoryItem[] = [];

  if (isConfigured) {
    try {
      const supabase = await createClient();

      // Attempt reading from v_products_admin view first
      const { data: viewProducts, error: viewError } = await supabase
        .from("v_products_admin" as any)
        .select("*")
        .order("stock", { ascending: true });

      if (!viewError && viewProducts && viewProducts.length > 0) {
        inventoryItems = viewProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          batch_no: p.batch_no,
          hsn_code: p.hsn_code,
          price: Number(p.price ?? 0),
          stock: Number(p.stock ?? 0),
          low_stock_threshold: Number(p.low_stock_threshold ?? 5),
          is_low_stock: Boolean(p.is_low_stock ?? (p.stock <= (p.low_stock_threshold ?? 5))),
          category_name: p.category_name || null,
          primary_image: p.primary_image || null,
        }));
      } else {
        // Fallback directly to products table
        const { data: dbProducts } = await supabase
          .from("products")
          .select(`
            *,
            category:categories!products_category_id_fkey(name),
            images:product_images(url, is_primary, sort_order)
          `)
          .order("created_at", { ascending: false });

        if (dbProducts && dbProducts.length > 0) {
          inventoryItems = dbProducts.map((p: any) => {
            const rawCat = Array.isArray(p.category) ? p.category[0] : p.category;
            const rawImages = Array.isArray(p.images) ? p.images : [];
            const primaryImg = rawImages.find((i: any) => i.is_primary)?.url || rawImages[0]?.url || null;

            const effectiveStock = Number(p.stock ?? p.stock_quantity ?? 0);
            const threshold = Number(p.low_stock_threshold ?? 5);

            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              sku: p.sku,
              batch_no: p.batch_no || p.batch_number || null,
              hsn_code: p.hsn_code || null,
              price: Number(p.price ?? p.base_price ?? 0),
              stock: effectiveStock,
              low_stock_threshold: threshold,
              is_low_stock: effectiveStock <= threshold,
              category_name: rawCat?.name || null,
              primary_image: primaryImg,
            };
          });
        }
      }
    } catch (err) {
      console.error("[AdminInventoryPage] Error fetching inventory:", err);
    }
  }

  // Fallback to local store if unconfigured or returned no records
  if (inventoryItems.length === 0) {
    const { loadMockStore } = await import("@/lib/mock-data/admin-store");
    const store = loadMockStore();
    inventoryItems = (store.products || []).map((p: any) => {
      const rawCat = store.categories.find((c: any) => c.id === p.category_id);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku || null,
        batch_no: p.batch_number || p.batch_no || null,
        hsn_code: p.hsn_code || "7419",
        price: Number(p.base_price ?? p.price ?? 0),
        stock: Number(p.stock_quantity ?? p.stock ?? 0),
        low_stock_threshold: 5,
        is_low_stock: Number(p.stock_quantity ?? p.stock ?? 0) <= 5,
        category_name: rawCat?.name || null,
        primary_image: p.images?.[0]?.image_url || p.image_url || null,
      };
    });
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Warehouse & Stock Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Inventory & Stock Control
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Live warehouse stock monitoring, depletion alerts, HSN codes, batch tracking, and atomic inventory movements.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border shrink-0">
          <Boxes className="h-4 w-4 text-primary" />
          <span>{inventoryItems.length} active inventory rows</span>
        </div>
      </div>

      <InventoryManager initialItems={inventoryItems} />
    </div>
  );
}
