"use client";

import React, { useRef, useState, useEffect } from "react";
import { Product } from "@/lib/store";
import { ProductCard } from "@/components/ui/product-card";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalProductRowProps {
  products: Product[];
  categoryMap: Map<string, string>;
  onViewProduct?: (product: Product) => void;
}

export function HorizontalProductRow({
  products,
  categoryMap,
  onViewProduct,
}: HorizontalProductRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [products.length]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="relative group/row w-full">
      {/* Desktop Navigation Arrow - Left */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="hidden md:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-[#FFFDF7]/95 border border-[#E8DCC8] text-[#3B2416] hover:text-[#C8891A] hover:bg-[#FFFDF7] shadow-md transition-all hover:scale-105"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Desktop Navigation Arrow - Right */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-[#FFFDF7]/95 border border-[#E8DCC8] text-[#3B2416] hover:text-[#C8891A] hover:bg-[#FFFDF7] shadow-md transition-all hover:scale-105"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Horizontal Scroll Track (Keeps all products in ONE continuous horizontal row) */}
      <div
        ref={scrollContainerRef}
        className="flex w-full overflow-x-auto overflow-y-hidden gap-3.5 sm:gap-5 pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[185px] sm:w-[225px] md:w-[245px] lg:w-[265px] shrink-0 snap-start"
          >
            <ProductCard
              product={product}
              categoryName={categoryMap.get(product.category_id)}
              onView={onViewProduct}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
