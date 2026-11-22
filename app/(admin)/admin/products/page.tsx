import { createClient } from "@/lib/supabase/server";
import { ProductManager } from "@/components/admin/product-manager";
import { getAllActiveCategories } from "@/lib/data/homepage";
import { FALLBACK_PRODUCT_DETAILS, type ProductDetail } from "@/lib/data/products";
import { SEED_PRODUCTS, SEED_CATEGORIES } from "@/lib/mock-data/admin-store";
import { Package, Sparkles } from "lucide-react";
import type { Category } from "@/lib/data/homepage";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Product Catalog Management | Admin Dashboard",
  description:
    "Manage store products, image galleries, variants, pricing, inventory stock, and catalog visibility.",
};

export default async function AdminProductsPage() {
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  let products: ProductDetail[] = [];
  let categories: Category[] = [];

  if (isConfigured) {
    try {
      const supabase = await createClient();
      // 1. Fetch categories
      const { data: dbCats } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (dbCats && dbCats.length > 0) {
        categories = dbCats as unknown as Category[];
      } else {
        categories = await getAllActiveCategories();
      }

      // 2. Fetch all products from products table with images and category details
      // Supports both schema.txt (price, stock, batch_no, hsn_code) and existing columns
      const { data: dbProducts, error: prodError } = await supabase
        .from("products")
        .select(`
          *,
          category:categories!products_category_id_fkey(id, name, slug, parent_id),
          images:product_images(id, product_id, url, storage_path, sort_order, is_primary)
        `)
        .order("created_at", { ascending: false });

      if (!prodError && dbProducts && dbProducts.length > 0) {
        products = dbProducts.map((p: any) => {
          const rawCat = Array.isArray(p.category) ? p.category[0] : p.category;
          const rawImages = Array.isArray(p.images) ? p.images : [];

          // Sort images by sort_order / display_order
          const sortedImages = [...rawImages].sort(
            (a, b) => (a.sort_order ?? a.display_order ?? 0) - (b.sort_order ?? b.display_order ?? 0)
          ).map((img: any) => ({
            id: img.id,
            product_id: img.product_id,
            image_url: img.url || img.image_url,
            alt_text: img.alt_text || null,
            display_order: img.sort_order ?? img.display_order ?? 0,
            is_primary: Boolean(img.is_primary),
          }));

          const effectivePrice = Number(p.price ?? p.base_price ?? 0);
          const effectiveStock = Number(p.stock ?? p.stock_quantity ?? 0);

          return {
            id: p.id,
            category_id: p.category_id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            brand: p.brand || "Kanhaiya Collection",
            sku: p.sku,
            base_price: effectivePrice,
            compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
            stock_quantity: effectiveStock,
            sold_count: Number(p.sold_count ?? 0),
            is_active: Boolean(p.is_active),
            is_featured_top_seller: Boolean(p.is_featured_top_seller),
            top_seller_display_order: p.top_seller_display_order
              ? Number(p.top_seller_display_order)
              : null,
            avg_rating: Number(p.avg_rating ?? 0),
            review_count: Number(p.review_count ?? 0),
            meta_title: p.meta_title || null,
            meta_description: p.meta_description || null,
            created_at: p.created_at,
            category: rawCat || null,
            images: sortedImages,
            variants: [],
            batch_number: p.batch_no || p.batch_number || null,
          };
        });
      } else {
        // Fallback query if relation syntax differs
        const { data: fallbackProds } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (fallbackProds && fallbackProds.length > 0) {
          products = fallbackProds.map((p: any) => ({
            id: p.id,
            category_id: p.category_id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            brand: p.brand || "Kanhaiya Collection",
            sku: p.sku,
            base_price: Number(p.price ?? p.base_price ?? 0),
            compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
            stock_quantity: Number(p.stock ?? p.stock_quantity ?? 0),
            sold_count: Number(p.sold_count ?? 0),
            is_active: Boolean(p.is_active),
            is_featured_top_seller: Boolean(p.is_featured_top_seller),
            top_seller_display_order: null,
            avg_rating: 0,
            review_count: 0,
            meta_title: null,
            meta_description: null,
            created_at: p.created_at,
            category: null,
            images: [],
            variants: [],
            batch_number: p.batch_no || null,
          }));
        }
      }
    } catch {
      categories = [];
      products = [];
    }
  } else {
    categories = [];
    products = [];
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Storefront Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Products & Inventory
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Create, edit, and organize catalog items. Manage primary and gallery images, custom product variants, pricing, stock levels, and SEO metadata.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border shrink-0">
          <Package className="h-4 w-4 text-primary" />
          <span>{products.length} products loaded</span>
        </div>
      </div>

      <ProductManager initialProducts={products} categories={categories} />
    </div>
  );
}
