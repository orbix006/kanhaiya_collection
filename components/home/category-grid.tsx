import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Layers } from "lucide-react";
import type { Category } from "@/lib/data/homepage";

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section aria-label="Shop by Category" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <Layers className="h-3.5 w-3.5" />
            <span>Curated Collections</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Shop by Category
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Explore authentic handloom textiles, designer couture, and handcrafted accessories.
          </p>
        </div>

        <Link
          href="/shop"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
        >
          <span>All Categories</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, idx) => (
          <Link
            key={cat.id}
            href={`/shop?category=${encodeURIComponent(cat.slug)}`}
            className="group relative flex flex-col justify-end aspect-[4/3] sm:aspect-[16/11] overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Category Image */}
            {cat.image_url ? (
              <Image
                src={cat.image_url}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={idx < 3}
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-muted to-primary/10" />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent transition-opacity duration-300" />

            {/* Content Details */}
            <div className="relative z-10 p-6 text-white">
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-1">
                Collection
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1.5 group-hover:text-amber-200 transition-colors">
                {cat.name}
              </h3>
              {cat.description && (
                <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 max-w-sm mb-3">
                  {cat.description}
                </p>
              )}

              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                <span>Explore Collection</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
