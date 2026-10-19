import React from "react";
import {
  getHomepageSectionsAdmin,
  getBannersAdmin,
  getAnnouncementsAdmin,
  getFestiveCampaignsAdmin,
} from "@/lib/data/cms";
import { getFestiveOffer, getAllProducts } from "@/lib/store";
import { HomepageManager } from "@/components/admin/cms/homepage-manager";
import { Layers, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Homepage Sections & Content | Kanhaiya Admin",
  description: "Manage Hero Images and Banners, Offer Announcements, and Festive Discount Campaigns.",
};

export default async function AdminHomepageSectionsPage() {
  const [sections, banners, announcements, campaigns, festiveData, products] = await Promise.all([
    getHomepageSectionsAdmin(),
    getBannersAdmin(),
    getAnnouncementsAdmin(),
    getFestiveCampaignsAdmin(),
    getFestiveOffer(),
    getAllProducts(),
  ]);

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Storefront Presentation Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Homepage Sections & Promotional Showcase
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Control the three primary storefront areas: Hero Images & Banners, Offer & Discount Announcements, and Festive Discount Campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border shrink-0">
          <Layers className="h-4 w-4 text-primary" />
          <span>3 Internal Content Areas</span>
        </div>
      </div>

      <HomepageManager
        initialSections={sections}
        initialBanners={banners}
        initialAnnouncements={announcements}
        initialCampaigns={campaigns}
        initialFestiveOffer={festiveData.offer}
        products={products}
      />
    </div>
  );
}
