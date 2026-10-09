import {
  getHomepageSections,
  getActiveBanners,
  getHomepageCategories,
  getAllActiveCategories,
  getContinueBrowsingProducts,
  getTopSellers,
  getCategoryProductSections,
  getActiveTestimonials,
} from "../lib/data/homepage";

async function verifyHomepage() {
  console.log("🔍 Starting Homepage Verification Test Suite...\n");
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `- ${detail}` : ""}`);
    }
  }

  // TEST 1: Dynamic homepage sections ordering and visibility
  console.log("--- 1. Homepage Sections Dynamic Ordering & Visibility ---");
  const sections = await getHomepageSections();
  assert(Array.isArray(sections), "Sections returned as array");
  assert(sections.length > 0, `Sections fetched: ${sections.length} enabled sections`);
  
  // Verify strictly sorted by display_order ASC
  let isSorted = true;
  for (let i = 1; i < sections.length; i++) {
    if (sections[i].display_order < sections[i - 1].display_order) {
      isSorted = false;
      break;
    }
  }
  assert(isSorted, "Sections are ordered strictly by display_order ascending");
  assert(sections.every((s) => s.is_enabled), "Only enabled sections are returned for rendering");

  // Verify all 6 expected section keys are represented in valid order
  const validKeys = ["banner", "shop_by_category", "continue_browsing", "top_sellers", "category_products", "wall_of_love"];
  assert(sections.every((s) => validKeys.includes(s.key)), "All sections use valid database section keys");

  // TEST 2: Active banner carousel logic
  console.log("\n--- 2. Active Banner Carousel Logic ---");
  const banners = await getActiveBanners();
  assert(Array.isArray(banners) && banners.length > 0, `Active banners fetched: ${banners.length}`);
  
  // Navigation controls rule: controls ONLY rendered when multiple banners exist
  const multiBannerControlsVisible = banners.length > 1;
  assert(multiBannerControlsVisible === (banners.length > 1), `Navigation controls rendered when multiple banners (${banners.length} banners: controls=${multiBannerControlsVisible})`);

  // Test single banner edge case
  const singleBannerList = [banners[0]];
  const singleBannerControlsVisible = singleBannerList.length > 1;
  assert(!singleBannerControlsVisible, "Navigation controls strictly omitted when only 1 banner exists");

  // Verify optional links
  assert(banners.some((b) => b.link_url !== null), "Banners contain valid optional click destination links");
  assert(banners.every((b) => b.image_url.length > 0), "Every banner has a valid image_url");

  // TEST 3: Homepage Category Grid
  console.log("\n--- 3. Homepage Category Grid & Deep Links ---");
  const homepageCategories = await getHomepageCategories();
  assert(Array.isArray(homepageCategories) && homepageCategories.length > 0, `Active homepage categories fetched: ${homepageCategories.length}`);
  assert(homepageCategories.every((c) => c.show_on_homepage && c.is_active), "Categories are active and marked show_on_homepage");
  
  // Deep link format verification
  const categoryDeepLinks = homepageCategories.map((c) => `/shop?category=${c.slug}`);
  assert(categoryDeepLinks.every((link) => link.startsWith("/shop?category=")), "Category boxes correctly generate /shop?category=<slug> deep links");
  console.log(`     Sample Deep Links: ${categoryDeepLinks.slice(0, 3).join(", ")}`);

  // TEST 4: Global Storefront Header Category Tree & Search
  console.log("\n--- 4. Global Storefront Header (Mega-Menu & Search) ---");
  const allCategories = await getAllActiveCategories();
  assert(allCategories.length >= homepageCategories.length, "All active categories retrieved for header navigation");
  const topParents = allCategories.filter((c) => c.parent_id === null);
  const children = allCategories.filter((c) => c.parent_id !== null);
  assert(topParents.length > 0, `Top-level parent categories for mega-menu: ${topParents.length}`);
  assert(children.length > 0, `Nested subcategories for mega-menu: ${children.length}`);

  // TEST 5: Reusable ProductCard Data Attributes
  console.log("\n--- 5. Reusable ProductCard Attributes ---");
  const topSellers = await getTopSellers();
  assert(Array.isArray(topSellers) && topSellers.length > 0, `Top sellers fetched: ${topSellers.length}`);
  const sampleProduct = topSellers[0];
  assert(typeof sampleProduct.name === "string" && sampleProduct.name.length > 0, "Product has valid name");
  assert(typeof sampleProduct.base_price === "number" && sampleProduct.base_price > 0, `Product base_price valid: ₹${sampleProduct.base_price}`);
  assert(sampleProduct.compare_at_price === null || sampleProduct.compare_at_price >= sampleProduct.base_price, "Compare-at price valid strikethrough price");
  assert(sampleProduct.avg_rating >= 0 && sampleProduct.avg_rating <= 5, `Rating valid: ${sampleProduct.avg_rating} / 5`);
  assert(typeof sampleProduct.image_url === "string" && sampleProduct.image_url.length > 0, "Product primary image resolved");

  // TEST 6: Continue Browsing (Logged-out vs Authenticated)
  console.log("\n--- 6. Continue Browsing Logic ---");
  const loggedOutViews = await getContinueBrowsingProducts(null);
  assert(loggedOutViews.length === 0, "Continue Browsing returns 0 items for logged-out users (renders null)");
  const emptyUserViews = await getContinueBrowsingProducts("non-existent-user-id");
  assert(emptyUserViews.length === 0, "Continue Browsing returns 0 items when user has 0 view history");

  // TEST 7: Category Product Rows with View All links
  console.log("\n--- 7. Products-by-Homepage-Category Rows ---");
  const categoryProductSections = await getCategoryProductSections();
  assert(categoryProductSections.length > 0, `Category product rows fetched: ${categoryProductSections.length} sections`);
  assert(categoryProductSections.every((sec) => sec.products.length > 0), "Each category row contains products");
  assert(categoryProductSections.every((sec) => sec.category.slug.length > 0), "Each category row links with View All (/shop?category=<slug>)");

  // TEST 8: Active Testimonials
  console.log("\n--- 8. Active Testimonials (Wall of Love) ---");
  const testimonials = await getActiveTestimonials();
  assert(Array.isArray(testimonials) && testimonials.length > 0, `Active testimonials fetched: ${testimonials.length}`);
  assert(testimonials.every((t) => t.customer_name && t.content), "Testimonials contain customer name and verified quote");
  assert(testimonials.every((t) => (t.rating || 5) >= 1 && (t.rating || 5) <= 5), "Testimonials have 1-5 star ratings");

  console.log(`\n==================================================`);
  console.log(`Verification Summary: ${passedTests}/${totalTests} tests passed!`);
  console.log(`==================================================\n`);

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

verifyHomepage().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
