"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ImageIcon,
  Flame,
  Megaphone,
} from "lucide-react";
import { BannersManager } from "./banners-manager";
import { AnnouncementsManager } from "./announcements-manager";
import { CampaignsManager } from "./campaigns-manager";
import type { Banner, Announcement, FestiveCampaign } from "@/lib/data/cms";
import type { FestiveOffer, Product } from "@/lib/store";

interface HomepageManagerProps {
  initialSections?: any[];
  initialBanners: Banner[];
  initialAnnouncements?: Announcement[];
  initialCampaigns?: FestiveCampaign[];
  initialFestiveOffer?: FestiveOffer;
  products: Product[];
}

export function HomepageManager({
  initialBanners,
  initialAnnouncements = [],
  initialCampaigns = [],
  products,
}: HomepageManagerProps) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");

  // The Homepage Sections page must contain exactly three main management areas:
  // 1. Hero Images and Banners ('hero')
  // 2. Offer and Discount Announcements ('announcements')
  // 3. Festive Discount Campaigns ('campaigns')
  const [localArea, setLocalArea] = useState<"hero" | "announcements" | "campaigns">("hero");

  const activeArea: "hero" | "announcements" | "campaigns" =
    urlTab === "hero" || urlTab === "announcements" || urlTab === "campaigns"
      ? urlTab
      : urlTab === "offers"
      ? "announcements"
      : urlTab === "festive"
      ? "campaigns"
      : localArea;

  return (
    <div className="space-y-6 font-sans">
      {/* EXACTLY THREE MAIN MANAGEMENT AREAS NAVIGATION BAR */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted/50 rounded-2xl border border-border/80">
        {/* Area 1: Hero Images and Banners */}
        <button
          type="button"
          onClick={() => setLocalArea("hero")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeArea === "hero"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-card/60"
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>1. Hero Images & Banners</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary-foreground/20">
            {initialBanners.length}
          </span>
        </button>

        {/* Area 2: Offer and Discount Announcements */}
        <button
          type="button"
          onClick={() => setLocalArea("announcements")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeArea === "announcements"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-card/60"
          }`}
        >
          <Megaphone className="h-4 w-4" />
          <span>2. Offer & Discount Announcements</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary-foreground/20">
            {initialAnnouncements.length}
          </span>
        </button>

        {/* Area 3: Festive Discount Campaigns */}
        <button
          type="button"
          onClick={() => setLocalArea("campaigns")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeArea === "campaigns"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-card/60"
          }`}
        >
          <Flame className="h-4 w-4" />
          <span>3. Festive Discount Campaigns</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary-foreground/20">
            {initialCampaigns.length}
          </span>
        </button>
      </div>

      {/* =====================================================================
          MAIN MANAGEMENT AREA 1: HERO IMAGES AND BANNERS
      ====================================================================== */}
      {activeArea === "hero" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <BannersManager initialBanners={initialBanners} />
        </div>
      )}

      {/* =====================================================================
          MAIN MANAGEMENT AREA 2: OFFER AND DISCOUNT ANNOUNCEMENTS
      ====================================================================== */}
      {activeArea === "announcements" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <AnnouncementsManager initialAnnouncements={initialAnnouncements} />
        </div>
      )}

      {/* =====================================================================
          MAIN MANAGEMENT AREA 3: FESTIVE DISCOUNT CAMPAIGNS
      ====================================================================== */}
      {activeArea === "campaigns" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <CampaignsManager
            initialCampaigns={initialCampaigns}
            products={products}
          />
        </div>
      )}
    </div>
  );
}
