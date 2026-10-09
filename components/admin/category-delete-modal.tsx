"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { getDescendantCategoryIds, getCategoryPathLabel } from "@/lib/data/categories";
import { deleteCategoryAction } from "@/app/(admin)/admin/categories/actions";
import type { Category } from "@/lib/data/homepage";

interface CategoryDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedCategoryId: string) => void;
  category: Category | null;
  allCategories: Category[];
}

export function CategoryDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  category,
  allCategories,
}: CategoryDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !category) return null;

  // Calculate descendant categories that will be cascade deleted
  const descendantIds = getDescendantCategoryIds(category.id, allCategories);
  const descendantCategories = allCategories.filter((c) =>
    descendantIds.includes(c.id)
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    const res = await deleteCategoryAction(category.id);
    setIsDeleting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      onSuccess(category.id);
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

      {/* Modal Dialog */}
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
              Delete Category: {category.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Please review the cascade deletion effects before proceeding.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive font-medium">
            {errorMessage}
          </div>
        )}

        {/* Descendant Cascade Explanation */}
        <div className="space-y-4 text-xs text-foreground/90">
          <div className="rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/40 p-4 text-amber-900 dark:text-amber-200">
            <p className="font-bold text-xs mb-1">
              ⚠️ Descendant Cascade Deletion Warning:
            </p>
            <p className="leading-relaxed">
              In this database schema, subcategories reference their parent via a cascading foreign key (<code>parent_id ON DELETE CASCADE</code>).
              Deleting <strong>"{category.name}"</strong> will permanently delete this category and all of its descendant subcategories.
            </p>
          </div>

          {descendantCategories.length > 0 ? (
            <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2">
              <span className="font-semibold text-xs text-foreground block">
                The following {descendantCategories.length} subcategory(ies) will also be deleted:
              </span>
              <ul className="space-y-1.5 pl-3 list-disc text-muted-foreground">
                {descendantCategories.map((sub) => (
                  <li key={sub.id} className="font-mono text-[11px]">
                    {getCategoryPathLabel(sub.id, allCategories)}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground">
              This category has no subcategories. Only <strong>"{category.name}"</strong> will be removed.
            </p>
          )}

          <div className="rounded-xl border border-border/70 p-3 bg-card text-[11px] text-muted-foreground">
            <strong>Product Survival Note:</strong> Products assigned to this category will <strong>not</strong> be deleted; their category association will automatically become uncategorized (<code>category_id SET NULL</code>).
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold shadow-xs hover:bg-destructive/90 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>
              {isDeleting
                ? "Deleting..."
                : descendantCategories.length > 0
                ? `Delete Category & ${descendantCategories.length} Subcategories`
                : "Delete Category"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
