import { History } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { ProductItem } from "@/lib/data/homepage";

interface ContinueBrowsingProps {
  products: ProductItem[];
  isAuthenticated?: boolean;
}

export function ContinueBrowsing({
  products,
  isAuthenticated = false,
}: ContinueBrowsingProps) {
  // Strictly render nothing for logged-out users or empty view history
  if (!isAuthenticated || !products || products.length === 0) {
    return null;
  }

  return (
    <section aria-label="Continue Browsing" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <History className="h-3.5 w-3.5" />
            <span>Recently Viewed</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Continue Browsing
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Items you recently viewed — pick up right where you left off.
          </p>
        </div>

        <span className="hidden sm:inline-block text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {products.length} {products.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Grid of recently viewed products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {products.slice(0, 10).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
