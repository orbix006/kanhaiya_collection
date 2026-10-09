import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getAllProducts, getActiveCategories } from "@/lib/store";
import { ProductTracker } from "./tracker";
import { ArrowLeft, Check, ShieldCheck, Truck, Sparkles } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const categories = await getActiveCategories();
  const category = categories.find((c) => c.id === product.category_id);

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(product.base_price);

  const formattedComparePrice = product.compare_at_price
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(product.compare_at_price)
    : null;

  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.base_price
      ? Math.round(
          ((product.compare_at_price - product.base_price) /
            product.compare_at_price) *
            100
        )
      : null;

  return (
    <div className="min-h-screen bg-[#FFFDF7] py-10 sm:py-16">
      {/* Client-side Recently Viewed tracker */}
      <ProductTracker productId={product.id} />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-8 flex items-center gap-2 text-xs text-[#806B57] font-sans">
          <Link href="/" className="hover:text-[#C8891A] transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          {category ? (
            <>
              <Link href={`/shop?category=${category.slug}`} className="hover:text-[#C8891A] transition-colors">
                {category.name}
              </Link>
              <span>/</span>
            </>
          ) : null}
          <span className="text-[#3B2416] font-medium truncate max-w-[200px] sm:max-w-xs">
            {product.name}
          </span>
        </div>

        {/* Product Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left: Product Image Gallery */}
          <div className="rounded-3xl bg-[#F8F1E3] border border-[#E8DCC8] overflow-hidden p-4 sm:p-6 shadow-sm">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#FFFDF7]">
              <Image
                src={product.image_url || "/images/preview-murti.jpg"}
                alt={product.name}
                fill
                priority
                className="object-cover object-center"
              />
              {discountPercent ? (
                <div className="absolute top-4 left-4 rounded-full bg-[#FFFDF7]/95 px-3 py-1 text-xs font-semibold text-[#C8891A] border border-[#E8DCC8] shadow-xs">
                  SAVE {discountPercent}%
                </div>
              ) : null}
            </div>
          </div>

          {/* Right: Product Details & Purchase Actions */}
          <div className="flex flex-col space-y-6">
            <div>
              {category ? (
                <span className="text-xs uppercase tracking-widest text-[#C8891A] font-semibold font-sans">
                  {category.name}
                </span>
              ) : null}
              <h1 className="mt-1 font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#3B2416] leading-tight">
                {product.name}
              </h1>
              <p className="mt-2 text-xs text-[#806B57] font-sans">
                Brand: <span className="font-medium text-[#3B2416]">{product.brand}</span>
              </p>
            </div>

            {/* Price Box */}
            <div className="flex items-baseline gap-3 p-4 rounded-2xl bg-[#F8F1E3]/60 border border-[#E8DCC8]/80">
              <span className="font-sans text-2xl sm:text-3xl font-bold text-[#3B2416]">
                {formattedPrice}
              </span>
              {formattedComparePrice ? (
                <span className="font-sans text-base text-[#806B57] line-through">
                  {formattedComparePrice}
                </span>
              ) : null}
              {discountPercent ? (
                <span className="text-xs font-semibold text-[#C8891A] bg-[#FFFDF7] px-2.5 py-0.5 rounded-full border border-[#E8DCC8]">
                  {discountPercent}% OFF
                </span>
              ) : null}
            </div>

            {/* Product Description */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#3B2416] font-sans">
                About this Sacred Offering
              </h2>
              <p className="text-sm sm:text-base text-[#806B57] font-normal leading-relaxed font-sans">
                {product.description}
              </p>
            </div>

            {/* Seva Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-[#806B57] font-sans">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FFFDF7] border border-[#E8DCC8]">
                <ShieldCheck className="h-4 w-4 text-[#C8891A] shrink-0" />
                <span>100% Authentic Brass & Craft</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FFFDF7] border border-[#E8DCC8]">
                <Truck className="h-4 w-4 text-[#C8891A] shrink-0" />
                <span>Secure All-India Delivery</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FFFDF7] border border-[#E8DCC8]">
                <Sparkles className="h-4 w-4 text-[#C8891A] shrink-0" />
                <span>Consecrated with Care</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FFFDF7] border border-[#E8DCC8]">
                <Check className="h-4 w-4 text-[#C8891A] shrink-0" />
                <span>In Stock ({product.stock_quantity} available)</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/checkout"
                className="flex-1 h-12 rounded-xl bg-[#C8891A] text-white font-medium text-sm sm:text-base hover:bg-[#B37814] transition-all flex items-center justify-center shadow-md font-sans"
              >
                Buy Now
              </Link>
              <Link
                href="/cart"
                className="flex-1 h-12 rounded-xl bg-[#FFFDF7] border border-[#C8891A] text-[#C8891A] font-medium text-sm sm:text-base hover:bg-[#F8F1E3] transition-all flex items-center justify-center font-sans"
              >
                Add to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
