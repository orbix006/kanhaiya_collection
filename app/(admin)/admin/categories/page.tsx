import { createClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/admin/category-manager";
import { getAllActiveCategories } from "@/lib/data/homepage";
import { FolderTree, Sparkles } from "lucide-react";
import type { Category } from "@/lib/data/homepage";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  let categories: Category[] = [];

  if (isConfigured) {
    const { data: dbCats, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !dbCats || dbCats.length === 0) {
      categories = await getAllActiveCategories();
    } else {
      categories = dbCats as Category[];
    }
  } else {
    categories = await getAllActiveCategories();
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
            Organize catalog categories with unlimited-depth hierarchy. Create subcategories, customize auto-slugs, and manage storefront visibility.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border">
          <FolderTree className="h-4 w-4 text-primary" />
          <span>{categories.length} total categories</span>
        </div>
      </div>

      <CategoryManager initialCategories={categories} />
    </div>
  );
}
