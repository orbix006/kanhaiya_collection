import Link from "next/link";
import { ShoppingBag, Search } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { ShopSidebar } from "@/components/shop/shop-sidebar";
import { ShopMobileFilter } from "@/components/shop/shop-mobile-filter";
import { ShopSortDropdown } from "@/components/shop/shop-sort-dropdown";
import { ShopActiveFilters } from "@/components/shop/shop-active-filters";
import { ShopPagination } from "@/components/shop/shop-pagination";
import { getAllActiveCategories } from "@/lib/data/homepage";
import { getShopProducts } from "@/lib/data/products";

export const metadata = {
  title: "Shop All Sacred Offerings | Kanhaiya Collection",
  description:
    "Explore our curated store for sacred brass idols, puja essentials, temple brassware, and spiritual home offerings.",
};

type SearchParams = Record<string, string | string[] | undefined>;

interface ShopPageProps {
  searchParams: Promise<SearchParams>;
}

function one(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

function positiveNumber(value?: string): number | undefined {
  if (!value || !/^\d+(\.\d+)?$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const categorySlug = one(params, "category");
  const searchQuery = one(params, "q")?.trim().slice(0, 100);
  const minPrice = positiveNumber(one(params, "minPrice"));
  const maxPrice = positiveNumber(one(params, "maxPrice"));
  const sort = one(params, "sort");
  const page = Math.max(1, Math.min(10000, Math.floor(positiveNumber(one(params, "page")) || 1)));
  const availabilityValue = one(params, "availability");
  const availability =
    availabilityValue === "in-stock" || availabilityValue === "out-of-stock"
      ? availabilityValue
      : undefined;
  const festival = one(params, "festival")?.trim().slice(0, 50);
  const material = one(params, "material")?.trim().slice(0, 50);

  const [categories, result] = await Promise.all([
    getAllActiveCategories(),
    getShopProducts({
      categorySlug,
      searchQuery,
      minPrice,
      maxPrice,
      availability,
      festival,
      material,
      sort,
      page,
      pageSize: 12,
    }),
  ]);

  const selectedCategory = result.activeCategory;
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  const activeFilterCount = [
    categorySlug,
    searchQuery,
    minPrice !== undefined || maxPrice !== undefined,
    availability,
    festival,
    material,
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-[#FFFDF7] py-10 sm:py-16 font-sans">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F8F1E3] border border-[#E8DCC8] px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#C8891A] mb-3">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Divine Store</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#3B2416]">
            {selectedCategory?.name || "All Sacred Offerings"}
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-[#806B57] font-normal leading-relaxed">
            {selectedCategory?.description ||
              "Curated collection of sacred idols, puja essentials, pure brassware, and festive treasures."}
          </p>
        </div>

        <form action="/shop" className="mx-auto mb-8 flex max-w-xl gap-2">
          <label htmlFor="shop-search" className="sr-only">Search products, categories, or SKU</label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="shop-search"
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search products, categories, or SKU"
              className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button type="submit" className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <ShopSidebar
              categories={categories}
              currentCategorySlug={categorySlug}
              minPriceParam={minPrice}
              maxPriceParam={maxPrice}
              currentAvailability={availability}
              currentFestival={festival}
              currentMaterial={material}
            />
          </aside>

          <section aria-label="Products">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <ShopMobileFilter
                categories={categories}
                currentCategorySlug={categorySlug}
                minPriceParam={minPrice}
                maxPriceParam={maxPrice}
                currentAvailability={availability}
                currentFestival={festival}
                currentMaterial={material}
                activeFilterCount={activeFilterCount}
              />
              <ShopSortDropdown currentSort={sort || "featured"} />
              <p className="ml-auto text-xs text-muted-foreground">
                {result.totalCount} {result.totalCount === 1 ? "product" : "products"}
              </p>
            </div>

            <ShopActiveFilters categories={categories} />

            {result.products.length === 0 ? (
              <div className="rounded-3xl border border-[#E8DCC8] bg-[#F8F1E3]/40 p-12 text-center">
                <p className="font-serif text-lg text-[#3B2416]">No products match these filters.</p>
                <p className="mt-2 text-sm text-muted-foreground">Try another search or clear some filters.</p>
                <Link href="/shop" className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground">
                  View all products
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
                  {result.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      categoryName={product.category_id ? categoryMap.get(product.category_id) : undefined}
                    />
                  ))}
                </div>
                <ShopPagination
                  currentPage={result.page}
                  totalPages={result.totalPages}
                  totalCount={result.totalCount}
                  pageSize={result.pageSize}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
