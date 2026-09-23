"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Sparkles,
  Info,
  Check,
} from "lucide-react";
import type {
  ProductDetail,
  ProductVariant,
  ProductReviewItem,
  ProductRatingSummary,
} from "@/lib/data/products";
import { ProductGallery } from "./product-gallery";
import { ProductPurchasePanel } from "./product-purchase-panel";
import { ProductReviewsSection } from "./product-reviews-section";

interface ProductDetailViewProps {
  product: ProductDetail;
  reviews: ProductReviewItem[];
  userPendingReview: ProductReviewItem | null;
  reviewSummary: ProductRatingSummary;
  canReview: boolean;
  alreadyReviewed: boolean;
  reviewIneligibilityReason?: string;
  isAuthenticated: boolean;
  currentUserId?: string | null;
}

export function ProductDetailView({
  product,
  reviews,
  userPendingReview,
  reviewSummary,
  canReview,
  alreadyReviewed,
  reviewIneligibilityReason,
  isAuthenticated,
  currentUserId,
}: ProductDetailViewProps) {
  const [selectedVariantImage, setSelectedVariantImage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleVariantChange = (variant: ProductVariant | null) => {
    if (variant?.image_url) {
      setSelectedVariantImage(variant.image_url);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || `Check out ${product.name} on Kanhaiya Collection`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fall back to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.base_price
      ? Math.round(
          ((product.compare_at_price - product.base_price) /
            product.compare_at_price) *
            100
        )
      : null;

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb Navigation & Share */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-none"
        >
          <Link
            href="/"
            className="hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-foreground transition-colors">
            Shop
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/shop?category=${encodeURIComponent(product.category.slug)}`}
                className="hover:text-primary transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground font-bold truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shrink-0 cursor-pointer"
          title="Share this product"
        >
          {copiedLink ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </>
          )}
        </button>
      </div>

      {/* Main Product Presentation (Gallery on Left, Purchasing Panel on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Gallery Column */}
        <div className="lg:col-span-7">
          <ProductGallery
            images={product.images}
            productName={product.name}
            selectedVariantImage={selectedVariantImage}
            discountPercent={discountPercent}
            isTopSeller={product.is_featured_top_seller}
          />
        </div>

        {/* Purchase Panel Column */}
        <div className="lg:col-span-5">
          <ProductPurchasePanel
            product={product}
            onVariantChange={handleVariantChange}
          />
        </div>
      </div>

      {/* Product Description & Specification Details */}
      <div className="mt-16 pt-12 border-t border-border/70 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Authentic Craftsmanship</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Product Overview & Description
            </h2>
          </div>

          <p className="text-sm sm:text-base text-foreground/80 leading-relaxed whitespace-pre-line">
            {product.description ||
              "Handcrafted with exquisite attention to detail using pure fabrics and artisanal techniques."}
          </p>

          {/* Key Product Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl border border-border/70 bg-card flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Fabric & Material
              </span>
              <span className="text-xs text-muted-foreground">
                100% pure authentic handloom weave with natural dye techniques.
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-border/70 bg-card flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Care Instructions
              </span>
              <span className="text-xs text-muted-foreground">
                Dry clean recommended for initial wears. Store in a cool, moisture-free closet.
              </span>
            </div>
          </div>
        </div>

        {/* Specifications Table */}
        <div className="rounded-3xl border border-border/70 bg-muted/20 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Info className="h-4 w-4 text-primary" />
            <span>Specifications</span>
          </div>

          <dl className="divide-y divide-border/60 text-xs">
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted-foreground">Brand</dt>
              <dd className="font-semibold text-foreground">
                {product.brand || "Kanhaiya Collection"}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted-foreground">Category</dt>
              <dd className="font-semibold text-foreground">
                {product.category?.name || "Apparel"}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted-foreground">SKU Code</dt>
              <dd className="font-mono text-foreground">
                {product.sku || "N/A"}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted-foreground">Country of Origin</dt>
              <dd className="font-semibold text-foreground">India</dd>
            </div>
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted-foreground">Warranty / Guarantee</dt>
              <dd className="font-semibold text-foreground">Authenticity Guaranteed</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Customer Reviews & Moderation Section */}
      <div className="mt-16">
        <ProductReviewsSection
          productId={product.id}
          productSlug={product.slug}
          reviews={reviews}
          userPendingReview={userPendingReview}
          summary={reviewSummary}
          canReview={canReview}
          alreadyReviewed={alreadyReviewed}
          reviewIneligibilityReason={reviewIneligibilityReason}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
