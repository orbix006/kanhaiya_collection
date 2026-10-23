import React from "react";
import {
  getActiveBanners,
  getActiveCategories,
  getAllProducts,
  getBestsellerProducts,
  getNewlyAddedProducts,
  getFestiveOffer,
} from "@/lib/store";
import { getActiveFestiveCampaigns } from "@/lib/data/cms";
import { getActiveTestimonials } from "@/lib/data/homepage";
import { HeroBanner } from "@/components/home/hero-banner";
import { RecentlyViewed } from "@/components/home/recently-viewed";
import { BestsellerSection } from "@/components/home/bestseller-section";
import { NewlyAddedSection } from "@/components/home/newly-added-section";
import { FestiveOfferSection } from "@/components/home/festive-offer-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";

export const revalidate = 0; // Dynamic server rendering for live admin updates

export const metadata = {
  title: "Kanhaiya Collection — Sacred Devotion & Craft",
  description:
    "Explore handcrafted brass idols, akhand diyas, artisan puja thalis, and sacred temple offerings for your home mandir.",
};

export default async function HomePage() {
  // Fetch active admin-controlled datasets efficiently
  const [
    banners,
    categories,
    allProducts,
    bestsellers,
    newlyAdded,
    festiveOfferData,
    festiveCampaigns,
    testimonials,
  ] = await Promise.all([
    getActiveBanners(),
    getActiveCategories(),
    getAllProducts(),
    getBestsellerProducts(8),
    getNewlyAddedProducts(10),
    getFestiveOffer(),
    getActiveFestiveCampaigns(),
    getActiveTestimonials(),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFDF7] text-[#3B2416] font-sans w-full max-w-full overflow-x-hidden">
      {/* 1. Dynamic Multi-Banner Section */}
      <HeroBanner banners={banners} />

      {/* 2. Recently Viewed (Last 10 opened products, hidden if empty) */}
      <RecentlyViewed allProducts={allProducts} categories={categories} />

      {/* 3. Bestseller (Top performing products by sales / views) */}
      <BestsellerSection products={bestsellers} categories={categories} />

      {/* 4. Newly Added (Latest products sorted by created_at desc) */}
      <NewlyAddedSection products={newlyAdded} categories={categories} />

      {/* 5. Festive Discount Campaigns (Slideshow of active campaigns, hidden if disabled) */}
      <FestiveOfferSection
        offer={festiveOfferData.offer}
        campaigns={festiveCampaigns}
        products={allProducts}
        categories={categories}
      />

      {/* 6. Categories (All active categories) */}
      <CategoriesSection categories={categories} />

      {/* 7. Customer Reviews & Ratings (Wall of Love) */}
      <TestimonialsSection testimonials={testimonials} />
    </div>
  );
}
