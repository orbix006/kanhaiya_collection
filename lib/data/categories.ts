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
 * Calculates the depth level of a category in the hierarchy.
 * 0 = Root (top-level)
 * 1 = Subcategory
 * 2 = Sub-subcategory
 */
export function getCategoryDepth(
  categoryId: string | null | undefined,
  allCategories: Category[]
): number {
  if (!categoryId) return 0;
  let depth = 0;
  let curr = allCategories.find((c) => c.id === categoryId);
  while (curr && curr.parent_id) {
    depth++;
    curr = allCategories.find((c) => c.id === curr!.parent_id);
    if (depth > 10) break; // guard against malformed circular references
  }
  return depth;
}

/**
 * Calculates the subtree height of a category (maximum distance to a leaf descendant).
 * 0 = No children (leaf)
 * 1 = Has direct children
 * 2 = Has grandchildren
 */
export function getCategoryHeight(
  categoryId: string,
  allCategories: Category[]
): number {
  const directChildren = allCategories.filter((c) => c.parent_id === categoryId);
  if (directChildren.length === 0) return 0;

  let maxChildHeight = 0;
  for (const child of directChildren) {
    const childHeight = getCategoryHeight(child.id, allCategories);
    if (childHeight > maxChildHeight) {
      maxChildHeight = childHeight;
    }
  }
  return 1 + maxChildHeight;
}

/**
 * Validates whether `prospectiveParentId` is a safe parent for `categoryId`.
 * Rejects:
 * 1. Selecting itself as parent (`prospectiveParentId === categoryId`).
 * 2. Selecting any of its own descendants as parent (circular loop).
 * 3. Exceeding 3 category levels (Category > Subcategory > Sub-subcategory).
 */
export function isSafeParent(
  categoryId: string | null | undefined,
  prospectiveParentId: string | null | undefined,
  allCategories: Category[]
): { safe: boolean; reason?: string } {
  // Setting to root (no parent) is always safe as long as category subtree doesn't exceed 3 levels
  if (!prospectiveParentId) {
    if (categoryId) {
      const height = getCategoryHeight(categoryId, allCategories);
      if (height > 2) {
        return {
          safe: false,
          reason: "This category has descendants that would exceed three category levels.",
        };
      }
    }
    return { safe: true };
  }

  // Cannot select itself
  if (categoryId && prospectiveParentId === categoryId) {
    return {
      safe: false,
      reason: "A category cannot be its own parent.",
    };
  }

  // Cannot select any descendant
  if (categoryId) {
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
  }

  // Enforce maximum 3 levels: Root (Level 0) > Sub (Level 1) > Sub-Sub (Level 2)
  const parentDepth = getCategoryDepth(prospectiveParentId, allCategories);
  if (parentDepth >= 2) {
    return {
      safe: false,
      reason: "Only three levels supported: Category > Subcategory > Sub-subcategory. You cannot nest under a sub-subcategory.",
    };
  }

  if (categoryId) {
    const categoryHeight = getCategoryHeight(categoryId, allCategories);
    // parentDepth (0 for root, 1 for subcategory) + 1 (the node itself) + categoryHeight <= 2 (0-indexed: max 2 = 3 levels)
    if (parentDepth + 1 + categoryHeight > 2) {
      return {
        safe: false,
        reason: "This move would exceed three category levels (Category > Subcategory > Sub-subcategory).",
      };
    }
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
 * Resolves a unique product slug by checking existing product slugs and automatically
 * appending an incremental numeric suffix (e.g. `base-slug-2`, `base-slug-3`) if collision occurs.
 */
export function resolveUniqueProductSlug(
  baseSlug: string,
  currentProductId: string | undefined,
  existingProducts: Array<{ id?: string; slug?: string | null }>
): string {
  let normalized = generateSlug(baseSlug);
  if (!normalized) normalized = "product";

  const otherSlugs = new Set(
    existingProducts
      .filter((p) => Boolean(p.slug) && p.id !== currentProductId)
      .map((p) => p.slug!.toLowerCase().trim())
  );

  if (!otherSlugs.has(normalized)) {
    return normalized;
  }

  // Extract trailing numeric suffix if present, e.g. "poshak-2" -> root="poshak", counter=3
  const match = normalized.match(/^(.*?)-(\d+)$/);
  const root = match ? match[1] : normalized;
  let counter = match ? parseInt(match[2], 10) + 1 : 2;

  let candidate = `${root}-${counter}`;
  while (otherSlugs.has(candidate)) {
    counter++;
    candidate = `${root}-${counter}`;
  }
  return candidate;
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
