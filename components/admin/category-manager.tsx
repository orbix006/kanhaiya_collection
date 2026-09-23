"use client";

import { useState, useMemo } from "react";
import {
  FolderTree,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
} from "lucide-react";
import { CategoryTree } from "./category-tree";
import { CategoryModal } from "./category-modal";
import { CategoryDeleteModal } from "./category-delete-modal";
import { buildCategoryTree, getDescendantCategoryIds } from "@/lib/data/categories";
import type { Category } from "@/lib/data/homepage";

interface CategoryManagerProps {
  initialCategories: Category[];
}

export function CategoryManager({
  initialCategories,
}: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Build tree structure
  const treeNodes = useMemo(() => {
    let filtered = categories;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      // Match categories or their ancestors/descendants
      const matchedIds = new Set<string>();
      for (const c of categories) {
        if (
          c.name.toLowerCase().includes(term) ||
          c.slug.toLowerCase().includes(term)
        ) {
          matchedIds.add(c.id);
          // Include parent IDs
          let curr = c;
          while (curr.parent_id) {
            matchedIds.add(curr.parent_id);
            curr = categories.find((item) => item.id === curr.parent_id) || curr;
            if (!curr.parent_id) break;
          }
        }
      }
      filtered = categories.filter((c) => matchedIds.has(c.id));
    }
    return buildCategoryTree(filtered);
  }, [categories, searchTerm]);

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

  // Success handler for create/edit
  const handleSaveSuccess = (saved: Category) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      if (exists) {
        return prev.map((c) => (c.id === saved.id ? saved : c));
      }
      return [...prev, saved];
    });
    setNotification({
      type: "success",
      message: `Category '${saved.name}' saved successfully.`,
    });
  };

  // Success handler for delete (cascades locally)
  const handleDeleteSuccess = (deletedId: string) => {
    const descendantIds = getDescendantCategoryIds(deletedId, categories);
    const allRemovedIds = new Set([deletedId, ...descendantIds]);

    setCategories((prev) => prev.filter((c) => !allRemovedIds.has(c.id)));
    setNotification({
      type: "success",
      message: `Category and all associated subcategories deleted successfully.`,
    });
  };

  const rootCategoriesCount = categories.filter((c) => c.parent_id === null).length;
  const subCategoriesCount = categories.filter((c) => c.parent_id !== null).length;

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div
          className={`flex items-center gap-2 p-4 rounded-2xl border text-xs font-semibold ${
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

      {/* Control Bar: Search & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-card shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search category tree..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="hidden md:inline">
              {rootCategoriesCount} Roots, {subCategoriesCount} Subcategories
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddRoot}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Tree Visualization Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <FolderTree className="h-4 w-4 text-primary" />
            <span>Unlimited-Depth Hierarchy Tree</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Total {categories.length} Categories
          </span>
        </div>

        <CategoryTree
          nodes={treeNodes}
          onAddSubcategory={handleAddSubcategory}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
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
      />
    </div>
  );
}
