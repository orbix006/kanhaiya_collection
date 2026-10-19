"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Layers,
  ExternalLink,
  Play,
  Pause,
} from "lucide-react";
import {
  saveBannerAction,
  deleteBannerAction,
  toggleBannerStatusAction,
  BannerPayload,
} from "@/app/(admin)/admin/cms/actions";
import {
  loadMockBanners,
  saveMockBanner,
  deleteMockBanner,
  toggleMockBannerStatus,
  reorderMockBanners,
} from "@/lib/mock-data/admin-store";
import type { Banner } from "@/lib/data/cms";

interface BannersManagerProps {
  initialBanners: Banner[];
}

export function BannersManager({ initialBanners }: BannersManagerProps) {
  const [banners, setBanners] = useState<Banner[]>(() => {
    return [...initialBanners].sort((a, b) => a.display_order - b.display_order);
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);

  // Form State
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Interactive Carousel Preview State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [previewMode, setPreviewMode] = useState<"active" | "inactive">("active");
  const [inactiveIndex, setInactiveIndex] = useState(0);
  const [objectFitSetting, setObjectFitSetting] = useState<"cover" | "contain">("cover");
  const [modalObjectFit, setModalObjectFit] = useState<"cover" | "contain">("cover");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Hydrate on mount from mock store
  const refreshFromStore = () => {
    try {
      const stored = loadMockBanners();
      if (stored && stored.length > 0) {
        setBanners(stored);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    refreshFromStore();
  }, []);

  // Filter active banners for carousel preview in storefront sequence order
  const activeBanners = useMemo(() => {
    return banners
      .filter((b) => b.is_active)
      .sort((a, b) => a.display_order - b.display_order);
  }, [banners]);

  // Filter inactive / scheduled / staged banners for separate preview inspection
  const inactiveBanners = useMemo(() => {
    return banners
      .filter((b) => !b.is_active)
      .sort((a, b) => a.display_order - b.display_order);
  }, [banners]);

  // Adjust carousel index if it exceeds active banners count
  useEffect(() => {
    if (carouselIndex >= activeBanners.length && activeBanners.length > 0) {
      setCarouselIndex(0);
    }
  }, [activeBanners.length, carouselIndex]);

  // Adjust inactive index if it exceeds inactive banners count
  useEffect(() => {
    if (inactiveIndex >= inactiveBanners.length && inactiveBanners.length > 0) {
      setInactiveIndex(0);
    }
  }, [inactiveBanners.length, inactiveIndex]);

  // Optional auto-playing carousel timer
  useEffect(() => {
    if (!isAutoPlaying || activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, activeBanners.length]);

  const nextSlide = () => {
    if (activeBanners.length <= 1) return;
    setCarouselIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const prevSlide = () => {
    if (activeBanners.length <= 1) return;
    setCarouselIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const openCreateModal = () => {
    setActiveBanner(null);
    setImageUrl("");
    setTitle("");
    setLinkUrl("");
    setDisplayOrder(banners.length + 1);
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setActiveBanner(banner);
    setImageUrl(banner.image_url);
    setTitle(banner.title || "");
    setLinkUrl(banner.link_url || "");
    setDisplayOrder(banner.display_order);
    setIsActive(banner.is_active);
    setFormError(null);
    setModalOpen(true);
  };

  // Reorder banner quick handlers
  const moveBanner = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === banners.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...banners];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const updated = reordered.map((b, idx) => ({
      ...b,
      display_order: idx + 1,
    }));

    setBanners(updated);
    reorderMockBanners(updated.map((b) => b.id));
    setToastMessage({
      text: "Banner order resequenced successfully.",
      type: "success",
    });
  };

  // Validation & Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanImageUrl = imageUrl.trim();
    if (!cleanImageUrl) {
      setFormError("Banner image URL is required.");
      return;
    }

    if (
      !cleanImageUrl.startsWith("http://") &&
      !cleanImageUrl.startsWith("https://") &&
      !cleanImageUrl.startsWith("/")
    ) {
      setFormError("Banner image URL must start with http://, https://, or /");
      return;
    }

    const cleanLinkUrl = linkUrl.trim();
    if (
      cleanLinkUrl &&
      !cleanLinkUrl.startsWith("/") &&
      !cleanLinkUrl.startsWith("http://") &&
      !cleanLinkUrl.startsWith("https://")
    ) {
      setFormError(
        "Destination link must be a valid relative path (/shop...) or full URL (https://...)."
      );
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: BannerPayload = {
      id: activeBanner?.id,
      image_url: cleanImageUrl,
      title: title.trim() || null,
      link_url: cleanLinkUrl || null,
      display_order: Number(displayOrder) || 1,
      is_active: isActive,
    };

    try {
      // 1. Direct local mock store save
      saveMockBanner(payload);

      // 2. Server action sync
      const res = await saveBannerAction(payload);
      if (res.error) {
        setFormError(res.error);
      } else {
        refreshFromStore();
        setToastMessage({
          text: res.message || "Banner saved successfully.",
          type: "success",
        });
        setModalOpen(false);
      }
    } catch {
      setFormError("Failed to save banner. Please verify form inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (banner: Banner) => {
    const updatedStatus = !banner.is_active;
    try {
      toggleMockBannerStatus(banner.id);
      const res = await toggleBannerStatusAction(banner.id, updatedStatus);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        refreshFromStore();
        setToastMessage({
          text: `Banner ${updatedStatus ? "activated" : "hidden"} successfully.`,
          type: "success",
        });
      }
    } catch {
      setToastMessage({ text: "Failed to toggle banner status.", type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!bannerToDelete) return;
    try {
      deleteMockBanner(bannerToDelete.id);
      const res = await deleteBannerAction(bannerToDelete.id);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        refreshFromStore();
        setToastMessage({ text: "Banner removed successfully.", type: "success" });
        setDeleteModalOpen(false);
        setBannerToDelete(null);
      }
    } catch {
      setToastMessage({ text: "Failed to delete banner.", type: "error" });
    }
  };

  const currentSlide = activeBanners[carouselIndex];

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Hero Promotional CMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Hero Carousel Banners
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Create, edit, activate, and arrange promotional hero slides. Multiple active rows form an auto-advancing carousel with navigation arrows on the storefront.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Notification Toast */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-semibold transition-all ${
            toastMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* INTERACTIVE CAROUSEL ARRANGEMENT PREVIEW */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-border/60">
          <div>
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-primary" />
              <span>Interactive Hero Slideshow & Scheduling Preview</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live preview rendered in responsive hero aspect ratio. Devotees experience active slides in strict display order.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Mode Switcher: Active Slides vs Inactive / Staged Banners */}
            <div className="flex items-center p-1 bg-muted rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setPreviewMode("active")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewMode === "active"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Active Slides ({activeBanners.length})
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("inactive")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewMode === "inactive"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Next Inactive / Staged ({inactiveBanners.length})
              </button>
            </div>

            {/* Object Fit Toggle */}
            <button
              type="button"
              onClick={() => setObjectFitSetting(objectFitSetting === "cover" ? "contain" : "cover")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted cursor-pointer transition-colors"
              title="Toggle between fill crop and contain without stretching"
            >
              <span>Fit:</span>
              <span className="text-primary uppercase font-mono text-[11px]">{objectFitSetting}</span>
            </button>

            {previewMode === "active" && activeBanners.length > 1 && (
              <button
                type="button"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  isAutoPlaying
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {isAutoPlaying ? (
                  <>
                    <Pause className="h-3 w-3" /> Auto-Cycle On
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" /> Auto-Cycle
                  </>
                )}
              </button>
            )}

            <span className="bg-muted px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-bold text-muted-foreground border border-border/60">
              {previewMode === "active"
                ? activeBanners.length > 0
                  ? `Slide ${carouselIndex + 1} of ${activeBanners.length}`
                  : "0 Active Slides"
                : inactiveBanners.length > 0
                ? `Staged ${inactiveIndex + 1} of ${inactiveBanners.length}`
                : "0 Inactive Banners"}
            </span>
          </div>
        </div>

        {/* Viewport Render: Active Mode */}
        {previewMode === "active" && (
          <>
            {activeBanners.length > 0 && currentSlide ? (
              <div className="relative w-full aspect-[21/9] min-h-[240px] max-h-[380px] rounded-2xl overflow-hidden bg-stone-950 group border border-border/80 shadow-md">
                {/* Background Image */}
                <img
                  src={currentSlide.image_url}
                  alt={currentSlide.title || "Hero banner preview"}
                  style={{ objectFit: objectFitSetting }}
                  className="w-full h-full transition-transform duration-700 group-hover:scale-102"
                />

                {/* Subtle Gradient Overlay for Legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 pointer-events-none" />

                {/* Slide Title & CTA Link */}
                <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end text-white max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/80 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase tracking-wider mb-2 w-fit">
                    <span>Storefront Slide #{currentSlide.display_order}</span>
                  </div>
                  <h2 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug drop-shadow-md">
                    {currentSlide.title || "Sacred Temple Collection & Mandir Essentials"}
                  </h2>

                  {currentSlide.link_url && (
                    <div className="mt-4 flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black font-extrabold text-xs shadow-md">
                        <span>Explore Collection</span>
                        <ExternalLink className="h-3 w-3" />
                      </span>
                      <span className="text-[11px] text-white/70 font-mono">
                        Target: {currentSlide.link_url}
                      </span>
                    </div>
                  )}
                </div>

                {/* Navigation Arrows */}
                {activeBanners.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevSlide}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer border border-white/20 shadow-md"
                      title="Previous Slide"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextSlide}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer border border-white/20 shadow-md"
                      title="Next Slide"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Indicator Dots */}
                {activeBanners.length > 1 && (
                  <div className="absolute bottom-4 right-6 flex items-center gap-2">
                    {activeBanners.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIndex(i)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          i === carouselIndex
                            ? "w-6 bg-primary"
                            : "w-2 bg-white/50 hover:bg-white"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
                <ImageIcon className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                <h4 className="font-bold text-foreground text-sm">No Active Banners Available</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Activate at least one banner below or create a new hero banner to populate the storefront carousel.
                </p>
              </div>
            )}
          </>
        )}

        {/* Viewport Render: Inactive / Staged Mode */}
        {previewMode === "inactive" && (
          <>
            {inactiveBanners.length > 0 ? (
              (() => {
                const staged = inactiveBanners[inactiveIndex] || inactiveBanners[0];
                return (
                  <div className="space-y-3">
                    <div className="relative w-full aspect-[21/9] min-h-[240px] max-h-[380px] rounded-2xl overflow-hidden bg-stone-950 group border border-dashed border-amber-500/50 shadow-md">
                      <img
                        src={staged.image_url}
                        alt={staged.title || "Inactive staged banner preview"}
                        style={{ objectFit: objectFitSetting }}
                        className="w-full h-full opacity-85"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/25 pointer-events-none" />

                      <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/90 text-stone-950 text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Staged Inactive Banner Preview</span>
                      </div>

                      <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end text-white max-w-2xl">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] font-mono font-bold uppercase tracking-wider mb-2 w-fit">
                          <span>Display Order #{staged.display_order} (Scheduled / Inactive)</span>
                        </div>
                        <h2 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug drop-shadow-md">
                          {staged.title || "Untitled Staged Banner"}
                        </h2>
                        {staged.link_url && (
                          <p className="text-xs text-white/70 font-mono mt-1">
                            Destination: {staged.link_url}
                          </p>
                        )}

                        <div className="mt-4 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggle(staged)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md cursor-pointer transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Publish to Storefront Now</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(staged)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-xs cursor-pointer transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit Banner Details</span>
                          </button>
                        </div>
                      </div>

                      {/* Inactive Banner Switcher Arrows */}
                      {inactiveBanners.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setInactiveIndex((prev) => (prev - 1 + inactiveBanners.length) % inactiveBanners.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer border border-white/20 shadow-md"
                            title="Previous Inactive Banner"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setInactiveIndex((prev) => (prev + 1) % inactiveBanners.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer border border-white/20 shadow-md"
                            title="Next Inactive Banner"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground italic">
                      * NOTE: Scheduling in this development phase uses local mock staging status. The schema table banners does not contain scheduling columns; publishing toggles is_active directly.
                    </p>
                  </div>
                );
              })()
            ) : (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/80 mx-auto mb-2" />
                <h4 className="font-bold text-foreground text-sm">No Inactive or Scheduled Banners</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  All created banners are currently active and visible on the storefront. Create or deactivate a banner to stage it here.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* BANNERS MANAGEMENT TABLE */}
      <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-foreground text-base">
              All Configured Banners ({banners.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reorder display sequence, edit image URLs, update destination links, or toggle visibility.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/70 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Order</th>
                <th className="py-3 px-4 w-28">Preview</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Destination Link</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {banners.map((banner, index) => (
                <tr
                  key={banner.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    !banner.is_active ? "opacity-60 bg-muted/10" : ""
                  }`}
                >
                  {/* Order Controls */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveBanner(index, "up")}
                          disabled={index === 0}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBanner(index, "down")}
                          disabled={index === banners.length - 1}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-mono font-bold text-sm text-foreground ml-1">
                        {banner.display_order}
                      </span>
                    </div>
                  </td>

                  {/* Thumbnail Preview */}
                  <td className="py-3 px-4">
                    <div className="h-14 w-24 rounded-xl border border-border/80 overflow-hidden bg-muted shadow-xs">
                      <img
                        src={banner.image_url}
                        alt={banner.title || "Banner"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </td>

                  {/* Title & Caption */}
                  <td className="py-3 px-4">
                    <span className="font-bold text-foreground text-sm block">
                      {banner.title || (
                        <span className="italic text-muted-foreground font-normal">
                          Untitled Hero Banner
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono mt-0.5 block truncate max-w-sm">
                      {banner.image_url}
                    </span>
                  </td>

                  {/* Destination Link */}
                  <td className="py-3 px-4">
                    {banner.link_url ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-foreground font-mono text-[11px] border border-border/60">
                        <LinkIcon className="h-3 w-3 text-primary shrink-0" />
                        <span className="truncate max-w-[180px]">{banner.link_url}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">— None —</span>
                    )}
                  </td>

                  {/* Active Status Switch */}
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(banner)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                        banner.is_active
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                      }`}
                    >
                      {banner.is_active ? (
                        <>
                          <Eye className="h-3 w-3" /> Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" /> Hidden
                        </>
                      )}
                    </button>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(banner)}
                        className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        title="Edit Banner"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBannerToDelete(banner);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                        title="Delete Banner"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT BANNER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg p-6 sm:p-7 rounded-3xl border border-border/80 bg-card shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <h3 className="font-black text-lg text-foreground">
                {activeBanner ? "Edit Hero Banner" : "Add New Hero Banner"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Image URL Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">
                  Image URL <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... or /banners/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 text-xs"
                  required
                />
                <span className="text-[11px] text-muted-foreground block">
                  Must be a valid high-resolution image URL (starts with http://, https://, or /).
                </span>
              </div>

              {/* Real-time Pre-Save Image Preview with Aspect Ratio & Fit Controls */}
              {imageUrl.trim() && (
                <div className="space-y-1.5 p-3 rounded-2xl border border-border/80 bg-muted/30">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-muted-foreground uppercase flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-primary" />
                      Pre-Save Live Image Preview
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setModalObjectFit("cover")}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                          modalObjectFit === "cover"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Cover
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalObjectFit("contain")}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                          modalObjectFit === "contain"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Contain
                      </button>
                    </div>
                  </div>
                  <div className="relative aspect-[21/9] w-full rounded-xl border border-border overflow-hidden bg-black/90">
                    <img
                      src={imageUrl.trim()}
                      alt="Pre-save banner preview"
                      style={{ objectFit: modalObjectFit }}
                      className="h-full w-full"
                      onError={(e) => {
                        (e.target as any).src =
                          "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono">
                      Aspect Ratio 21:9 — Fit: {modalObjectFit}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Verifies that the banner renders cleanly without unexpected distortion or vertical stretching.
                  </p>
                </div>
              )}

              {/* Title / Caption */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">
                  Title / Caption (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Divine Brass Radha Krishna Murtis"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 text-xs"
                />
              </div>

              {/* Destination Link URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">
                  Destination Link URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /shop?category=idols or https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 text-xs"
                />
                <span className="text-[11px] text-muted-foreground block">
                  Relative catalog route (e.g. /shop) or external link.
                </span>
              </div>

              {/* Display Order & Active Toggle */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="font-bold text-foreground">Active Status</label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> Hidden
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/70">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>{activeBanner ? "Update Banner" : "Save Banner"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && bannerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl border border-border/80 bg-card shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <div className="h-10 w-10 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-foreground">
                  Permanently Delete Banner?
                </h3>
                <span className="text-xs text-muted-foreground">
                  {bannerToDelete.title || bannerToDelete.id}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This banner will be permanently removed from the storefront hero rotation. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setBannerToDelete(null);
                }}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 cursor-pointer shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
