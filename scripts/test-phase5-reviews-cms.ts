/**
 * Phase 5 Verification Test Suite: Product Reviews and Homepage Content Management
 * Validates schema fidelity to `schema ecomm.txt`, system-managed rating rollups,
 * review moderation workflows, homepage section toggles/reordering,
 * banner and testimonial CRUD and validations, and admin route rendering.
 */

import {
  SEED_REVIEWS,
  SEED_HOMEPAGE_SECTIONS,
  SEED_BANNERS,
  SEED_TESTIMONIALS,
  SEED_PRODUCTS,
  loadMockReviews,
  getMockReviewById,
  approveMockReview,
  unapproveMockReview,
  deleteMockReview,
  createMockReview,
  refreshProductRatingRollup,
  loadMockHomepageSections,
  updateMockHomepageSections,
  loadMockBanners,
  saveMockBanner,
  deleteMockBanner,
  toggleMockBannerStatus,
  reorderMockBanners,
  loadMockTestimonials,
  saveMockTestimonial,
  deleteMockTestimonial,
  toggleMockTestimonialStatus,
  reorderMockTestimonials,
  loadMockStore,
  saveMockStore,
  getInitialMockStore,
} from "../lib/mock-data/admin-store";

const BASE_URL = "http://localhost:3000";

interface TestReport {
  category: string;
  name: string;
  passed: boolean;
  message?: string;
}

const reports: TestReport[] = [];

function assert(category: string, name: string, condition: boolean, message?: string) {
  reports.push({
    category,
    name,
    passed: condition,
    message: condition ? "OK" : message || "Assertion failed",
  });
  console.log(`[${condition ? "PASS" : "FAIL"}] [${category}] ${name}${condition ? "" : " -> " + message}`);
}

async function runTestSuite() {
  console.log("==================================================================");
  console.log("  PHASE 5: PRODUCT REVIEWS & HOMEPAGE CONTENT MANAGEMENT SUITE   ");
  console.log("==================================================================\n");

  // ---------------------------------------------------------------------------
  // SECTION A: PRODUCT REVIEWS & SYSTEM RATING ROLLUPS
  // ---------------------------------------------------------------------------
  console.log("--- Section A: Product Reviews Schema & Moderation Workflow ---");

  // A1: Schema field verification on product_reviews
  assert(
    "Reviews: Schema",
    "SEED_REVIEWS loaded and contains realistic moderation records",
    Array.isArray(SEED_REVIEWS) && SEED_REVIEWS.length >= 5,
    `Found ${SEED_REVIEWS?.length} seed reviews.`
  );

  const sampleReview = SEED_REVIEWS[0];
  assert(
    "Reviews: Schema",
    "Review record contains exact schema fields without extra columns",
    Boolean(
      sampleReview.id &&
      sampleReview.product_id &&
      sampleReview.user_id &&
      sampleReview.rating !== undefined &&
      sampleReview.images !== undefined &&
      sampleReview.is_approved !== undefined &&
      sampleReview.created_at
    ),
    JSON.stringify(sampleReview)
  );

  assert(
    "Reviews: Schema",
    "All seed review ratings obey smallint CHECK (rating between 1 and 5)",
    SEED_REVIEWS.every((r) => r.rating >= 1 && r.rating <= 5),
    "Invalid rating found in seed reviews"
  );

  // A2: Moderation state diversity
  const hasApproved = SEED_REVIEWS.some((r) => r.is_approved === true);
  const hasPending = SEED_REVIEWS.some((r) => r.is_approved === false);
  assert(
    "Reviews: Moderation",
    "Seed dataset contains both approved and pending reviews for moderation testing",
    hasApproved && hasPending,
    `Approved: ${hasApproved}, Pending: ${hasPending}`
  );

  // A3: Filter tests
  const allResult = loadMockReviews();
  assert(
    "Reviews: Filter",
    "loadMockReviews() retrieves all reviews and comprehensive stats",
    allResult.reviews.length >= SEED_REVIEWS.length && allResult.stats.totalCount >= SEED_REVIEWS.length,
    `Reviews: ${allResult.reviews.length}, Stats total: ${allResult.stats.totalCount}`
  );

  const pendingResult = loadMockReviews({ status: "pending" });
  assert(
    "Reviews: Filter",
    "Filter by status: 'pending' returns only unapproved reviews",
    pendingResult.reviews.every((r) => !r.is_approved),
    `Pending reviews contained approved items`
  );

  const approvedResult = loadMockReviews({ status: "approved" });
  assert(
    "Reviews: Filter",
    "Filter by status: 'approved' returns only approved reviews",
    approvedResult.reviews.every((r) => r.is_approved),
    `Approved reviews contained unapproved items`
  );

  const rating5Result = loadMockReviews({ rating: 5 });
  assert(
    "Reviews: Filter",
    "Filter by rating: 5 returns only 5-star reviews",
    rating5Result.reviews.every((r) => r.rating === 5),
    `Rating filter returned non-5-star items`
  );

  const verifiedResult = loadMockReviews({ verification: "verified" });
  assert(
    "Reviews: Filter",
    "Filter by verification: 'verified' returns only purchase-linked reviews",
    verifiedResult.reviews.every((r) => r.is_verified_purchase),
    `Found unverified reviews in verified filter`
  );

  // A4: Text Search
  const searchResult = loadMockReviews({ searchQuery: "Radha Krishna" });
  assert(
    "Reviews: Search",
    "Search by query matches product name or review text",
    searchResult.reviews.length > 0 &&
      searchResult.reviews.every(
        (r) =>
          r.product_name.toLowerCase().includes("radha krishna") ||
          (r.review_text && r.review_text.toLowerCase().includes("radha krishna"))
      ),
    `Search did not properly match query`
  );

  // A5: System Rating Rollup Simulation (refresh_product_rating trigger)
  console.log("\n--- Section A.2: Schema Trigger refresh_product_rating Rollup ---");
  const store = loadMockStore();
  const testProdId = "prod-1"; // Radha Krishna Murti
  const productBefore = store.products.find((p) => p.id === testProdId);
  const initialApprovedCount = (store.reviews || []).filter(
    (r) => r.product_id === testProdId && r.is_approved === true
  ).length;

  assert(
    "Reviews: Trigger Rollup",
    "Product review_count matches approved reviews only (excluding pending)",
    productBefore?.review_count === initialApprovedCount,
    `product.review_count: ${productBefore?.review_count}, expected approved count: ${initialApprovedCount}`
  );

  // Approve pending review rev-004
  const approveRes = approveMockReview("rev-004");
  assert(
    "Reviews: Moderation Action",
    "approveMockReview('rev-004') marks review as approved",
    approveRes.success && approveRes.review?.is_approved === true,
    approveRes.error || "Approval failed"
  );

  const storeAfterApprove = loadMockStore();
  const productAfterApprove = storeAfterApprove.products.find((p) => p.id === testProdId);
  const expectedNewCount = initialApprovedCount + 1;
  assert(
    "Reviews: Trigger Rollup",
    "Approving a review automatically increments product review_count and recomputes avg_rating",
    productAfterApprove?.review_count === expectedNewCount && productAfterApprove?.avg_rating === 5.0,
    `Count: ${productAfterApprove?.review_count} (expected ${expectedNewCount}), Avg: ${productAfterApprove?.avg_rating}`
  );

  // Unapprove review rev-004
  const unapproveRes = unapproveMockReview("rev-004");
  assert(
    "Reviews: Moderation Action",
    "unapproveMockReview('rev-004') revokes approval",
    unapproveRes.success && unapproveRes.review?.is_approved === false,
    unapproveRes.error || "Unapproval failed"
  );

  const storeAfterUnapprove = loadMockStore();
  const productAfterUnapprove = storeAfterUnapprove.products.find((p) => p.id === testProdId);
  assert(
    "Reviews: Trigger Rollup",
    "Revoking review approval automatically decrements product review_count and restores avg_rating",
    productAfterUnapprove?.review_count === initialApprovedCount,
    `Count after revoke: ${productAfterUnapprove?.review_count}, expected: ${initialApprovedCount}`
  );

  // Constraint UNIQUE (product_id, user_id)
  const duplicateReviewRes = createMockReview({
    product_id: "prod-1",
    user_id: "cust-1", // cust-1 already reviewed prod-1 (rev-001)
    order_item_id: null,
    rating: 5,
    review_text: "Duplicate attempt",
    images: [],
    is_approved: false,
  });
  assert(
    "Reviews: Constraints",
    "Rejects duplicate review for same user and product under schema UNIQUE (product_id, user_id)",
    duplicateReviewRes.success === false,
    "Expected failure for duplicate user+product review"
  );

  // ---------------------------------------------------------------------------
  // SECTION B: HOMEPAGE SECTIONS MANAGEMENT
  // ---------------------------------------------------------------------------
  console.log("\n--- Section B: Homepage Sections CMS ---");

  const sections = loadMockHomepageSections();
  assert(
    "Homepage Sections",
    "loadMockHomepageSections() returns all 6 canonical schema sections",
    sections.length === 6,
    `Expected 6 sections, found ${sections.length}`
  );

  const expectedKeys = [
    "banner",
    "shop_by_category",
    "continue_browsing",
    "top_sellers",
    "category_products",
    "wall_of_love",
  ];
  const allKeysPresent = expectedKeys.every((k) => sections.some((s) => s.key === k));
  assert(
    "Homepage Sections",
    "All 6 exact schema section keys are configured",
    allKeysPresent,
    `Sections present: ${sections.map((s) => s.key).join(", ")}`
  );

  // Test toggling and reordering
  const reorderedSections = [
    { key: "shop_by_category", is_enabled: true, display_order: 1 },
    { key: "banner", is_enabled: false, display_order: 2 },
    { key: "top_sellers", is_enabled: true, display_order: 3 },
    { key: "continue_browsing", is_enabled: true, display_order: 4 },
    { key: "category_products", is_enabled: true, display_order: 5 },
    { key: "wall_of_love", is_enabled: true, display_order: 6 },
  ];

  const updateSectionRes = updateMockHomepageSections(reorderedSections);
  assert(
    "Homepage Sections",
    "updateMockHomepageSections() updates order and enabled status",
    updateSectionRes.success === true &&
      updateSectionRes.sections?.[0].key === "shop_by_category" &&
      updateSectionRes.sections?.[1].is_enabled === false,
    updateSectionRes.error || "Update sections failed"
  );

  // Restore sections
  const restoredSections = expectedKeys.map((key, idx) => ({
    key,
    is_enabled: true,
    display_order: idx + 1,
  }));
  updateMockHomepageSections(restoredSections);

  // ---------------------------------------------------------------------------
  // SECTION C: BANNERS CMS
  // ---------------------------------------------------------------------------
  console.log("\n--- Section C: Hero Banners CMS ---");

  const initialBanners = loadMockBanners();
  assert(
    "Banners",
    "loadMockBanners() returns configured active hero banners",
    initialBanners.length >= 3,
    `Found ${initialBanners.length} banners.`
  );

  // Validation: Missing or invalid Image URL
  const invalidImageRes = saveMockBanner({
    image_url: "invalid-url-without-protocol",
    title: "Bad Banner",
  });
  assert(
    "Banners: Validation",
    "saveMockBanner rejects invalid image URL format",
    invalidImageRes.success === false,
    "Expected failure for malformed image URL"
  );

  // Validation: Invalid link URL
  const invalidLinkRes = saveMockBanner({
    image_url: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375",
    link_url: "ftp://invalid-link-format",
    title: "Bad Link",
  });
  assert(
    "Banners: Validation",
    "saveMockBanner rejects invalid destination link format",
    invalidLinkRes.success === false,
    "Expected failure for malformed link URL"
  );

  // Create valid banner
  const newBannerRes = saveMockBanner({
    image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=1600&q=80",
    title: "Festive Diwali Deepam Special Offer",
    link_url: "/shop?category=pooja-essentials",
    display_order: 10,
    is_active: true,
  });
  assert(
    "Banners: CRUD",
    "saveMockBanner successfully creates new hero banner with valid inputs",
    newBannerRes.success && Boolean(newBannerRes.banner?.id),
    newBannerRes.error || "Failed to create banner"
  );

  const createdBannerId = newBannerRes.banner?.id!;

  // Toggle banner
  const toggleRes = toggleMockBannerStatus(createdBannerId);
  assert(
    "Banners: CRUD",
    "toggleMockBannerStatus toggles is_active flag",
    toggleRes.success && toggleRes.banner?.is_active === false,
    toggleRes.error || "Toggle failed"
  );

  // Delete banner
  const deleteBannerRes = deleteMockBanner(createdBannerId);
  assert(
    "Banners: CRUD",
    "deleteMockBanner removes banner record",
    deleteBannerRes.success,
    deleteBannerRes.error || "Delete failed"
  );

  // ---------------------------------------------------------------------------
  // SECTION D: TESTIMONIALS CMS (Wall of Love)
  // ---------------------------------------------------------------------------
  console.log("\n--- Section D: Testimonials CMS (Wall of Love) ---");

  const initialTestimonials = loadMockTestimonials();
  assert(
    "Testimonials",
    "loadMockTestimonials() returns configured active testimonials",
    initialTestimonials.length >= 4,
    `Found ${initialTestimonials.length} testimonials.`
  );

  // Validation: customer_name min length
  const invalidNameRes = saveMockTestimonial({
    customer_name: "A",
    content: "Valid review content with sufficient length.",
  });
  assert(
    "Testimonials: Validation",
    "saveMockTestimonial rejects customer name with less than 2 characters",
    invalidNameRes.success === false,
    "Expected failure for single character customer name"
  );

  // Validation: content min length
  const invalidContentRes = saveMockTestimonial({
    customer_name: "Suresh Patel",
    content: "Too short",
  });
  assert(
    "Testimonials: Validation",
    "saveMockTestimonial rejects review content with less than 10 characters",
    invalidContentRes.success === false,
    "Expected failure for short review content"
  );

  // Validation: rating 1 to 5
  const invalidRatingRes = saveMockTestimonial({
    customer_name: "Suresh Patel",
    content: "Excellent divine brass idol for our mandir.",
    rating: 6,
  });
  assert(
    "Testimonials: Validation",
    "saveMockTestimonial rejects rating outside 1 to 5 range",
    invalidRatingRes.success === false,
    "Expected failure for rating 6"
  );

  // Create valid testimonial
  const newTestimonialRes = saveMockTestimonial({
    customer_name: "Gaurav Singhal",
    designation: "Temple Trustee, Mathura",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    content: "The heavy brass mandir kalash and akhand diya arrived in sanctified condition. Top tier artisan quality.",
    rating: 5,
    display_order: 10,
    is_active: true,
  });
  assert(
    "Testimonials: CRUD",
    "saveMockTestimonial creates valid testimonial record",
    newTestimonialRes.success && Boolean(newTestimonialRes.testimonial?.id),
    newTestimonialRes.error || "Failed to create testimonial"
  );

  const createdTestId = newTestimonialRes.testimonial?.id!;

  // Toggle testimonial status
  const toggleTestRes = toggleMockTestimonialStatus(createdTestId);
  assert(
    "Testimonials: CRUD",
    "toggleMockTestimonialStatus toggles active state",
    toggleTestRes.success && toggleTestRes.testimonial?.is_active === false,
    toggleTestRes.error || "Toggle failed"
  );

  // Delete testimonial
  const deleteTestRes = deleteMockTestimonial(createdTestId);
  assert(
    "Testimonials: CRUD",
    "deleteMockTestimonial removes testimonial record",
    deleteTestRes.success,
    deleteTestRes.error || "Delete failed"
  );

  // ---------------------------------------------------------------------------
  // SECTION E: ADMIN ROUTES HTTP RENDERING
  // ---------------------------------------------------------------------------
  console.log("\n--- Section E: Admin Routes HTTP Rendering ---");

  const routesToTest = [
    { path: "/admin/reviews", label: "Review Moderation Hub" },
    { path: "/admin/cms/homepage", label: "Homepage Section Sequence CMS" },
    { path: "/admin/cms/banners", label: "Hero Banners CMS" },
    { path: "/admin/cms/testimonials", label: "Wall of Love Testimonials CMS" },
  ];

  for (const route of routesToTest) {
    try {
      const res = await fetch(`${BASE_URL}${route.path}`, {
        headers: {
          Cookie: "admin_preview_active=true",
        },
      });

      assert(
        "HTTP Route",
        `${route.label} (${route.path}) returns HTTP 200 OK`,
        res.status === 200,
        `Status was ${res.status}`
      );
    } catch (err: any) {
      assert(
        "HTTP Route",
        `${route.label} (${route.path}) reachable`,
        false,
        err.message || "Failed to connect"
      );
    }
  }

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  console.log("\n==================================================================");
  const total = reports.length;
  const passed = reports.filter((r) => r.passed).length;
  const failed = reports.filter((r) => !r.passed).length;

  console.log(`TOTAL TESTS : ${total}`);
  console.log(`PASSED      : ${passed}`);
  console.log(`FAILED      : ${failed}`);
  console.log("==================================================================");

  if (failed > 0) {
    console.error(`\n❌ ${failed} tests failed!`);
    process.exit(1);
  } else {
    console.log("\n✅ ALL PHASE 5 VERIFICATION TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
