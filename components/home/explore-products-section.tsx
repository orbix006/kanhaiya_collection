import React from "react";
import Link from "next/link";
import { Product, Category } from "@/lib/store";
import { ProductCard } from "@/components/ui/product-card";
import { ArrowRight, Compass } from "lucide-react";

interface ExploreProductsSectionProps {
  products: Product[];
  categories: Category[];
}

export function ExploreProductsSection({ products, categories }: ExploreProductsSectionProps) {
  if (!products || products.length === 0) return null;

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <section
      aria-label="Build & Explore Sacred Offerings"
      className="py-14 sm:py-20 bg-white border-b border-[#E8DCC8]/60 transition-colors"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading & View All Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#C8891A] font-semibold font-sans mb-1">
              <Compass className="h-3.5 w-3.5" />
              <span>Devotional Gallery</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#3B2416]">
              Build / Explore Products
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#806B57] font-sans font-normal max-w-md">
              Discover consecrated puja essentials, artisan-crafted idols, and sacred sanctum brassware.
            </p>
          </div>

          <Link
            href="/shop"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#C8891A] hover:text-[#B37814] transition-colors py-1 font-sans shrink-0"
          >
            <span>Explore Entire Collection</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => {
            const cardItem = {
              id: product.id,
              name: product.name,
              slug: product.slug,
              brand: product.brand,
              base_price: product.base_price,
              compare_at_price: product.compare_at_price,
              stock_quantity: product.stock_quantity,
              avg_rating: product.avg_rating,
              review_count: product.review_count,
              image_url: product.image_url,
              category_id: product.category_id,
            };
            return (
              <ProductCard
                key={product.id}
                product={cardItem}
                categoryName={product.category_id ? categoryMap.get(product.category_id) : undefined}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
