import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingBag, Eye } from "lucide-react";
import type { ProductItem } from "@/lib/data/homepage";

interface ProductCardProps {
  product: ProductItem;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.base_price
      ? Math.round(
          ((product.compare_at_price - product.base_price) /
            product.compare_at_price) *
            100
        )
      : null;

  const formattedBasePrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(product.base_price);

  const formattedComparePrice = product.compare_at_price
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(product.compare_at_price)
    : null;

  const isLowStock =
    product.stock_quantity > 0 && product.stock_quantity <= 5;
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted/40">
        <Link
          href={`/shop/product/${product.slug}`}
          className="block h-full w-full"
          tabIndex={-1}
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              priority={priority}
              className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted/60 text-muted-foreground">
              <ShoppingBag className="h-10 w-10 stroke-[1.5] opacity-40" />
            </div>
          )}
        </Link>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {discountPercent && discountPercent > 0 && (
            <span className="inline-flex items-center rounded-md bg-destructive px-2 py-0.5 text-[11px] font-bold text-destructive-foreground shadow-xs tracking-tight">
              Save {discountPercent}%
            </span>
          )}
          {product.is_featured_top_seller && (
            <span className="inline-flex items-center rounded-md bg-amber-500/90 text-amber-950 backdrop-blur-xs px-2 py-0.5 text-[11px] font-bold shadow-xs">
              Top Pick
            </span>
          )}
        </div>

        {/* Stock status badge */}
        {isLowStock && (
          <span className="absolute bottom-3 left-3 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 px-2 py-0.5 text-[10px] font-medium backdrop-blur-xs border border-amber-300/50">
            Only {product.stock_quantity} left
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute bottom-3 left-3 rounded-md bg-neutral-900/80 text-white px-2 py-0.5 text-[10px] font-medium backdrop-blur-xs">
            Out of Stock
          </span>
        )}

        {/* Hover Quick Action Buttons */}
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
          <Link
            href={`/shop/product/${product.slug}`}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-background/95 backdrop-blur text-foreground border border-border/80 px-3 py-2 text-xs font-semibold shadow-md hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View Details</span>
          </Link>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-1 flex-col p-4">
        {/* Brand & Ratings */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-1.5">
          {product.brand ? (
            <span className="font-medium tracking-wider uppercase text-[10px] text-muted-foreground/80 truncate">
              {product.brand}
            </span>
          ) : (
            <span />
          )}

          {product.avg_rating > 0 && (
            <div className="flex items-center gap-1 shrink-0 font-medium text-amber-600 dark:text-amber-400">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>{product.avg_rating.toFixed(1)}</span>
              {product.review_count > 0 && (
                <span className="text-muted-foreground/70 text-[11px]">
                  ({product.review_count})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-sm sm:text-base leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          <Link href={`/shop/product/${product.slug}`}>{product.name}</Link>
        </h3>

        {/* Pricing */}
        <div className="mt-auto pt-3 flex items-baseline gap-2">
          <span className="text-base sm:text-lg font-bold text-foreground">
            {formattedBasePrice}
          </span>
          {formattedComparePrice && (
            <span className="text-xs sm:text-sm text-muted-foreground line-through">
              {formattedComparePrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
