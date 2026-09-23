"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Truck,
  RotateCcw,
  Loader2,
} from "lucide-react";
import type { ProductDetail, ProductVariant } from "@/lib/data/products";
import { addToCartAction } from "@/app/(public)/cart/actions";

interface ProductPurchasePanelProps {
  product: ProductDetail;
  onVariantChange?: (variant: ProductVariant | null) => void;
}

export function ProductPurchasePanel({
  product,
  onVariantChange,
}: ProductPurchasePanelProps) {
  const router = useRouter();

  // Selected variant state (defaults to first active variant if exists)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants.length > 0 ? product.variants[0] : null
  );

  // Quantity state
  const [quantity, setQuantity] = useState<number>(1);

  // Add to cart action state
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  // Accurate active pricing
  const activeBasePrice = selectedVariant?.price ?? product.base_price;
  const activeComparePrice =
    selectedVariant?.compare_at_price ?? product.compare_at_price;

  const discountPercent =
    activeComparePrice && activeComparePrice > activeBasePrice
      ? Math.round(((activeComparePrice - activeBasePrice) / activeComparePrice) * 100)
      : null;

  // Accurate stock calculation
  const currentStock = selectedVariant
    ? selectedVariant.stock_quantity
    : product.stock_quantity;

  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= 5;
  const maxAllowedQuantity = Math.max(1, Math.min(currentStock, 10));

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setErrorMessage(null);
    setSuccessFeedback(null);

    // Reset quantity if it exceeds new variant stock
    if (quantity > variant.stock_quantity) {
      setQuantity(Math.max(1, Math.min(1, variant.stock_quantity)));
    }

    if (onVariantChange) {
      onVariantChange(variant);
    }
  };

  const handleIncrement = () => {
    if (quantity < currentStock && quantity < maxAllowedQuantity) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleQuantityChange = (val: string) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) {
      setQuantity(1);
    } else if (parsed > maxAllowedQuantity) {
      setQuantity(maxAllowedQuantity);
    } else {
      setQuantity(parsed);
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setIsPending(true);
    setErrorMessage(null);
    setSuccessFeedback(null);

    try {
      const res = await addToCartAction({
        productId: product.id,
        variantId: selectedVariant?.id || null,
        quantity,
      });

      if (res.error) {
        if (res.requiresAuth) {
          router.push(`/login?redirect=/shop/product/${product.slug}`);
          return;
        }
        setErrorMessage(res.error);
      } else {
        if (typeof res.newCartCount === "number" && typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("cart:updated", { detail: { count: res.newCartCount } })
          );
        }
        router.refresh();
        setSuccessFeedback(
          res.message || "Added to your shopping bag successfully!"
        );
      }
    } catch {
      setErrorMessage("Something went wrong while adding to cart.");
    } finally {
      setIsPending(false);
    }
  };

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(activeBasePrice);

  const formattedComparePrice = activeComparePrice
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(activeComparePrice)
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Brand, Title, Rating */}
      <div className="flex flex-col gap-1.5">
        {product.brand && (
          <span className="text-xs font-bold tracking-widest uppercase text-primary">
            {product.brand}
          </span>
        )}

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
          {product.name}
        </h1>

        {product.sku && (
          <span className="text-xs font-mono text-muted-foreground">
            SKU: {selectedVariant?.sku || product.sku}
          </span>
        )}
      </div>

      {/* Price Block */}
      <div className="flex flex-wrap items-baseline gap-3 pb-5 border-b border-border/70">
        <span className="text-3xl sm:text-4xl font-extrabold text-foreground">
          {formattedPrice}
        </span>

        {formattedComparePrice && (
          <span className="text-lg sm:text-xl text-muted-foreground line-through">
            {formattedComparePrice}
          </span>
        )}

        {discountPercent && discountPercent > 0 && (
          <span className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold px-2.5 py-1">
            Save {discountPercent}% OFF
          </span>
        )}

        <span className="text-[11px] text-muted-foreground ml-auto">
          Inclusive of all taxes
        </span>
      </div>

      {/* Accurate Stock Status Badge */}
      <div className="flex items-center gap-2">
        {isOutOfStock ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>Currently Out of Stock</span>
          </div>
        ) : isLowStock ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold animate-pulse">
            <Clock className="h-4 w-4" />
            <span>Only {currentStock} left in stock — order soon!</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="h-4 w-4" />
            <span>In Stock ({currentStock} available)</span>
          </div>
        )}
      </div>

      {/* Variant Selection */}
      {product.variants.length > 0 && (
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Select Variant:
            </span>
            {selectedVariant && (
              <span className="text-xs font-semibold text-primary">
                {selectedVariant.variant_name}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const isVariantOutOfStock = v.stock_quantity <= 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleVariantSelect(v)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : isVariantOutOfStock
                      ? "bg-muted/30 border-border/50 text-muted-foreground/60 line-through"
                      : "bg-card border-border hover:border-foreground/60 text-foreground"
                  }`}
                >
                  <span>{v.variant_name}</span>
                  {v.price && v.price !== product.base_price && (
                    <span
                      className={`text-[10px] ${
                        isSelected
                          ? "text-primary-foreground/90"
                          : "text-muted-foreground"
                      }`}
                    >
                      (₹{v.price})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Selector and Add to Cart Button */}
      <div className="flex flex-col gap-3 pt-3">
        <div className="flex items-center gap-3">
          {/* Quantity Counter */}
          <div className="flex items-center h-12 rounded-2xl border border-border/80 bg-muted/30 p-1">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={quantity <= 1 || isOutOfStock}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>

            <input
              type="number"
              min="1"
              max={maxAllowedQuantity}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              disabled={isOutOfStock}
              className="w-12 text-center text-sm font-bold bg-transparent text-foreground focus:outline-hidden"
              aria-label="Quantity"
            />

            <button
              type="button"
              onClick={handleIncrement}
              disabled={quantity >= maxAllowedQuantity || isOutOfStock}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Add to Bag Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isPending || isOutOfStock}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Adding to Bag...</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                <span>Add to Shopping Bag</span>
              </>
            )}
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successFeedback && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successFeedback}</span>
            </div>
            <Link
              href="/cart"
              className="font-bold underline text-foreground hover:text-primary transition-colors text-right"
            >
              View Cart →
            </Link>
          </div>
        )}
      </div>

      {/* Assurance / Service Guarantee Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-border/70 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary shrink-0" />
          <span>Free Express Shipping</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span>100% Certified Authentic</span>
        </div>
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-primary shrink-0" />
          <span>7-Day Easy Returns</span>
        </div>
      </div>
    </div>
  );
}
