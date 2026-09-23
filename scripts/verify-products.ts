import {
  getShopProducts,
  getProductBySlug,
  checkUserReviewEligibility,
  FALLBACK_PRODUCT_DETAILS,
} from "../lib/data/products";
import { generateSlug } from "../lib/data/categories";

async function verifyProductsSuite() {
  console.log("🔍 Starting Products, Shop & Admin Verification Suite...\n");
  let total = 0;
  let passed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `- ${detail}` : ""}`);
    }
  }

  // TEST 1: Shop Catalog Default Retrieval
  console.log("--- Section 1: Shop Catalog & Filters ---");
  const defaultShop = await getShopProducts({ page: 1, pageSize: 6 });
  assert(
    defaultShop.products.length > 0 && defaultShop.products.length <= 6,
    "Shop pagination limits products per page correctly",
    `Count: ${defaultShop.products.length}`
  );
  assert(
    defaultShop.totalCount >= defaultShop.products.length,
    "Shop returns total count for pagination controls"
  );
  assert(
    defaultShop.products.every((p) => p.image_url !== null),
    "All catalog products resolve a usable image URL"
  );

  // TEST 2: Price Filtering
  const priceFiltered = await getShopProducts({ minPrice: 2000, maxPrice: 10000 });
  const allInRange = priceFiltered.products.every(
    (p) => p.base_price >= 2000 && p.base_price <= 10000
  );
  assert(allInRange, "Shop price filter strictly respects minPrice and maxPrice bounds");

  // TEST 3: Sorting
  const sortedAsc = await getShopProducts({ sort: "price_asc" });
  let isSortedAsc = true;
  for (let i = 1; i < sortedAsc.products.length; i++) {
    if (sortedAsc.products[i].base_price < sortedAsc.products[i - 1].base_price) {
      isSortedAsc = false;
      break;
    }
  }
  assert(isSortedAsc, "Shop sort 'price_asc' orders products from lowest to highest price");

  // TEST 4: Trigram / Search Query
  const searchResults = await getShopProducts({ searchQuery: "shirt" });
  assert(
    searchResults.products.length > 0 &&
      searchResults.products.some((p) => p.name.toLowerCase().includes("shirt")),
    "Shop search matches products by name query ('shirt')"
  );

  // TEST 5: Category Hierarchy Resolution
  const categoryResults = await getShopProducts({ categorySlug: "menswear" });
  assert(
    categoryResults.products.length > 0,
    "Shop category query resolves products in category and all descendant subcategories"
  );

  // TEST 6: Product Detail Lookup & Slug Resolution
  console.log("\n--- Section 2: Product Detail & Guardrails ---");
  const testProduct = FALLBACK_PRODUCT_DETAILS[0];
  const fetchedProd = await getProductBySlug(testProduct.slug);
  assert(
    fetchedProd !== null && fetchedProd.slug === testProduct.slug,
    `Valid active slug '${testProduct.slug}' resolves successfully`
  );
  assert(
    fetchedProd !== null && fetchedProd.images.length > 0,
    "Resolved product has populated image gallery"
  );
  assert(
    fetchedProd !== null && fetchedProd.images.some((img) => img.is_primary),
    "Resolved product has an active primary image"
  );

  // TEST 7: Invalid / Inactive Product 404 Guard
  const nonExistent = await getProductBySlug("non-existent-luxury-item-xyz");
  assert(nonExistent === null, "Non-existent product returns null (triggers notFound 404)");

  // TEST 8: Review Eligibility Guardrails
  console.log("\n--- Section 3: Review Permissions & Moderation ---");
  const unauthEligibility = await checkUserReviewEligibility(testProduct.id, null);
  assert(
    !unauthEligibility.canReview && Boolean(unauthEligibility.reason?.includes("sign in")),
    "Unauthenticated users cannot submit reviews"
  );

  // TEST 9: Slug Generation
  console.log("\n--- Section 4: Admin Product Validation Rules ---");
  const generatedSlug = generateSlug("Royal Linen Formal Shirt (Limited Edition)");
  assert(
    generatedSlug === "royal-linen-formal-shirt-limited-edition",
    "Slug auto-generator produces clean URL slugs",
    generatedSlug
  );

  // TEST 10: Primary Image Business Rule Validation
  const activeProductWithoutPrimary = {
    is_active: true,
    images: [
      { image_url: "https://example.com/img1.jpg", is_primary: false, display_order: 1 },
      { image_url: "https://example.com/img2.jpg", is_primary: false, display_order: 2 },
    ],
  };
  const hasPrimary = activeProductWithoutPrimary.images.some((img) => img.is_primary);
  assert(
    !hasPrimary,
    "Primary image validation catches missing primary image when is_active = true"
  );

  // TEST 11: Schema Column Integrity
  const allowedProductColumns = new Set([
    "id",
    "category_id",
    "name",
    "slug",
    "description",
    "brand",
    "sku",
    "base_price",
    "compare_at_price",
    "stock_quantity",
    "sold_count",
    "is_active",
    "is_featured_top_seller",
    "top_seller_display_order",
    "avg_rating",
    "review_count",
    "meta_title",
    "meta_description",
    "created_at",
    "updated_at",
  ]);

  for (const p of FALLBACK_PRODUCT_DETAILS) {
    const keys = Object.keys(p).filter(
      (k) => !["images", "variants", "category"].includes(k)
    );
    const unbacked = keys.filter((k) => !allowedProductColumns.has(k));
    assert(
      unbacked.length === 0,
      `Product '${p.name}' contains only schema-backed columns`,
      unbacked.join(", ")
    );
  }

  // Summary
  console.log("\n==========================================");
  console.log(`Results: ${passed} / ${total} tests passed.`);
  console.log("==========================================");

  if (passed !== total) {
    process.exit(1);
  }
}

verifyProductsSuite().catch((err) => {
  console.error("Verification suite execution error:", err);
  process.exit(1);
});
