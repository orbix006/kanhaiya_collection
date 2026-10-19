"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  Star,
  Layers,
  Image as ImageIcon,
  DollarSign,
  Search,
  Package,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCw,
  Sliders,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
  FormSwitch,
} from "@/components/admin/form";
import { ImageUploader } from "@/components/ui/image-uploader";
import {
  generateSlug,
  getCategoryPathLabel,
  getDescendantCategoryIds,
} from "@/lib/data/categories";
import {
  upsertProductInStore,
  generateProductSku,
  generateProductBatchNumber,
} from "@/lib/mock-data/admin-store";
import type { Category } from "@/lib/data/homepage";
import type {
  ProductDetail,
  ProductImage,
  ProductVariant,
} from "@/lib/data/products";
import {
  saveProductAction,
  type ProductSavePayload,
  type ProductImageInput,
  type ProductVariantInput,
} from "@/app/(admin)/admin/products/actions";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductDetail | null;
  categories: Category[];
  onSuccess: (savedProduct: any) => void;
}

type TabType = "general" | "pricing" | "images" | "variants" | "seo";

export function ProductModal({
  isOpen,
  onClose,
  product,
  categories,
  onSuccess,
}: ProductModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [rootCategoryId, setRootCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [brand, setBrand] = useState("Kanhaiya Collection");
  const [sku, setSku] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [description, setDescription] = useState("");

  const [basePrice, setBasePrice] = useState<string>("0");
  const [compareAtPrice, setCompareAtPrice] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("10");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isFeaturedTopSeller, setIsFeaturedTopSeller] = useState<boolean>(false);
  const [topSellerDisplayOrder, setTopSellerDisplayOrder] = useState<string>("");

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Images state
  const [images, setImages] = useState<ProductImageInput[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");

  // Variants state
  const [variants, setVariants] = useState<ProductVariantInput[]>([]);

  // Category hierarchy calculation
  const effectiveCategoryId = subcategoryId || rootCategoryId;
  const availableSubcategories = useMemo(() => {
    if (!rootCategoryId) return [];
    const descendantIds = new Set(getDescendantCategoryIds(rootCategoryId, categories));
    return categories
      .filter((c) => descendantIds.has(c.id))
      .map((c) => {
        const full = getCategoryPathLabel(c.id, categories);
        const rootCat = categories.find((cat) => cat.id === rootCategoryId);
        const relLabel = rootCat && full.startsWith(rootCat.name)
          ? full.replace(rootCat.name + " > ", "")
          : full;
        return {
          ...c,
          displayLabel: relLabel,
        };
      });
  }, [categories, rootCategoryId]);

  const fullCategoryPath = useMemo(() => {
    if (!effectiveCategoryId) return "None selected";
    return getCategoryPathLabel(effectiveCategoryId, categories);
  }, [effectiveCategoryId, categories]);

  // Populate data when editing an existing product or reset when creating
  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setSlug(product.slug || "");
      setIsSlugManuallyEdited(true);

      // Resolve category & subcategory from product.category_id (supports any hierarchy depth)
      const assignedCat = categories.find((c) => c.id === product.category_id);
      if (assignedCat && assignedCat.parent_id) {
        let root = assignedCat;
        while (root.parent_id) {
          const parent = categories.find((c) => c.id === root.parent_id);
          if (!parent) break;
          root = parent;
        }
        setRootCategoryId(root.id);
        setSubcategoryId(assignedCat.id);
      } else if (assignedCat) {
        setRootCategoryId(assignedCat.id);
        setSubcategoryId("");
      } else {
        const firstRoot = categories.find((c) => !c.parent_id)?.id || categories[0]?.id || "";
        setRootCategoryId(product.category_id || firstRoot);
        setSubcategoryId("");
      }

      setBrand(product.brand || "Kanhaiya Collection");
      // Preserve existing SKU and Batch Number on edit (do NOT regenerate)
      setSku(product.sku || "");
      setBatchNumber((product as any).batch_number || "");
      setDescription(product.description || "");

      setBasePrice(String(product.base_price || 0));
      setCompareAtPrice(product.compare_at_price ? String(product.compare_at_price) : "");
      setStockQuantity(String(product.stock_quantity ?? 0));
      setIsActive(product.is_active ?? true);
      setIsFeaturedTopSeller(Boolean(product.is_featured_top_seller));
      setTopSellerDisplayOrder(
        product.top_seller_display_order !== null && product.top_seller_display_order !== undefined
          ? String(product.top_seller_display_order)
          : ""
      );

      setMetaTitle(product.meta_title || "");
      setMetaDescription(product.meta_description || "");

      setImages(
        product.images && product.images.length > 0
          ? product.images.map((img) => ({
              id: img.id,
              image_url: img.image_url,
              alt_text: img.alt_text,
              display_order: img.display_order,
              is_primary: img.is_primary,
            }))
          : []
      );

      setVariants(
        product.variants && product.variants.length > 0
          ? product.variants.map((v) => ({
              id: v.id,
              variant_name: v.variant_name,
              sku: v.sku,
              attributes: v.attributes,
              price: v.price,
              compare_at_price: v.compare_at_price,
              stock_quantity: v.stock_quantity,
              image_url: v.image_url,
              is_active: v.is_active,
            }))
          : []
      );
    } else {
      // Reset for new product: automatically generate SKU and Batch Number
      setName("");
      setSlug("");
      setIsSlugManuallyEdited(false);

      const rootCats = categories.filter((c) => !c.parent_id);
      const defaultRoot = rootCats[0]?.id || categories[0]?.id || "";
      setRootCategoryId(defaultRoot);
      setSubcategoryId("");

      const rootCatObj = categories.find((c) => c.id === defaultRoot);
      setSku(generateProductSku(rootCatObj?.name || rootCatObj?.slug));
      setBatchNumber(generateProductBatchNumber());

      setBrand("Kanhaiya Collection");
      setDescription("");

      setBasePrice("");
      setCompareAtPrice("");
      setStockQuantity("10");
      setIsActive(true);
      setIsFeaturedTopSeller(false);
      setTopSellerDisplayOrder("");

      setMetaTitle("");
      setMetaDescription("");
      setImages([]);
      setVariants([]);
    }
    setActiveTab("general");
    setErrorMessage(null);
  }, [product, categories, isOpen]);

  const handleRootCategoryChange = (newRootId: string) => {
    setRootCategoryId(newRootId);
    setSubcategoryId("");
    // If creating a new product, automatically update the SKU candidate to match category convention
    if (!product) {
      const catObj = categories.find((c) => c.id === newRootId);
      setSku(generateProductSku(catObj?.name || catObj?.slug));
    }
  };

  const handleSubcategoryChange = (newSubId: string) => {
    setSubcategoryId(newSubId);
    if (!product && newSubId) {
      const catObj = categories.find((c) => c.id === newSubId);
      setSku(generateProductSku(catObj?.name || catObj?.slug));
    }
  };

  // Handle auto-slug on name typing unless manually overridden
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManuallyEdited) {
      setSlug(generateSlug(val));
    }
  };

  const handleRegenerateSlug = () => {
    setSlug(generateSlug(name));
    setIsSlugManuallyEdited(false);
  };

  // Image Management Handlers
  const handleImageUploaded = (uploadedUrl: string) => {
    if (!uploadedUrl) return;

    setImages((prev) => {
      const isFirst = prev.length === 0;
      return [
        ...prev,
        {
          image_url: uploadedUrl,
          alt_text: `${name || "Product"} view`,
          display_order: prev.length + 1,
          is_primary: isFirst, // First image is automatically primary
        },
      ];
    });
  };

  const handleAddManualImage = (url: string) => {
    if (!url.trim()) return;
    setImages((prev) => {
      const isFirst = prev.length === 0;
      return [
        ...prev,
        {
          image_url: url.trim(),
          alt_text: `${name || "Product"} view`,
          display_order: prev.length + 1,
          is_primary: isFirst,
        },
      ];
    });
    setManualImageUrl("");
  };

  const handleMoveImage = (index: number, direction: "left" | "right") => {
    setImages((prev) => {
      const targetIdx = direction === "left" ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((img, idx) => ({ ...img, display_order: idx + 1 }));
    });
  };


  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        is_primary: idx === index,
      }))
    );
  };

  const handleDeleteImage = (index: number) => {
    setImages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      // If deleted image was primary, make the first remaining image primary
      if (prev[index].is_primary && filtered.length > 0) {
        filtered[0].is_primary = true;
      }
      return filtered;
    });
  };

  const handleImageAltChange = (index: number, text: string) => {
    setImages((prev) =>
      prev.map((img, idx) => (idx === index ? { ...img, alt_text: text } : img))
    );
  };

  // Variant Management Handlers
  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        variant_name: `Option ${prev.length + 1}`,
        sku: sku ? `${sku}-V${prev.length + 1}` : null,
        price: basePrice ? Number(basePrice) : null,
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
        stock_quantity: 5,
        image_url: images.length > 0 ? images[0].image_url : null,
        is_active: true,
        attributes: { color: "Default", size: "Standard" },
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleVariantFieldChange = (
    index: number,
    field: keyof ProductVariantInput,
    value: any
  ) => {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === index ? { ...v, [field]: value } : v))
    );
  };

  const handleVariantAttributeChange = (
    index: number,
    attrKey: string,
    attrValue: string
  ) => {
    setVariants((prev) =>
      prev.map((v, idx) => {
        if (idx !== index) return v;
        const updatedAttrs = { ...(v.attributes || {}), [attrKey]: attrValue };
        return { ...v, attributes: updatedAttrs };
      })
    );
  };

  // Primary Image check for validation banner
  const hasPrimaryImage = images.some((img) => img.is_primary);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side required field checks per specification
    if (!name.trim()) {
      setActiveTab("general");
      setErrorMessage("Product name is required.");
      return;
    }

    if (!description.trim()) {
      setActiveTab("general");
      setErrorMessage("Product details / description is required.");
      return;
    }

    if (!brand.trim()) {
      setActiveTab("general");
      setErrorMessage("Brand label is required.");
      return;
    }

    if (!effectiveCategoryId) {
      setActiveTab("general");
      setErrorMessage("Please select a category hierarchy for this product.");
      return;
    }

    if (!basePrice || isNaN(Number(basePrice)) || Number(basePrice) < 0) {
      setActiveTab("pricing");
      setErrorMessage("Please enter a valid base price (greater than or equal to 0).");
      return;
    }

    // Sensible compare-at price check
    if (
      compareAtPrice &&
      !isNaN(Number(compareAtPrice)) &&
      basePrice &&
      !isNaN(Number(basePrice)) &&
      Number(compareAtPrice) < Number(basePrice)
    ) {
      setActiveTab("pricing");
      setErrorMessage(
        `Sensible Pricing Rule: Compare-at price (₹${compareAtPrice}) cannot be lower than the base price (₹${basePrice}).`
      );
      return;
    }

    if (isActive && (!hasPrimaryImage || images.length === 0)) {
      setActiveTab("images");
      setErrorMessage(
        "Primary Image Required: Active products must have at least one usable primary image before publishing."
      );
      return;
    }

    setIsSubmitting(true);

    const payload: ProductSavePayload = {
      id: product?.id,
      category_id: effectiveCategoryId,
      name: name.trim(),
      slug: slug.trim() || generateSlug(name),
      description: description.trim(),
      brand: brand.trim(),
      sku: sku.trim() || null,
      batch_number: batchNumber.trim() || null,
      base_price: Number(basePrice),
      compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
      stock_quantity: Number(stockQuantity) || 0,
      is_active: isActive,
      is_featured_top_seller: isFeaturedTopSeller,
      top_seller_display_order: topSellerDisplayOrder
        ? Number(topSellerDisplayOrder)
        : null,
      meta_title: metaTitle.trim() || null,
      meta_description: metaDescription.trim() || null,
      images,
      variants,
    };

    // 1. Validate and save to mock store (persisted in localStorage and data/ecomm_store.json)
    const localRes = upsertProductInStore({
      id: product?.id,
      category_id: effectiveCategoryId,
      name: name.trim(),
      slug: slug.trim() || generateSlug(name),
      description: description.trim(),
      brand: brand.trim(),
      sku: sku.trim() || null,
      batch_number: batchNumber.trim() || undefined,
      base_price: Number(basePrice),
      compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
      stock_quantity: Number(stockQuantity) || 0,
      is_active: isActive,
      is_featured_top_seller: isFeaturedTopSeller,
      top_seller_display_order: topSellerDisplayOrder
        ? Number(topSellerDisplayOrder)
        : null,
      meta_title: metaTitle.trim() || null,
      meta_description: metaDescription.trim() || null,
      images: images as any,
      variants: variants as any,
    });

    if (!localRes.success) {
      setIsSubmitting(false);
      setErrorMessage(localRes.error || "Failed to validate product.");
      return;
    }

    // 2. Invoke server action for cache revalidation and server persistence
    try {
      await saveProductAction(payload);
    } catch {
      // Offline fallback
    }

    setIsSubmitting(false);
    onSuccess(localRes.product || payload);
    onClose();
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/70 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-foreground">
                {product ? `Edit Product: ${product.name}` : "Create New Product"}
              </h2>
              <span className="text-xs text-muted-foreground">
                {product
                  ? "Update catalog information, variants, images, and inventory."
                  : "Add an authentic piece to Kanhaiya Collection catalog."}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 border-b border-border/70 overflow-x-auto scrollbar-none shrink-0 bg-muted/10">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "general"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            1. General Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pricing")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "pricing"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            2. Pricing & Stock
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("images")}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "images"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>3. Images ({images.length})</span>
            {isActive && !hasPrimaryImage && (
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("variants")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "variants"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            4. Variants ({variants.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("seo")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "seo"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            5. SEO Meta
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error notification */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: General Info */}
          {activeTab === "general" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <FormField label="Product Name" required helperText="e.g. Royal Linen Formal Shirt">
                <FormInput
                  placeholder="Enter full product name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </FormField>

              {/* Editable Auto-Slug */}
              <FormField
                label="URL Slug"
                required
                helperText="URL-friendly identifier. Auto-generates from title; you can customize it freely."
              >
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
                      /shop/product/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setIsSlugManuallyEdited(true);
                      }}
                      className="h-9.5 w-full rounded-xl border border-border bg-background pl-32 pr-3 text-xs font-mono text-foreground focus:border-primary focus:outline-hidden"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRegenerateSlug}
                    className="flex items-center gap-1 h-9.5 px-3 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer shrink-0"
                    title="Reset slug from name"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Auto</span>
                  </button>
                </div>
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Category (Hierarchy Root)"
                  required
                  helperText="Select top-level catalog category"
                >
                  <FormSelect
                    value={rootCategoryId}
                    onChange={(e) => handleRootCategoryChange(e.target.value)}
                    required
                  >
                    <option value="">Select Root Category...</option>
                    {categories
                      .filter((c) => !c.parent_id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </FormSelect>
                </FormField>

                <FormField
                  label="Subcategory (Optional)"
                  helperText={
                    availableSubcategories.length > 0
                      ? "Assign to a specific child category"
                      : "No subcategories under selected root"
                  }
                >
                  <FormSelect
                    value={subcategoryId}
                    onChange={(e) => handleSubcategoryChange(e.target.value)}
                    disabled={availableSubcategories.length === 0}
                  >
                    <option value="">
                      -- None (Assign to Root Category) --
                    </option>
                    {availableSubcategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.displayLabel || c.name}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>
              </div>

              {/* Hierarchy Path Visual Breadcrumb */}
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border/80 bg-muted/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-semibold">
                    Assigned Hierarchy:
                  </span>
                  <span className="font-bold text-foreground">
                    {fullCategoryPath}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  ID: {effectiveCategoryId || "None"}
                </span>
              </div>

              <FormField label="Brand / Label" required helperText="e.g. Kanhaiya Collection">
                <FormInput
                  placeholder="Enter brand name"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                />
              </FormField>

              {/* Automatically Generated SKU & Batch Number (Strictly Read-Only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-border/80 bg-muted/20">
                {/* Automatically Generated SKU */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      Auto-Generated SKU
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                      Read-Only
                    </span>
                  </div>
                  <div className="h-9.5 px-3 rounded-xl border border-border bg-background flex items-center justify-between font-mono text-xs text-foreground font-bold select-all">
                    <span>{sku || "Generating..."}</span>
                    <span className="text-[10px] font-normal text-muted-foreground font-sans">
                      Verified Unique
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Standard SKU convention (<code className="font-mono">KC-PREFIX-SEQ</code>). Generated centrally; preserved across edits.
                  </p>
                </div>

                {/* Automatically Generated Batch Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      Auto-Generated Batch
                    </span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                      Dev Model
                    </span>
                  </div>
                  <div className="h-9.5 px-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between font-mono text-xs text-amber-900 dark:text-amber-200 font-bold select-all">
                    <span>{batchNumber || "Generating..."}</span>
                    <span className="text-[10px] font-normal text-amber-700 dark:text-amber-400 font-sans">
                      Stable Batch
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Stable unique identifier (<code className="font-mono">BATCH-YYYYMM-XXXX</code>). Development model attribute, separate from uploaded PostgreSQL database schema; flagged for migration approval.
                  </p>
                </div>
              </div>

              <FormField
                label="Product Details / Description"
                required
                helperText="Detailed description of craftsmanship, sacred materials, spiritual significance, and dimensions."
              >
                <FormTextarea
                  rows={4}
                  placeholder="Describe the artisan craft, materials (e.g. pure brass, Ashtadhatu, pure linen), and occasion..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </FormField>
            </div>
          )}

          {/* TAB 2: Pricing & Stock */}
          {activeTab === "pricing" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Base Price (₹)"
                  required
                  helperText="The actual selling price for customer purchase"
                >
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 2499"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      className="h-9.5 w-full rounded-xl border border-border bg-background pl-7 pr-3 text-xs text-foreground focus:border-primary focus:outline-hidden"
                      required
                    />
                  </div>
                </FormField>

                <FormField
                  label="Compare-at Price (₹)"
                  helperText="Optional original 'was' price shown with strikethrough discount"
                >
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 2999"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value)}
                      className="h-9.5 w-full rounded-xl border border-border bg-background pl-7 pr-3 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    />
                  </div>
                </FormField>
              </div>

              <FormField
                label="Total Inventory / Stock Quantity"
                required
                helperText="Available quantity. Auto-decrements upon confirmed customer orders."
              >
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 45"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="h-9.5 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  required
                />
              </FormField>

              {/* Status and Top Seller Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/60">
                <FormSwitch
                  label="Catalog Status"
                  description={isActive ? "Visible in public shop & search" : "Archived / Hidden from shop"}
                  checked={isActive}
                  onChange={(checked) => setIsActive(checked)}
                />

                <FormSwitch
                  label="Top Seller Pin"
                  description="Manual pin floating to the top of Top Sellers"
                  checked={isFeaturedTopSeller}
                  onChange={(checked) => setIsFeaturedTopSeller(checked)}
                />
              </div>

              {isFeaturedTopSeller && (
                <FormField
                  label="Top Seller Display Order"
                  helperText="Manual display order among pinned top sellers (lower numbers show first)"
                >
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1"
                    value={topSellerDisplayOrder}
                    onChange={(e) => setTopSellerDisplayOrder(e.target.value)}
                    className="h-9.5 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </FormField>
              )}

              {/* Read-Only System Managed Metrics (Schema Requirement) */}
              <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-3 pt-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>System-Managed Performance Metrics (Read-only)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-border/60 bg-card">
                    <span className="text-[10px] text-muted-foreground block font-medium">Average Rating</span>
                    <span className="text-sm font-bold text-foreground font-mono">
                      ★ {product?.avg_rating !== undefined ? Number(product.avg_rating).toFixed(1) : "0.0"} / 5.0
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">Rolled up from approved reviews</span>
                  </div>
                  <div className="p-3 rounded-xl border border-border/60 bg-card">
                    <span className="text-[10px] text-muted-foreground block font-medium">Review Count</span>
                    <span className="text-sm font-bold text-foreground font-mono">
                      {product?.review_count ?? 0} reviews
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">Customer feedback submissions</span>
                  </div>
                  <div className="p-3 rounded-xl border border-border/60 bg-card">
                    <span className="text-[10px] text-muted-foreground block font-medium">Lifetime Sales</span>
                    <span className="text-sm font-bold text-foreground font-mono">
                      {product?.sold_count ?? 0} units sold
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">Auto-updated on order confirmation</span>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* TAB 3: Images Management */}
          {activeTab === "images" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Primary Image Rule Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
                  hasPrimaryImage
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200"
                }`}
              >
                <ImageIcon className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold">Primary Image Requirement:</span>
                  <span>
                    {hasPrimaryImage
                      ? "A usable primary image is designated. This image acts as the primary thumbnail across Home, Shop, and Search."
                      : "An active product must have at least one image with 'Primary' marked. Upload an image below to set it as primary."}
                  </span>
                </div>
              </div>

              {/* Dev Storage Persistence Banner */}
              <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-900 dark:text-blue-200 text-xs leading-relaxed flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Development Storage Architecture: </span>
                  <span>
                    Uploaded images are streamed to the local development filesystem at <code className="font-mono bg-blue-500/10 px-1 py-0.5 rounded text-[11px]">public/uploads/</code> and referenced via standard URLs. This avoids large base64 strings in localStorage, preventing localStorage quota limits while guaranteeing image persistence across server reloads and browser refreshes.
                  </span>
                </div>
              </div>

              {/* Upload to media bucket */}
              {/* Upload to media bucket OR Add by URL/Preset */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-border/80 bg-muted/20">
                  <span className="block text-xs font-bold text-foreground mb-2">
                    Upload Local Photo File:
                  </span>
                  <ImageUploader
                    bucket="media"
                    folderPath="products"
                    label=""
                    aspectRatio="auto"
                    onUploadComplete={handleImageUploaded}
                  />
                </div>

                <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-2">
                  <span className="block text-xs font-bold text-foreground">
                    Add Photo by URL or Dev Preset:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Paste image URL (https://... or /images/...)"
                      value={manualImageUrl}
                      onChange={(e) => setManualImageUrl(e.target.value)}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddManualImage(manualImageUrl)}
                      className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shrink-0 hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground pt-1">
                    <span className="font-semibold text-[10px]">Sample Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleAddManualImage("https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80")}
                      className="px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-[10px]"
                    >
                      + Brass Idol
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddManualImage("https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80")}
                      className="px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-[10px]"
                    >
                      + Akhand Diya
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddManualImage("https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=800&q=80")}
                      className="px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-[10px]"
                    >
                      + Puja Thali
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddManualImage("https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80")}
                      className="px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-[10px]"
                    >
                      + Dhoop
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Images List */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Attached Gallery Images ({images.length})
                </span>

                {images.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative flex flex-col p-3 rounded-2xl border transition-all ${
                          img.is_primary
                            ? "border-primary ring-2 ring-primary/20 bg-card shadow-xs"
                            : "border-border/70 bg-card/60"
                        }`}
                      >
                        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-muted/50 mb-3">
                          <Image
                            src={img.image_url}
                            alt={img.alt_text || `Product photo ${idx + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />

                          {img.is_primary && (
                            <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-extrabold shadow-md">
                              <Star className="h-3 w-3 fill-current" />
                              <span>Primary Image</span>
                            </span>
                          )}

                          <span className="absolute bottom-2 right-2 rounded-md bg-black/60 text-white font-mono text-[10px] px-1.5 py-0.5 backdrop-blur-xs">
                            Order #{idx + 1}
                          </span>
                        </div>

                        {/* Alt Text Input */}
                        <div className="flex flex-col gap-1 mb-3">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">
                            Accessible Alt Text:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Front view linen shirt"
                            value={img.alt_text || ""}
                            onChange={(e) => handleImageAltChange(idx, e.target.value)}
                            className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                          />
                        </div>

                        {/* Image Actions: Set Primary, Reorder, Delete */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/60">
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            disabled={img.is_primary}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              img.is_primary
                                ? "text-primary cursor-default"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${
                                img.is_primary ? "fill-primary" : ""
                              }`}
                            />
                            <span>{img.is_primary ? "Primary Thumbnail" : "Make Primary"}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, "left")}
                              disabled={idx === 0}
                              title="Move left in gallery display order"
                              className="p-1 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, "right")}
                              disabled={idx === images.length - 1}
                              title="Move right in gallery display order"
                              className="p-1 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(idx)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              aria-label="Delete image"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center rounded-2xl border border-dashed border-border text-muted-foreground text-xs">
                    No images uploaded yet. Upload your first product photograph above.
                  </div>
                )}
              </div>
            </div>
          )}


          {/* TAB 4: Variants Management */}
          {activeTab === "variants" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Product Variants
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Optional SKU, price overrides, stock, and JSON attributes (color, size, drape).
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Variant</span>
                </button>
              </div>

              {variants.length > 0 ? (
                <div className="space-y-4">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-border/80 bg-muted/20 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          Variant #{idx + 1}: {v.variant_name}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          aria-label="Remove variant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <FormField label="Variant Name" required>
                          <input
                            type="text"
                            value={v.variant_name}
                            onChange={(e) =>
                              handleVariantFieldChange(idx, "variant_name", e.target.value)
                            }
                            placeholder="e.g. Red / Large"
                            className="h-8.5 rounded-xl border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                            required
                          />
                        </FormField>

                        <FormField label="Variant SKU">
                          <input
                            type="text"
                            value={v.sku || ""}
                            onChange={(e) =>
                              handleVariantFieldChange(idx, "sku", e.target.value)
                            }
                            placeholder="e.g. SKU-LINEN-RED-L"
                            className="h-8.5 rounded-xl border border-border bg-background px-2.5 text-xs font-mono text-foreground focus:border-primary focus:outline-hidden"
                          />
                        </FormField>

                        <FormField label="Variant Stock" required>
                          <input
                            type="number"
                            min="0"
                            value={v.stock_quantity}
                            onChange={(e) =>
                              handleVariantFieldChange(idx, "stock_quantity", Number(e.target.value))
                            }
                            className="h-8.5 rounded-xl border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                            required
                          />
                        </FormField>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <FormField label="Price Override (₹)" helperText="Overrides base price when set">
                          <input
                            type="number"
                            min="0"
                            value={v.price ?? ""}
                            onChange={(e) =>
                              handleVariantFieldChange(
                                idx,
                                "price",
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            placeholder={`Defaults to ₹${basePrice || 0}`}
                            className="h-8.5 rounded-xl border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                          />
                        </FormField>

                        <FormField label="Color Attribute">
                          <input
                            type="text"
                            value={v.attributes?.color || ""}
                            onChange={(e) =>
                              handleVariantAttributeChange(idx, "color", e.target.value)
                            }
                            placeholder="e.g. Royal Blue"
                            className="h-8.5 rounded-xl border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                          />
                        </FormField>

                        <FormField label="Size / Dimension">
                          <input
                            type="text"
                            value={v.attributes?.size || ""}
                            onChange={(e) =>
                              handleVariantAttributeChange(idx, "size", e.target.value)
                            }
                            placeholder="e.g. XL, 42, 6.3m"
                            className="h-8.5 rounded-xl border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                          />
                        </FormField>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center rounded-2xl border border-dashed border-border text-muted-foreground text-xs">
                  No variants defined yet. Click &ldquo;Add Variant&rdquo; to define options like colors, sizes, or custom cuts.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SEO Meta */}
          {activeTab === "seo" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <FormField
                label="Meta Title (SEO)"
                helperText="Appears in browser tabs and search engine headings"
              >
                <FormInput
                  placeholder="e.g. Royal Linen Formal Shirt | Kanhaiya Collection"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
              </FormField>

              <FormField
                label="Meta Description (SEO)"
                helperText="Summary snippet displayed beneath the title in search engine results"
              >
                <FormTextarea
                  rows={3}
                  placeholder="Shop authentic handcrafted royal linen formal shirts online..."
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                />
              </FormField>

              {/* Live SERP Snippet Preview */}
              <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Google Search Snippet Preview:
                </span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate">
                  {metaTitle || `${name || "Product Name"} | Kanhaiya Collection`}
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono truncate">
                  https://kanhaiyacollection.com/shop/product/{slug || "product-slug"}
                </span>
                <span className="text-xs text-muted-foreground line-clamp-2">
                  {metaDescription ||
                    description ||
                    "Explore our handcrafted apparel and designer traditional wear at Kanhaiya Collection."}
                </span>
              </div>
            </div>
          )}

          {/* Dialog Footer Actions */}
          <div className="flex items-center justify-between pt-5 border-t border-border/70 mt-auto shrink-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Status:</span>
              <span
                className={`font-bold ${
                  isActive ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {isActive ? "Active on Storefront" : "Archived (Hidden)"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{product ? "Save Changes" : "Create Product"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
