"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { Banner } from "@/lib/data/homepage";

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const bannerCount = banners.length;
  const hasMultipleBanners = bannerCount > 1;

  const nextSlide = useCallback(() => {
    if (bannerCount <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % bannerCount);
  }, [bannerCount]);

  const prevSlide = useCallback(() => {
    if (bannerCount <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + bannerCount) % bannerCount);
  }, [bannerCount]);

  // Automatic advance every 5 seconds, pauses when hovered or focused
  useEffect(() => {
    if (!hasMultipleBanners || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [hasMultipleBanners, isPaused, nextSlide]);

  if (bannerCount === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <section
      aria-label="Promotional Banners"
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="relative aspect-[16/9] sm:aspect-[21/9] lg:aspect-[24/9] w-full overflow-hidden rounded-3xl border border-border/60 bg-muted shadow-lg">
        {/* Banner Images */}
        {banners.map((banner, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <Image
                src={banner.image_url}
                alt={banner.title || `Promotional banner ${index + 1}`}
                fill
                priority={index === 0}
                className="object-cover object-center"
              />

              {/* Rich gradient overlay for high contrast and readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent sm:bg-gradient-to-r sm:from-black/80 sm:via-black/40 sm:to-transparent" />

              {/* Banner Caption & Action Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end sm:justify-center p-6 sm:p-10 md:p-14 text-white z-20 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 w-fit px-3 py-1 rounded-full bg-primary/80 backdrop-blur-md text-primary-foreground text-xs font-semibold mb-3 tracking-wide shadow-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Featured Collection</span>
                </div>

                {banner.title && (
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight sm:leading-tight mb-4 text-white drop-shadow-sm">
                    {banner.title}
                  </h2>
                )}

                {banner.link_url && (
                  <div className="mt-2">
                    <Link
                      href={banner.link_url}
                      className="inline-flex items-center justify-center rounded-xl bg-white text-neutral-950 px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-bold shadow-lg hover:bg-neutral-100 hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                      Shop Collection
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Navigation Controls: Rendered ONLY when multiple banners exist */}
        {hasMultipleBanners && (
          <>
            {/* Left Prev Arrow Button */}
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous slide"
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-background/60 hover:bg-background/90 text-foreground backdrop-blur-md border border-white/20 shadow-md transition-all hover:scale-110 active:scale-90"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Right Next Arrow Button */}
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next slide"
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-background/60 hover:bg-background/90 text-foreground backdrop-blur-md border border-white/20 shadow-md transition-all hover:scale-110 active:scale-90"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Pagination Indicator Dots */}
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 z-30 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              {banners.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentIndex(dotIdx)}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    dotIdx === currentIndex
                      ? "w-6 bg-primary"
                      : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
