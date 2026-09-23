"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertTriangle, Trash2, Archive, X, AlertCircle } from "lucide-react";
import type { ProductDetail } from "@/lib/data/products";
import {
  archiveProductAction,
  deleteProductAction,
} from "@/app/(admin)/admin/products/actions";

interface ProductDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedId: string, actionType: "archive" | "delete") => void;
  product: ProductDetail | null;
}

export function ProductDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: ProductDeleteModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const primaryImage =
    product.images.find((img) => img.is_primary)?.image_url ||
    product.images[0]?.image_url;

  const handleArchive = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    const res = await archiveProductAction(product.id, true);
    setIsProcessing(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      onSuccess(product.id, "archive");
      onClose();
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    const res = await deleteProductAction(product.id);
    setIsProcessing(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      onSuccess(product.id, "delete");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-destructive/40 bg-card p-6 sm:p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Warning Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              Manage / Delete Product
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose to archive or permanently delete this catalog item.
            </p>
          </div>
        </div>

        {/* Product Preview Card */}
        <div className="flex items-center gap-4 p-3.5 rounded-2xl border border-border bg-muted/30 mb-5">
          <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/80">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                No Img
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-foreground truncate">
              {product.name}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {product.sku && <span className="font-mono">SKU: {product.sku}</span>}
              <span>•</span>
              <span className="font-semibold text-foreground">
                ₹{product.base_price.toLocaleString("en-IN")}
              </span>
              <span>•</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  product.is_active
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {product.is_active ? "Active" : "Archived"}
              </span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Explanation & Options */}
        <div className="space-y-3 text-xs text-foreground/90">
          <div className="rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/40 p-4 text-amber-900 dark:text-amber-200">
            <p className="font-bold mb-1">Recommended: Archive Product</p>
            <p className="leading-relaxed">
              Archiving immediately hides the product from customer browse, search, and recommendations, while safeguarding existing order records and review histories.
            </p>
          </div>

          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-muted-foreground">
            <p className="font-bold text-destructive mb-1">Permanent Deletion:</p>
            <p className="leading-relaxed text-[11px]">
              Permanently removes this product, its uploaded image links, and all {product.variants.length} variant(s). This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 mt-6 pt-5 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>

          {product.is_active && (
            <button
              type="button"
              onClick={handleArchive}
              disabled={isProcessing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
            >
              <Archive className="h-4 w-4" />
              <span>{isProcessing ? "Archiving..." : "Archive Product"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDelete}
            disabled={isProcessing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold shadow-xs hover:bg-destructive/90 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isProcessing ? "Deleting..." : "Permanently Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
