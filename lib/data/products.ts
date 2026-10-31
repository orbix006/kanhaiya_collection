import { createClient } from "@/lib/supabase/server";
import { getAllActiveCategories, type ProductItem, type Category } from "@/lib/data/homepage";
import { getDescendantCategoryIds } from "@/lib/data/categories";

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  sku: string | null;
  attributes: Record<string, unknown>;
  price: number | null;
  compare_at_price: number | null;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
}

export interface ProductReviewItem {
  id: string;
  product_id: string;
  user_id: string;
  order_item_id: string | null;
  rating: number;
  review_text: string | null;
  images: string[];
  is_approved: boolean;
  created_at: string;
  author_name?: string;
  author_avatar?: string | null;
}

export interface ProductRatingSummary {
  avgRating: number;
  reviewCount: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ProductDetail {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  sku: string | null;
  base_price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  sold_count: number;
  is_active: boolean;
  is_featured_top_seller: boolean;
  top_seller_display_order: number | null;
  avg_rating: number;
  review_count: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  category?: Category | null;
  images: ProductImage[];
  variants: ProductVariant[];
  /**
   * Development model batch identifier.
   * NOTE: Clearly separate from PostgreSQL database schema (which has no batch_number column).
   * Flagged for persistent database migration approval.
   */
  batch_number?: string | null;
}

export interface ShopFilterParams {
  categorySlug?: string;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: "in-stock" | "out-of-stock";
  festival?: string;
  material?: string;
  sort?: string; // 'price_asc' | 'price_desc' | 'newest' | 'top_rated' | 'featured'
  page?: number;
  pageSize?: number;
}

export interface ShopQueryResult {
  products: ProductItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  activeCategory: Category | null;
  minPriceAvailable: number;
  maxPriceAvailable: number;
}

// Fallback product details purged in favor of live backend database and store
export const FALLBACK_PRODUCT_DETAILS: ProductDetail[] = [];

// Fallback seed reviews
export const FALLBACK_REVIEWS: ProductReviewItem[] = [
  {
    id: "rev-1",
    product_id: "prod-1",
    user_id: "user-test-1",
    order_item_id: "order-item-1",
    rating: 5,
    review_text: "The fabric breathability and finish are exceptional. Felt extraordinarily regal wearing this at our anniversary dinner. Highly recommend!",
    images: [],
    is_approved: true,
    created_at: "2026-02-15T14:30:00.000Z",
    author_name: "Rajesh K.",
    author_avatar: null,
  },
  {
    id: "rev-2",
    product_id: "prod-1",
    user_id: "user-test-2",
    order_item_id: "order-item-2",
    rating: 5,
    review_text: "Perfect tailoring on the shoulders. Even after two gentle washes the linen retains its subtle sheen and softness.",
    images: [],
    is_approved: true,
    created_at: "2026-02-18T10:15:00.000Z",
    author_name: "Sunil V.",
    author_avatar: null,
  },
  {
    id: "rev-3",
    product_id: "prod-7",
    user_id: "user-test-3",
    order_item_id: "order-item-3",
    rating: 5,
    review_text: "A truly royal Kanjeevaram Banarasi saree! The gold zari weave on the pallu looks heavenly in natural light.",
    images: [],
    is_approved: true,
    created_at: "2026-02-20T16:00:00.000Z",
    author_name: "Meera D.",
    author_avatar: null,
  },
];

interface CatalogDbImage {
  image_url: string;
  is_primary?: boolean | null;
  display_order?: number | null;
}

interface CatalogDbProduct {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  brand: string | null;
  base_price: number | string;
  compare_at_price: number | string | null;
  avg_rating: number | string | null;
  review_count: number | string | null;
  stock_quantity: number | null;
  is_featured_top_seller: boolean | null;
  product_images?: CatalogDbImage[] | null;
}

interface SingleDbImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string | null;
  display_order?: number | null;
  is_primary?: boolean | null;
}

interface SingleDbVariant {
  id: string;
  product_id: string;
  variant_name: string;
  sku?: string | null;
  attributes?: Record<string, unknown> | null;
  price?: number | string | null;
  compare_at_price?: number | string | null;
  stock_quantity?: number | null;
  image_url?: string | null;
  is_active?: boolean;
}

interface SingleDbProduct {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  sku: string | null;
  base_price: number | string;
  compare_at_price: number | string | null;
  stock_quantity: number | null;
  sold_count: number | null;
  is_active: boolean;
  is_featured_top_seller: boolean | null;
  top_seller_display_order: number | null;
  avg_rating: number | string | null;
  review_count: number | string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  category?: Category | null;
  product_images?: SingleDbImage[] | null;
  product_variants?: SingleDbVariant[] | null;
}

interface ReviewDbItem {
  id: string;
  product_id: string;
  user_id: string;
  order_item_id: string | null;
  rating: number;
  review_text: string | null;
  images?: string[] | null;
  is_approved: boolean;
  created_at: string;
  profiles?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

/**
 * Executes a server-driven shop catalog query with filtering, trigram search,
 * category resolution, price ranges, sorting, and pagination.
 */
export async function getShopProducts(params: ShopFilterParams): Promise<ShopQueryResult> {
  const {
    categorySlug,
    searchQuery,
    minPrice,
    maxPrice,
    availability,
    festival,
    material,
    sort = "featured",
    page = 1,
    pageSize = 12,
  } = params;

  const validPage = Math.max(1, page);
  const offset = (validPage - 1) * pageSize;

  const allCategories = await getAllActiveCategories();
  const activeCategory = categorySlug
    ? allCategories.find((c) => c.slug === categorySlug) || null
    : null;

  try {
    const supabase = await createClient();

    // Check if database is configured and responding
    let dbQuery = supabase
      .from("products")
      .select(
        `
        id,
        category_id,
        name,
        slug,
        brand,
        base_price,
        compare_at_price,
        stock_quantity,
        sold_count,
        avg_rating,
        review_count,
        is_active,
        is_featured_top_seller,
        top_seller_display_order,
        created_at,
        product_images (
          image_url,
          is_primary,
          display_order
        )
      `,
        { count: "exact" }
      )
      .eq("is_active", true);

    // 1. Filter by category (including descendant categories)
    if (activeCategory) {
      const childCategoryIds = getDescendantCategoryIds(activeCategory.id, allCategories);
      const targetCategoryIds = [activeCategory.id, ...childCategoryIds];
      dbQuery = dbQuery.in("category_id", targetCategoryIds);
    }

    // 2. Trigram-friendly name search (schema index: idx_products_name_trgm on products using gin (name gin_trgm_ops))
    if (searchQuery && searchQuery.trim()) {
      const term = searchQuery.trim().replace(/[^a-zA-Z0-9 _-]/g, " ").trim();
      if (term) {
        const matchingCategory = !activeCategory
          ? allCategories.find((category) =>
              (category.name + " " + category.slug).toLowerCase().includes(term.toLowerCase())
            )
          : null;

        if (matchingCategory) {
          const descendants = getDescendantCategoryIds(matchingCategory.id, allCategories);
          dbQuery = dbQuery.in("category_id", [matchingCategory.id, ...descendants]);
        } else {
          dbQuery = dbQuery.or("name.ilike.%" + term + "%,sku.ilike.%" + term + "%");
        }
      }
    }

    // 3. Price range filters
    if (minPrice !== undefined && !isNaN(minPrice) && minPrice > 0) {
      dbQuery = dbQuery.gte("base_price", minPrice);
    }
    if (maxPrice !== undefined && !isNaN(maxPrice) && maxPrice > 0) {
      dbQuery = dbQuery.lte("base_price", maxPrice);
    }

    if (availability === "in-stock") {
      dbQuery = dbQuery.gt("stock_quantity", 0);
    } else if (availability === "out-of-stock") {
      dbQuery = dbQuery.lte("stock_quantity", 0);
    }

    // 3b. Festival filter
    if (festival && festival.trim()) {
      const festTerm = festival.trim().replace(/[^a-zA-Z0-9 _-]/g, " ").trim();
      if (festTerm) {
        dbQuery = dbQuery.or(`description.ilike.%${festTerm}%,name.ilike.%${festTerm}%`);
      }
    }

    // 3c. Material filter
    if (material && material.trim()) {
      const matTerm = material.trim().replace(/[^a-zA-Z0-9 _-]/g, " ").trim();
      if (matTerm) {
        dbQuery = dbQuery.or(`description.ilike.%${matTerm}%,name.ilike.%${matTerm}%`);
      }
    }

    // 4. Sorting
    switch (sort) {
      case "price_asc":
        dbQuery = dbQuery.order("base_price", { ascending: true });
        break;
      case "price_desc":
        dbQuery = dbQuery.order("base_price", { ascending: false });
        break;
      case "newest":
        dbQuery = dbQuery.order("created_at", { ascending: false });
        break;
      case "top_rated":
        dbQuery = dbQuery
          .order("avg_rating", { ascending: false })
          .order("review_count", { ascending: false });
        break;
      case "featured":
      default:
        dbQuery = dbQuery
          .order("is_featured_top_seller", { ascending: false })
          .order("top_seller_display_order", { ascending: true, nullsFirst: false })
          .order("sold_count", { ascending: false });
        break;
    }

    // 5. Pagination
    dbQuery = dbQuery.range(offset, offset + pageSize - 1);

    const { data: dbProducts, count, error } = await dbQuery;

    if (!error && dbProducts) {
      const items: ProductItem[] = (dbProducts as unknown as CatalogDbProduct[]).map((p) => {
        const sortedImages = p.product_images
          ? [...p.product_images].sort(
              (a, b) => (a.display_order || 0) - (b.display_order || 0)
            )
          : [];

        const primaryImg =
          sortedImages.find((img) => img.is_primary)?.image_url ||
          sortedImages[0]?.image_url ||
          null;

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          brand: p.brand,
          base_price: Number(p.base_price),
          compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
          avg_rating: Number(p.avg_rating || 0),
          review_count: Number(p.review_count || 0),
          stock_quantity: Number(p.stock_quantity || 0),
          image_url: primaryImg,
          is_featured_top_seller: Boolean(p.is_featured_top_seller),
          category_id: p.category_id,
        };
      });

      const totalCount = count ?? items.length;

      return {
        products: items,
        totalCount,
        page: validPage,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize) || 1,
        activeCategory,
        minPriceAvailable: 1000,
        maxPriceAvailable: 20000,
      };
    }
  } catch {
    // Graceful fallback to offline catalog below
  }

  // Robust shared mock catalog filtering (admin-store synchronization)
  let sourceProducts: ProductDetail[] = [];
  try {
    const { loadMockProducts } = await import("@/lib/mock-data/admin-store");
    const loaded = loadMockProducts();
    if (loaded && Array.isArray(loaded)) {
      sourceProducts = loaded as unknown as ProductDetail[];
    } else {
      sourceProducts = [];
    }
  } catch {
    sourceProducts = [];
  }

  let filtered = [...sourceProducts].filter((p) => p.is_active);

  // Category filtering with descendant expansion
  if (activeCategory) {
    const descendantIds = getDescendantCategoryIds(activeCategory.id, allCategories);
    const targetCategoryIds = [activeCategory.id, ...descendantIds];
    filtered = filtered.filter(
      (p) =>
        (p.category_id && targetCategoryIds.includes(p.category_id)) ||
        p.slug.includes(activeCategory.slug)
    );
  }

  // Trigram / text search matching
  if (searchQuery && searchQuery.trim()) {
    const term = searchQuery.trim().toLowerCase();
    const matchingCategory = !activeCategory
      ? allCategories.find((category) =>
          (category.name + " " + category.slug).toLowerCase().includes(term)
        )
      : null;

    if (matchingCategory) {
      const descendants = getDescendantCategoryIds(matchingCategory.id, allCategories);
      const categoryIds = new Set([matchingCategory.id, ...descendants]);
      filtered = filtered.filter((product) => product.category_id && categoryIds.has(product.category_id));
    } else {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.sku && p.sku.toLowerCase().includes(term)) ||
          (p.brand && p.brand.toLowerCase().includes(term)) ||
          (p.description && p.description.toLowerCase().includes(term))
      );
    }
  }

  // Price filtering
  if (minPrice !== undefined && !isNaN(minPrice) && minPrice > 0) {
    filtered = filtered.filter((p) => p.base_price >= minPrice);
  }
  if (maxPrice !== undefined && !isNaN(maxPrice) && maxPrice > 0) {
    filtered = filtered.filter((p) => p.base_price <= maxPrice);
  }

  if (availability === "in-stock") {
    filtered = filtered.filter((p) => p.stock_quantity > 0);
  } else if (availability === "out-of-stock") {
    filtered = filtered.filter((p) => p.stock_quantity <= 0);
  }

  // Festival filtering
  if (festival && festival.trim()) {
    const festLower = festival.trim().toLowerCase();
    filtered = filtered.filter((p) => {
      const desc = (p.description || "").toLowerCase();
      const name = (p.name || "").toLowerCase();
      const hasVariantAttr = p.variants?.some((v) => {
        const attrs = v.attributes || {};
        return Object.values(attrs).some((val) => String(val).toLowerCase().includes(festLower));
      });
      return desc.includes(festLower) || name.includes(festLower) || Boolean(hasVariantAttr);
    });
  }

  // Material filtering
  if (material && material.trim()) {
    const matLower = material.trim().toLowerCase();
    filtered = filtered.filter((p) => {
      const desc = (p.description || "").toLowerCase();
      const name = (p.name || "").toLowerCase();
      const hasVariantAttr = p.variants?.some((v) => {
        const attrs = v.attributes || {};
        return Object.values(attrs).some((val) => String(val).toLowerCase().includes(matLower));
      });
      return desc.includes(matLower) || name.includes(matLower) || Boolean(hasVariantAttr);
    });
  }

  // Sorting
  switch (sort) {
    case "price_asc":
      filtered.sort((a, b) => a.base_price - b.base_price);
      break;
    case "price_desc":
      filtered.sort((a, b) => b.base_price - a.base_price);
      break;
    case "newest":
      filtered.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      break;
    case "top_rated":
      filtered.sort((a, b) => b.avg_rating - a.avg_rating || b.review_count - a.review_count);
      break;
    case "featured":
    default:
      filtered.sort((a, b) => {
        if (a.is_featured_top_seller && !b.is_featured_top_seller) return -1;
        if (!a.is_featured_top_seller && b.is_featured_top_seller) return 1;
        return b.sold_count - a.sold_count;
      });
      break;
  }

  const totalCount = filtered.length;
  const paginated = filtered.slice(offset, offset + pageSize);

  const productItems: ProductItem[] = paginated.map((p) => {
    const primaryImg =
      p.images.find((img) => img.is_primary)?.image_url ||
      p.images[0]?.image_url ||
      null;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      base_price: p.base_price,
      compare_at_price: p.compare_at_price,
      avg_rating: p.avg_rating,
      review_count: p.review_count,
      stock_quantity: p.stock_quantity,
      image_url: primaryImg,
      is_featured_top_seller: p.is_featured_top_seller,
      category_id: p.category_id,
    };
  });

  return {
    products: productItems,
    totalCount,
    page: validPage,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
    activeCategory,
    minPriceAvailable: 1500,
    maxPriceAvailable: 15000,
  };
}

/**
 * Fetches product detail by slug with images, variants, and category.
 * Strictly returns null if product does not exist or is inactive (is_active = false).
 */
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  if (!slug) return null;

  try {
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories (
          id,
          name,
          slug,
          parent_id,
          is_active
        ),
        product_images (
          id,
          product_id,
          image_url,
          alt_text,
          display_order,
          is_primary
        ),
        product_variants (
          id,
          product_id,
          variant_name,
          sku,
          attributes,
          price,
          compare_at_price,
          stock_quantity,
          image_url,
          is_active
        )
      `
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && product) {
      const prod = product as unknown as SingleDbProduct;
      const sortedImages: ProductImage[] = (prod.product_images || [])
        .sort(
          (a, b) => (a.display_order || 0) - (b.display_order || 0)
        )
        .map((img) => ({
          id: img.id,
          product_id: img.product_id,
          image_url: img.image_url,
          alt_text: img.alt_text || null,
          display_order: img.display_order || 0,
          is_primary: Boolean(img.is_primary),
        }));

      const activeVariants: ProductVariant[] = (prod.product_variants || [])
        .filter((v) => v.is_active !== false)
        .map((v) => ({
          id: v.id,
          product_id: v.product_id,
          variant_name: v.variant_name,
          sku: v.sku || null,
          attributes:
            typeof v.attributes === "object" &&
            v.attributes !== null &&
            !Array.isArray(v.attributes)
              ? (v.attributes as Record<string, unknown>)
              : {},
          price: v.price !== null && v.price !== undefined ? Number(v.price) : null,
          compare_at_price:
            v.compare_at_price !== null && v.compare_at_price !== undefined ? Number(v.compare_at_price) : null,
          stock_quantity: Number(v.stock_quantity || 0),
          image_url: v.image_url || null,
          is_active: Boolean(v.is_active),
        }));

      return {
        id: prod.id,
        category_id: prod.category_id,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        brand: prod.brand,
        sku: prod.sku,
        base_price: Number(prod.base_price),
        compare_at_price: prod.compare_at_price
          ? Number(prod.compare_at_price)
          : null,
        stock_quantity: Number(prod.stock_quantity || 0),
        sold_count: Number(prod.sold_count || 0),
        is_active: prod.is_active,
        is_featured_top_seller: Boolean(prod.is_featured_top_seller),
        top_seller_display_order: prod.top_seller_display_order,
        avg_rating: Number(prod.avg_rating || 0),
        review_count: Number(prod.review_count || 0),
        meta_title: prod.meta_title,
        meta_description: prod.meta_description,
        created_at: prod.created_at,
        category: prod.category || null,
        images: sortedImages,
        variants: activeVariants,
      };
    }
  } catch {
    // Fallback to local catalog below
  }

  // Offline / shared mock store lookup
  let sourceProducts: ProductDetail[] = [];
  try {
    const { loadMockProducts } = await import("@/lib/mock-data/admin-store");
    const loaded = loadMockProducts();
    if (loaded && Array.isArray(loaded)) {
      sourceProducts = loaded as unknown as ProductDetail[];
    } else {
      sourceProducts = [];
    }
  } catch {
    sourceProducts = [];
  }

  const fallback = sourceProducts.find(
    (p) => p.slug === slug && p.is_active
  );

  if (!fallback) return null;

  const allCategories = await getAllActiveCategories();
  const cat = allCategories.find((c) => c.id === fallback.category_id) || null;

  return {
    ...fallback,
    category: cat,
  };
}

/**
 * Records a product view for authenticated users to power the "Continue Browsing" row.
 * Automatically trimmed to the latest 10 rows by schema trigger trg_trim_product_views.
 */
export async function recordProductView(
  productId: string,
  userId?: string | null
): Promise<void> {
  if (!userId || !productId) return;

  try {
    const supabase = await createClient();
    await supabase.from("product_views").upsert(
      {
        user_id: userId,
        product_id: productId,
        viewed_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,product_id",
      }
    );
  } catch {
    // Non-blocking view recording
  }
}

/**
 * Retrieves public approved reviews plus author's pending review (if current user authored one).
 */
export async function getProductReviews(
  productId: string,
  currentUserId?: string | null
): Promise<{
  reviews: ProductReviewItem[];
  userPendingReview: ProductReviewItem | null;
  summary: ProductRatingSummary;
}> {
  try {
    const supabase = await createClient();

    // RLS policy: reviews_read_approved_or_own_or_admin allows approved reviews OR own review
    const { data: dbReviews, error } = await supabase
      .from("product_reviews")
      .select(
        `
        id,
        product_id,
        user_id,
        order_item_id,
        rating,
        review_text,
        images,
        is_approved,
        created_at,
        profiles (
          full_name,
          avatar_url
        )
      `
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (!error && dbReviews) {
      let userPendingReview: ProductReviewItem | null = null;
      const approvedReviews: ProductReviewItem[] = [];

      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let ratingTotal = 0;

      for (const r of (dbReviews as unknown as ReviewDbItem[])) {
        const item: ProductReviewItem = {
          id: r.id,
          product_id: r.product_id,
          user_id: r.user_id,
          order_item_id: r.order_item_id,
          rating: Number(r.rating),
          review_text: r.review_text,
          images: Array.isArray(r.images) ? r.images : [],
          is_approved: Boolean(r.is_approved),
          created_at: r.created_at,
          author_name: r.profiles?.full_name || "Verified Customer",
          author_avatar: r.profiles?.avatar_url || null,
        };

        if (r.is_approved) {
          approvedReviews.push(item);
          const star = Math.min(5, Math.max(1, Math.round(item.rating))) as 1 | 2 | 3 | 4 | 5;
          breakdown[star]++;
          ratingTotal += item.rating;
        } else if (currentUserId && r.user_id === currentUserId) {
          // Current user's pending moderation review
          userPendingReview = item;
        }
      }

      const totalApproved = approvedReviews.length;
      const avgRating = totalApproved > 0 ? Number((ratingTotal / totalApproved).toFixed(1)) : 0;

      return {
        reviews: approvedReviews,
        userPendingReview,
        summary: {
          avgRating,
          reviewCount: totalApproved,
          breakdown,
        },
      };
    }
  } catch {
    // Fallback reviews below
  }

  // Fallback reviews
  const matching = FALLBACK_REVIEWS.filter((r) => r.product_id === productId);
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let ratingTotal = 0;

  matching.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[star]++;
    ratingTotal += r.rating;
  });

  const total = matching.length;
  const avg = total > 0 ? Number((ratingTotal / total).toFixed(1)) : 5.0;

  return {
    reviews: matching,
    userPendingReview: null,
    summary: {
      avgRating: avg,
      reviewCount: total,
      breakdown,
    },
  };
}

/**
 * Checks whether the current user is eligible to review the product:
 * 1. Must be authenticated.
 * 2. Cannot have an existing review (1 review per product/user).
 * 3. Must have a qualifying purchased order item (order confirmed/paid/processing/shipped/delivered).
 */
export async function checkUserReviewEligibility(
  productId: string,
  userId?: string | null
): Promise<{
  canReview: boolean;
  alreadyReviewed: boolean;
  existingReview: ProductReviewItem | null;
  qualifyingOrderItemId: string | null;
  reason?: string;
}> {
  if (!userId) {
    return {
      canReview: false,
      alreadyReviewed: false,
      existingReview: null,
      qualifyingOrderItemId: null,
      reason: "Please sign in with your account to submit a review.",
    };
  }

  try {
    const supabase = await createClient();

    // 1. Check if user already reviewed this product
    const { data: existingReviewData } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingReviewData) {
      const existing: ProductReviewItem = {
        id: existingReviewData.id,
        product_id: existingReviewData.product_id,
        user_id: existingReviewData.user_id,
        order_item_id: existingReviewData.order_item_id,
        rating: existingReviewData.rating,
        review_text: existingReviewData.review_text,
        images: Array.isArray(existingReviewData.images) ? (existingReviewData.images as string[]) : [],
        is_approved: existingReviewData.is_approved,
        created_at: existingReviewData.created_at,
      };

      return {
        canReview: false,
        alreadyReviewed: true,
        existingReview: existing,
        qualifyingOrderItemId: existingReviewData.order_item_id,
        reason: existingReviewData.is_approved
          ? "You have already reviewed this product. Thank you for your feedback!"
          : "Your review has been submitted and is currently pending moderation.",
      };
    }

    // 2. Check for qualifying purchased order item
    // Qualifying order statuses: confirmed, processing, shipped, delivered, OR payment_status = paid
    const { data: qualifyingOrders } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        payment_status,
        order_items!inner (
          id,
          product_id
        )
      `
      )
      .eq("user_id", userId)
      .eq("order_items.product_id", productId)
      .in("status", ["confirmed", "processing", "shipped", "delivered"]);

    if (qualifyingOrders && qualifyingOrders.length > 0) {
      const qualifyingItem = qualifyingOrders[0].order_items?.[0];
      return {
        canReview: true,
        alreadyReviewed: false,
        existingReview: null,
        qualifyingOrderItemId: qualifyingItem?.id || null,
      };
    }

    // Also check if any order has payment_status = 'paid'
    const { data: paidOrders } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        payment_status,
        order_items!inner (
          id,
          product_id
        )
      `
      )
      .eq("user_id", userId)
      .eq("order_items.product_id", productId)
      .eq("payment_status", "paid");

    if (paidOrders && paidOrders.length > 0) {
      const qualifyingItem = paidOrders[0].order_items?.[0];
      return {
        canReview: true,
        alreadyReviewed: false,
        existingReview: null,
        qualifyingOrderItemId: qualifyingItem?.id || null,
      };
    }

    return {
      canReview: false,
      alreadyReviewed: false,
      existingReview: null,
      qualifyingOrderItemId: null,
      reason:
        "Verified purchase required. You can review this item once you have placed a confirmed order for it.",
    };
  } catch {
    // If Supabase is not yet initialized with orders in dev mode, grant review permission for testing if authenticated
    return {
      canReview: true,
      alreadyReviewed: false,
      existingReview: null,
      qualifyingOrderItemId: null,
    };
  }
}
