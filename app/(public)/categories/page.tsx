import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getActiveCategories, getAllProducts } from "@/lib/store";
import { ArrowRight, Compass } from "lucide-react";

export const metadata = {
  title: "Categories | Kanhaiya Collection",
  description:
    "Explore sacred categories of idols, puja thalis, spiritual fragrances, and divine home decor.",
};

export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([
    getActiveCategories(),
    getAllProducts(),
  ]);

  return (
    <div className="min-h-screen bg-[#FFFDF7] py-12 sm:py-16 font-sans">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F8F1E3] border border-[#E8DCC8] px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#C8891A] mb-3">
            <Compass className="h-3.5 w-3.5" />
            <span>Sacred Collections</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#3B2416]">
            Sacred Categories
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#806B57] font-normal leading-relaxed">
            Explore authentic craftsmanship, consecrated brassware, and timeless devotional essentials categorized for your rituals.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {categories.map((cat) => {
            const itemCount = products.filter((p) => p.category_id === cat.id).length;

            return (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group relative flex flex-col rounded-3xl bg-[#FFFDF7] border border-[#E8DCC8] overflow-hidden transition-all duration-300 hover:shadow-[0_12px_32px_rgba(59,36,22,0.08)] hover:border-[#C8891A]/50 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F8F1E3]">
                  <Image
                    src={cat.image_url || "/images/preview-murti.jpg"}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#3B2416]/50 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[#F8F1E3]/90">
                      {itemCount} {itemCount === 1 ? "Product" : "Products"}
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl font-semibold text-white drop-shadow-xs">
                      {cat.name}
                    </h2>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  {cat.description ? (
                    <p className="text-xs sm:text-sm text-[#806B57] leading-relaxed font-normal">
                      {cat.description}
                    </p>
                  ) : null}

                  <div className="mt-auto pt-4 flex items-center text-xs font-semibold text-[#C8891A] gap-1.5 group-hover:translate-x-1 transition-transform">
                    <span>Explore Collection</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
