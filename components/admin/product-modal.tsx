"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import {
  X,
  Package,
  AlertCircle,
  Loader2,
  Lock,
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import { ImageUploader, type UploadedImageItem } from "@/components/ui/image-uploader";
import {
  generateSlug,
  getDescendantCategoryIds,
} from "@/lib/data/categories";
import {
  generateProductSku,
  generateProductBatchNumber,
  upsertProductInStore,
} from "@/lib/mock-data/admin-store";
import type { Category } from "@/lib/data/homepage";
import type { ProductDetail } from "@/lib/data/products";
import {
  saveProductAction,
  type ProductSavePayload,
  type ProductImageInput,
} from "@/app/(admin)/admin/products/actions";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductDetail | null;
  categories: Category[];
  onSuccess: (savedProduct: any) => void;
}

export function ProductModal({
  isOpen,
  onClose,
  product,
  categories,
  onSuccess,
}: ProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // 1. Product Name
  const [name, setName] = useState("");

  // 2. Images (Uploaded files with previews, reordering, removal, primary selection)
  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);

  // 3. Category & 4. Subcategory
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");

  // 5. SKU & 6. Batch (Automatically generated, non-manual input)
  const [sku, setSku] = useState("");
  const [batchNo, setBatchNo] = useState("");

  // 7. Product Detail (Multiline description)
  const [description, setDescription] = useState("");

  // 8. Price
  const [price, setPrice] = useState<string>("");

  // 9. Stock
  const [stock, setStock] = useState<string>("0");

  // Optional status & top seller flag
  const [isActive, setIsActive] = useState<boolean>(true);

  // Eligible parent categories (top-level or parent_id === null)
  const parentCategories = useMemo(() => {
    return categories.filter((c) => !c.parent_id);
  }, [categories]);

  // Subcategories belonging strictly to the selected parent category
  const availableSubcategories = useMemo(() => {
    if (!categoryId) return [];
    const descendantIds = new Set(getDescendantCategoryIds(categoryId, categories));
    return categories.filter((c) => descendantIds.has(c.id) || c.parent_id === categoryId);
  }, [categories, categoryId]);

  // Populate form on open / reset for creation
  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage(null);
    setSuccessToast(null);

    if (product) {
      // Edit Product Mode
      setName(product.name || "");
      setDescription(product.description || "");
      setPrice(
        product.base_price !== undefined
          ? String(product.base_price)
          : (product as any).price !== undefined
          ? String((product as any).price)
          : ""
      );
      setStock(product.stock_quantity !== undefined ? String(product.stock_quantity) : "0");
      setIsActive(product.is_active ?? true);

      // Preserve existing SKU and Batch
      setSku(product.sku || "");
      setBatchNo((product as any).batch_no || (product as any).batch_number || "");

      // Resolve category & subcategory
      if ((product as any).subcategory_id) {
        setCategoryId(product.category_id || "");
        setSubcategoryId((product as any).subcategory_id || "");
      } else {
        const assignedCat = categories.find((c) => c.id === product.category_id);
        if (assignedCat && assignedCat.parent_id) {
          setCategoryId(assignedCat.parent_id);
          setSubcategoryId(assignedCat.id);
        } else {
          setCategoryId(product.category_id || (parentCategories[0]?.id || ""));
          setSubcategoryId("");
        }
      }

      // Populate existing images
      const initialImgs: UploadedImageItem[] = (product.images || []).map((img, idx) => ({
        id: img.id || `img-${idx}`,
        url: img.image_url,
        storage_path: (img as any).storage_path || null,
        alt_text: img.alt_text || product.name,
        display_order: img.display_order ?? idx + 1,
        is_primary: Boolean(img.is_primary),
      }));
      setUploadedImages(initialImgs);
    } else {
      // Add Product Mode: Generate fresh unique SKU and Batch Number automatically
      setName("");
      setDescription("");
      setPrice("");
      setStock("0");
      setIsActive(true);
      setUploadedImages([]);

      const defaultCatId = parentCategories[0]?.id || categories[0]?.id || "";
      setCategoryId(defaultCatId);
      setSubcategoryId("");

      const initialCatObj = categories.find((c) => c.id === defaultCatId);
      setSku(generateProductSku(initialCatObj?.name || initialCatObj?.slug));
      setBatchNo(generateProductBatchNumber());
    }
  }, [isOpen, product, categories, parentCategories]);

  // When Parent Category changes: auto-clear subcategory & update SKU prefix for new product
  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    setSubcategoryId(""); // Automatically clear previous subcategory
    if (!product) {
      const catObj = categories.find((c) => c.id === newCatId);
      setSku(generateProductSku(catObj?.name || catObj?.slug));
    }
  };

  const handleImagesChange = (newImages: UploadedImageItem[]) => {
    setUploadedImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validate Product Name
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("1. Product Name is required and cannot be empty.");
      return;
    }

    // 2. Validate Images
    if (uploadedImages.length === 0) {
      setErrorMessage("2. Product Images: Please upload at least one image file from your device.");
      return;
    }

    // 3. Validate Category
    if (!categoryId) {
      setErrorMessage("3. Category: Please select an eligible category.");
      return;
    }

    // 7. Validate Product Detail
    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      setErrorMessage("7. Product Detail: Please provide a description for the product.");
      return;
    }

    // 8. Validate Price
    const numericPrice = Number(price);
    if (!price || isNaN(numericPrice) || numericPrice <= 0) {
      setErrorMessage("8. Price: Please enter a valid positive monetary price (e.g. 1999.00).");
      return;
    }

    // 9. Validate Stock
    const numericStock = Number(stock);
    if (stock === "" || isNaN(numericStock) || numericStock < 0 || !Number.isInteger(numericStock)) {
      setErrorMessage("9. Stock: Please enter a valid non-negative whole integer (e.g. 0, 10, 50).");
      return;
    }

    setIsSubmitting(true);

    // Normalize images and guarantee exactly one primary image
    const imagesToSave: ProductImageInput[] = uploadedImages.map((img, idx) => ({
      id: img.id?.startsWith("img-") ? undefined : img.id,
      image_url: img.url,
      alt_text: img.alt_text || trimmedName,
      display_order: idx + 1,
      is_primary: uploadedImages.some((i) => i.is_primary) ? Boolean(img.is_primary) : idx === 0,
    }));

    if (!imagesToSave.some((img) => img.is_primary) && imagesToSave.length > 0) {
      imagesToSave[0].is_primary = true;
    }

    const computedSlug = product?.slug || generateSlug(trimmedName);

    const payload: ProductSavePayload = {
      id: product?.id,
      category_id: categoryId || null,
      subcategory_id: subcategoryId || null,
      name: trimmedName,
      slug: computedSlug,
      description: trimmedDescription,
      brand: "Kanhaiya Collection",
      sku: sku.trim(),
      batch_number: batchNo.trim(),
      base_price: numericPrice,
      compare_at_price: null,
      stock_quantity: numericStock,
      is_active: isActive,
      is_featured_top_seller: product?.is_featured_top_seller || false,
      top_seller_display_order: null,
      meta_title: `${trimmedName} | Kanhaiya Collection`,
      meta_description: trimmedDescription.slice(0, 160),
      images: imagesToSave,
      variants: [],
    };

    try {
      // 1. Call server action for Supabase persistence first
      const serverRes = await saveProductAction(payload);
      if (serverRes.error) {
        setIsSubmitting(false);
        setErrorMessage(serverRes.error);
        return;
      }

      // 2. Synchronize local store with actual persisted record
      const persistedProduct = serverRes.product || payload;
      upsertProductInStore({
        ...payload,
        id: (persistedProduct as any).id || payload.id,
        images: imagesToSave as any,
      });

      onSuccess(persistedProduct);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[92vh] bg-card border border-border/80 text-card-foreground rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Sticky top) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground">
                {product ? `Edit Product: ${product.name}` : "Add New Product"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Fill in all 9 product parameters in this single unified form.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Single Form Body (Vertically Scrollable Container) */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 font-sans">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form id="add-product-unified-form" onSubmit={handleSubmit} className="space-y-6">
            {/* FIELD 1: PRODUCT NAME */}
            <div className="space-y-1.5 p-4 rounded-2xl border border-border/70 bg-card shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  1. Product Name <span className="text-destructive">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">Trimmed automatically</span>
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sacred Brass Krishna Idol with Flute (8-inch)"
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm font-semibold text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>

            {/* FIELD 2: PRODUCT IMAGES */}
            <div className="space-y-2 p-4 rounded-2xl border border-border/70 bg-card shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                    2. Product Images <span className="text-destructive">*</span>
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Upload actual photo files from your device. First or selected image becomes the primary thumbnail.
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-muted text-foreground">
                  {uploadedImages.length} image{uploadedImages.length === 1 ? "" : "s"}
                </span>
              </div>

              <ImageUploader
                bucket="product-images"
                folderPath="products"
                multiple={true}
                maxSizeMB={5}
                images={uploadedImages}
                onChangeImages={handleImagesChange}
              />
            </div>

            {/* FIELD 3: CATEGORY & FIELD 4: SUBCATEGORY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* FIELD 3: Category */}
              <div className="space-y-1.5 p-4 rounded-2xl border border-border/70 bg-card shadow-xs">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  3. Category <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:border-primary focus:outline-hidden cursor-pointer"
                >
                  <option value="" disabled>
                    -- Select Parent Category --
                  </option>
                  {parentCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-muted-foreground block">
                  Dynamically fetched from Category Management.
                </span>
              </div>

              {/* FIELD 4: Subcategory */}
              <div className="space-y-1.5 p-4 rounded-2xl border border-border/70 bg-card shadow-xs">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  4. Subcategory (Optional)
                </label>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  disabled={!categoryId || availableSubcategories.length === 0}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:border-primary focus:outline-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {availableSubcategories.length === 0
                      ? "-- No Subcategories Available --"
                      : "-- None (Root Category Level) --"}
                  </option>
                  {availableSubcategories.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-muted-foreground block">
                  Filtered by selected category. Resets on category change.
                </span>
              </div>
            </div>

            {/* FIELD 5: SKU & FIELD 6: BATCH */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* FIELD 5: SKU (Auto-generated) */}
              <div className="space-y-1.5 p-4 rounded-2xl border border-border/70 bg-muted/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-primary" />
                    <span>5. SKU (Auto-Generated)</span>
                  </label>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Locked
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={sku}
                  placeholder="SKU-000001"
                  className="w-full h-11 px-4 rounded-xl border border-border/80 bg-muted/40 font-mono text-xs font-bold text-foreground/80 cursor-not-allowed"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Unique identifier generated server-side. Not manually editable.
                </span>
              </div>

              {/* FIELD 6: Batch (Auto-generated) */}
              <div className="space-y-1.5 p-4 rounded-2xl border border-border/70 bg-muted/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-primary" />
                    <span>6. Batch Identifier (Auto-Generated)</span>
                  </label>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Locked
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={batchNo}
                  placeholder="B20261121-0001"
                  className="w-full h-11 px-4 rounded-xl border border-border/80 bg-muted/40 font-mono text-xs font-bold text-foreground/80 cursor-not-allowed"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Inventory batch sequence generated using date-stamped algorithm.
                </span>
              </div>
            </div>

            {/* FIELD 7: PRODUCT DETAIL */}
            <div className="space-y-1.5 p-4 rounded-2xl border border-border/70 bg-card shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  7. Product Detail &amp; Description <span className="text-destructive">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">Preserves formatting &amp; line breaks</span>
              </div>
              <textarea
                required
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter rich product details, material specifications, sacred artisan origin, dimensions, care instructions..."
                className="w-full p-4 rounded-xl border border-border bg-background text-xs font-sans leading-relaxed text-foreground focus:border-primary focus:outline-hidden resize-y"
              />
            </div>

            {/* FIELD 8: PRICE & FIELD 9: STOCK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* FIELD 8: Price */}
              <div className="space-y-1.5 p-4 rounded-2xl border border-border/70 bg-card shadow-xs">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  8. Price (INR ₹) <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="2499.00"
                    className="w-full h-11 pl-8 pr-4 rounded-xl border border-border bg-background text-sm font-mono font-bold text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  Valid positive monetary value with up to 2 decimal places.
                </span>
              </div>

              {/* FIELD 9: Stock */}
              <div className="space-y-1.5 p-4 rounded-2xl border border-border/70 bg-card shadow-xs">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  9. Available Stock <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="25"
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm font-mono font-bold text-foreground focus:border-primary focus:outline-hidden"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Non-negative whole integer initialized through inventory system.
                </span>
              </div>
            </div>

            {/* Visibility Switch */}
            <div className="p-4 rounded-2xl border border-border/70 bg-muted/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Storefront Publication Status
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Active products appear immediately on public storefront catalog.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </form>
        </div>

        {/* Action Placement (Accessible & Sticky at the bottom) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/80 bg-muted/20 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="add-product-unified-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Product...</span>
              </>
            ) : (
              <span>{product ? "Update Product" : "Save Product"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
