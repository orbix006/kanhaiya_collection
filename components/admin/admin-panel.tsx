"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Banner,
  Category,
  Product,
  FestiveOffer,
} from "@/lib/store";
import {
  saveBannerAction,
  toggleBannerStatusAction,
  deleteBannerAction,
  reorderBannersAction,
  saveCategoryAction,
  toggleCategoryStatusAction,
  deleteCategoryAction,
  reorderCategoriesAction,
  updateFestiveOfferAction,
  toggleFestiveOfferAction,
  saveProductAction,
  deleteProductAction,
} from "@/lib/actions/admin";
import {
  LayoutDashboard,
  Image as ImageIcon,
  FolderTree,
  Flame,
  Package,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  ExternalLink,
  Save,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { BannerEditModal } from "./banner-edit-modal";

interface AdminPanelProps {
  initialBanners: Banner[];
  initialCategories: Category[];
  initialProducts: Product[];
  initialFestiveOffer: FestiveOffer;
}

export function AdminPanel({
  initialBanners,
  initialCategories,
  initialProducts,
  initialFestiveOffer,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "banners" | "categories" | "festive" | "products"
  >("banners");

  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [festiveOffer, setFestiveOffer] = useState<FestiveOffer>(initialFestiveOffer);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Modal states
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "banner" | "category" | "product";
    id: string;
    name: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ---------------------------------------------------------------------------
  // BANNER HANDLERS
  // ---------------------------------------------------------------------------
  const handleToggleBanner = async (id: string, current: boolean) => {
    const res = await toggleBannerStatusAction(id, !current);
    if (res.success) {
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, is_active: !current } : b))
      );
      showToast("success", `Banner ${!current ? "enabled" : "disabled"}`);
    } else {
      showToast("error", res.error || "Failed to update banner");
    }
  };

  const handleMoveBanner = async (id: string, direction: "up" | "down") => {
    const sorted = [...banners].sort((a, b) => a.display_order - b.display_order);
    const index = sorted.findIndex((b) => b.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sorted.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = sorted[index];
    sorted[index] = sorted[targetIndex];
    sorted[targetIndex] = temp;

    const orderedIds = sorted.map((b) => b.id);
    const res = await reorderBannersAction(orderedIds);
    if (res.success) {
      setBanners(
        sorted.map((b, idx) => ({ ...b, display_order: idx + 1 }))
      );
      showToast("success", "Banner order updated");
    }
  };

  const handleSaveBanner = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await saveBannerAction(formData);
    if (res.success) {
      showToast("success", "Banner saved successfully");
      setIsBannerModalOpen(false);
      setEditingBanner(null);
      // Soft refresh local list
      const title = formData.get("title") as string;
      const subtitle = formData.get("subtitle") as string;
      const cta_text = formData.get("cta_text") as string;
      const cta_link = formData.get("cta_link") as string;
      const image_url = formData.get("image_url") as string;
      const mobile_image_url = (formData.get("mobile_image_url") as string) || null;
      const is_active = formData.get("is_active") === "on";
      const display_order = parseInt((formData.get("display_order") as string) || "1", 10);
      const id = formData.get("id") as string;

      if (id) {
        setBanners((prev) =>
          prev.map((b) =>
            b.id === id
              ? { ...b, title, subtitle, cta_text, cta_link, image_url, mobile_image_url, is_active, display_order }
              : b
          )
        );
      } else {
        const newB: Banner = {
          id: `banner-${Date.now()}`,
          title,
          subtitle,
          cta_text,
          cta_link,
          image_url,
          mobile_image_url,
          is_active,
          display_order,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setBanners((prev) => [...prev, newB]);
      }
    } else {
      showToast("error", res.error || "Failed to save banner");
    }
  };

  const handleDeleteBannerConfirm = async () => {
    if (!deleteConfirm || deleteConfirm.type !== "banner") return;
    const res = await deleteBannerAction(deleteConfirm.id);
    if (res.success) {
      setBanners((prev) => prev.filter((b) => b.id !== deleteConfirm.id));
      showToast("success", "Banner deleted successfully");
    } else {
      showToast("error", res.error || "Failed to delete banner");
    }
    setDeleteConfirm(null);
  };

  // ---------------------------------------------------------------------------
  // CATEGORY HANDLERS
  // ---------------------------------------------------------------------------
  const handleToggleCategory = async (id: string, current: boolean) => {
    const res = await toggleCategoryStatusAction(id, !current);
    if (res.success) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: !current } : c))
      );
      showToast("success", `Category ${!current ? "enabled" : "disabled"}`);
    } else {
      showToast("error", res.error || "Failed to update category");
    }
  };

  const handleMoveCategory = async (id: string, direction: "up" | "down") => {
    const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);
    const index = sorted.findIndex((c) => c.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sorted.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = sorted[index];
    sorted[index] = sorted[targetIndex];
    sorted[targetIndex] = temp;

    const orderedIds = sorted.map((c) => c.id);
    const res = await reorderCategoriesAction(orderedIds);
    if (res.success) {
      setCategories(
        sorted.map((c, idx) => ({ ...c, display_order: idx + 1 }))
      );
      showToast("success", "Category order updated");
    }
  };

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await saveCategoryAction(formData);
    if (res.success) {
      showToast("success", "Category saved successfully");
      setIsCategoryModalOpen(false);
      setEditingCategory(null);

      const id = formData.get("id") as string;
      const name = formData.get("name") as string;
      const slug = formData.get("slug") as string;
      const description = formData.get("description") as string;
      const image_url = formData.get("image_url") as string;
      const display_order = parseInt((formData.get("display_order") as string) || "1", 10);
      const is_active = formData.get("is_active") === "on";

      if (id) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, name, slug, description, image_url, display_order, is_active }
              : c
          )
        );
      } else {
        const newCat: Category = {
          id: `cat-${Date.now()}`,
          name,
          slug,
          description,
          image_url,
          display_order,
          is_active,
          show_on_homepage: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setCategories((prev) => [...prev, newCat]);
      }
    } else {
      showToast("error", res.error || "Failed to save category");
    }
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!deleteConfirm || deleteConfirm.type !== "category") return;
    const res = await deleteCategoryAction(deleteConfirm.id);
    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
      showToast("success", "Category deleted safely. Related products preserved.");
    } else {
      showToast("error", res.error || "Failed to delete category");
    }
    setDeleteConfirm(null);
  };

  // ---------------------------------------------------------------------------
  // FESTIVE OFFER HANDLERS
  // ---------------------------------------------------------------------------
  const handleToggleFestiveOffer = async (enabled: boolean) => {
    const res = await toggleFestiveOfferAction(enabled);
    if (res.success) {
      setFestiveOffer((prev) => ({ ...prev, enabled }));
      showToast(
        "success",
        `Festive Offer section ${enabled ? "enabled on storefront" : "hidden from storefront"}`
      );
    } else {
      showToast("error", res.error || "Failed to update festive offer");
    }
  };

  const handleSaveFestiveOffer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("enabled", String(festiveOffer.enabled));
    formData.append("title", festiveOffer.title);
    formData.append("subtitle", festiveOffer.subtitle);
    formData.append("product_ids", JSON.stringify(festiveOffer.product_ids));

    const res = await updateFestiveOfferAction(formData);
    if (res.success) {
      showToast("success", "Festive Offer settings updated successfully");
    } else {
      showToast("error", res.error || "Failed to save festive offer");
    }
  };

  const handleAddProductToFestive = (productId: string) => {
    if (!productId || festiveOffer.product_ids.includes(productId)) return;
    setFestiveOffer((prev) => ({
      ...prev,
      product_ids: [...prev.product_ids, productId],
    }));
  };

  const handleRemoveProductFromFestive = (productId: string) => {
    setFestiveOffer((prev) => ({
      ...prev,
      product_ids: prev.product_ids.filter((id) => id !== productId),
    }));
  };

  const handleMoveFestiveProduct = (productId: string, direction: "up" | "down") => {
    const list = [...festiveOffer.product_ids];
    const index = list.indexOf(productId);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === list.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    setFestiveOffer((prev) => ({ ...prev, product_ids: list }));
  };

  const festiveProducts = festiveOffer.product_ids
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  const availableProductsForFestive = products.filter(
    (p) => !festiveOffer.product_ids.includes(p.id)
  );

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col font-sans">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#FFFDF7] border-b border-[#E8DCC8] shadow-2xs">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#806B57] hover:text-[#C8891A] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Store</span>
            </Link>
            <span className="text-[#E8DCC8]">•</span>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-semibold text-[#3B2416]">
                Kanhaiya Collection
              </span>
              <span className="rounded-full bg-[#F8F1E3] border border-[#E8DCC8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#C8891A]">
                Admin Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8DCC8] text-xs font-medium text-[#3B2416] hover:bg-[#F8F1E3] transition-colors"
            >
              <span>View Storefront</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#C8891A]" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar + Tab Content */}
      <div className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-60 shrink-0 bg-[#FFFDF7] border border-[#E8DCC8] rounded-2xl p-3 shadow-2xs space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab("banners")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "banners"
                ? "bg-[#C8891A] text-white shadow-xs"
                : "text-[#3B2416] hover:bg-[#F8F1E3]"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Hero Banners</span>
            <span className="ml-auto text-[10px] font-semibold opacity-80">
              {banners.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "categories"
                ? "bg-[#C8891A] text-white shadow-xs"
                : "text-[#3B2416] hover:bg-[#F8F1E3]"
            }`}
          >
            <FolderTree className="h-4 w-4" />
            <span>Categories</span>
            <span className="ml-auto text-[10px] font-semibold opacity-80">
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("festive")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "festive"
                ? "bg-[#C8891A] text-white shadow-xs"
                : "text-[#3B2416] hover:bg-[#F8F1E3]"
            }`}
          >
            <Flame className="h-4 w-4" />
            <span>Festive Offer</span>
            <span
              className={`ml-auto text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                festiveOffer.enabled
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-stone-200 text-stone-600"
              }`}
            >
              {festiveOffer.enabled ? "Active" : "Off"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "products"
                ? "bg-[#C8891A] text-white shadow-xs"
                : "text-[#3B2416] hover:bg-[#F8F1E3]"
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Products</span>
            <span className="ml-auto text-[10px] font-semibold opacity-80">
              {products.length}
            </span>
          </button>
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 w-full bg-[#FFFDF7] border border-[#E8DCC8] rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* Notification Toast */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 1: BANNERS                                                   */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === "banners" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DCC8]">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#3B2416]">
                    Hero Banners Management
                  </h2>
                  <p className="text-xs text-[#806B57] mt-0.5">
                    Control promotional hero carousel banners shown at the top of the storefront.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingBanner(null);
                    setIsBannerModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8891A] text-white text-xs font-semibold hover:bg-[#B37814] transition-colors shadow-2xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add Banner</span>
                </button>
              </div>

              {/* Banners List */}
              <div className="space-y-3">
                {banners
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((banner, index) => (
                    <div
                      key={banner.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] hover:border-[#C8891A]/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <div className="relative h-16 w-24 sm:h-18 sm:w-28 rounded-lg overflow-hidden bg-[#F8F1E3] shrink-0 border border-[#E8DCC8]">
                          <Image
                            src={banner.image_url || "/images/hero-flute.jpg"}
                            alt={banner.title}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif text-base font-semibold text-[#3B2416]">
                              {banner.title}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                banner.is_active
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-stone-200 text-stone-600"
                              }`}
                            >
                              {banner.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          {banner.subtitle && (
                            <p className="text-xs text-[#806B57] line-clamp-1 mt-0.5">
                              {banner.subtitle}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[11px] text-[#806B57] mt-1 font-mono flex-wrap">
                            <span>Order: #{banner.display_order}</span>
                            <span>CTA: &ldquo;{banner.cta_text}&rdquo;</span>
                            <span>Link: {banner.cta_link}</span>
                            {banner.mobile_image_url && (
                              <span className="text-[10px] text-[#C8891A] bg-[#F8F1E3] px-1.5 py-0.5 rounded border border-[#E8DCC8]">
                                Mobile Visual Set
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleMoveBanner(banner.id, "up")}
                          disabled={index === 0}
                          title="Move Up"
                          className="p-1.5 rounded-lg border border-[#E8DCC8] hover:bg-[#F8F1E3] disabled:opacity-30 text-[#806B57]"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveBanner(banner.id, "down")}
                          disabled={index === banners.length - 1}
                          title="Move Down"
                          className="p-1.5 rounded-lg border border-[#E8DCC8] hover:bg-[#F8F1E3] disabled:opacity-30 text-[#806B57]"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleBanner(banner.id, banner.is_active)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                            banner.is_active
                              ? "border-amber-300 bg-amber-50 text-amber-800"
                              : "border-emerald-300 bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          {banner.is_active ? "Disable" : "Enable"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingBanner(banner);
                            setIsBannerModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-[#E8DCC8] hover:bg-[#F8F1E3] text-[#3B2416]"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirm({
                              type: "banner",
                              id: banner.id,
                              name: banner.title,
                            })
                          }
                          className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 2: CATEGORIES                                                */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DCC8]">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#3B2416]">
                    Categories Management
                  </h2>
                  <p className="text-xs text-[#806B57] mt-0.5">
                    Create, edit, reorder or toggle categories shown on the home page and shop.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCategoryModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8891A] text-white text-xs font-semibold hover:bg-[#B37814] transition-colors shadow-2xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add Category</span>
                </button>
              </div>

              {/* Categories Grid/List */}
              <div className="space-y-3">
                {categories
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((cat, index) => (
                    <div
                      key={cat.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] hover:border-[#C8891A]/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-[#F8F1E3] shrink-0 border border-[#E8DCC8]">
                          <Image
                            src={cat.image_url || "/images/preview-murti.jpg"}
                            alt={cat.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif text-base font-semibold text-[#3B2416]">
                              {cat.name}
                            </span>
                            <span className="text-xs font-mono text-[#806B57]">
                              ({cat.slug})
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                cat.is_active
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-stone-200 text-stone-600"
                              }`}
                            >
                              {cat.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-xs text-[#806B57] line-clamp-1 mt-0.5">
                              {cat.description}
                            </p>
                          )}
                          <div className="text-[11px] text-[#806B57] mt-1 font-mono">
                            Display Order: #{cat.display_order}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(cat.id, "up")}
                          disabled={index === 0}
                          title="Move Up"
                          className="p-1.5 rounded-lg border border-[#E8DCC8] hover:bg-[#F8F1E3] disabled:opacity-30 text-[#806B57]"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(cat.id, "down")}
                          disabled={index === categories.length - 1}
                          title="Move Down"
                          className="p-1.5 rounded-lg border border-[#E8DCC8] hover:bg-[#F8F1E3] disabled:opacity-30 text-[#806B57]"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleCategory(cat.id, cat.is_active)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                            cat.is_active
                              ? "border-amber-300 bg-amber-50 text-amber-800"
                              : "border-emerald-300 bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          {cat.is_active ? "Disable" : "Enable"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(cat);
                            setIsCategoryModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-[#E8DCC8] hover:bg-[#F8F1E3] text-[#3B2416]"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirm({
                              type: "category",
                              id: cat.id,
                              name: cat.name,
                            })
                          }
                          className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 3: FESTIVE OFFER                                             */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === "festive" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DCC8]">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#3B2416]">
                    Festive Offer Management
                  </h2>
                  <p className="text-xs text-[#806B57] mt-0.5">
                    Enable or disable the festive showcase on the home page and curate selected offerings.
                  </p>
                </div>

                {/* Main Toggle Switch */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[#3B2416]">
                    Section Status:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleFestiveOffer(!festiveOffer.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      festiveOffer.enabled ? "bg-emerald-600" : "bg-stone-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        festiveOffer.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-xs font-semibold text-[#3B2416]">
                    {festiveOffer.enabled ? "ENABLED" : "DISABLED"}
                  </span>
                </div>
              </div>

              {/* Form Settings */}
              <form onSubmit={handleSaveFestiveOffer} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#806B57] uppercase tracking-wider">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={festiveOffer.title}
                      onChange={(e) =>
                        setFestiveOffer((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full h-10 px-3 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#806B57] uppercase tracking-wider">
                      Subtitle / Message
                    </label>
                    <input
                      type="text"
                      value={festiveOffer.subtitle}
                      onChange={(e) =>
                        setFestiveOffer((prev) => ({ ...prev, subtitle: e.target.value }))
                      }
                      className="w-full h-10 px-3 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
                    />
                  </div>
                </div>

                {/* Add Product Dropdown */}
                <div className="p-4 rounded-xl bg-[#F8F1E3]/50 border border-[#E8DCC8] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs font-medium text-[#3B2416]">
                    Add a product to this Festive Offer:
                  </span>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      id="festive-prod-select"
                      defaultValue=""
                      className="h-9 px-3 rounded-lg border border-[#E8DCC8] bg-[#FFFDF7] text-xs text-[#3B2416] flex-1 sm:w-64"
                    >
                      <option value="" disabled>
                        Select product from catalog...
                      </option>
                      {availableProductsForFestive.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₹{p.base_price})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const sel = document.getElementById(
                          "festive-prod-select"
                        ) as HTMLSelectElement;
                        if (sel && sel.value) {
                          handleAddProductToFestive(sel.value);
                          sel.value = "";
                        }
                      }}
                      className="h-9 px-3.5 rounded-lg bg-[#C8891A] text-white text-xs font-medium hover:bg-[#B37814] transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Selected Products in Festive Offer */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#806B57]">
                    Selected Festive Products ({festiveProducts.length})
                  </span>

                  {festiveProducts.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#806B57] bg-[#F8F1E3]/30 rounded-xl border border-dashed border-[#E8DCC8]">
                      No products added to this festive offer yet. Select from the dropdown above.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {festiveProducts.map((p, idx) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-4 p-3 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-semibold text-[#806B57] w-5">
                              #{idx + 1}
                            </span>
                            <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-[#F8F1E3] shrink-0 border border-[#E8DCC8]">
                              <Image
                                src={p.image_url || "/images/preview-murti.jpg"}
                                alt={p.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-serif text-sm font-medium text-[#3B2416]">
                                {p.name}
                              </p>
                              <p className="text-xs text-[#806B57]">₹{p.base_price}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleMoveFestiveProduct(p.id, "up")}
                              disabled={idx === 0}
                              className="p-1 rounded border border-[#E8DCC8] hover:bg-[#F8F1E3] disabled:opacity-30"
                            >
                              <ArrowUp className="h-3.5 w-3.5 text-[#806B57]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveFestiveProduct(p.id, "down")}
                              disabled={idx === festiveProducts.length - 1}
                              className="p-1 rounded border border-[#E8DCC8] hover:bg-[#F8F1E3] disabled:opacity-30"
                            >
                              <ArrowDown className="h-3.5 w-3.5 text-[#806B57]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveProductFromFestive(p.id)}
                              className="p-1 rounded border border-red-200 hover:bg-red-50 text-red-600"
                              title="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#E8DCC8] flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C8891A] text-white text-xs sm:text-sm font-semibold hover:bg-[#B37814] transition-colors shadow-sm"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Festive Offer Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 4: PRODUCTS                                                  */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DCC8]">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#3B2416]">
                    Product Catalog
                  </h2>
                  <p className="text-xs text-[#806B57] mt-0.5">
                    View active store items, stock quantities, and sold counts that power the Bestseller ranking.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8DCC8] text-[#806B57] uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-2">Product</th>
                      <th className="py-3 px-2">Price</th>
                      <th className="py-3 px-2">Stock</th>
                      <th className="py-3 px-2">Sold Count</th>
                      <th className="py-3 px-2">Top Seller Pin</th>
                      <th className="py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DCC8]/60">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-[#F8F1E3]/40 transition-colors">
                        <td className="py-3 px-2 flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-[#F8F1E3] shrink-0 border border-[#E8DCC8]">
                            <Image
                              src={p.image_url || "/images/preview-murti.jpg"}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-medium text-[#3B2416] block max-w-xs truncate">
                              {p.name}
                            </span>
                            <span className="text-[11px] text-[#806B57] font-mono">
                              {p.slug}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-semibold text-[#3B2416]">
                          ₹{p.base_price}
                          {p.compare_at_price && (
                            <span className="block text-[10px] text-[#806B57] line-through font-normal">
                              ₹{p.compare_at_price}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-[#806B57]">{p.stock_quantity} in stock</td>
                        <td className="py-3 px-2 font-bold text-[#C8891A]">
                          {p.sold_count} sold
                        </td>
                        <td className="py-3 px-2">
                          {p.is_featured_top_seller ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                              Pinned Top
                            </span>
                          ) : (
                            <span className="text-[#806B57] text-[10px]">Standard</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.is_active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-200 text-stone-600"
                            }`}
                          >
                            {p.is_active ? "Active" : "Hidden"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* BANNER EDIT/CREATE MODAL WITH LIVE DESKTOP/MOBILE PREVIEWS           */}
      {/* -------------------------------------------------------------------- */}
      {isBannerModalOpen && (
        <BannerEditModal
          banner={editingBanner}
          onClose={() => setIsBannerModalOpen(false)}
          onSave={handleSaveBanner}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* CATEGORY EDIT/CREATE MODAL                                           */}
      {/* -------------------------------------------------------------------- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-[#FFFDF7] border border-[#E8DCC8] rounded-2xl p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DCC8]">
              <h3 className="font-serif text-xl font-semibold text-[#3B2416]">
                {editingCategory ? "Edit Category" : "Create New Category"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-[#806B57] hover:bg-[#F8F1E3]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <input type="hidden" name="id" value={editingCategory?.id || ""} />

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#806B57] uppercase tracking-wider">
                  Category Name
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingCategory?.name || ""}
                  placeholder="e.g. Brass Diyas"
                  className="w-full h-10 px-3 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#806B57] uppercase tracking-wider">
                  Slug (URL parameter)
                </label>
                <input
                  name="slug"
                  type="text"
                  defaultValue={editingCategory?.slug || ""}
                  placeholder="brass-diyas"
                  className="w-full h-10 px-3 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#806B57] uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingCategory?.description || ""}
                  placeholder="Short description of items in this category"
                  className="w-full p-3 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#806B57] uppercase tracking-wider">
                  Category Image
                </label>
                <input
                  name="image_url"
                  type="text"
                  required
                  defaultValue={editingCategory?.image_url || "/images/preview-murti.jpg"}
                  className="w-full h-10 px-3 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#806B57] uppercase tracking-wider">
                    Display Order
                  </label>
                  <input
                    name="display_order"
                    type="number"
                    min={1}
                    defaultValue={editingCategory?.display_order || 1}
                    className="w-full h-10 px-3 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    name="is_active"
                    type="checkbox"
                    id="cat-is-active"
                    defaultChecked={editingCategory ? editingCategory.is_active : true}
                    className="h-4 w-4 rounded accent-[#C8891A]"
                  />
                  <label htmlFor="cat-is-active" className="text-xs font-medium text-[#3B2416]">
                    Active on Storefront
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8DCC8] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8DCC8] text-xs font-medium text-[#806B57] hover:bg-[#F8F1E3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C8891A] text-white text-xs font-semibold hover:bg-[#B37814]"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION DIALOG                                           */}
      {/* -------------------------------------------------------------------- */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-[#FFFDF7] border border-red-200 rounded-2xl p-6 shadow-2xl space-y-4 font-sans text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#3B2416]">
                Confirm Deletion
              </h3>
              <p className="text-xs text-[#806B57] mt-1">
                Are you sure you want to permanently delete &ldquo;{deleteConfirm.name}&rdquo;?
                {deleteConfirm.type === "category" &&
                  " Products belonging to this category will be preserved safely."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-[#E8DCC8] text-xs font-medium text-[#806B57] hover:bg-[#F8F1E3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === "banner") handleDeleteBannerConfirm();
                  if (deleteConfirm.type === "category") handleDeleteCategoryConfirm();
                }}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 shadow-2xs"
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
