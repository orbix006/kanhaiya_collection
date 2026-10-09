import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Category } from "@/lib/store";
import { ArrowRight, Compass } from "lucide-react";

interface CategoriesSectionProps {
  categories: Category[];
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section
      aria-label="Shop Categories"
      className="py-14 sm:py-20 lg:py-24 bg-[#FFFDF7] transition-colors"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#C8891A] font-semibold font-sans mb-1">
              <Compass className="h-3.5 w-3.5" />
              <span>Sacred Collections</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#3B2416]">
              Categories
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#806B57] font-sans font-normal max-w-md">
              Discover artisan murtis, puja essentials, temple brassware, and altar textiles.
            </p>
          </div>

          <Link
            href="/categories"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#C8891A] hover:text-[#B37814] transition-colors py-1 font-sans shrink-0"
          >
            <span>View All Categories</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Categories Track (Horizontally scrollable on mobile, grid on desktop) */}
        <div className="flex overflow-x-auto gap-4 pb-3 no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative flex flex-col w-[170px] xs:w-[200px] shrink-0 sm:w-auto rounded-2xl bg-[#FFFDF7] border border-[#E8DCC8] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(59,36,22,0.08)] hover:border-[#C8891A]/50 hover:-translate-y-1"
            >
              {/* Image Box */}
              <div className="relative aspect-square w-full overflow-hidden bg-[#F8F1E3]">
                <Image
                  src={cat.image_url || "/images/preview-murti.jpg"}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3B2416]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Title & Description */}
              <div className="flex flex-col p-3.5 sm:p-4 flex-1">
                <h3 className="font-serif text-base sm:text-lg font-medium text-[#3B2416] group-hover:text-[#C8891A] transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                {cat.description ? (
                  <p className="mt-1 text-xs text-[#806B57] line-clamp-2 leading-relaxed font-sans font-normal">
                    {cat.description}
                  </p>
                ) : null}

                <div className="mt-auto pt-3 flex items-center text-xs font-semibold text-[#C8891A] gap-1 group-hover:translate-x-0.5 transition-transform font-sans">
                  <span>Explore</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
