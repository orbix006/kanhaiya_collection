import React from "react";
import Link from "next/link";
import { FestiveOffer, Product, Category } from "@/lib/store";
import { HorizontalProductRow } from "@/components/ui/horizontal-product-row";
import { ArrowRight, Flame } from "lucide-react";

interface FestiveOfferSectionProps {
  offer: FestiveOffer;
  products: Product[];
  categories: Category[];
}

export function FestiveOfferSection({
  offer,
  products,
  categories,
}: FestiveOfferSectionProps) {
  // If disabled by admin or no products selected, completely disappear from storefront
  if (!offer.enabled || !products || products.length === 0) {
    return null;
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <section
      aria-label="Festive Offers"
      className="relative py-14 sm:py-20 bg-gradient-to-b from-[#FFFDF7] via-[#FDF8EE] to-[#FFFDF7] border-b border-[#E8DCC8]/60 transition-colors"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Subtle Indian Festive Banner Frame */}
        <div className="rounded-3xl border border-[#E8DCC8] bg-[#FFFDF7]/95 p-6 sm:p-8 lg:p-10 shadow-[0_6px_28px_rgba(200,137,26,0.06)]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4 pb-5 border-b border-[#E8DCC8]/60">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F1E3] border border-[#E8DCC8] px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#C8891A] mb-2.5 font-sans">
                <Flame className="h-3.5 w-3.5 text-[#C8891A]" />
                <span>Auspicious Celebrations</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#3B2416]">
                {offer.title || "Festive Offerings"}
              </h2>
              {offer.subtitle ? (
                <p className="mt-1.5 text-xs sm:text-sm text-[#806B57] font-sans font-normal max-w-xl">
                  {offer.subtitle}
                </p>
              ) : null}
            </div>

            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFFDF7] border border-[#E8DCC8] text-xs sm:text-sm font-semibold text-[#3B2416] hover:text-[#C8891A] hover:border-[#C8891A]/50 transition-all font-sans shrink-0 shadow-2xs"
            >
              <span>Explore Festive Catalog</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 text-[#C8891A]" />
            </Link>
          </div>

          {/* Continuous Horizontally Scrollable Festive Product Row */}
          <HorizontalProductRow
            products={products}
            categoryMap={categoryMap}
          />
        </div>
      </div>
    </section>
  );
}
