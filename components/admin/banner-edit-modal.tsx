"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Banner } from "@/lib/store";
import { X, ArrowRight, Laptop, Smartphone } from "lucide-react";

interface BannerEditModalProps {
  banner: Banner | null;
  onClose: () => void;
  onSave: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function BannerEditModal({
  banner,
  onClose,
  onSave,
}: BannerEditModalProps) {
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [title, setTitle] = useState(banner?.title || "");
  const [subtitle, setSubtitle] = useState(banner?.subtitle || "");
  const [ctaText, setCtaText] = useState(banner?.cta_text || "Shop Now");
  const [ctaLink, setCtaLink] = useState(banner?.cta_link || "/shop");
  const [imageUrl, setImageUrl] = useState(banner?.image_url || "/images/janmashtami-campaign.jpg");
  const [mobileImageUrl, setMobileImageUrl] = useState(banner?.mobile_image_url || "");
  const [displayOrder, setDisplayOrder] = useState(banner?.display_order || 1);
  const [isActive, setIsActive] = useState(banner ? banner.is_active : true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!imageUrl.trim()) {
      e.preventDefault();
      setValidationError("Desktop Banner Image is required.");
      return;
    }
    setValidationError(null);
    onSave(e);
  };

  const previewImage = previewDevice === "mobile" && mobileImageUrl.trim()
    ? mobileImageUrl
    : imageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#FFFDF7] border border-[#E8DCC8] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 font-sans my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DCC8]">
          <div>
            <h3 className="font-serif text-2xl font-semibold text-[#3B2416]">
              {banner ? "Edit Campaign Banner" : "Create New Campaign Banner"}
            </h3>
            <p className="text-xs text-[#806B57] mt-0.5">
              Configure promotional artwork, campaign messaging, and preview across devices before publishing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#806B57] hover:bg-[#F8F1E3] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {validationError}
          </div>
        )}

        {/* Two-Column Grid: Form Left, Real-Time Preview Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Controls (7 cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
            <input type="hidden" name="id" value={banner?.id || ""} />

            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#806B57] uppercase tracking-wider">
                Campaign Title
              </label>
              <input
                name="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Janmashtami Collection"
                className="w-full h-10 px-3.5 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#806B57] uppercase tracking-wider">
                Subtitle / Announcement
              </label>
              <textarea
                name="subtitle"
                rows={2}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Celebrate devotion with timeless pieces for your home."
                className="w-full p-3 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30 resize-none"
              />
            </div>

            {/* CTA text & Destination */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#806B57] uppercase tracking-wider">
                  CTA Button Text
                </label>
                <input
                  name="cta_text"
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="e.g. Explore Collection"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#806B57] uppercase tracking-wider">
                  CTA Link Destination
                </label>
                <input
                  name="cta_link"
                  type="text"
                  value={ctaLink}
                  onChange={(e) => setCtaLink(e.target.value)}
                  placeholder="/shop?category=idols"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
                />
              </div>
            </div>

            {/* Desktop Image URL */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#806B57] uppercase tracking-wider">
                  Desktop Image URL <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setImageUrl("/images/janmashtami-campaign.jpg")}
                    className="text-[10px] text-[#C8891A] hover:underline"
                  >
                    Janmashtami
                  </button>
                  <span className="text-[10px] text-[#806B57]">•</span>
                  <button
                    type="button"
                    onClick={() => setImageUrl("/images/diwali-campaign.jpg")}
                    className="text-[10px] text-[#C8891A] hover:underline"
                  >
                    Diwali
                  </button>
                </div>
              </div>
              <input
                name="image_url"
                type="text"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/images/janmashtami-campaign.jpg"
                className="w-full h-10 px-3.5 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
              />
            </div>

            {/* Mobile Image URL */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#806B57] uppercase tracking-wider">
                  Mobile Image URL (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setMobileImageUrl("/images/janmashtami-mobile.jpg")}
                  className="text-[10px] text-[#C8891A] hover:underline"
                >
                  Use Mobile Sample
                </button>
              </div>
              <input
                name="mobile_image_url"
                type="text"
                value={mobileImageUrl}
                onChange={(e) => setMobileImageUrl(e.target.value)}
                placeholder="/images/janmashtami-mobile.jpg (falls back to desktop)"
                className="w-full h-10 px-3.5 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
              />
            </div>

            {/* Order & Status */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#806B57] uppercase tracking-wider">
                  Display Order
                </label>
                <input
                  name="display_order"
                  type="number"
                  min={1}
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 1)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  name="is_active"
                  type="checkbox"
                  id="modal-banner-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#C8891A]"
                />
                <label
                  htmlFor="modal-banner-active"
                  className="text-xs font-semibold text-[#3B2416] cursor-pointer"
                >
                  Active on Storefront
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#E8DCC8] flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#E8DCC8] text-xs font-medium text-[#806B57] hover:bg-[#F8F1E3]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#C8891A] text-white text-xs font-semibold hover:bg-[#B37814] shadow-sm transition-all"
              >
                Save Banner
              </button>
            </div>
          </form>

          {/* Right Column: Live Device Previews (5 cols) */}
          <div className="lg:col-span-5 bg-[#F8F1E3]/50 border border-[#E8DCC8] rounded-2xl p-4 flex flex-col items-center">
            {/* Device Switcher */}
            <div className="flex items-center justify-between w-full mb-3 pb-3 border-b border-[#E8DCC8]/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#3B2416]">
                Live Storefront Preview
              </span>
              <div className="flex items-center rounded-lg border border-[#E8DCC8] bg-[#FFFDF7] p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    previewDevice === "desktop"
                      ? "bg-[#C8891A] text-white"
                      : "text-[#806B57] hover:text-[#3B2416]"
                  }`}
                >
                  <Laptop className="h-3.5 w-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    previewDevice === "mobile"
                      ? "bg-[#C8891A] text-white"
                      : "text-[#806B57] hover:text-[#3B2416]"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Desktop Preview Card */}
            {previewDevice === "desktop" ? (
              <div className="w-full relative aspect-[16/9] rounded-xl overflow-hidden shadow-md border border-[#E8DCC8] bg-[#1C120C]">
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt="Preview"
                    fill
                    className="object-cover object-center"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
                <div className="absolute inset-0 p-4 flex flex-col justify-center text-white max-w-[70%]">
                  {title && (
                    <h4 className="font-serif text-lg font-semibold leading-tight text-[#FFFDF7]">
                      {title}
                    </h4>
                  )}
                  {subtitle && (
                    <p className="font-sans text-[10px] text-[#F8F1E3]/90 mt-1 line-clamp-2">
                      {subtitle}
                    </p>
                  )}
                  {ctaText && (
                    <div className="mt-2.5">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#C8891A] text-white text-[10px] font-semibold">
                        <span>{ctaText}</span>
                        <ArrowRight className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Mobile Preview Card */
              <div className="w-[180px] relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md border-2 border-[#3B2416] bg-[#1C120C]">
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt="Mobile Preview"
                    fill
                    className="object-cover object-center"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute inset-0 p-3 flex flex-col justify-end text-white text-left">
                  {title && (
                    <h4 className="font-serif text-xs font-semibold leading-tight text-[#FFFDF7]">
                      {title}
                    </h4>
                  )}
                  {subtitle && (
                    <p className="font-sans text-[9px] text-[#F8F1E3]/80 mt-0.5 line-clamp-2">
                      {subtitle}
                    </p>
                  )}
                  {ctaText && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C8891A] text-white text-[9px] font-semibold">
                        <span>{ctaText}</span>
                        <ArrowRight className="h-2 w-2" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-[10px] text-[#806B57] mt-3 text-center">
              Preview updates live as you edit fields.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
