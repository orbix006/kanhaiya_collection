import React from "react";
import Link from "next/link";
import { Product, Category } from "@/lib/store";
import { HorizontalProductRow } from "@/components/ui/horizontal-product-row";
import { ArrowRight, Sparkles } from "lucide-react";

interface NewlyAddedSectionProps {
  products: Product[];
  categories: Category[];
}

export function NewlyAddedSection({ products, categories }: NewlyAddedSectionProps) {
  if (!products || products.length === 0) return null;

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <section
      aria-label="Newly Added Products"
      className="py-14 sm:py-20 bg-[#FFFDF7] border-b border-[#E8DCC8]/60 transition-colors"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading & View All Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#C8891A] font-semibold font-sans mb-1">
              <Sparkles className="h-3.5 w-3.5 text-[#C8891A]" />
              <span>Fresh Creations</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#3B2416]">
              Newly Added
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#806B57] font-sans font-normal max-w-md">
              The latest handcrafted artisan arrivals to our temple brassware and devotional gallery.
            </p>
          </div>

          <Link
            href="/shop?sort=newest"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#C8891A] hover:text-[#B37814] transition-colors py-1 font-sans shrink-0"
          >
            <span>Explore All New Arrivals</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Continuous Horizontal Scrollable Row */}
        <HorizontalProductRow
          products={products}
          categoryMap={categoryMap}
        />
      </div>
    </section>
  );
}
