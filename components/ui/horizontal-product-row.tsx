"use client";

import React, { useRef, useState, useEffect } from "react";
import { Product } from "@/lib/store";
import { ProductCard } from "@/components/ui/product-card";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalProductRowProps {
  products?: Product[];
  categoryMap?: Map<string, string>;
  onViewProduct?: (product: Product) => void;
}

export function HorizontalProductRow({
  products = [],
  categoryMap = new Map(),
  onViewProduct,
}: HorizontalProductRowProps) {
  const safeProducts = Array.isArray(products) ? products : [];
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
  }, [safeProducts.length]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (safeProducts.length === 0) return null;

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

      {/* Scrollable Track */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory px-1"
      >
        {safeProducts.map((product) => (
          <div
            key={product.id}
            className="w-[180px] xs:w-[220px] sm:w-[260px] shrink-0 snap-start"
          >
            <ProductCard
              product={product}
              categoryName={
                product.category_id ? categoryMap.get(product.category_id) : undefined
              }
              onView={onViewProduct ? () => onViewProduct(product) : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
