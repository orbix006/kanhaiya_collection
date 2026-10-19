"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { FestiveOffer, Product, Category } from "@/lib/store";
import type { FestiveCampaign } from "@/lib/data/cms";
import { HorizontalProductRow } from "@/components/ui/horizontal-product-row";
import { ArrowRight, Flame, ChevronLeft, ChevronRight, Pause, Play, Sparkles } from "lucide-react";
import { loadMockFestiveCampaigns } from "@/lib/mock-data/admin-store";

interface FestiveOfferSectionProps {
  offer?: FestiveOffer;
  campaigns?: FestiveCampaign[];
  products: Product[];
  categories: Category[];
}

export function FestiveOfferSection({
  offer,
  campaigns: initialCampaigns,
  products: initialProducts,
  categories,
}: FestiveOfferSectionProps) {
  // Client state synced with mock store
  const [campaigns, setCampaigns] = useState<FestiveCampaign[]>(() => {
    if (initialCampaigns && initialCampaigns.length > 0) {
      return initialCampaigns;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = loadMockFestiveCampaigns();
        if (stored && stored.length > 0) return stored;
      } catch {}
    }
    return [];
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync real-time updates when admin saves campaigns
  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = loadMockFestiveCampaigns();
        if (stored && stored.length > 0) {
          setCampaigns(stored);
        }
      } catch {}
    };

    handleSync();
    window.addEventListener("catalog_updated", handleSync);
    return () => window.removeEventListener("catalog_updated", handleSync);
  }, []);

  // Filter only active campaigns in display order
  const activeCampaigns = useMemo(() => {
    return campaigns
      .filter((c) => c.is_active)
      .sort((a, b) => a.display_order - b.display_order);
  }, [campaigns]);

  // Adjust index if out of bounds
  useEffect(() => {
    if (currentIndex >= activeCampaigns.length && activeCampaigns.length > 0) {
      setCurrentIndex(0);
    }
  }, [activeCampaigns.length, currentIndex]);

  // Automatic slideshow rotation for multiple active campaigns
  useEffect(() => {
    if (activeCampaigns.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeCampaigns.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeCampaigns.length, isPaused]);

  // Fallback for legacy single festive offer if no multi-campaigns are configured
  if (activeCampaigns.length === 0) {
    if (!offer || !offer.enabled || !initialProducts || initialProducts.length === 0) {
      return null; // Completely disappear from storefront if disabled
    }

    const legacyProducts = initialProducts.filter((p) =>
      offer.product_ids?.includes(p.id)
    );
    if (legacyProducts.length === 0) return null;

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return (
      <section
        aria-label="Festive Offers"
        className="relative py-14 sm:py-20 bg-gradient-to-b from-[#FFFDF7] via-[#FDF8EE] to-[#FFFDF7] border-b border-[#E8DCC8]/60 transition-colors"
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#E8DCC8] bg-[#FFFDF7]/95 p-6 sm:p-8 lg:p-10 shadow-[0_6px_28px_rgba(200,137,26,0.06)]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4 pb-5 border-b border-[#E8DCC8]/60">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F1E3] border border-[#E8DCC8] px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#C8891A] mb-2.5 font-sans">
                  <Flame className="h-3.5 w-3.5 text-[#C8891A]" />
                  <span>Auspicious Celebrations</span>
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#3B2416]">
                  {offer.title || "Festive Offerings"}
                </h2>
                {offer.subtitle && (
                  <p className="mt-1.5 text-xs sm:text-sm text-[#806B57] font-sans font-normal max-w-xl">
                    {offer.subtitle}
                  </p>
                )}
              </div>

              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFFDF7] border border-[#E8DCC8] text-xs sm:text-sm font-semibold text-[#3B2416] hover:text-[#C8891A] hover:border-[#C8891A]/50 transition-all font-sans shrink-0 shadow-2xs"
              >
                <span>Explore Festive Catalog</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 text-[#C8891A]" />
              </Link>
            </div>

            <HorizontalProductRow
              products={legacyProducts}
              categoryMap={categoryMap}
            />
          </div>
        </div>
      </section>
    );
  }

  // Active Multi-Campaign Slideshow
  const currentCampaign = activeCampaigns[currentIndex] || activeCampaigns[0];
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // Selected products for this active campaign
  const campaignProductSet = new Set(currentCampaign.product_ids || []);
  const rawCampaignProducts = initialProducts.filter((p) =>
    campaignProductSet.has(p.id)
  );

  // Apply explicit numerical discount ONLY if defined & > 0
  const campaignProducts = rawCampaignProducts.map((p) => {
    if (
      currentCampaign.discount_percent !== null &&
      currentCampaign.discount_percent !== undefined &&
      currentCampaign.discount_percent > 0
    ) {
      const discountedPrice = Math.round(
        p.base_price * (1 - currentCampaign.discount_percent / 100)
      );
      return {
        ...p,
        compare_at_price: p.base_price,
        base_price: discountedPrice,
      };
    }
    return p;
  });

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + activeCampaigns.length) % activeCampaigns.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % activeCampaigns.length);
  };

  return (
    <section
      aria-label="Festive Discount Campaigns"
      className="relative py-14 sm:py-20 bg-gradient-to-b from-[#FFFDF7] via-[#FDF8EE] to-[#FFFDF7] border-b border-[#E8DCC8]/60 transition-colors select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Subtle Indian Festive Banner Frame */}
        <div className="rounded-3xl border border-[#E8DCC8] bg-[#FFFDF7]/95 p-6 sm:p-8 lg:p-10 shadow-[0_6px_28px_rgba(200,137,26,0.06)] space-y-8">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E8DCC8]/60">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F1E3] border border-[#E8DCC8] px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#C8891A] mb-2.5 font-sans">
                <Flame className="h-3.5 w-3.5 text-[#C8891A]" />
                <span>Festive Discount Campaign</span>
                {currentCampaign.discount_tag && (
                  <span className="ml-1 pl-2 border-l border-[#C8891A]/30 text-[#806B57]">
                    {currentCampaign.discount_tag}
                  </span>
                )}
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#3B2416]">
                {currentCampaign.name}
              </h2>
              {currentCampaign.description && (
                <p className="mt-2 text-xs sm:text-sm text-[#806B57] font-sans font-normal max-w-2xl leading-relaxed">
                  {currentCampaign.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Slideshow Controls (rendered if multiple campaigns) */}
              {activeCampaigns.length > 1 && (
                <div className="flex items-center gap-1 bg-[#F8F1E3] p-1 rounded-xl border border-[#E8DCC8]">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous campaign"
                    className="p-1.5 rounded-lg text-[#3B2416] hover:bg-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaused(!isPaused)}
                    aria-label={isPaused ? "Resume slideshow" : "Pause slideshow"}
                    className="p-1.5 rounded-lg text-[#3B2416] hover:bg-white transition-colors cursor-pointer"
                    title={isPaused ? "Resume rotation" : "Pause rotation"}
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next campaign"
                    className="p-1.5 rounded-lg text-[#3B2416] hover:bg-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFFDF7] border border-[#E8DCC8] text-xs sm:text-sm font-semibold text-[#3B2416] hover:text-[#C8891A] hover:border-[#C8891A]/50 transition-all font-sans shrink-0 shadow-2xs"
              >
                <span>Explore All</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 text-[#C8891A]" />
              </Link>
            </div>
          </div>

          {/* Optional Banner Showcase Image (clean non-broken rendering when null) */}
          {currentCampaign.image_url ? (
            <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] min-h-[180px] max-h-[320px] rounded-2xl overflow-hidden border border-[#E8DCC8]/70 shadow-xs">
              <img
                src={currentCampaign.image_url}
                alt={currentCampaign.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-6 right-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  {currentCampaign.discount_percent && (
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-600 text-white font-sans text-xs font-black uppercase tracking-wider mb-1.5 shadow-sm">
                      Special -{currentCampaign.discount_percent}% Off Selected Items
                    </span>
                  )}
                  <h3 className="font-serif text-lg sm:text-2xl font-bold tracking-tight">
                    {currentCampaign.name}
                  </h3>
                </div>
              </div>
            </div>
          ) : (
            /* Clean Devotional Bannerless Card: Never displays broken media tags */
            <div className="relative w-full rounded-2xl overflow-hidden border border-[#E8DCC8] bg-gradient-to-r from-[#2A180E] via-[#3B2416] to-[#2A180E] p-6 sm:p-8 text-[#FFFDF7] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#C8891A] text-xs font-bold uppercase tracking-wider border border-[#C8891A]/30 font-sans">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Sacred Temple Special</span>
                    {currentCampaign.discount_percent && (
                      <span className="ml-1 text-white font-black">
                        · Flat {currentCampaign.discount_percent}% Discount Applied
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-[#FFFDF7]">
                    {currentCampaign.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#F8F1E3]/85 font-sans leading-relaxed">
                    {currentCampaign.description}
                  </p>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8891A] text-white text-xs font-bold font-sans shadow-sm">
                    <span>{campaignProducts.length} Sacred Items Featured</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Horizontally Scrollable Campaign Products */}
          {campaignProducts.length > 0 ? (
            <div className="space-y-2">
              <HorizontalProductRow
                products={campaignProducts}
                categoryMap={categoryMap}
              />
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[#E8DCC8] bg-[#FDF8EE]/60 text-xs text-[#806B57]">
              No products currently assigned to this festive campaign.
            </div>
          )}

          {/* Slide Indicator Dots */}
          {activeCampaigns.length > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {activeCampaigns.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex
                      ? "w-7 bg-[#C8891A]"
                      : "w-2 bg-[#E8DCC8] hover:bg-[#806B57]"
                  }`}
                  aria-label={`Jump to campaign slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
