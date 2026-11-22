"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  FolderTree,
  AlertCircle,
  Save,
} from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";
import {
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
} from "./form";
import {
  generateSlug,
  getDescendantCategoryIds,
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

  // Exactly the 5 fields requested
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailPath, setThumbnailPath] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePath, setImagePath] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form values
  useEffect(() => {
    if (!isOpen) return;

    if (categoryToEdit) {
      setName(categoryToEdit.name || "");
      setParentId(categoryToEdit.parent_id || "");
      setThumbnailUrl(categoryToEdit.image_url || "");
      setThumbnailPath((categoryToEdit as any).thumbnail_path || null);
      setDescription(categoryToEdit.description || "");
      setImageUrl((categoryToEdit as any).banner_image_url || categoryToEdit.image_url || "");
      setImagePath((categoryToEdit as any).image_path || null);
    } else {
      setName("");
      setParentId(defaultParentId || "");
      setThumbnailUrl("");
      setThumbnailPath(null);
      setDescription("");
      setImageUrl("");
      setImagePath(null);
    }
    setFormError(null);
  }, [isOpen, categoryToEdit, defaultParentId]);

  if (!isOpen) return null;

  // Safe Parent Picker: Calculate disallowed IDs (cannot select itself or any descendants)
  const disallowedParentIds: string[] = [];
  if (categoryToEdit) {
    disallowedParentIds.push(categoryToEdit.id);
    const descendantIds = getDescendantCategoryIds(categoryToEdit.id, allCategories);
    disallowedParentIds.push(...descendantIds);
  }

  // Available parent options (Only root categories can be parents; max 2 levels)
  const parentOptions = allCategories.filter(
    (cat) => !disallowedParentIds.includes(cat.id) && !cat.parent_id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Category name is required.");
      return;
    }

    // Auto-generate safe slug
    const finalSlug = categoryToEdit?.slug || generateSlug(trimmedName) || `category-${Date.now()}`;

    // Schema constraint check: prevent duplicate lower(name) under the same parent
    const targetParentId = parentId.trim() ? parentId : null;
    const duplicateName = allCategories.find((c) => {
      const sameParent = (c.parent_id || null) === targetParentId;
      const sameName = c.name.toLowerCase() === trimmedName.toLowerCase();
      const notCurrent = c.id !== categoryToEdit?.id;
      return sameParent && sameName && notCurrent;
    });

    if (duplicateName) {
      setFormError(
        `A category named "${trimmedName}" already exists under ${
          targetParentId ? "this parent category" : "main categories"
        }. Please choose a unique name.`
      );
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    // Effective image: thumbnail takes priority, then secondary image, then default empty-state
    const effectiveImgUrl = thumbnailUrl.trim() || imageUrl.trim() || "/images/default-category.svg";
    const effectiveStoragePath = thumbnailPath || imagePath || null;

    const payload: CategoryPayload = {
      id: categoryToEdit?.id,
      name: trimmedName,
      slug: finalSlug,
      description: description.trim() || null,
      parent_id: targetParentId,
      image_url: effectiveImgUrl,
      thumbnail_path: effectiveStoragePath,
      display_order: categoryToEdit?.display_order || allCategories.length + 1,
      is_active: categoryToEdit?.is_active ?? true,
      show_on_homepage: categoryToEdit?.show_on_homepage ?? true,
    };

    // 1. Invoke server action to persist to Supabase categories table first
    try {
      const serverRes = await saveCategoryAction(payload);
      if (serverRes.error) {
        setIsSubmitting(false);
        setFormError(serverRes.error);
        return;
      }

      const savedCategory = (serverRes.category || payload) as unknown as Category;

      // 2. Synchronize local store only after database confirms
      upsertCategoryInStore({
        id: (savedCategory as any).id || payload.id,
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        parent_id: payload.parent_id,
        image_url: payload.image_url,
        display_order: payload.display_order,
        is_active: payload.is_active,
        show_on_homepage: payload.show_on_homepage,
      });

      setIsSubmitting(false);
      onSuccess(savedCategory);
      onClose();
      return;
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err.message || "Failed to save category. Please check your network connection.");
      return;
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
      <div className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto">
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
              {isEditing ? `Edit Category: ${categoryToEdit?.name || ""}` : "Add Category"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in the details below to save and update the storefront catalog.
            </p>
          </div>
        </div>

        {formError && (
          <div className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive font-medium flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Category Name (Required) */}
          <FormField label="1. Category Name" required>
            <FormInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Pure Brass Idols, Akhand Diya"
              required
            />
          </FormField>

          {/* 2. Parent Category (Dropdown: None or existing categories) */}
          <FormField
            label="2. Parent Category"
            helperText="Select 'None' for main/parent category, or choose an existing parent category to create a subcategory."
          >
            <FormSelect
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">None (Main / Parent Category)</option>
              {parentOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </FormSelect>
          </FormField>

          {/* 3. Category Thumbnail (Optional upload) */}
          <FormField
            label="3. Category Thumbnail (Optional)"
            helperText="Optional thumbnail icon or image stored in Supabase Storage. Uses default image if omitted."
          >
            <div className="space-y-2">
              <ImageUploader
                bucket="category-thumbnails"
                folderPath="thumbnails"
                currentImageUrl={thumbnailUrl}
                onUploadComplete={(url, storagePath) => {
                  setThumbnailUrl(url);
                  setThumbnailPath(storagePath || null);
                }}
                aspectRatio="square"
                maxSizeMB={2}
                label="Upload Thumbnail"
              />

              {thumbnailUrl && (
                <div className="flex items-center justify-between p-2 rounded-xl border border-border bg-muted/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative h-8 w-8 rounded-lg border border-border overflow-hidden shrink-0 bg-muted">
                      <Image
                        src={thumbnailUrl}
                        alt="Thumbnail"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-xs">
                      {thumbnailUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailUrl("");
                      setThumbnailPath(null);
                    }}
                    className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove Thumbnail"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </FormField>

          {/* 4. Description (Optional) */}
          <FormField label="4. Description (Optional)" helperText="Brief summary of offerings under this category">
            <FormTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description of category offerings for devotees..."
              rows={3}
            />
          </FormField>

          {/* 5. Image Upload (Optional) */}
          <FormField
            label="5. Image Upload (Optional)"
            helperText="Optional secondary promotional or banner image stored in Supabase Storage. Uses default image if omitted."
          >
            <div className="space-y-2">
              <ImageUploader
                bucket="category-thumbnails"
                folderPath="banners"
                currentImageUrl={imageUrl}
                onUploadComplete={(url, storagePath) => {
                  setImageUrl(url);
                  setImagePath(storagePath || null);
                }}
                aspectRatio="banner"
                maxSizeMB={5}
                label="Upload Image"
              />

              {imageUrl && (
                <div className="flex items-center justify-between p-2 rounded-xl border border-border bg-muted/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative h-8 w-12 rounded-lg border border-border overflow-hidden shrink-0 bg-muted">
                      <Image
                        src={imageUrl}
                        alt="Category Image"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-xs">
                      {imageUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl("");
                      setImagePath(null);
                    }}
                    className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove Image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </FormField>

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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? "Saving..." : isEditing ? "Update Category" : "Save Category"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
