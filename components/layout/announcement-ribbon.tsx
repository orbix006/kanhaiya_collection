"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { Announcement } from "@/lib/data/cms";
import { loadMockAnnouncements } from "@/lib/mock-data/admin-store";

const DEFAULT_ANNOUNCEMENT_TEXT =
  "Shubh Deepavali Special: Complimentary Brass Diya Set with sacred orders above ₹2,499. Use code DIWALI108.";

interface AnnouncementRibbonProps {
  initialAnnouncements?: Announcement[];
}

export function AnnouncementRibbon({ initialAnnouncements }: AnnouncementRibbonProps) {
  // 1. Deterministic mount guard to guarantee SSR and client hydration markup match 100%
  const [mounted, setMounted] = useState<boolean>(false);

  // 2. Initialize with deterministic data across Server and Client (no window/localStorage access in initializer)
  const [announcements, setAnnouncements] = useState<Announcement[]>(
    initialAnnouncements && initialAnnouncements.length > 0 ? initialAnnouncements : []
  );

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // 3. Client-side hydration sync: runs only after initial hydration mount
  useEffect(() => {
    setMounted(true);

    const handleSync = () => {
      try {
        const stored = loadMockAnnouncements();
        if (stored && stored.length > 0) {
          setAnnouncements(stored);
        }
      } catch {}
    };

    handleSync();
    window.addEventListener("catalog_updated", handleSync);
    return () => window.removeEventListener("catalog_updated", handleSync);
  }, []);

  const activeAnnouncements = useMemo(() => {
    return announcements
      .filter((a) => a.is_active)
      .sort((a, b) => a.display_order - b.display_order);
  }, [announcements]);

  // Adjust current index if it exceeds active items
  useEffect(() => {
    if (currentIndex >= activeAnnouncements.length && activeAnnouncements.length > 0) {
      setCurrentIndex(0);
    }
  }, [activeAnnouncements.length, currentIndex]);

  // Auto-advance rotation timer
  useEffect(() => {
    if (!mounted || activeAnnouncements.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [mounted, activeAnnouncements.length, isPaused]);

  // 4. SSR and Initial Hydration Placeholder:
  // Render matching static structure with identical accessibility attributes (role="region", aria-label="...")
  if (!mounted) {
    const fallbackText =
      (initialAnnouncements && initialAnnouncements[0]?.text) || DEFAULT_ANNOUNCEMENT_TEXT;

    return (
      <div
        role="region"
        aria-label="Announcements & Special Offers"
        className="relative z-50 w-full bg-gradient-to-r from-[#2A180E] via-[#3B2416] to-[#2A180E] text-[#FFFDF7] border-b border-[#C8891A]/30 py-2 px-3 sm:px-6 transition-all font-sans select-none"
      >
        <div className="container mx-auto max-w-7xl flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center shrink-0">
            <div className="w-5" />
          </div>
          <div className="flex-1 text-center min-w-0 px-1 sm:px-4">
            <p className="text-[11px] sm:text-xs md:text-[13px] font-medium leading-snug tracking-wide text-[#FDF8EE] break-words line-clamp-2 sm:line-clamp-1">
              {fallbackText}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="w-5" />
          </div>
        </div>
      </div>
    );
  }

  // 5. Post-mount: if no announcements exist or are all inactive, hide cleanly
  if (activeAnnouncements.length === 0) {
    return null;
  }

  const current = activeAnnouncements[currentIndex] || activeAnnouncements[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
  };

  return (
    <div
      role="region"
      aria-label="Announcements & Special Offers"
      className="relative z-50 w-full bg-gradient-to-r from-[#2A180E] via-[#3B2416] to-[#2A180E] text-[#FFFDF7] border-b border-[#C8891A]/30 py-2 px-3 sm:px-6 transition-all font-sans select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container mx-auto max-w-7xl flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Previous Navigation Control (rendered when multiple announcements exist) */}
        <div className="flex items-center shrink-0">
          {activeAnnouncements.length > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous announcement"
              className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="w-5" />
          )}
        </div>

        {/* Center: Text-Only Announcement Content */}
        <div className="flex-1 text-center min-w-0 px-1 sm:px-4">
          <p className="text-[11px] sm:text-xs md:text-[13px] font-medium leading-snug tracking-wide text-[#FDF8EE] break-words line-clamp-2 sm:line-clamp-1">
            {current.text}
          </p>
        </div>

        {/* Right: Pause/Resume Toggle + Next Navigation Control */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {activeAnnouncements.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                aria-label={isPaused ? "Resume auto-rotation" : "Pause auto-rotation"}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isPaused ? "Resume rotation" : "Pause rotation"}
              >
                {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next announcement"
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
