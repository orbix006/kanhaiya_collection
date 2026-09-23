"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
  FormSwitch,
} from "@/components/admin/form";
import { ImageUploader } from "@/components/ui/image-uploader";
import { generateSlug, getCategoryPathLabel } from "@/lib/data/categories";
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
  const [categoryId, setCategoryId] = useState<string>("");
  const [brand, setBrand] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");

  const [basePrice, setBasePrice] = useState<string>("");
  const [compareAtPrice, setCompareAtPrice] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("0");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isFeaturedTopSeller, setIsFeaturedTopSeller] = useState<boolean>(false);
  const [topSellerDisplayOrder, setTopSellerDisplayOrder] = useState<string>("");

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Images state
  const [images, setImages] = useState<ProductImageInput[]>([]);

  // Variants state
  const [variants, setVariants] = useState<ProductVariantInput[]>([]);

  // Populate data when editing an existing product or reset when creating
  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setSlug(product.slug || "");
      setIsSlugManuallyEdited(true);
      setCategoryId(product.category_id || "");
      setBrand(product.brand || "");
      setSku(product.sku || "");
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
      // Reset for new product
      setName("");
      setSlug("");
      setIsSlugManuallyEdited(false);
      setCategoryId(categories.length > 0 ? categories[0].id : "");
      setBrand("Kanhaiya Heritage");
      setSku("");
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

    // Client-side quick checks
    if (!name.trim()) {
      setActiveTab("general");
      setErrorMessage("Product name is required.");
      return;
    }

    if (!basePrice || isNaN(Number(basePrice)) || Number(basePrice) < 0) {
      setActiveTab("pricing");
      setErrorMessage("Please enter a valid base price (greater than or equal to 0).");
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
      category_id: categoryId || null,
      name: name.trim(),
      slug: slug.trim() || generateSlug(name),
      description: description.trim() || null,
      brand: brand.trim() || null,
      sku: sku.trim() || null,
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

    try {
      const res = await saveProductAction(payload);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        onSuccess(res.product || payload);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while saving product.");
    } finally {
      setIsSubmitting(false);
    }
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
                  label="Category"
                  required
                  helperText="Assign to parent or child subcategory"
                >
                  <FormSelect
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                  >
                    <option value="">Select a Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {getCategoryPathLabel(c.id, categories)}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>

                <FormField label="Brand / Label" helperText="e.g. Kanhaiya Heritage">
                  <FormInput
                    placeholder="Enter brand name"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="SKU (Stock Keeping Unit)" helperText="Optional unique stock tracking code">
                <FormInput
                  placeholder="e.g. SKU-LINEN-ROYAL-01"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </FormField>

              <FormField
                label="Product Description"
                helperText="Detailed description of fabric composition, craftsmanship, and styling"
              >
                <FormTextarea
                  rows={4}
                  placeholder="Describe the product weave, materials, and occasion fit..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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

              {/* Upload to media bucket */}
              <div className="p-5 rounded-2xl border border-border/80 bg-muted/20">
                <span className="block text-xs font-bold text-foreground mb-2">
                  Upload Product Photo to Media Bucket:
                </span>
                <ImageUploader
                  bucket="media"
                  folderPath="products"
                  label=""
                  aspectRatio="auto"
                  onUploadComplete={handleImageUploaded}
                />
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

                        {/* Image Actions: Set Primary, Delete */}
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
