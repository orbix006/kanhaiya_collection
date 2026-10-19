"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FolderTree,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Filter,
  Package,
} from "lucide-react";
import { CategoryTree } from "./category-tree";
import { CategoryModal } from "./category-modal";
import { CategoryDeleteModal } from "./category-delete-modal";
import { buildCategoryTree, getDescendantCategoryIds } from "@/lib/data/categories";
import {
  loadMockStore,
  saveMockStore,
  upsertCategoryInStore,
  deleteCategoryFromStore,
  moveCategoryInStore,
  swapCategoryOrderInStore,
  changeCategoryHierarchyLevelInStore,
  MockCategory,
} from "@/lib/mock-data/admin-store";
import {
  moveCategoryAction,
  swapCategoryOrderAction,
  changeCategoryHierarchyLevelAction,
} from "@/app/(admin)/admin/categories/actions";
import type { Category } from "@/lib/data/homepage";

interface CategoryManagerProps {
  initialCategories: Category[];
  initialProducts?: any[];
}

export function CategoryManager({
  initialCategories,
  initialProducts = [],
}: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [levelFilter, setLevelFilter] = useState<"all" | "roots" | "subcategories">("all");

  // Expand / collapse state
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Sync state from MockStore (both on mount and on catalog_updated events)
  const syncFromStore = useCallback(() => {
    const store = loadMockStore();
    if (store.categories && store.categories.length > 0) {
      setCategories(store.categories as unknown as Category[]);
    }
    if (store.products && store.products.length > 0) {
      setProducts(store.products);
    }
  }, []);

  useEffect(() => {
    syncFromStore();
    window.addEventListener("catalog_updated", syncFromStore);
    return () => window.removeEventListener("catalog_updated", syncFromStore);
  }, [syncFromStore]);

  // Compute live product counts per category (direct and total including descendants)
  const productCounts = useMemo(() => {
    const map: Record<string, { direct: number; total: number }> = {};
    for (const c of categories) {
      const descendantIds = new Set(getDescendantCategoryIds(c.id, categories));
      let direct = 0;
      let total = 0;
      for (const p of products) {
        if (p.category_id === c.id) {
          direct++;
          total++;
        } else if (p.category_id && descendantIds.has(p.category_id)) {
          total++;
        }
      }
      map[c.id] = { direct, total };
    }
    return map;
  }, [categories, products]);

  // Build tree structure with filter support
  const treeNodes = useMemo(() => {
    let filtered = [...categories];

    // 1. Status Filter
    if (statusFilter === "active") {
      filtered = filtered.filter((c) => c.is_active);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((c) => !c.is_active);
    }

    // 2. Hierarchy Level Filter
    if (levelFilter === "roots") {
      filtered = filtered.filter((c) => !c.parent_id);
    } else if (levelFilter === "subcategories") {
      filtered = filtered.filter((c) => Boolean(c.parent_id));
    }

    // 3. Search Term with ancestor preservation
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const matchedIds = new Set<string>();
      for (const c of categories) {
        if (
          c.name.toLowerCase().includes(term) ||
          c.slug.toLowerCase().includes(term)
        ) {
          matchedIds.add(c.id);
          // Include parent IDs so branch remains intact in tree
          let curr = c;
          while (curr.parent_id) {
            matchedIds.add(curr.parent_id);
            curr = categories.find((item) => item.id === curr.parent_id) || curr;
            if (!curr.parent_id) break;
          }
        }
      }
      filtered = filtered.filter((c) => matchedIds.has(c.id));
    }

    return buildCategoryTree(filtered);
  }, [categories, searchTerm, statusFilter, levelFilter]);

  // Collapse / Expand handlers
  const handleToggleCollapse = (id: string) => {
    setCollapsedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = () => {
    setCollapsedIds({});
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    for (const c of categories) {
      if (categories.some((child) => child.parent_id === c.id)) {
        next[c.id] = true;
      }
    }
    setCollapsedIds(next);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setLevelFilter("all");
  };

  // Handler: Add Root Category
  const handleAddRoot = () => {
    setEditingCategory(null);
    setDefaultParentId(null);
    setIsModalOpen(true);
    setNotification(null);
  };

  // Handler: Add Subcategory
  const handleAddSubcategory = (parentId: string) => {
    setEditingCategory(null);
    setDefaultParentId(parentId);
    setIsModalOpen(true);
    setNotification(null);
  };

  // Handler: Edit Category
  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setDefaultParentId(cat.parent_id);
    setIsModalOpen(true);
    setNotification(null);
  };

  // Handler: Delete Category
  const handleDeleteCategory = (cat: Category) => {
    setDeletingCategory(cat);
    setIsDeleteModalOpen(true);
    setNotification(null);
  };

  // Handler: Quick Active/Inactive Toggle
  const handleToggleActive = (cat: Category) => {
    const updated = { ...cat, is_active: !cat.is_active };
    upsertCategoryInStore(updated as any);
    syncFromStore();
    setNotification({
      type: "success",
      message: `Category '${cat.name}' is now ${!cat.is_active ? "active and visible" : "hidden from storefront navigation"}.`,
    });
  };

  // Handler: Drag and drop move category
  const handleMoveCategory = (
    categoryId: string,
    targetParentId?: string | null,
    position?: "before" | "after" | "inside",
    targetSiblingId?: string
  ) => {
    const res = moveCategoryInStore(categoryId, targetParentId, position, targetSiblingId);
    if (!res.success) {
      setNotification({
        type: "error",
        message: res.error || "Failed to move category.",
      });
      return;
    }

    syncFromStore();

    // Trigger server action in background for route revalidations
    moveCategoryAction(categoryId, targetParentId, position, targetSiblingId).catch(() => {});

    const catName = categories.find((c) => c.id === categoryId)?.name || "Category";
    let desc = "reordered successfully.";
    if (position === "inside") {
      const parentName = categories.find((c) => c.id === targetSiblingId)?.name || "new parent";
      desc = `nested under '${parentName}'.`;
    } else if (targetParentId === null && !targetSiblingId) {
      desc = "promoted to top-level Root category.";
    }

    setNotification({
      type: "success",
      message: `'${catName}' ${desc}`,
    });
  };

  // Handler: Keyboard Move Up / Down
  const handleSwapOrder = (categoryId: string, direction: "up" | "down") => {
    const res = swapCategoryOrderInStore(categoryId, direction);
    if (!res.success) {
      setNotification({
        type: "error",
        message: res.error || "Cannot reorder category.",
      });
      return;
    }

    syncFromStore();
    swapCategoryOrderAction(categoryId, direction).catch(() => {});

    const catName = categories.find((c) => c.id === categoryId)?.name || "Category";
    setNotification({
      type: "success",
      message: `'${catName}' moved ${direction}.`,
    });
  };

  // Handler: Indent (nest) / Outdent (promote)
  const handleChangeHierarchyLevel = (categoryId: string, action: "indent" | "outdent") => {
    const res = changeCategoryHierarchyLevelInStore(categoryId, action);
    if (!res.success) {
      setNotification({
        type: "error",
        message: res.error || "Cannot change hierarchy level.",
      });
      return;
    }

    syncFromStore();
    changeCategoryHierarchyLevelAction(categoryId, action).catch(() => {});

    const catName = categories.find((c) => c.id === categoryId)?.name || "Category";
    setNotification({
      type: "success",
      message:
        action === "indent"
          ? `'${catName}' nested under preceding sibling.`
          : `'${catName}' moved up to parent level.`,
    });
  };

  // Success handler for create/edit
  const handleSaveSuccess = (saved: Category) => {
    syncFromStore();
    setNotification({
      type: "success",
      message: `Category '${saved.name}' saved and synchronized with storefront catalog.`,
    });
  };

  // Success handler for delete
  const handleDeleteSuccess = () => {
    syncFromStore();
    setNotification({
      type: "success",
      message: `Category and all descendant subcategories successfully removed.`,
    });
  };

  const rootCategoriesCount = categories.filter((c) => c.parent_id === null).length;
  const subCategoriesCount = categories.filter((c) => c.parent_id !== null).length;
  const activeCount = categories.filter((c) => c.is_active).length;
  const inactiveCount = categories.filter((c) => !c.is_active).length;

  const hasActiveFilters =
    searchTerm.trim() !== "" || statusFilter !== "all" || levelFilter !== "all";

  return (
    <div className="space-y-6 font-sans">
      {/* Notifications */}
      {notification && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-xs font-semibold ${
            notification.type === "success"
              ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Bar: Search, Filters & Actions */}
      <div className="flex flex-col gap-4 p-4 rounded-2xl border border-border/80 bg-card shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search taxonomy by category name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          {/* Filters & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:border-primary focus:outline-hidden cursor-pointer"
              title="Filter by category active status"
            >
              <option value="all">All Status ({categories.length})</option>
              <option value="active">Active Only ({activeCount})</option>
              <option value="inactive">Hidden / Inactive ({inactiveCount})</option>
            </select>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:border-primary focus:outline-hidden cursor-pointer"
              title="Filter by hierarchy depth"
            >
              <option value="all">All Levels</option>
              <option value="roots">Root Categories Only ({rootCategoriesCount})</option>
              <option value="subcategories">Subcategories Only ({subCategoriesCount})</option>
            </select>

            {/* Expand / Collapse All Toggle */}
            <button
              type="button"
              onClick={
                Object.keys(collapsedIds).length > 0 ? handleExpandAll : handleCollapseAll
              }
              className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
              title={
                Object.keys(collapsedIds).length > 0
                  ? "Expand all subcategories"
                  : "Collapse all subcategories"
              }
            >
              {Object.keys(collapsedIds).length > 0 ? (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span>Expand All</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>Collapse All</span>
                </>
              )}
            </button>

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-border bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}

            {/* Add Root Category Button */}
            <button
              type="button"
              onClick={handleAddRoot}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 h-10 text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer shrink-0 ml-auto lg:ml-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="flex items-center gap-3 pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex-wrap">
          <span className="font-semibold text-foreground">Hierarchy Summary:</span>
          <span>{rootCategoriesCount} Root Categories</span>
          <span>•</span>
          <span>{subCategoriesCount} Nested Subcategories</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {activeCount} Active
          </span>
          {inactiveCount > 0 && (
            <>
              <span>•</span>
              <span className="text-amber-600 font-medium">{inactiveCount} Hidden</span>
            </>
          )}
          <span>•</span>
          <span className="text-primary font-medium">
            {products.length} Products Linked
          </span>
        </div>
      </div>

      {/* Tree Visualization Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-border/60 gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <FolderTree className="h-4 w-4 text-primary" />
            <span>Storefront Taxonomy Tree (Drag to Reorder or Nest)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
            <span>Showing {treeNodes.length} top-level branches</span>
            <span>•</span>
            <span>{categories.length} total categories</span>
          </div>
        </div>

        {/* Categories Tree */}
        <CategoryTree
          nodes={treeNodes}
          allCategories={categories}
          productCounts={productCounts}
          collapsedIds={collapsedIds}
          onToggleCollapse={handleToggleCollapse}
          onAddSubcategory={handleAddSubcategory}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onToggleActive={handleToggleActive}
          onMoveCategory={handleMoveCategory}
          onSwapOrder={handleSwapOrder}
          onChangeHierarchyLevel={handleChangeHierarchyLevel}
        />
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSaveSuccess}
        categoryToEdit={editingCategory}
        defaultParentId={defaultParentId}
        allCategories={categories}
      />

      <CategoryDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        category={deletingCategory}
        allCategories={categories}
        allProducts={products}
      />
    </div>
  );
}
