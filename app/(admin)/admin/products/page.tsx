import { createClient } from "@/lib/supabase/server";
import { ProductManager } from "@/components/admin/product-manager";
import { getAllActiveCategories } from "@/lib/data/homepage";
import { FALLBACK_PRODUCT_DETAILS, type ProductDetail } from "@/lib/data/products";
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
  const supabase = await createClient();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  let products: ProductDetail[] = [];
  let categories: Category[] = [];

  if (isConfigured) {
    try {
      // 1. Fetch categories
      const { data: dbCats } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (dbCats && dbCats.length > 0) {
        categories = dbCats as Category[];
      } else {
        categories = await getAllActiveCategories();
      }

      // 2. Fetch all products (including archived / inactive)
      const { data: dbProducts, error: prodError } = await supabase
        .from("products")
        .select(`
          id,
          category_id,
          name,
          slug,
          description,
          brand,
          sku,
          base_price,
          compare_at_price,
          stock_quantity,
          sold_count,
          is_active,
          is_featured_top_seller,
          top_seller_display_order,
          avg_rating,
          review_count,
          meta_title,
          meta_description,
          created_at,
          category:categories(id, name, slug, parent_id),
          images:product_images(id, product_id, image_url, alt_text, display_order, is_primary),
          variants:product_variants(id, product_id, variant_name, sku, attributes, price, compare_at_price, stock_quantity, image_url, is_active)
        `)
        .order("created_at", { ascending: false });

      if (!prodError && dbProducts && dbProducts.length > 0) {
        products = dbProducts.map((p: any) => {
          const rawCat = Array.isArray(p.category) ? p.category[0] : p.category;
          const rawImages = Array.isArray(p.images) ? p.images : [];
          const rawVariants = Array.isArray(p.variants) ? p.variants : [];

          // Sort images by display_order
          const sortedImages = [...rawImages].sort(
            (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
          );

          // Clean variants attributes
          const cleanedVariants = rawVariants.map((v: any) => ({
            ...v,
            attributes:
              typeof v.attributes === "object" && v.attributes !== null
                ? v.attributes
                : {},
          }));

          return {
            id: p.id,
            category_id: p.category_id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            brand: p.brand,
            sku: p.sku,
            base_price: Number(p.base_price),
            compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
            stock_quantity: Number(p.stock_quantity ?? 0),
            sold_count: Number(p.sold_count ?? 0),
            is_active: Boolean(p.is_active),
            is_featured_top_seller: Boolean(p.is_featured_top_seller),
            top_seller_display_order: p.top_seller_display_order
              ? Number(p.top_seller_display_order)
              : null,
            avg_rating: Number(p.avg_rating ?? 0),
            review_count: Number(p.review_count ?? 0),
            meta_title: p.meta_title,
            meta_description: p.meta_description,
            created_at: p.created_at,
            category: rawCat || null,
            images: sortedImages,
            variants: cleanedVariants,
          };
        });
      } else {
        products = FALLBACK_PRODUCT_DETAILS;
      }
    } catch {
      categories = await getAllActiveCategories();
      products = FALLBACK_PRODUCT_DETAILS;
    }
  } else {
    categories = await getAllActiveCategories();
    products = FALLBACK_PRODUCT_DETAILS;
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
