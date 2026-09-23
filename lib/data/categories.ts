import type { Category } from "@/lib/data/homepage";

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  level: number;
}

/**
 * Returns all descendant IDs (children, grandchildren, etc.) for a given category ID.
 */
export function getDescendantCategoryIds(
  categoryId: string,
  allCategories: Category[]
): string[] {
  const descendants: string[] = [];

  function findChildren(parentId: string) {
    const directChildren = allCategories.filter((c) => c.parent_id === parentId);
    for (const child of directChildren) {
      descendants.push(child.id);
      findChildren(child.id);
    }
  }

  findChildren(categoryId);
  return descendants;
}

/**
 * Validates whether `prospectiveParentId` is a safe parent for `categoryId`.
 * Rejects:
 * 1. Selecting itself as parent (`prospectiveParentId === categoryId`).
 * 2. Selecting any of its own descendants as parent.
 */
export function isSafeParent(
  categoryId: string | null | undefined,
  prospectiveParentId: string | null | undefined,
  allCategories: Category[]
): { safe: boolean; reason?: string } {
  // Setting to root (no parent) is always safe
  if (!prospectiveParentId) {
    return { safe: true };
  }

  // Creating a new category (no categoryId yet) can pick any existing category
  if (!categoryId) {
    return { safe: true };
  }

  // Cannot select itself
  if (prospectiveParentId === categoryId) {
    return {
      safe: false,
      reason: "A category cannot be its own parent.",
    };
  }

  // Cannot select any descendant
  const descendantIds = getDescendantCategoryIds(categoryId, allCategories);
  if (descendantIds.includes(prospectiveParentId)) {
    const descendantName =
      allCategories.find((c) => c.id === prospectiveParentId)?.name ||
      "a descendant";
    return {
      safe: false,
      reason: `Cannot select '${descendantName}' as parent because it is a descendant of this category. Doing so would create a circular loop.`,
    };
  }

  return { safe: true };
}

/**
 * Converts a flat array of categories into an unlimited-depth tree structure.
 */
export function buildCategoryTree(allCategories: Category[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  // Initialize nodes
  for (const cat of allCategories) {
    map.set(cat.id, { ...cat, children: [], level: 0 });
  }

  // Link children to parents
  for (const cat of allCategories) {
    const node = map.get(cat.id)!;
    if (cat.parent_id && map.has(cat.parent_id)) {
      const parentNode = map.get(cat.parent_id)!;
      parentNode.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Assign level and sort children by display_order
  function setLevelsAndSort(nodes: CategoryTreeNode[], level: number) {
    nodes.sort((a, b) => a.display_order - b.display_order);
    for (const n of nodes) {
      n.level = level;
      setLevelsAndSort(n.children, level + 1);
    }
  }

  setLevelsAndSort(roots, 0);
  return roots;
}

/**
 * Generates a URL-friendly slug from category name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Returns formatted hierarchy label (e.g. "Menswear > Shirts")
 */
export function getCategoryPathLabel(
  categoryId: string,
  allCategories: Category[]
): string {
  const parts: string[] = [];
  let curr: Category | undefined = allCategories.find((c) => c.id === categoryId);

  while (curr) {
    parts.unshift(curr.name);
    if (!curr.parent_id) break;
    curr = allCategories.find((c) => c.id === curr!.parent_id);
  }

  return parts.join(" > ");
}
