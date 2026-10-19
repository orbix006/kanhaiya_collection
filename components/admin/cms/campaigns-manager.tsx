"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Flame,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Loader2,
  Layers,
  Sparkles,
  ShoppingBag,
  Tag,
  Search,
  Check,
} from "lucide-react";
import type { FestiveCampaign } from "@/lib/data/cms";
import type { Product } from "@/lib/store";
import {
  loadMockFestiveCampaigns,
  saveMockFestiveCampaign,
  deleteMockFestiveCampaign,
  toggleMockFestiveCampaignStatus,
  reorderMockFestiveCampaigns,
  loadMockProducts,
} from "@/lib/mock-data/admin-store";
import {
  saveFestiveCampaignAction,
  deleteFestiveCampaignAction,
  toggleFestiveCampaignStatusAction,
  reorderFestiveCampaignsAction,
} from "@/app/(admin)/admin/cms/actions";

interface CampaignsManagerProps {
  initialCampaigns?: FestiveCampaign[];
  products: Product[];
}

export function CampaignsManager({ initialCampaigns = [], products: initialProducts }: CampaignsManagerProps) {
  const [campaigns, setCampaigns] = useState<FestiveCampaign[]>(() => {
    return [...initialCampaigns].sort((a, b) => a.display_order - b.display_order);
  });

  const [allProducts, setAllProducts] = useState<Product[]>(() => initialProducts);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<FestiveCampaign | null>(null);
  const [itemToDelete, setItemToDelete] = useState<FestiveCampaign | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formProductIds, setFormProductIds] = useState<string[]>([]);
  const [formDiscountTag, setFormDiscountTag] = useState("");
  const [formDiscountPercent, setFormDiscountPercent] = useState<string>("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product Picker State
  const [productSearch, setProductSearch] = useState("");

  // Live Slideshow Preview State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshFromStore = () => {
    try {
      const stored = loadMockFestiveCampaigns();
      if (stored && stored.length > 0) {
        setCampaigns(stored);
      }
      const p = loadMockProducts();
      if (p && p.length > 0) {
        setAllProducts(p as any);
      }
    } catch {}
  };

  useEffect(() => {
    refreshFromStore();
  }, []);

  const activeCampaigns = useMemo(() => {
    return campaigns
      .filter((c) => c.is_active)
      .sort((a, b) => a.display_order - b.display_order);
  }, [campaigns]);

  // Adjust preview index if active campaigns change
  useEffect(() => {
    if (carouselIndex >= activeCampaigns.length && activeCampaigns.length > 0) {
      setCarouselIndex(0);
    }
  }, [activeCampaigns.length, carouselIndex]);

  // Automatic slideshow rotation for active campaigns
  useEffect(() => {
    if (!isAutoCycling || activeCampaigns.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % activeCampaigns.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isAutoCycling, activeCampaigns.length]);

  const nextSlide = () => {
    if (activeCampaigns.length <= 1) return;
    setCarouselIndex((prev) => (prev + 1) % activeCampaigns.length);
  };

  const prevSlide = () => {
    if (activeCampaigns.length <= 1) return;
    setCarouselIndex((prev) => (prev - 1 + activeCampaigns.length) % activeCampaigns.length);
  };

  const openCreateModal = () => {
    setActiveItem(null);
    setFormName("");
    setFormDescription("");
    setFormImageUrl("");
    setFormProductIds([]);
    setFormDiscountTag("");
    setFormDiscountPercent("");
    setFormIsActive(true);
    setFormOrder(campaigns.length + 1);
    setProductSearch("");
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (item: FestiveCampaign) => {
    setActiveItem(item);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormImageUrl(item.image_url || "");
    setFormProductIds([...item.product_ids]);
    setFormDiscountTag(item.discount_tag || "");
    setFormDiscountPercent(item.discount_percent ? String(item.discount_percent) : "");
    setFormIsActive(item.is_active);
    setFormOrder(item.display_order);
    setProductSearch("");
    setFormError(null);
    setModalOpen(true);
  };

  // Reorder campaigns
  const handleMove = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === campaigns.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...campaigns];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const updated = reordered.map((c, idx) => ({
      ...c,
      display_order: idx + 1,
    }));

    setCampaigns(updated);
    const orderedIds = updated.map((c) => c.id);
    reorderMockFestiveCampaigns(orderedIds);
    await reorderFestiveCampaignsAction(orderedIds);
    showToast("Festive campaigns reordered successfully.");
  };

  // Product toggle in modal
  const handleProductToggle = (productId: string) => {
    setFormProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Submit Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) {
      setFormError("Campaign name is required.");
      return;
    }

    const cleanDescription = formDescription.trim();
    if (!cleanDescription) {
      setFormError("Offer or discount description is required.");
      return;
    }

    let discountPercent: number | null = null;
    if (formDiscountPercent.trim()) {
      const num = Number(formDiscountPercent.trim());
      if (isNaN(num) || num < 0 || num > 90) {
        setFormError("Discount percentage must be a valid number between 0% and 90%.");
        return;
      }
      discountPercent = num > 0 ? num : null;
    }

    const cleanImageUrl = formImageUrl.trim() || null;
    if (
      cleanImageUrl &&
      !cleanImageUrl.startsWith("http://") &&
      !cleanImageUrl.startsWith("https://") &&
      !cleanImageUrl.startsWith("/")
    ) {
      setFormError("Banner image URL must start with http://, https://, or /");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      id: activeItem?.id,
      name: cleanName,
      description: cleanDescription,
      image_url: cleanImageUrl,
      product_ids: formProductIds,
      discount_tag: formDiscountTag.trim() || null,
      discount_percent: discountPercent,
      is_active: formIsActive,
      display_order: Number(formOrder) || 1,
    };

    try {
      // 1. Direct local mock store save
      saveMockFestiveCampaign(payload);

      // 2. Server action sync
      const res = await saveFestiveCampaignAction(payload);
      if (res.error) {
        setFormError(res.error);
      } else {
        refreshFromStore();
        showToast(activeItem ? "Campaign updated successfully." : "New festive campaign created.");
        setModalOpen(false);
      }
    } catch {
      setFormError("Failed to save campaign. Please check your form inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active status
  const handleToggle = async (item: FestiveCampaign) => {
    const nextStatus = !item.is_active;
    try {
      toggleMockFestiveCampaignStatus(item.id);
      const res = await toggleFestiveCampaignStatusAction(item.id, nextStatus);
      if (res.error) {
        showToast(res.error, "error");
      } else {
        refreshFromStore();
        showToast(`Campaign ${nextStatus ? "activated" : "deactivated"} successfully.`);
      }
    } catch {
      showToast("Failed to toggle campaign status.", "error");
    }
  };

  // Delete campaign with confirmation (does NOT delete catalog products)
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      deleteMockFestiveCampaign(itemToDelete.id);
      const res = await deleteFestiveCampaignAction(itemToDelete.id);
      if (res.error) {
        showToast(res.error, "error");
      } else {
        refreshFromStore();
        showToast("Campaign deleted successfully. Linked catalog products remain intact.");
        setDeleteModalOpen(false);
        setItemToDelete(null);
      }
    } catch {
      showToast("Failed to delete campaign.", "error");
    }
  };

  const currentPreviewCampaign = activeCampaigns[carouselIndex];
  const currentPreviewProducts = useMemo(() => {
    if (!currentPreviewCampaign) return [];
    const set = new Set(currentPreviewCampaign.product_ids);
    return allProducts.filter((p) => set.has(p.id));
  }, [currentPreviewCampaign, allProducts]);

  // Filtered products for modal picker
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return allProducts;
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
    );
  }, [allProducts, productSearch]);

  return (
    <div className="space-y-8 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold tracking-wide uppercase mb-2">
            <Flame className="h-3.5 w-3.5" />
            <span>Storefront Festive Campaign Showcase</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Festive Discount Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Create, edit, and arrange festive promotional campaigns. Multiple active campaigns form an auto-advancing slideshow on the storefront, each displaying its curated devotional products.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>New Festive Campaign</span>
        </button>
      </div>

      {/* Schema & Price Calculation Notice */}
      <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-start gap-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">Accurate Pricing & Architecture Standard</p>
          <p>
            Campaigns are stored in the local development mock store. The PostgreSQL schema does not define a dedicated campaign table.
            Promotional badge text is purely informative; calculated numerical price discounts are applied strictly when an explicit percentage (1-90%) is entered. Deleting a campaign never deletes catalog products.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
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

      {/* LIVE STOREFRONT FESTIVE CAMPAIGN PREVIEW */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
          <div>
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Flame className="h-4.5 w-4.5 text-primary" />
              <span>Live Festive Campaign Slideshow Preview</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Interactive preview of active campaigns with their selected products, exactly as rendered on the storefront.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {activeCampaigns.length > 1 && (
              <button
                type="button"
                onClick={() => setIsAutoCycling(!isAutoCycling)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  isAutoCycling
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {isAutoCycling ? (
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
              {activeCampaigns.length > 0
                ? `Campaign ${carouselIndex + 1} of ${activeCampaigns.length}`
                : "0 Active Campaigns"}
            </span>
          </div>
        </div>

        {/* Campaign Preview Container */}
        {activeCampaigns.length > 0 && currentPreviewCampaign ? (
          <div className="rounded-2xl border border-[#E8DCC8] bg-gradient-to-b from-[#FFFDF7] via-[#FDF8EE] to-[#FFFDF7] p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Campaign Header / Banner Showcase */}
            <div className="relative rounded-2xl overflow-hidden border border-[#E8DCC8]/80 shadow-md">
              {currentPreviewCampaign.image_url ? (
                /* WITH BANNER IMAGE */
                <div className="relative w-full aspect-[21/9] min-h-[220px] max-h-[340px] bg-black">
                  <img
                    src={currentPreviewCampaign.image_url}
                    alt={currentPreviewCampaign.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
                  <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end text-white max-w-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/90 text-white text-[10px] font-extrabold uppercase tracking-wider">
                        Slide #{currentPreviewCampaign.display_order}
                      </span>
                      {currentPreviewCampaign.discount_tag && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-extrabold uppercase tracking-wider">
                          {currentPreviewCampaign.discount_tag}
                        </span>
                      )}
                      {currentPreviewCampaign.discount_percent && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
                          {currentPreviewCampaign.discount_percent}% Off Applied
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight drop-shadow-md">
                      {currentPreviewCampaign.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-xl font-normal leading-relaxed drop-shadow-xs">
                      {currentPreviewCampaign.description}
                    </p>
                  </div>
                </div>
              ) : (
                /* WITHOUT BANNER IMAGE — Clean, Graceful Devotional Card */
                <div className="relative w-full min-h-[160px] bg-gradient-to-r from-[#2A180E] via-[#3B2416] to-[#2A180E] p-6 sm:p-8 text-[#FFFDF7] flex flex-col justify-center border-l-4 border-l-primary">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/20 text-[#C8891A] text-[10px] font-extrabold uppercase tracking-wider border border-[#C8891A]/30">
                      <Flame className="h-3 w-3" />
                      <span>Pure Devotional Showcase (No Image)</span>
                    </span>
                    {currentPreviewCampaign.discount_tag && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-extrabold uppercase tracking-wider">
                        {currentPreviewCampaign.discount_tag}
                      </span>
                    )}
                    {currentPreviewCampaign.discount_percent && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
                        {currentPreviewCampaign.discount_percent}% Off Applied
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-3xl font-serif font-bold text-[#FFFDF7] tracking-tight">
                    {currentPreviewCampaign.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#F8F1E3]/85 mt-1.5 max-w-2xl font-sans leading-relaxed">
                    {currentPreviewCampaign.description}
                  </p>
                </div>
              )}

              {/* Prev / Next Slide Controls */}
              {activeCampaigns.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer border border-white/20 shadow-md"
                    title="Previous Campaign Slide"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer border border-white/20 shadow-md"
                    title="Next Campaign Slide"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* Selected Products in this Campaign */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#806B57]">
                  Selected Campaign Products ({currentPreviewProducts.length})
                </h4>
                {currentPreviewCampaign.discount_percent ? (
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                    * Displaying calculated -{currentPreviewCampaign.discount_percent}% reduced prices
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-muted-foreground">
                    * Standard catalog prices (promotional badge only)
                  </span>
                )}
              </div>

              {currentPreviewProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {currentPreviewProducts.map((p) => {
                    const primaryImg =
                      p.images?.find((img) => img.is_primary)?.image_url ||
                      p.images?.[0]?.image_url ||
                      (p as any).image_url ||
                      "/images/preview-murti.jpg";

                    const hasDiscount =
                      currentPreviewCampaign.discount_percent !== null &&
                      currentPreviewCampaign.discount_percent !== undefined &&
                      currentPreviewCampaign.discount_percent > 0;

                    const calculatedPrice = hasDiscount
                      ? Math.round(p.base_price * (1 - (currentPreviewCampaign.discount_percent || 0) / 100))
                      : p.base_price;

                    return (
                      <div
                        key={p.id}
                        className="rounded-2xl border border-[#E8DCC8] bg-[#FFFDF7] p-3 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                      >
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted mb-2">
                          <img
                            src={primaryImg}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                          {hasDiscount && (
                            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider">
                              -{currentPreviewCampaign.discount_percent}%
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#3B2416] line-clamp-1 leading-snug">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-extrabold text-[#3B2416]">
                              ₹{calculatedPrice.toLocaleString("en-IN")}
                            </span>
                            {hasDiscount ? (
                              <span className="text-[11px] text-muted-foreground line-through">
                                ₹{p.base_price.toLocaleString("en-IN")}
                              </span>
                            ) : p.compare_at_price ? (
                              <span className="text-[11px] text-muted-foreground line-through">
                                ₹{p.compare_at_price.toLocaleString("en-IN")}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-[#E8DCC8] bg-white/40">
                  <ShoppingBag className="h-6 w-6 text-muted-foreground mx-auto mb-1 opacity-50" />
                  <p className="text-xs text-muted-foreground">
                    No products selected for this campaign yet. Edit this campaign to select items from the catalog.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
            <Flame className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
            <h4 className="font-bold text-foreground text-sm">No Active Festive Campaigns</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Activate at least one festive campaign below to display the festive campaign slideshow on the storefront.
            </p>
          </div>
        )}
      </div>

      {/* CAMPAIGNS LIST TABLE */}
      <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="p-6 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-foreground">
              Configured Festive Campaigns ({campaigns.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Arranged in homepage slideshow sequence order.
            </p>
          </div>
        </div>

        {campaigns.length > 0 ? (
          <div className="divide-y divide-border/60">
            {campaigns.map((item, index) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
              >
                {/* Left: Reorder, Image/Badge, Details */}
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 shrink-0 pt-0.5 sm:pt-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-muted-foreground hover:text-foreground"
                      title="Move Up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === campaigns.length - 1}
                      onClick={() => handleMove(index, "down")}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-muted-foreground hover:text-foreground"
                      title="Move Down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Order Badge */}
                  <span className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center font-mono text-xs font-bold text-muted-foreground shrink-0 border border-border/60">
                    #{item.display_order}
                  </span>

                  {/* Thumbnail / Image Preview */}
                  <div className="h-14 w-20 rounded-xl overflow-hidden bg-muted border border-border/80 shrink-0 relative flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#2A180E] flex flex-col items-center justify-center text-white/70 p-1 text-center">
                        <Flame className="h-4 w-4 text-[#C8891A]" />
                        <span className="text-[8px] font-mono mt-0.5">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">
                        {item.name}
                      </h4>
                      {item.discount_tag && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
                          {item.discount_tag}
                        </span>
                      )}
                      {item.discount_percent && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                          {item.discount_percent}% Off
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <ShoppingBag className="h-3 w-3 text-primary" />
                        {item.product_ids.length} Products Linked
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.is_active
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-stone-500/15 text-stone-600 dark:text-stone-400"
                        }`}
                      >
                        {item.is_active ? "Active in Slideshow" : "Deactivated / Hidden"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(item)}
                    className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                      item.is_active
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground"
                    }`}
                    title={item.is_active ? "Deactivate" : "Activate"}
                  >
                    {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground cursor-pointer transition-colors"
                    title="Edit Campaign Details"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setItemToDelete(item);
                      setDeleteModalOpen(true);
                    }}
                    className="p-2 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer transition-colors"
                    title="Delete Campaign"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <Flame className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No festive campaigns configured yet.</p>
            <p className="text-xs mt-1">Click "New Festive Campaign" to create your first seasonal promotional offer.</p>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-card w-full max-w-2xl rounded-3xl border border-border p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 shrink-0">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                <h3 className="text-base font-extrabold text-foreground">
                  {activeItem ? "Edit Festive Campaign" : "Create New Festive Campaign"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2 shrink-0">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Campaign Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">
                  Campaign Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deepotsav & Sacred Diwali Offerings"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 text-xs"
                  required
                />
              </div>

              {/* Offer Description (Preserve Admin's Custom Copy) */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">
                  Custom Offer / Discount Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Bless your home mandir this season with consecrated brassware and auspicious puja essentials. Enjoy complimentary brass diya with select festival items."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 text-xs resize-none"
                  required
                />
              </div>

              {/* Optional Banner Image URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground flex items-center justify-between">
                  <span>Banner Image URL (Optional)</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    Leave blank to render clean devotional text card
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... or /banners/..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 text-xs"
                />
              </div>

              {/* Live Image Pre-Save Preview */}
              {formImageUrl.trim() && (
                <div className="relative aspect-[21/9] w-full rounded-xl border border-border overflow-hidden bg-black/90">
                  <img
                    src={formImageUrl.trim()}
                    alt="Pre-save campaign preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as any).src =
                        "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono">
                    Pre-save Banner Preview
                  </div>
                </div>
              )}

              {/* Discount Tag & Structured Numerical Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">
                    Promotional Badge / Offer Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Festive Grace, Flat 25% Off"
                    value={formDiscountTag}
                    onChange={(e) => setFormDiscountTag(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Informational badge displayed on the storefront.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">
                    Structured Numerical Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    placeholder="e.g. 15 (leave blank for none)"
                    value={formDiscountPercent}
                    onChange={(e) => setFormDiscountPercent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Calculated price reduced only if explicitly defined &gt; 0.
                  </span>
                </div>
              </div>

              {/* Display Order & Active Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="font-bold text-foreground">Slideshow Status</label>
                  <button
                    type="button"
                    onClick={() => setFormIsActive(!formIsActive)}
                    className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      formIsActive
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {formIsActive ? (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Published in Slideshow
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> Deactivated
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Product Selector (Shared Product Repository from Phase 3) */}
              <div className="space-y-2 pt-2 border-t border-border/70">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    <span>Select Campaign Products ({formProductIds.length} selected)</span>
                  </label>
                  {formProductIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormProductIds([])}
                      className="text-[11px] text-destructive hover:underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Product Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search catalog products by name, brand, or SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border bg-background text-xs"
                  />
                </div>

                {/* Product Selection List */}
                <div className="max-h-48 overflow-y-auto rounded-2xl border border-border divide-y divide-border/60 bg-muted/20">
                  {filteredProducts.map((p) => {
                    const isSelected = formProductIds.includes(p.id);
                    const primaryImg =
                      p.images?.find((img) => img.is_primary)?.image_url ||
                      p.images?.[0]?.image_url ||
                      (p as any).image_url ||
                      "/images/preview-murti.jpg";

                    return (
                      <div
                        key={p.id}
                        onClick={() => handleProductToggle(p.id)}
                        className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10" : "hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-border bg-background"
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>

                          <div className="h-9 w-9 rounded-lg overflow-hidden bg-muted border border-border/60 shrink-0">
                            <img
                              src={primaryImg}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground line-clamp-1">
                              {p.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              SKU: {p.sku || "N/A"} · ₹{p.base_price.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {isSelected ? "Selected" : "Add"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/70 shrink-0">
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
                  <span>{activeItem ? "Update Campaign" : "Save Campaign"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="h-10 w-10 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">Confirm Campaign Deletion</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Removes seasonal campaign showcase</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border text-xs text-foreground space-y-1">
              <p className="font-bold">{itemToDelete.name}</p>
              <p className="text-muted-foreground line-clamp-2">{itemToDelete.description}</p>
              <p className="text-[11px] font-mono text-primary pt-1">
                Linked Products: {itemToDelete.product_ids.length}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Product Safety Guarantee:
              </p>
              <p className="mt-0.5">
                Deleting this festive campaign will <strong>never delete</strong> the actual products from your catalog.
                The {itemToDelete.product_ids.length} linked products remain completely intact in the store.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-bold text-xs shadow-xs hover:bg-destructive/90 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
