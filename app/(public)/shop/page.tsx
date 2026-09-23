import Link from "next/link";
import { ArrowLeft, Tag, Search, Sparkles, ShoppingBag } from "lucide-react";
import { getAllActiveCategories } from "@/lib/data/homepage";
import { getShopProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/product/product-card";
import { ShopSidebar } from "@/components/shop/shop-sidebar";
import { ShopMobileFilter } from "@/components/shop/shop-mobile-filter";
import { ShopSortDropdown } from "@/components/shop/shop-sort-dropdown";
import { ShopActiveFilters } from "@/components/shop/shop-active-filters";
import { ShopPagination } from "@/components/shop/shop-pagination";

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const categorySlug = params.category;
  const searchQuery = params.q;
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const sort = params.sort || "featured";
  const page = params.page ? parseInt(params.page, 10) : 1;
  const pageSize = 12;

  // Concurrently fetch shop data and categories
  const [shopResult, allCategories] = await Promise.all([
    getShopProducts({
      categorySlug,
      searchQuery,
      minPrice,
      maxPrice,
      sort,
      page,
      pageSize,
    }),
    getAllActiveCategories(),
  ]);

  const { products, totalCount, totalPages, activeCategory } = shopResult;

  // Compute active filter count for mobile badge
  let activeFilterCount = 0;
  if (categorySlug) activeFilterCount++;
  if (searchQuery) activeFilterCount++;
  if (minPrice || maxPrice) activeFilterCount++;
  if (sort && sort !== "featured") activeFilterCount++;

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-xs font-medium text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-none"
      >
        <Link
          href="/"
          className="hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <Link
          href="/shop"
          className={`hover:text-foreground transition-colors ${
            !categorySlug ? "text-foreground font-bold" : ""
          }`}
        >
          Shop
        </Link>
        {activeCategory && (
          <>
            <span>/</span>
            <span className="text-primary font-bold">{activeCategory.name}</span>
          </>
        )}
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-border/70 gap-4">
        <div>
          {activeCategory && (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <Tag className="h-3.5 w-3.5" />
              <span>Category Filter</span>
            </div>
          )}
          {searchQuery && (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <Search className="h-3.5 w-3.5" />
              <span>Search Results</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {activeCategory
              ? activeCategory.name
              : searchQuery
              ? `Results for "${searchQuery}"`
              : "All Handcrafted Collections"}
          </h1>

          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {activeCategory?.description ||
              (searchQuery
                ? `Showing authentic royal apparel and handcrafted pieces matching your search query.`
                : "Explore our royal catalogue of authentic handloom sarees, bespoke linen, artisanal kurtas, and luxury accessories.")}
          </p>
        </div>

        {/* Header Actions: Sort and Mobile Filter Button */}
        <div className="flex items-center gap-3 self-start md:self-end">
          <ShopMobileFilter
            categories={allCategories}
            currentCategorySlug={categorySlug}
            minPriceParam={minPrice}
            maxPriceParam={maxPrice}
            activeFilterCount={activeFilterCount}
          />
          <ShopSortDropdown currentSort={sort} />
        </div>
      </div>

      {/* Active Filters Chip Bar */}
      <ShopActiveFilters categories={allCategories} />

      {/* Main Shop Layout: Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
        {/* Desktop Sticky Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
            <ShopSidebar
              categories={allCategories}
              currentCategorySlug={categorySlug}
              minPriceParam={minPrice}
              maxPriceParam={maxPrice}
            />
          </div>
        </div>

        {/* Product Catalog Grid Column */}
        <div className="lg:col-span-3 flex flex-col">
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={idx < 4}
                  />
                ))}
              </div>

              {/* Pagination */}
              <ShopPagination
                currentPage={page}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-dashed border-border/80 bg-muted/20 px-4">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                No matching products found
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
                We couldn&apos;t find any items matching your selected filters. Try broadening
                your price range, clearing your search query, or selecting another category.
              </p>
              <Link
                href="/shop"
                className="rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors"
              >
                Clear All Filters & View Full Catalog
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
