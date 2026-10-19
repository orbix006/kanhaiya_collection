"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  Star,
  DollarSign,
  AlertTriangle,
  Eye,
  ShoppingBag,
} from "lucide-react";
import { AdminDataTable, type Column } from "@/components/admin/data-table";
import { ProductModal } from "@/components/admin/product-modal";
import { ProductDeleteModal } from "@/components/admin/product-delete-modal";
import { archiveProductAction } from "@/app/(admin)/admin/products/actions";
import {
  loadMockStore,
  archiveProductInStore,
} from "@/lib/mock-data/admin-store";
import { getCategoryPathLabel, getDescendantCategoryIds } from "@/lib/data/categories";
import type { Category } from "@/lib/data/homepage";
import type { ProductDetail } from "@/lib/data/products";

interface ProductManagerProps {
  initialProducts: ProductDetail[];
  categories: Category[];
}

type FilterTab = "all" | "active" | "archived" | "top_seller" | "low_stock";

export function ProductManager({
  initialProducts,
  categories: initialCategories,
}: ProductManagerProps) {
  const [products, setProducts] = useState<ProductDetail[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDetail | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductDetail | null>(null);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Safe client hydration from MockStore localStorage & real-time catalog event listener
  useEffect(() => {
    const syncFromStore = () => {
      const store = loadMockStore();
      if (store.products && store.products.length > 0) {
        setProducts(store.products as unknown as ProductDetail[]);
      }
      if (store.categories && store.categories.length > 0) {
        setCategories(store.categories as unknown as Category[]);
      }
    };

    syncFromStore();
    window.addEventListener("catalog_updated", syncFromStore);
    return () => window.removeEventListener("catalog_updated", syncFromStore);
  }, []);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: products.length,
      active: products.filter((p) => p.is_active).length,
      archived: products.filter((p) => !p.is_active).length,
      top_seller: products.filter((p) => p.is_featured_top_seller).length,
      low_stock: products.filter((p) => p.stock_quantity <= 10).length,
    };
  }, [products]);

  // Filtered dataset based on tab & category (including descendant child categories)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Tab filter
      if (activeTab === "active" && !p.is_active) return false;
      if (activeTab === "archived" && p.is_active) return false;
      if (activeTab === "top_seller" && !p.is_featured_top_seller) return false;
      if (activeTab === "low_stock" && p.stock_quantity > 10) return false;

      // Category filter (includes nested child categories)
      if (selectedCategory !== "all") {
        const descendantIds = getDescendantCategoryIds(selectedCategory, categories);
        const matchIds = [selectedCategory, ...descendantIds];
        if (!p.category_id || !matchIds.includes(p.category_id)) return false;
      }

      return true;
    });
  }, [products, activeTab, selectedCategory, categories]);

  // Handler: Open Create Modal
  const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
    setNotification(null);
  };

  // Handler: Open Edit Modal
  const handleEditProduct = (prod: ProductDetail) => {
    setEditingProduct(prod);
    setIsModalOpen(true);
    setNotification(null);
  };

  // Handler: Open Delete Modal
  const handleDeleteProduct = (prod: ProductDetail) => {
    setDeletingProduct(prod);
    setIsDeleteModalOpen(true);
    setNotification(null);
  };

  // Handler: Quick Toggle Active Status
  const handleToggleActive = async (prod: ProductDetail) => {
    const shouldArchive = prod.is_active;
    setTogglingId(prod.id);
    setNotification(null);

    // 1. Persist archive state in mock store (validates primary image rule if unarchiving)
    const localRes = archiveProductInStore(prod.id, shouldArchive);
    if (!localRes.success) {
      setTogglingId(null);
      setNotification({
        type: "error",
        message: localRes.error || "Failed to update product status.",
      });
      return;
    }

    // 2. Server action for cache revalidation
    try {
      await archiveProductAction(prod.id, shouldArchive);
    } catch {
      // offline fallback
    }

    setTogglingId(null);
    setProducts((prev) =>
      prev.map((p) => (p.id === prod.id ? { ...p, is_active: !shouldArchive } : p))
    );
    setNotification({
      type: "success",
      message: shouldArchive
        ? `Product "${prod.name}" archived.`
        : `Product "${prod.name}" restored to active catalog.`,
    });
  };

  // Handler: Save Success (Insert or Update)
  const handleSaveSuccess = (savedPayload: any) => {
    const store = loadMockStore();
    if (store.products && store.products.length > 0) {
      setProducts(store.products as unknown as ProductDetail[]);
    } else {
      setProducts((prev) => {
        const exists = prev.some((p) => p.id === savedPayload.id);
        if (exists) {
          return prev.map((p) => (p.id === savedPayload.id ? { ...p, ...savedPayload } : p));
        }
        return [savedPayload, ...prev];
      });
    }

    setNotification({
      type: "success",
      message: `Product "${savedPayload.name}" saved successfully.`,
    });
  };

  // Handler: Delete/Archive Success from Delete Modal
  const handleDeleteSuccess = (deletedId: string, actionType: "archive" | "delete") => {
    const store = loadMockStore();
    if (store.products) {
      setProducts(store.products as unknown as ProductDetail[]);
    } else if (actionType === "delete") {
      setProducts((prev) => prev.filter((p) => p.id !== deletedId));
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === deletedId ? { ...p, is_active: false } : p))
      );
    }

    setNotification({
      type: "success",
      message:
        actionType === "delete"
          ? "Product permanently removed from store catalog."
          : "Product archived successfully.",
    });
  };

  // Data table columns aligned with Phase 3 specifications
  const columns: Column<ProductDetail>[] = [
    {
      key: "name",
      header: "Product",
      sortable: true,
      className: "min-w-[260px]",
      render: (item) => {
        const primaryImg =
          item.images.find((img) => img.is_primary)?.image_url ||
          item.images[0]?.image_url;

        return (
          <div className="flex items-center gap-3 py-1">
            <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/80">
              {primaryImg ? (
                <Image
                  src={primaryImg}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-[10px]">
                  No Img
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-foreground truncate block">
                  {item.name}
                </span>
                {item.is_featured_top_seller && (
                  <span
                    title="Featured Top Seller"
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold shrink-0"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    Top
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                {item.description || "Authentic handcrafted devotional item"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "category",
      header: "Category Hierarchy",
      className: "min-w-[200px]",
      render: (item) => {
        const path = item.category_id
          ? getCategoryPathLabel(item.category_id, categories)
          : item.category?.name || "Uncategorized";

        return (
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5 truncate">
              <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground/90 border border-border/60">
                {path}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "brand",
      header: "Brand",
      sortable: true,
      className: "w-32",
      render: (item) => (
        <span className="text-xs font-medium text-foreground">
          {item.brand || "Kanhaiya Collection"}
        </span>
      ),
    },
    {
      key: "sku",
      header: "SKU",
      sortable: true,
      className: "w-32",
      render: (item) => (
        <div className="flex items-center gap-1">
          <span className="font-mono text-[11px] font-semibold bg-muted/70 text-foreground px-2 py-0.5 rounded-md border border-border">
            {item.sku || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "batch_number",
      header: "Batch Identifier",
      sortable: true,
      className: "w-36",
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <span
            title="Development Model Batch Identifier: stable unique batch generated centrally; flagged for persistent DB migration approval."
            className="font-mono text-[11px] font-bold text-amber-800 dark:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md w-fit cursor-help"
          >
            {item.batch_number || "—"}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80 font-bold">
            Dev Model
          </span>
        </div>
      ),
    },
    {
      key: "base_price",
      header: "Price",
      sortable: true,
      className: "w-28",
      render: (item) => (
        <div className="space-y-0.5">
          <div className="font-bold text-xs text-foreground">
            ₹{item.base_price.toLocaleString("en-IN")}
          </div>
          {item.compare_at_price && item.compare_at_price > item.base_price && (
            <div className="flex items-center gap-1 text-[10px]">
              <span className="line-through text-muted-foreground">
                ₹{item.compare_at_price.toLocaleString("en-IN")}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {Math.round(((item.compare_at_price - item.base_price) / item.compare_at_price) * 100)}% off
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "stock_quantity",
      header: "Stock",
      sortable: true,
      className: "w-28",
      render: (item) => {
        const isOutOfStock = item.stock_quantity <= 0;
        const isLowStock = item.stock_quantity > 0 && item.stock_quantity <= 10;

        return (
          <div className="space-y-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isOutOfStock
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : isLowStock
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {isOutOfStock ? (
                "Out of Stock"
              ) : isLowStock ? (
                `Low (${item.stock_quantity})`
              ) : (
                `${item.stock_quantity} in stock`
              )}
            </span>
          </div>
        );
      },
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      className: "w-28",
      render: (item) => {
        const isToggling = togglingId === item.id;

        return (
          <button
            type="button"
            onClick={() => handleToggleActive(item)}
            disabled={isToggling}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
              item.is_active
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
            }`}
            title={item.is_active ? "Click to archive (hide from storefront)" : "Click to activate on storefront"}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                item.is_active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span>
              {isToggling ? "Saving..." : item.is_active ? "Active" : "Archived"}
            </span>
          </button>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-28 text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/shop/product/${item.slug}`}
            target="_blank"
            title="View live product page on storefront"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => handleEditProduct(item)}
            title="Edit Product"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteProduct(item)}
            title="Archive or Delete"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`flex items-center gap-2 p-4 rounded-2xl border text-xs font-semibold animate-in fade-in duration-200 ${
            notification.type === "success"
              ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Total Catalog</span>
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {tabCounts.all}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {tabCounts.active} live in storefront
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Top Sellers</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {tabCounts.top_seller}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Featured on homepage & badges
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Low Stock Alert</span>
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {tabCounts.low_stock}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            ≤ 10 inventory remaining
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Archived / Inactive</span>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {tabCounts.archived}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Hidden from customer catalog
          </div>
        </div>
      </div>

      {/* Filter Tabs & Category Selector Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-2 rounded-2xl border border-border/60">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "all"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Products ({tabCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "active"
                ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active ({tabCounts.active})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("top_seller")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "top_seller"
                ? "bg-card text-amber-600 dark:text-amber-400 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Top Sellers ({tabCounts.top_seller})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("low_stock")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "low_stock"
                ? "bg-card text-amber-700 dark:text-amber-300 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Low Stock ({tabCounts.low_stock})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("archived")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "archived"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Archived ({tabCounts.archived})
          </button>
        </div>

        {/* Category Filter & Add Product Button */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8.5 rounded-xl border border-border bg-card px-2.5 text-xs text-foreground font-medium focus:border-primary focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {getCategoryPathLabel(c.id, categories)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleCreateProduct}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Main Admin Data Table */}
      <AdminDataTable
        columns={columns}
        data={filteredProducts}
        searchPlaceholder="Search products by name, SKU, batch number, brand..."
        searchKeys={["name", "sku", "batch_number", "brand"]}
        initialSortKey="name"
        initialSortDirection="asc"
        defaultPageSize={10}
        emptyMessage={
          activeTab === "all"
            ? "No products found in catalog. Click 'Add Product' to create one."
            : `No products found matching tab "${activeTab}".`
        }
      />

      {/* Product Create/Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        categories={categories}
        onSuccess={handleSaveSuccess}
      />

      {/* Product Delete/Archive Modal */}
      <ProductDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        product={deletingProduct}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
