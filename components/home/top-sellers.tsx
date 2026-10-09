import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { ProductItem } from "@/lib/data/homepage";

interface TopSellersSectionProps {
  products: ProductItem[];
}

export function TopSellersSection({ products }: TopSellersSectionProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section aria-label="Top Sellers" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
            <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>Trending Customer Favorites</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Top Sellers
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Our most popular master-crafted pieces, hand-selected by our patrons.
          </p>
        </div>

        <Link
          href="/shop"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
        >
          <span>View All Top Sellers</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Grid of Top Seller Products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product, idx) => (
          <ProductCard key={product.id} product={product} priority={idx < 4} />
        ))}
      </div>
    </section>
  );
}
