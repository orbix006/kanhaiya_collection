"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/store";
import { ArrowUpRight } from "lucide-react";

interface ProductCardProps {
  product: Product;
  categoryName?: string;
  className?: string;
  onView?: (product: Product) => void;
}

export function ProductCard({
  product,
  categoryName,
  className = "",
  onView,
}: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-IN", {
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

  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.base_price
      ? Math.round(
          ((product.compare_at_price - product.base_price) /
            product.compare_at_price) *
            100
        )
      : null;

  const handleClick = () => {
    // Record view in recently viewed
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("kanhaiya_recently_viewed");
        const list: string[] = stored ? JSON.parse(stored) : [];
        const filtered = list.filter((id) => id !== product.id);
        filtered.unshift(product.id);
        const capped = filtered.slice(0, 10);
        localStorage.setItem("kanhaiya_recently_viewed", JSON.stringify(capped));
        window.dispatchEvent(new Event("recently_viewed_updated"));
      } catch {
        // Non-fatal
      }
    }
    if (onView) {
      onView(product);
    }
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      onClick={handleClick}
      className={`group relative flex flex-col rounded-2xl bg-[#FFFDF7] border border-[#E8DCC8] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(59,36,22,0.08)] hover:border-[#C8891A]/50 hover:-translate-y-1 ${className}`}
    >
      {/* Product Image Area */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F8F1E3]">
        <Image
          src={product.image_url || "/images/preview-murti.jpg"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Subtle Discount Badge */}
        {discountPercent ? (
          <div className="absolute top-3 left-3 rounded-full bg-[#FFFDF7]/95 backdrop-blur-xs px-2.5 py-1 text-[10px] font-semibold tracking-wider text-[#C8891A] border border-[#E8DCC8] shadow-2xs font-sans">
            SAVE {discountPercent}%
          </div>
        ) : null}

        {/* Quick View Corner Icon */}
        <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-[#FFFDF7]/90 backdrop-blur-xs border border-[#E8DCC8] flex items-center justify-center text-[#806B57] opacity-0 group-hover:opacity-100 group-hover:text-[#C8891A] transition-all shadow-2xs">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Category Tag */}
        {categoryName ? (
          <span className="text-[11px] font-medium uppercase tracking-widest text-[#C8891A] font-sans mb-1 line-clamp-1">
            {categoryName}
          </span>
        ) : null}

        {/* Product Title */}
        <h3 className="font-serif text-base sm:text-lg font-medium text-[#3B2416] transition-colors group-hover:text-[#C8891A] line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Price & Status Row */}
        <div className="mt-auto pt-3 flex items-baseline gap-2">
          <span className="font-sans text-base sm:text-lg font-semibold text-[#3B2416]">
            {formattedPrice}
          </span>
          {formattedComparePrice ? (
            <span className="font-sans text-xs text-[#806B57]/70 line-through">
              {formattedComparePrice}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
