"use client";

import { useState } from "react";
import Image from "next/image";
import { Maximize2, ShoppingBag, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductImage } from "@/lib/data/products";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  selectedVariantImage?: string | null;
  discountPercent?: number | null;
  isTopSeller?: boolean;
}

export function ProductGallery({
  images,
  productName,
  selectedVariantImage,
  discountPercent,
  isTopSeller = false,
}: ProductGalleryProps) {
  // Sort images so primary comes first or display_order
  const sortedImages = [...images].sort(
    (a, b) => (a.display_order || 0) - (b.display_order || 0)
  );

  const initialImage =
    sortedImages.find((img) => img.is_primary)?.image_url ||
    sortedImages[0]?.image_url ||
    null;

  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage);
  const [prevVariantImage, setPrevVariantImage] = useState<string | null | undefined>(selectedVariantImage);

  if (selectedVariantImage !== prevVariantImage) {
    setPrevVariantImage(selectedVariantImage);
    if (selectedVariantImage) {
      setSelectedImage(selectedVariantImage);
    }
  }

  const activeImageUrl = selectedImage || initialImage;
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(0);

  // Gallery list for lightbox
  const galleryList = sortedImages.map((img) => img.image_url);
  if (selectedVariantImage && !galleryList.includes(selectedVariantImage)) {
    galleryList.unshift(selectedVariantImage);
  }

  const openLightbox = (imgUrl: string | null) => {
    if (!imgUrl) return;
    const idx = galleryList.indexOf(imgUrl);
    setActiveLightboxIndex(idx >= 0 ? idx : 0);
    setIsLightboxOpen(true);
  };

  const nextLightbox = () => {
    setActiveLightboxIndex((prev) => (prev + 1) % galleryList.length);
  };

  const prevLightbox = () => {
    setActiveLightboxIndex(
      (prev) => (prev - 1 + galleryList.length) % galleryList.length
    );
  };

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-4 w-full">
      {/* Thumbnails list (vertical on desktop, horizontal on mobile) */}
      {galleryList.length > 1 && (
        <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[520px] scrollbar-none pb-2 sm:pb-0 shrink-0">
          {galleryList.map((imgUrl, index) => {
            const isSelected = activeImageUrl === imgUrl;
            return (
              <button
                key={`${imgUrl}-${index}`}
                type="button"
                onClick={() => setSelectedImage(imgUrl)}
                className={`relative h-18 w-18 sm:h-20 sm:w-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 scale-102"
                    : "border-border/70 hover:border-foreground/50 opacity-80 hover:opacity-100"
                }`}
              >
                <Image
                  src={imgUrl}
                  alt={`${productName} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Main Showcase Image */}
      <div className="relative flex-1 aspect-[3/4] rounded-3xl overflow-hidden border border-border/80 bg-muted/30 shadow-md group">
        {activeImageUrl ? (
          <>
            <Image
              src={activeImageUrl}
              alt={productName}
              fill
              priority
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-103"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
            />

            {/* Badges on top of image */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
              {discountPercent && discountPercent > 0 && (
                <span className="inline-flex items-center rounded-lg bg-destructive px-2.5 py-1 text-xs font-extrabold text-destructive-foreground shadow-md tracking-tight">
                  Save {discountPercent}%
                </span>
              )}
              {isTopSeller && (
                <span className="inline-flex items-center rounded-lg bg-amber-500 text-amber-950 font-extrabold px-2.5 py-1 text-xs shadow-md">
                  Top Seller
                </span>
              )}
            </div>

            {/* Lightbox / Zoom Button */}
            <button
              type="button"
              onClick={() => openLightbox(activeImageUrl)}
              className="absolute bottom-4 right-4 h-10 w-10 rounded-xl bg-background/90 backdrop-blur-md border border-border/80 flex items-center justify-center text-foreground shadow-md opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:border-primary cursor-pointer"
              aria-label="Enlarge image"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/60 text-muted-foreground">
            <ShoppingBag className="h-16 w-16 opacity-30 stroke-[1.5]" />
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && galleryList.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-50"
            aria-label="Close fullscreen view"
          >
            <X className="h-6 w-6" />
          </button>

          {galleryList.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevLightbox}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-50"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={nextLightbox}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-50"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="relative h-[85vh] w-[85vw] max-w-4xl max-h-[900px]">
            <Image
              src={galleryList[activeLightboxIndex]}
              alt={`${productName} enlarged view`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full bg-white/10">
            {activeLightboxIndex + 1} / {galleryList.length}
          </div>
        </div>
      )}
    </div>
  );
}
