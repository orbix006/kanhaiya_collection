"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Banner } from "@/lib/store";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

interface HeroBannerProps {
  banners: Banner[];
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeBanners = banners && banners.length > 0 ? banners : [];

  // Autoplay carousel (6s interval, pauses on hover)
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeBanners.length, isPaused]);

  if (activeBanners.length === 0) {
    return null;
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const currentBanner = activeBanners[currentIndex];

  return (
    <section
      aria-label="Promotional Campaign Banners"
      className="relative w-full overflow-hidden bg-[#1C120C] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner Viewport: Large, Immersive E-Commerce Campaign Slider (70-80vh on desktop) */}
      <div className="relative w-full h-[520px] sm:h-[600px] md:h-[680px] lg:h-[75vh] lg:min-h-[580px] lg:max-h-[760px] overflow-hidden">
        {activeBanners.map((banner, index) => {
          const isActive = index === currentIndex;
          const mobileSrc = banner.mobile_image_url || banner.image_url;

          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Optional Clickable Full-Banner Destination */}
              <Link
                href={banner.cta_link || "/shop"}
                className="absolute inset-0 block cursor-pointer z-10"
                tabIndex={isActive ? 0 : -1}
                aria-label={banner.title || "Promotional Banner"}
              >
                {/* 1. Desktop Campaign Image (hidden on small mobile if mobile image exists) */}
                <div className={`relative w-full h-full ${banner.mobile_image_url ? "hidden sm:block" : "block"}`}>
                  <Image
                    src={banner.image_url || "/images/janmashtami-campaign.jpg"}
                    alt={banner.title || "Campaign Banner"}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover object-center"
                  />
                </div>

                {/* 2. Mobile-Specific Campaign Image (displayed on mobile screens if provided) */}
                {banner.mobile_image_url && (
                  <div className="relative w-full h-full sm:hidden">
                    <Image
                      src={mobileSrc}
                      alt={banner.title || "Mobile Campaign Banner"}
                      fill
                      priority={index === 0}
                      sizes="100vw"
                      className="object-cover object-center"
                    />
                  </div>
                )}

                {/* Subtle Cinematic Vignette Overlay (Leaves 85% of image completely clear) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent sm:bg-gradient-to-r sm:from-black/70 sm:via-black/30 sm:to-transparent" />

                {/* Concise Campaign Announcement & CTA Overlay */}
                <div className="absolute inset-0 z-20 container mx-auto max-w-7xl px-6 sm:px-10 lg:px-14 flex items-end sm:items-center pb-14 sm:pb-0">
                  <div className="max-w-xl text-left text-white space-y-2.5 sm:space-y-3.5">
                    {/* Campaign Title */}
                    {banner.title && (
                      <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#FFFDF7] leading-[1.1] drop-shadow-md">
                        {banner.title}
                      </h2>
                    )}

                    {/* Concise Subtitle */}
                    {banner.subtitle && (
                      <p className="font-sans text-xs sm:text-base lg:text-lg text-[#F8F1E3]/90 font-normal leading-relaxed max-w-lg drop-shadow-xs line-clamp-2">
                        {banner.subtitle}
                      </p>
                    )}

                    {/* Prominent Campaign CTA */}
                    {banner.cta_text && (
                      <div className="pt-2 sm:pt-4">
                        <span className="inline-flex items-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-[#C8891A] text-white font-sans text-xs sm:text-sm font-semibold hover:bg-[#B37814] transition-all shadow-[0_4px_18px_rgba(200,137,26,0.4)] group-hover:scale-105">
                          <span>{banner.cta_text}</span>
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}

        {/* Carousel Prev & Next Controls: [ ← ] [ → ] */}
        {activeBanners.length > 1 && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none container mx-auto max-w-7xl px-3 sm:px-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous promotional banner"
              className="pointer-events-auto h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-xs border border-white/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next promotional banner"
              className="pointer-events-auto h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-xs border border-white/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        )}

        {/* Minimal Indicators: ● ○ ○ */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-5 inset-x-0 z-30 flex items-center justify-center gap-2 pointer-events-auto">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to promotional banner ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex
                    ? "w-7 h-2 bg-[#C8891A] shadow-xs"
                    : "w-2 h-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
