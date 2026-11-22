import { createClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/admin/category-manager";
import { getAllActiveCategories } from "@/lib/data/homepage";
import { SEED_CATEGORIES, loadMockCategories, loadMockProducts } from "@/lib/mock-data/admin-store";
import { FolderTree, Sparkles } from "lucide-react";
import type { Category } from "@/lib/data/homepage";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  let categories: Category[] = [];
  let products: any[] = [];

  if (isConfigured) {
    try {
      const supabase = await createClient();
      const [catRes, prodRes] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("products")
          .select("id, name, category_id, subcategory_id"),
      ]);

      if (!catRes.error && catRes.data) {
        categories = catRes.data.map((c: any) => ({
          id: c.id,
          parent_id: c.parent_id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          image_url: c.thumbnail_url || c.image_url || null,
          thumbnail_path: c.thumbnail_path || null,
          display_order: c.sort_order ?? c.display_order ?? 0,
          is_active: c.is_active ?? true,
          show_on_homepage: c.is_visible ?? c.show_on_homepage ?? true,
        })) as Category[];
      }

      if (!prodRes.error && prodRes.data) {
        products = prodRes.data;
      }
    } catch {
      categories = [];
      products = [];
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Store Taxonomy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Category Administration
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Hierarchical category tree with two-level depth, direct thumbnail upload to Supabase Storage, and real-time drag-and-drop reordering.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border">
          <FolderTree className="h-4 w-4 text-primary" />
          <span>{categories.length} total categories</span>
        </div>
      </div>

      <CategoryManager initialCategories={categories} initialProducts={products} />
    </div>
  );
}
