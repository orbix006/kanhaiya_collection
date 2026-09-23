import { createClient } from "@/lib/supabase/server";
export type {
  AdminReviewItem,
  AdminReviewFilterParams,
  AdminReviewStats,
} from "./review-types";
import type {
  AdminReviewItem,
  AdminReviewFilterParams,
  AdminReviewStats,
} from "./review-types";

// In-memory demo reviews store for offline/local development
const demoReviewsStore: Map<string, AdminReviewItem> = new Map();

function initDemoReviewsIfEmpty(): AdminReviewItem[] {
  if (demoReviewsStore.size > 0) {
    return Array.from(demoReviewsStore.values());
  }

  const defaultReviews: AdminReviewItem[] = [
    {
      id: "rev-demo-001",
      product_id: "prod-1",
      product_name: "Royal Heritage Embroidered Sherwani",
      product_slug: "royal-heritage-embroidered-sherwani",
      product_image: null,
      user_id: "demo-user-1",
      author_name: "Aarav Sharma",
      author_email: "aarav.sharma@example.com",
      author_phone: "+91 98765 43210",
      author_avatar: null,
      rating: 5,
      review_text:
        "The fabric breathability and finish are exceptional. Felt extraordinarily regal wearing this at our wedding reception. Highly recommend!",
      images: [],
      is_approved: true,
      created_at: "2026-09-21T11:30:00.000Z",
      order_item_id: "item-demo-101",
      is_verified_purchase: true,
      order_id: "ord-demo-001",
      order_number: "ORD-20260920-00101",
      order_status: "confirmed",
      order_placed_at: "2026-09-20T10:15:00.000Z",
      variant_name: "Ivory Silk / Size 42",
      unit_price: 4999,
      quantity: 1,
    },
    {
      id: "rev-demo-002",
      product_id: "prod-7",
      product_name: "Pure Banarasi Kanjeevaram Saree",
      product_slug: "pure-banarasi-kanjeevaram-saree",
      product_image: null,
      user_id: "demo-user-2",
      author_name: "Pooja Hegde",
      author_email: "pooja.h@example.com",
      author_phone: "+91 91234 56789",
      author_avatar: null,
      rating: 5,
      review_text:
        "Exquisite zari work and authentic silk feel. Truly timeless craftsmanship.",
      images: [],
      is_approved: false, // Pending moderation
      created_at: "2026-09-22T14:10:00.000Z",
      order_item_id: "item-demo-102",
      is_verified_purchase: true,
      order_id: "ord-demo-002",
      order_number: "ORD-20260918-00085",
      order_status: "confirmed",
      order_placed_at: "2026-09-18T14:45:00.000Z",
      variant_name: "Crimson Gold / Free Size",
      unit_price: 12499,
      quantity: 1,
    },
    {
      id: "rev-demo-003",
      product_id: "prod-2",
      product_name: "Handwoven Chanderi Kurta Set",
      product_slug: "handwoven-chanderi-kurta-set",
      product_image: null,
      user_id: "demo-user-3",
      author_name: "Vikram Malhotra",
      author_email: "vikram.m@example.com",
      author_phone: "+91 99887 76655",
      author_avatar: null,
      rating: 4,
      review_text:
        "Very comfortable and authentic dye color. Stitching on the collar was sturdy. Took slightly longer to ship but worth it.",
      images: [],
      is_approved: true,
      created_at: "2026-09-19T09:20:00.000Z",
      order_item_id: "item-demo-103",
      is_verified_purchase: true,
      order_id: "ord-demo-003",
      order_number: "ORD-20260915-00042",
      order_status: "processing",
      order_placed_at: "2026-09-15T09:30:00.000Z",
      variant_name: "Sage Green / M",
      unit_price: 3499,
      quantity: 2,
    },
    {
      id: "rev-demo-004",
      product_id: "prod-3",
      product_name: "Artisan Silk Nehru Jacket",
      product_slug: "artisan-silk-nehru-jacket",
      product_image: null,
      user_id: "demo-user-4",
      author_name: "Ananya Deshmukh",
      author_email: "ananya.d@example.com",
      author_phone: "+91 98220 12345",
      author_avatar: null,
      rating: 5,
      review_text:
        "The fit is tailored to perfection. Perfect addition over a plain linen shirt for festive gatherings.",
      images: [],
      is_approved: false, // Pending moderation
      created_at: "2026-09-23T08:05:00.000Z",
      order_item_id: "item-demo-104",
      is_verified_purchase: true,
      order_id: "ord-demo-004",
      order_number: "ORD-20260912-00019",
      order_status: "shipped",
      order_placed_at: "2026-09-12T16:20:00.000Z",
      variant_name: "Midnight Navy / 40",
      unit_price: 3599,
      quantity: 1,
    },
    {
      id: "rev-demo-005",
      product_id: "prod-8",
      product_name: "Handcrafted Zardozi Lehenga Choli",
      product_slug: "handcrafted-zardozi-lehenga-choli",
      product_image: null,
      user_id: "demo-user-6",
      author_name: "Kavita Singhania",
      author_email: "kavita.s@example.com",
      author_phone: null,
      author_avatar: null,
      rating: 2,
      review_text:
        "Color was slightly darker than pictured on site under studio lights. Quality of embroidery is good though.",
      images: [],
      is_approved: false, // Pending moderation
      created_at: "2026-09-23T12:00:00.000Z",
      order_item_id: null,
      is_verified_purchase: false,
    },
    {
      id: "rev-demo-006",
      product_id: "prod-4",
      product_name: "Cotton Silk Bandhgala",
      product_slug: "cotton-silk-bandhgala",
      product_image: null,
      user_id: "demo-user-7",
      author_name: "Rohan Kapoor",
      author_email: "rohan.k@example.com",
      author_phone: null,
      author_avatar: null,
      rating: 5,
      review_text:
        "Stupendous quality, arrived in premium branded dust bags. Will purchase again.",
      images: [],
      is_approved: true,
      created_at: "2026-09-10T16:45:00.000Z",
      order_item_id: null,
      is_verified_purchase: false,
    },
  ];

  for (const r of defaultReviews) {
    demoReviewsStore.set(r.id, r);
  }

  return defaultReviews;
}

/**
 * Retrieves all reviews with purchase linkage for store moderation
 */
export async function getAdminReviews(
  filterParams?: AdminReviewFilterParams
): Promise<{ reviews: AdminReviewItem[]; stats: AdminReviewStats }> {
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    const all = initDemoReviewsIfEmpty();
    let filtered = [...all];

    if (filterParams?.status === "pending") {
      filtered = filtered.filter((r) => !r.is_approved);
    } else if (filterParams?.status === "approved") {
      filtered = filtered.filter((r) => r.is_approved);
    }

    if (filterParams?.verification === "verified") {
      filtered = filtered.filter((r) => r.is_verified_purchase);
    } else if (filterParams?.verification === "unverified") {
      filtered = filtered.filter((r) => !r.is_verified_purchase);
    }

    if (filterParams?.rating && filterParams.rating !== "all") {
      filtered = filtered.filter((r) => r.rating === Number(filterParams.rating));
    }

    if (filterParams?.searchQuery?.trim()) {
      const q = filterParams.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.product_name.toLowerCase().includes(q) ||
          r.author_name.toLowerCase().includes(q) ||
          (r.review_text && r.review_text.toLowerCase().includes(q)) ||
          (r.order_number && r.order_number.toLowerCase().includes(q))
      );
    }

    filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const approvedReviews = all.filter((r) => r.is_approved);
    const averageRating =
      approvedReviews.length > 0
        ? Number(
            (
              approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
              approvedReviews.length
            ).toFixed(1)
          )
        : 0;

    const stats: AdminReviewStats = {
      totalCount: all.length,
      pendingCount: all.filter((r) => !r.is_approved).length,
      approvedCount: approvedReviews.length,
      averageRating,
      verifiedCount: all.filter((r) => r.is_verified_purchase).length,
    };

    return { reviews: filtered, stats };
  }

  const supabase = await createClient();

  let query = supabase
    .from("product_reviews")
    .select(`
      id,
      product_id,
      user_id,
      order_item_id,
      rating,
      review_text,
      images,
      is_approved,
      created_at,
      products:products(
        id,
        name,
        slug,
        product_images(image_url, is_primary)
      ),
      profiles:profiles(
        id,
        full_name,
        avatar_url,
        phone
      ),
      order_items:order_items(
        id,
        order_id,
        product_name,
        variant_name,
        unit_price,
        quantity,
        orders:orders(
          id,
          order_number,
          status,
          placed_at
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (filterParams?.status === "pending") {
    query = query.eq("is_approved", false);
  } else if (filterParams?.status === "approved") {
    query = query.eq("is_approved", true);
  }

  if (filterParams?.rating && filterParams.rating !== "all") {
    query = query.eq("rating", Number(filterParams.rating));
  }

  const { data: dbReviews, error } = await query;

  if (error || !dbReviews) {
    console.error("[getAdminReviews] Error querying reviews:", error?.message);
    return {
      reviews: [],
      stats: {
        totalCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        averageRating: 0,
        verifiedCount: 0,
      },
    };
  }

  let mapped: AdminReviewItem[] = dbReviews.map((r: any) => {
    const rawProd = Array.isArray(r.products) ? r.products[0] : r.products;
    const rawProfile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    const rawItem = Array.isArray(r.order_items) ? r.order_items[0] : r.order_items;
    const rawOrder = rawItem
      ? Array.isArray(rawItem.orders)
        ? rawItem.orders[0]
        : rawItem.orders
      : null;

    const prodImages = rawProd?.product_images || [];
    const primaryImg =
      prodImages.find((img: any) => img.is_primary)?.image_url ||
      prodImages[0]?.image_url ||
      null;

    const isVerified = Boolean(r.order_item_id && rawItem);

    return {
      id: r.id,
      product_id: r.product_id,
      product_name: rawProd?.name || "Product",
      product_slug: rawProd?.slug || "",
      product_image: primaryImg,
      user_id: r.user_id,
      author_name: rawProfile?.full_name || "Customer",
      author_email: null,
      author_phone: rawProfile?.phone || null,
      author_avatar: rawProfile?.avatar_url || null,
      rating: Number(r.rating),
      review_text: r.review_text,
      images: Array.isArray(r.images) ? r.images : [],
      is_approved: Boolean(r.is_approved),
      created_at: r.created_at,
      order_item_id: r.order_item_id,
      is_verified_purchase: isVerified,
      order_id: rawOrder?.id || rawItem?.order_id || null,
      order_number: rawOrder?.order_number || null,
      order_status: rawOrder?.status || null,
      order_placed_at: rawOrder?.placed_at || null,
      variant_name: rawItem?.variant_name || null,
      unit_price: rawItem?.unit_price ? Number(rawItem.unit_price) : null,
      quantity: rawItem?.quantity ? Number(rawItem.quantity) : null,
    };
  });

  if (filterParams?.verification === "verified") {
    mapped = mapped.filter((r) => r.is_verified_purchase);
  } else if (filterParams?.verification === "unverified") {
    mapped = mapped.filter((r) => !r.is_verified_purchase);
  }

  if (filterParams?.searchQuery?.trim()) {
    const q = filterParams.searchQuery.toLowerCase().trim();
    mapped = mapped.filter(
      (r) =>
        r.product_name.toLowerCase().includes(q) ||
        r.author_name.toLowerCase().includes(q) ||
        (r.review_text && r.review_text.toLowerCase().includes(q)) ||
        (r.order_number && r.order_number.toLowerCase().includes(q))
    );
  }

  // Calculate stats from all reviews in DB
  const { data: allReviewsStats } = await supabase
    .from("product_reviews")
    .select("is_approved, rating, order_item_id");

  let totalCount = 0;
  let pendingCount = 0;
  let approvedCount = 0;
  let ratingSum = 0;
  let verifiedCount = 0;

  if (allReviewsStats) {
    totalCount = allReviewsStats.length;
    for (const row of allReviewsStats) {
      if (row.is_approved) {
        approvedCount++;
        ratingSum += Number(row.rating || 0);
      } else {
        pendingCount++;
      }
      if (row.order_item_id) {
        verifiedCount++;
      }
    }
  }

  const averageRating =
    approvedCount > 0 ? Number((ratingSum / approvedCount).toFixed(1)) : 0;

  return {
    reviews: mapped,
    stats: {
      totalCount,
      pendingCount,
      approvedCount,
      averageRating,
      verifiedCount,
    },
  };
}

export function getDemoReviewsStore() {
  return demoReviewsStore;
}
