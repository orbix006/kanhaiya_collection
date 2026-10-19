"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronRight,
  ChevronDown,
  FolderPlus,
  Pencil,
  Trash2,
  Home,
  CheckCircle2,
  XCircle,
  ImageIcon,
  Eye,
  EyeOff,
  GripVertical,
  ChevronUp,
  CornerDownRight,
  CornerUpLeft,
  Package,
  Layers,
  ArrowDownToLine,
  Ban,
} from "lucide-react";
import { getDescendantCategoryIds } from "@/lib/data/categories";
import type { CategoryTreeNode } from "@/lib/data/categories";
import type { Category } from "@/lib/data/homepage";

interface CategoryTreeProps {
  nodes: CategoryTreeNode[];
  allCategories: Category[];
  productCounts?: Record<string, { direct: number; total: number }>;
  collapsedIds: Record<string, boolean>;
  onToggleCollapse: (id: string) => void;
  onAddSubcategory: (parentId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onToggleActive?: (category: Category) => void;
  onMoveCategory?: (
    categoryId: string,
    targetParentId?: string | null,
    position?: "before" | "after" | "inside",
    targetSiblingId?: string
  ) => void;
  onSwapOrder?: (categoryId: string, direction: "up" | "down") => void;
  onChangeHierarchyLevel?: (categoryId: string, action: "indent" | "outdent") => void;
}

export function CategoryTree({
  nodes,
  allCategories,
  productCounts = {},
  collapsedIds,
  onToggleCollapse,
  onAddSubcategory,
  onEditCategory,
  onDeleteCategory,
  onToggleActive,
  onMoveCategory,
  onSwapOrder,
  onChangeHierarchyLevel,
}: CategoryTreeProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    id: string;
    position: "before" | "after" | "inside";
    isInvalid?: boolean;
  } | null>(null);
  const [isOverRootZone, setIsOverRootZone] = useState(false);

  // Helper to determine if targetId is an invalid drop target (self or descendant)
  const isInvalidDropTarget = (targetId: string, currentDraggedId: string | null): boolean => {
    if (!currentDraggedId) return false;
    if (targetId === currentDraggedId) return true;
    const descendantIds = getDescendantCategoryIds(currentDraggedId, allCategories);
    return descendantIds.includes(targetId);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverTarget(null);
    setIsOverRootZone(false);
  };

  const handleDragOverCard = (e: React.DragEvent, node: CategoryTreeNode) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedId || draggedId === node.id) {
      setDragOverTarget(null);
      return;
    }

    const invalid = isInvalidDropTarget(node.id, draggedId);

    const rect = e.currentTarget.getBoundingClientRect();
    const relY = (e.clientY - rect.top) / rect.height;

    let position: "before" | "after" | "inside" = "inside";
    if (relY < 0.28) {
      position = "before";
    } else if (relY > 0.72) {
      position = "after";
    } else {
      position = "inside";
    }

    setDragOverTarget({ id: node.id, position, isInvalid: invalid });
  };

  const handleDropOnCard = (e: React.DragEvent, node: CategoryTreeNode) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedId || draggedId === node.id || !onMoveCategory) {
      handleDragEnd();
      return;
    }

    const invalid = isInvalidDropTarget(node.id, draggedId);
    if (invalid) {
      // Disallow invalid drop
      handleDragEnd();
      return;
    }

    const targetPos = dragOverTarget?.position || "inside";

    if (targetPos === "inside") {
      onMoveCategory(draggedId, node.id, "inside", node.id);
    } else {
      onMoveCategory(draggedId, node.parent_id, targetPos, node.id);
    }

    handleDragEnd();
  };

  const handleDropOnRootZone = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedId || !onMoveCategory) {
      handleDragEnd();
      return;
    }

    const draggedCat = allCategories.find((c) => c.id === draggedId);
    if (draggedCat && draggedCat.parent_id !== null) {
      onMoveCategory(draggedId, null, undefined, undefined);
    }
    handleDragEnd();
  };

  const getLevelBadge = (level: number) => {
    switch (level) {
      case 0:
        return (
          <span className="text-[10px] font-bold font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
            Root
          </span>
        );
      case 1:
        return (
          <span className="text-[10px] font-bold font-mono text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 dark:text-blue-400">
            Sub
          </span>
        );
      case 2:
      default:
        return (
          <span className="text-[10px] font-bold font-mono text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 dark:text-purple-400">
            Level {level + 1}
          </span>
        );
    }
  };

  const renderNode = (
    node: CategoryTreeNode,
    indexInSiblings: number,
    siblingCount: number
  ) => {
    const hasChildren = node.children.length > 0;
    const isCollapsed = Boolean(collapsedIds[node.id]);
    const isBeingDragged = draggedId === node.id;
    const isTarget = dragOverTarget?.id === node.id;
    const targetPos = isTarget ? dragOverTarget?.position : null;
    const isInvalid = isTarget && dragOverTarget?.isInvalid;

    const countInfo = productCounts[node.id] || { direct: 0, total: 0 };
    const isFirstSibling = indexInSiblings === 0;
    const isLastSibling = indexInSiblings === siblingCount - 1;
    const isRoot = node.level === 0;

    return (
      <div key={node.id} className="flex flex-col relative select-none">
        {/* Top Drop Indicator (position === "before") */}
        {isTarget && targetPos === "before" && (
          <div
            className={`h-1.5 rounded-full my-1 transition-all ${
              isInvalid
                ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                : "bg-primary shadow-[0_0_8px_rgba(200,137,26,0.6)]"
            }`}
            style={{ marginLeft: `${node.level * 24}px` }}
          />
        )}

        {/* Node Item Card */}
        <div
          draggable={true}
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOverCard(e, node)}
          onDrop={(e) => handleDropOnCard(e, node)}
          className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
            node.level > 0 ? "mt-2" : "mt-2.5 shadow-2xs"
          } ${
            isBeingDragged
              ? "opacity-35 border-dashed border-primary bg-primary/5 scale-[0.99]"
              : isTarget && targetPos === "inside"
              ? isInvalid
                ? "border-destructive/80 bg-destructive/10 ring-2 ring-destructive/40"
                : "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-md"
              : "border-border/70 bg-card hover:bg-muted/30 hover:border-border"
          }`}
          style={{ marginLeft: `${node.level * 24}px` }}
        >
          {/* Left: Drag Handle, Expander, Thumbnail, Name & Slug */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Drag Handle */}
            <div
              className="flex items-center justify-center h-7 w-5 text-muted-foreground/50 group-hover:text-foreground cursor-grab active:cursor-grabbing hover:bg-muted rounded transition-colors shrink-0"
              title="Drag to reorder among siblings or nest under another category"
              aria-label="Drag to reorder category"
            >
              <GripVertical className="h-4 w-4" />
            </div>

            {/* Collapse toggle or bullet spacer */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggleCollapse(node.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0 cursor-pointer"
                aria-label={isCollapsed ? `Expand ${node.name}` : `Collapse ${node.name}`}
                title={isCollapsed ? "Expand subcategories" : "Collapse subcategories"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-7 shrink-0 flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-border" />
              </div>
            )}

            {/* Thumbnail */}
            {node.image_url ? (
              <div className="relative h-9 w-9 rounded-xl border border-border overflow-hidden shrink-0 bg-muted">
                <Image
                  src={node.image_url}
                  alt={node.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground/60 shrink-0">
                <ImageIcon className="h-4 w-4" />
              </div>
            )}

            {/* Name, Slug, Order & Product Count */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {node.name}
                </span>
                {getLevelBadge(node.level)}

                {/* Nest Drop Banner if dragging inside */}
                {isTarget && targetPos === "inside" && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isInvalid
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-primary text-primary-foreground animate-pulse"
                    }`}
                  >
                    {isInvalid ? (
                      <>
                        <Ban className="h-3 w-3" />
                        <span>Cannot nest in descendant</span>
                      </>
                    ) : (
                      <>
                        <CornerDownRight className="h-3 w-3" />
                        <span>Nest as Subcategory</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[11px] font-mono text-muted-foreground truncate">
                  /{node.slug}
                </span>

                <span className="text-[10px] text-muted-foreground/80 font-mono">
                  • Order #{node.display_order}
                </span>

                {/* Product Count Badge */}
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                  <Package className="h-3 w-3 shrink-0" />
                  <span>
                    {countInfo.total} {countInfo.total === 1 ? "product" : "products"}
                  </span>
                  {hasChildren && countInfo.direct !== countInfo.total && (
                    <span className="text-muted-foreground font-normal">
                      ({countInfo.direct} direct)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Center & Right: Badges, Keyboard Reorder Controls & Action Buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
            {/* Status Badges */}
            <div className="flex items-center gap-1.5">
              {node.is_active ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  <span>Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                  <XCircle className="h-2.5 w-2.5" />
                  <span>Hidden</span>
                </span>
              )}

              {node.show_on_homepage && (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  <Home className="h-2.5 w-2.5" />
                  <span>Homepage</span>
                </span>
              )}

              {hasChildren && (
                <span className="hidden lg:inline text-[11px] font-medium text-muted-foreground/80 px-1.5">
                  {node.children.length} sub
                </span>
              )}
            </div>

            {/* Keyboard-Accessible Move Controls */}
            <div className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-xl border border-border/60">
              {/* Move Up Button */}
              {onSwapOrder && (
                <button
                  type="button"
                  disabled={isFirstSibling}
                  onClick={() => onSwapOrder(node.id, "up")}
                  title={isFirstSibling ? "First in this level" : "Move up among siblings"}
                  aria-label={`Move ${node.name} up`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Move Down Button */}
              {onSwapOrder && (
                <button
                  type="button"
                  disabled={isLastSibling}
                  onClick={() => onSwapOrder(node.id, "down")}
                  title={isLastSibling ? "Last in this level" : "Move down among siblings"}
                  aria-label={`Move ${node.name} down`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Indent / Nest under preceding sibling */}
              {onChangeHierarchyLevel && (
                <button
                  type="button"
                  disabled={isFirstSibling}
                  onClick={() => onChangeHierarchyLevel(node.id, "indent")}
                  title={
                    isFirstSibling
                      ? "Cannot indent: No sibling above to nest under"
                      : "Indent: Nest under the sibling above"
                  }
                  aria-label={`Indent ${node.name} under previous sibling`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <CornerDownRight className="h-3 w-3" />
                </button>
              )}

              {/* Outdent / Promote up to parent level */}
              {onChangeHierarchyLevel && (
                <button
                  type="button"
                  disabled={isRoot}
                  onClick={() => onChangeHierarchyLevel(node.id, "outdent")}
                  title={
                    isRoot
                      ? "Already at root level"
                      : "Outdent: Move up to parent level (or root)"
                  }
                  aria-label={`Outdent ${node.name} to parent level`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <CornerUpLeft className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Quick Action Icons */}
            <div className="flex items-center gap-1">
              {onToggleActive && (
                <button
                  type="button"
                  onClick={() => onToggleActive(node)}
                  title={node.is_active ? "Deactivate / Hide category" : "Activate category"}
                  aria-label={node.is_active ? "Deactivate category" : "Activate category"}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                    node.is_active
                      ? "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                      : "border-amber-400/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                  }`}
                >
                  {node.is_active ? (
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => onAddSubcategory(node.id)}
                title="Add subcategory inside this category"
                aria-label={`Add subcategory inside ${node.name}`}
                className="flex h-8 items-center gap-1 px-2 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                <span className="hidden md:inline text-[11px]">+ Sub</span>
              </button>

              <button
                type="button"
                onClick={() => onEditCategory(node)}
                title="Edit category details"
                aria-label={`Edit ${node.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onDeleteCategory(node)}
                title="Delete category (cascades subcategories)"
                aria-label={`Delete ${node.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Drop Indicator (position === "after") */}
        {isTarget && targetPos === "after" && (
          <div
            className={`h-1.5 rounded-full my-1 transition-all ${
              isInvalid
                ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                : "bg-primary shadow-[0_0_8px_rgba(200,137,26,0.6)]"
            }`}
            style={{ marginLeft: `${node.level * 24}px` }}
          />
        )}

        {/* Recursive Children Rendering */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col">
            {node.children.map((childNode, idx) =>
              renderNode(childNode, idx, node.children.length)
            )}
          </div>
        )}
      </div>
    );
  };

  const isDraggingSubcategory = Boolean(
    draggedId && allCategories.find((c) => c.id === draggedId)?.parent_id !== null
  );

  return (
    <div className="flex flex-col space-y-1">
      {/* Top Root Drop Target Zone (Shown when dragging a subcategory) */}
      {isDraggingSubcategory && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsOverRootZone(true);
          }}
          onDragLeave={() => setIsOverRootZone(false)}
          onDrop={handleDropOnRootZone}
          className={`flex items-center justify-center gap-2 p-3.5 mb-2 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            isOverRootZone
              ? "border-primary bg-primary/10 text-primary scale-[1.01]"
              : "border-border/80 bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <ArrowDownToLine className="h-4 w-4 shrink-0" />
          <span className="text-xs font-bold">
            Drop here to promote category to Root Level (Top Level)
          </span>
        </div>
      )}

      {nodes.length > 0 ? (
        nodes.map((rootNode, idx) => renderNode(rootNode, idx, nodes.length))
      ) : (
        <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl p-8">
          <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
          <p className="font-semibold text-xs text-foreground">No categories to display</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Adjust search or filter criteria, or click "Add Category" to create a new one.
          </p>
        </div>
      )}
    </div>
  );
}
