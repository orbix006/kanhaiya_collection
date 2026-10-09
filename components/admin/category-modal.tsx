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

    const res = await saveCategoryAction(payload);
    setIsSubmitting(false);

    if (res.error) {
      setFormError(res.error);
    } else if (res.category) {
      onSuccess(res.category as Category);
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
      <div className="relative w-full max-w-xl rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FolderTree className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {isEditing && categoryToEdit ? `Edit Category: ${categoryToEdit.name}` : "Create New Category"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure category details, safe parent placement, and storefront visibility.
            </p>
          </div>
        </div>

        {formError && (
          <div className="mb-5">
            <FormError message={formError} />
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Name */}
          <FormField label="Category Name" required helperText="e.g., Menswear, Sarees, Footwear">
            <FormInput
              type="text"
              required
              placeholder="Enter category name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </FormField>

          {/* Editable Auto-Slug */}
          <FormField
            label="URL Slug"
            required
            helperText="Used in deep-links (/shop?category=slug). Auto-generates as you type name."
          >
            <div className="relative flex items-center">
              <FormInput
                type="text"
                required
                placeholder="category-slug"
                value={slug}
                disabled={isSlugLocked}
                onChange={(e) => setSlug(e.target.value)}
                className="pr-24 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setIsSlugLocked(!isSlugLocked)}
                className={`absolute right-2 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  isSlugLocked
                    ? "bg-muted text-muted-foreground hover:text-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
                title={isSlugLocked ? "Unlock to customize slug" : "Lock to auto-sync with name"}
              >
                {isSlugLocked ? (
                  <>
                    <Lock className="h-3 w-3" />
                    <span>Auto</span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3" />
                    <span>Custom</span>
                  </>
                )}
              </button>
            </div>
          </FormField>

          {/* Safe Parent Picker */}
          <FormField
            label="Parent Category (Safe Picker)"
            helperText={
              isEditing
                ? "Cycle safe: This category and all of its descendants are automatically disabled."
                : "Select None for top-level root category, or nest under an existing category."
            }
          >
            <FormSelect
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">(None — Top Level Root Category)</option>
              {parentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {getCategoryPathLabel(opt.id, allCategories)}
                </option>
              ))}
            </FormSelect>
          </FormField>

          {/* Description */}
          <FormField label="Description" helperText="Brief summary shown on homepage category boxes.">
            <FormTextarea
              rows={2}
              placeholder="Describe this category..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          {/* Media Image URL */}
          <FormField label="Media Image URL" helperText="Public image URL displayed on category cards.">
            <div className="flex items-center gap-3">
              <FormInput
                type="url"
                placeholder="https://... image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              {imageUrl && (
                <div className="relative h-9.5 w-9.5 rounded-xl border border-border overflow-hidden shrink-0">
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </FormField>

          {/* Display Order */}
          <FormField label="Display Order" helperText="Determines sorting sequence across menus and storefront grids.">
            <FormInput
              type="number"
              min={0}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
              className="w-32"
            />
          </FormField>

          {/* Flags: Active & Homepage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <FormSwitch
              label="Active Status"
              description="Category is active across storefront and catalog"
              checked={isActive}
              onChange={setIsActive}
            />
            <FormSwitch
              label="Show on Homepage"
              description="Render in homepage Category Grid & Rows"
              checked={showOnHomepage}
              onChange={setShowOnHomepage}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Category"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
