import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { CategoryProductSection } from "@/lib/data/homepage";

interface CategoryProductRowsProps {
  categorySections: CategoryProductSection[];
}

export function CategoryProductRows({
  categorySections,
}: CategoryProductRowsProps) {
  if (!categorySections || categorySections.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-14 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {categorySections.map((sec) => (
        <section
          key={sec.category.id}
          aria-label={`Products in ${sec.category.name}`}
          className="flex flex-col"
        >
          {/* Header Row with View All Link */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3 pb-3 border-b border-border/50">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                <Tag className="h-3.5 w-3.5" />
                <span>Featured Category</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {sec.category.name}
              </h2>
              {sec.category.description && (
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  {sec.category.description}
                </p>
              )}
            </div>

            {/* View All link deep-linking to /shop?category=<slug> */}
            <Link
              href={`/shop?category=${encodeURIComponent(sec.category.slug)}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group self-start sm:self-end"
            >
              <span>View All {sec.category.name}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Category-correct Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {sec.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
