"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Lock,
  Unlock,
  FolderTree,
  AlertCircle,
  Save,
  ImageIcon,
} from "lucide-react";
import {
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
  FormSwitch,
  FormError,
} from "./form";
import {
  generateSlug,
  getDescendantCategoryIds,
  getCategoryPathLabel,
} from "@/lib/data/categories";
import { upsertCategoryInStore } from "@/lib/mock-data/admin-store";
import { saveCategoryAction, CategoryPayload } from "@/app/(admin)/admin/categories/actions";
import type { Category } from "@/lib/data/homepage";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedCategory: Category) => void;
  categoryToEdit?: Category | null;
  defaultParentId?: string | null;
  allCategories: Category[];
}

export function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  categoryToEdit,
  defaultParentId,
  allCategories,
}: CategoryModalProps) {
  const isEditing = Boolean(categoryToEdit);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [showOnHomepage, setShowOnHomepage] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form values
  useEffect(() => {
    if (!isOpen) return;

    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setSlug(categoryToEdit.slug);
      setIsSlugLocked(true);
      setDescription(categoryToEdit.description || "");
      setParentId(categoryToEdit.parent_id || "");
      setImageUrl(categoryToEdit.image_url || "");
      setDisplayOrder(categoryToEdit.display_order || 0);
      setIsActive(categoryToEdit.is_active ?? true);
      setShowOnHomepage(categoryToEdit.show_on_homepage ?? true);
    } else {
      setName("");
      setSlug("");
      setIsSlugLocked(true);
      setDescription("");
      setParentId(defaultParentId || "");
      setImageUrl("");
      setDisplayOrder(allCategories.length + 1);
      setIsActive(true);
      setShowOnHomepage(true);
    }
    setFormError(null);
  }, [isOpen, categoryToEdit, defaultParentId, allCategories.length]);

  if (!isOpen) return null;

  // Handle Name typing -> Auto-slug generation if locked
  const handleNameChange = (val: string) => {
    setName(val);
    if (isSlugLocked) {
      setSlug(generateSlug(val));
    }
  };

  // Safe Parent Picker: Calculate disallowed IDs (cannot select itself or any descendants)
  const disallowedParentIds: string[] = [];
  if (categoryToEdit) {
    disallowedParentIds.push(categoryToEdit.id);
    const descendantIds = getDescendantCategoryIds(categoryToEdit.id, allCategories);
    disallowedParentIds.push(...descendantIds);
  }

  // Available parent options
  const parentOptions = allCategories.filter(
    (cat) => !disallowedParentIds.includes(cat.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    const finalSlug = slug.trim() ? generateSlug(slug) : generateSlug(name);
    if (!finalSlug) {
      setFormError("A valid URL slug is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: CategoryPayload = {
      id: categoryToEdit?.id,
      name: name.trim(),
      slug: finalSlug,
      description: description.trim() || null,
      parent_id: parentId.trim() ? parentId : null,
      image_url: imageUrl.trim() || null,
      display_order: Number(displayOrder) || 0,
      is_active: isActive,
      show_on_homepage: showOnHomepage,
    };

    // 1. Save and validate locally in Mock Store (with persistence in localStorage)
    const localRes = upsertCategoryInStore({
      id: payload.id,
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      parent_id: payload.parent_id,
      image_url: payload.image_url,
      display_order: payload.display_order,
      is_active: payload.is_active,
      show_on_homepage: payload.show_on_homepage,
    });

    if (!localRes.success) {
      setIsSubmitting(false);
      setFormError(localRes.error || "Failed to validate category.");
      return;
    }

    // 2. Invoke server action for Next.js path cache revalidation
    try {
      await saveCategoryAction(payload);
    } catch {
      // Offline fallback
    }

    setIsSubmitting(false);
    onSuccess(localRes.category as unknown as Category);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
            <FolderTree className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              {isEditing ? `Edit Category: ${categoryToEdit?.name || ""}` : "Create New Category"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure name, hierarchy level, URL slug, and storefront placement.
            </p>
          </div>
        </div>

        {formError && (
          <div className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive font-medium flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <FormField label="Category Name" required>
            <FormInput
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Pure Brass Idols, Akhand Diya"
              required
            />
          </FormField>

          {/* Slug with Auto-generate / Manual edit toggle */}
          <FormField
            label="URL Slug"
            required
            helperText="Used in the URL: /shop?category=<slug>"
          >
            <div className="relative flex items-center">
              <span className="absolute left-3 font-mono text-xs text-muted-foreground">/</span>
              <FormInput
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugLocked(false);
                }}
                className="pl-6 pr-10 font-mono text-xs"
                placeholder="pure-brass-idols"
                required
              />
              <button
                type="button"
                onClick={() => {
                  if (!isSlugLocked) {
                    setSlug(generateSlug(name));
                  }
                  setIsSlugLocked(!isSlugLocked);
                }}
                className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title={isSlugLocked ? "Slug is auto-generated. Click to customize." : "Slug is customized. Click to lock & sync with name."}
              >
                {isSlugLocked ? (
                  <Lock className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Unlock className="h-3.5 w-3.5 text-amber-500" />
                )}
              </button>
            </div>
          </FormField>

          {/* Parent Category Picker (Prevents cycle and self-selection) */}
          <FormField
            label="Parent Category"
            helperText="Select a parent to create a subcategory (unlimited depth supported)"
          >
            <FormSelect
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">(None - Top Level Root Category)</option>
              {parentOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {getCategoryPathLabel(cat.id, allCategories)}
                </option>
              ))}
            </FormSelect>
          </FormField>

          {/* Description */}
          <FormField label="Description" helperText="Optional summary of products under this category">
            <FormTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for customer guidance..."
              rows={2}
            />
          </FormField>

          {/* Image URL & Preview */}
          <FormField
            label="Category Thumbnail Image URL"
            helperText="Image shown in 'Shop by Category' cards on the homepage"
          >
            <div className="space-y-2">
              <div className="relative">
                <FormInput
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or /images/preview-murti.jpg"
                />
              </div>

              {/* Quick Preset Buttons for Development */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
                <span className="font-semibold">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => setImageUrl("https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80")}
                  className="px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                >
                  Brass Idols
                </button>
                <button
                  type="button"
                  onClick={() => setImageUrl("https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80")}
                  className="px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                >
                  Akhand Diya
                </button>
                <button
                  type="button"
                  onClick={() => setImageUrl("https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=800&q=80")}
                  className="px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                >
                  Puja Thali
                </button>
                <button
                  type="button"
                  onClick={() => setImageUrl("https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80")}
                  className="px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                >
                  Dhoop & Aromas
                </button>
              </div>

              {imageUrl && (
                <div className="flex items-center gap-3 p-2 rounded-xl border border-border bg-muted/30">
                  <div className="relative h-12 w-12 rounded-lg border border-border overflow-hidden shrink-0 bg-muted">
                    <Image
                      src={imageUrl}
                      alt="Category Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate max-w-sm">
                    {imageUrl}
                  </span>
                </div>
              )}
            </div>
          </FormField>

          {/* Display Order */}
          <FormField
            label="Display Order"
            helperText="Controls the sorting sequence among categories at the same depth"
          >
            <FormInput
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
              min={0}
              className="w-32 font-mono"
            />
          </FormField>

          {/* Visibility Switches */}
          <div className="pt-2 border-t border-border/60 space-y-3">
            <FormSwitch
              checked={isActive}
              onChange={setIsActive}
              label="Active Status"
              description="When deactivated, this category and its subcategories are hidden from customer view."
            />

            <FormSwitch
              checked={showOnHomepage}
              onChange={setShowOnHomepage}
              label="Show on Homepage"
              description="Keep visible in shop catalog, but control whether a card appears on the homepage."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? "Saving..." : isEditing ? "Update Category" : "Create Category"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
