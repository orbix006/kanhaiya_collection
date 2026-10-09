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
} from "lucide-react";
import type { CategoryTreeNode } from "@/lib/data/categories";
import type { Category } from "@/lib/data/homepage";

interface CategoryTreeProps {
  nodes: CategoryTreeNode[];
  onAddSubcategory: (parentId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
}

export function CategoryTree({
  nodes,
  onAddSubcategory,
  onEditCategory,
  onDeleteCategory,
}: CategoryTreeProps) {
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderNode = (node: CategoryTreeNode) => {
    const hasChildren = node.children.length > 0;
    const isCollapsed = Boolean(collapsedIds[node.id]);

    return (
      <div key={node.id} className="flex flex-col">
        {/* Node Item Card */}
        <div
          className={`group flex items-center justify-between gap-3 p-3 rounded-2xl border border-border/60 bg-card hover:bg-muted/30 transition-all ${
            node.level > 0 ? "mt-2" : "mt-2.5 shadow-2xs"
          }`}
          style={{ marginLeft: `${node.level * 24}px` }}
        >
          {/* Left: Expander, Thumbnail, Name & Slug */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Collapse toggle or bullet spacer */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleCollapse(node.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0"
                aria-label={isCollapsed ? "Expand" : "Collapse"}
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
              <div className="relative h-9 w-9 rounded-xl border border-border overflow-hidden shrink-0">
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

            {/* Name and Slug */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {node.name}
                </span>
                {node.level > 0 && (
                  <span className="text-[10px] font-mono text-muted-foreground/70 bg-muted/60 px-1.5 py-0.5 rounded">
                    L{node.level}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-muted-foreground truncate">
                /{node.slug}
              </span>
            </div>
          </div>

          {/* Center & Right: Badges & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Badges */}
            <div className="hidden sm:flex items-center gap-1.5">
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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  <Home className="h-2.5 w-2.5" />
                  <span>Homepage</span>
                </span>
              )}

              {hasChildren && (
                <span className="text-[11px] font-medium text-muted-foreground/80 px-1.5">
                  {node.children.length} sub
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onAddSubcategory(node.id)}
                title="Add subcategory inside this category"
                className="flex h-8 items-center gap-1 px-2 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                <span className="hidden md:inline text-[11px]">+ Sub</span>
              </button>

              <button
                type="button"
                onClick={() => onEditCategory(node)}
                title="Edit category"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onDeleteCategory(node)}
                title="Delete category (and cascade descendants)"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Recursive Children Rendering (Unlimited Depth) */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col">
            {node.children.map((childNode) => renderNode(childNode))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-1">
      {nodes.length > 0 ? (
        nodes.map((rootNode) => renderNode(rootNode))
      ) : (
        <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl p-8">
          No categories found. Click "Add Category" to create your first top-level category.
        </div>
      )}
    </div>
  );
}
