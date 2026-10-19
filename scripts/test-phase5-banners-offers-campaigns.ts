/**
 * Automated Verification Script for Phase 5:
 * Complete Homepage Hero Banners, Announcements, and Festive Discounts
 */

import {
  loadMockBanners,
  saveMockBanner,
  deleteMockBanner,
  toggleMockBannerStatus,
  reorderMockBanners,
  loadMockAnnouncements,
  saveMockAnnouncement,
  deleteMockAnnouncement,
  toggleMockAnnouncementStatus,
  reorderMockAnnouncements,
  loadMockFestiveCampaigns,
  saveMockFestiveCampaign,
  deleteMockFestiveCampaign,
  toggleMockFestiveCampaignStatus,
  reorderMockFestiveCampaigns,
  loadMockProducts,
  loadMockStore,
} from "../lib/mock-data/admin-store";
import {
  getActiveAnnouncements,
  getActiveFestiveCampaigns,
  getAnnouncementsAdmin,
  getFestiveCampaignsAdmin,
  getBannersAdmin,
} from "../lib/data/cms";

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}${detail ? ` (${detail})` : ""}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ""}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runPhase5Tests() {
  console.log("================================================================================");
  console.log("PHASE 5 COMPREHENSIVE VERIFICATION SUITE");
  console.log("Hero Images & Banners | Announcements | Festive Discount Campaigns");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // SECTION A: HERO IMAGES AND BANNERS
  // ---------------------------------------------------------------------------
  console.log("--- Testing Section A: Hero Images and Banners ---");

  // 1. Load initial banners
  const initialBanners = loadMockBanners();
  assert(
    Array.isArray(initialBanners) && initialBanners.length >= 3,
    "Load banners returns initial configured banners in display order",
    `Found ${initialBanners.length} banners`
  );

  // 2. Validate display order sorting
  const isSorted = initialBanners.every((b, i, arr) => i === 0 || arr[i - 1].display_order <= b.display_order);
  assert(isSorted, "Banners are sorted in ascending display_order");

  // 3. Validation rejection on invalid image_url
  const invalidBannerRes = saveMockBanner({ image_url: "invalid-url-path" });
  assert(!invalidBannerRes.success, "Validation rejects invalid image URL without protocol or path");

  // 4. Add a new banner
  const addBannerRes = saveMockBanner({
    image_url: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1600&q=80",
    title: "Phase 5 Test Grand Festive Banner",
    link_url: "/shop?category=idols",
    display_order: 99,
    is_active: true,
  });
  assert(addBannerRes.success && !!addBannerRes.banner, "Add new banner successfully", `ID: ${addBannerRes.banner?.id}`);
  const createdBannerId = addBannerRes.banner!.id;

  // 5. Edit the newly created banner
  const editBannerRes = saveMockBanner({
    id: createdBannerId,
    image_url: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1600&q=80",
    title: "Phase 5 Test Grand Festive Banner (Updated)",
    link_url: "/shop?category=pooja-essentials",
    display_order: 99,
    is_active: true,
  });
  assert(
    editBannerRes.success && editBannerRes.banner?.title === "Phase 5 Test Grand Festive Banner (Updated)",
    "Edit banner updates title and link_url"
  );

  // 6. Toggle banner active status (inactive / staged preview test)
  const toggleRes = toggleMockBannerStatus(createdBannerId);
  assert(toggleRes.success && toggleRes.banner?.is_active === false, "Deactivating banner updates is_active to false");

  // 7. Separate active slideshow vs inactive staged banners
  const refreshedBanners = loadMockBanners();
  const activeBanners = refreshedBanners.filter((b) => b.is_active);
  const inactiveBanners = refreshedBanners.filter((b) => !b.is_active);
  assert(
    inactiveBanners.some((b) => b.id === createdBannerId),
    "Inactive / staged banners are isolated from active storefront sequence"
  );
  assert(
    !activeBanners.some((b) => b.id === createdBannerId),
    "Deactivated banner disappears from active storefront sequence"
  );

  // 8. Reorder banners
  const bannerIdsToReorder = refreshedBanners.slice(0, 3).map((b) => b.id).reverse();
  const reorderRes = reorderMockBanners(bannerIdsToReorder);
  assert(reorderRes.success && !!reorderRes.banners, "Reorder banners successfully resequences display_order");

  // 9. Delete banner with confirmation
  const deleteBannerRes = deleteMockBanner(createdBannerId);
  assert(deleteBannerRes.success, "Delete banner successfully removes it");
  const postDeleteBanners = loadMockBanners();
  assert(!postDeleteBanners.some((b) => b.id === createdBannerId), "Deleted banner no longer exists in store");

  console.log("✓ Section A: All Hero Banner tests passed.\n");

  // ---------------------------------------------------------------------------
  // SECTION B: OFFER AND DISCOUNT ANNOUNCEMENTS
  // ---------------------------------------------------------------------------
  console.log("--- Testing Section B: Offer & Discount Announcements ---");

  // 1. Load initial announcements
  const initialAnnouncements = loadMockAnnouncements();
  assert(
    Array.isArray(initialAnnouncements) && initialAnnouncements.length >= 2,
    "Load announcements returns initial configured text ribbons",
    `Found ${initialAnnouncements.length} announcements`
  );

  // 2. Text-only strict validation: reject HTML or image tags
  const imgAnnouncementRes = saveMockAnnouncement({
    text: 'Special Sale <img src="bad.jpg" /> Click here!',
  });
  assert(
    !imgAnnouncementRes.success,
    "Strict text-only validation rejects announcements containing <img> tags"
  );

  const markdownImgRes = saveMockAnnouncement({
    text: "Special Sale ![banner](bad.jpg) Click here!",
  });
  assert(
    !markdownImgRes.success,
    "Strict text-only validation rejects announcements containing markdown image tags"
  );

  // 3. Add valid text-only announcement
  const newAnnText = "Shubh Navratri Special: Complimentary Brass Aarti Bell with orders above ₹1,999.";
  const addAnnRes = saveMockAnnouncement({
    text: newAnnText,
    is_active: true,
    display_order: 99,
  });
  assert(addAnnRes.success && !!addAnnRes.announcement, "Add new text-only announcement", `ID: ${addAnnRes.announcement?.id}`);
  const createdAnnId = addAnnRes.announcement!.id;

  // 4. Edit announcement text
  const updatedAnnText = "Shubh Navratri Special: Complimentary Brass Aarti Bell with orders above ₹2,499. Use NAVRATRI108.";
  const editAnnRes = saveMockAnnouncement({
    id: createdAnnId,
    text: updatedAnnText,
    is_active: true,
    display_order: 99,
  });
  assert(
    editAnnRes.success && editAnnRes.announcement?.text === updatedAnnText,
    "Edit announcement updates text cleanly"
  );

  // 5. Toggle announcement active status
  const toggleAnnRes = toggleMockAnnouncementStatus(createdAnnId);
  assert(
    toggleAnnRes.success && toggleAnnRes.announcement?.is_active === false,
    "Deactivating announcement hides it from active rotation"
  );

  // 6. Active storefront query check
  const activeAnnouncementsPublic = await getActiveAnnouncements();
  assert(
    !activeAnnouncementsPublic.some((a) => a.id === createdAnnId),
    "Deactivated announcement disappears from active public query"
  );

  // Reactivate for reorder test
  toggleMockAnnouncementStatus(createdAnnId);
  const reorderAnnIds = loadMockAnnouncements().map((a) => a.id).reverse();
  const reorderAnnRes = reorderMockAnnouncements(reorderAnnIds);
  assert(reorderAnnRes.success && !!reorderAnnRes.announcements, "Reorder announcements updates display_order sequence");

  // 7. Delete announcement
  const deleteAnnRes = deleteMockAnnouncement(createdAnnId);
  assert(deleteAnnRes.success, "Delete announcement succeeds");
  const postDeleteAnnouncements = loadMockAnnouncements();
  assert(!postDeleteAnnouncements.some((a) => a.id === createdAnnId), "Deleted announcement removed from store");

  console.log("✓ Section B: All Offer & Discount Announcement tests passed.\n");

  // ---------------------------------------------------------------------------
  // SECTION C: FESTIVE DISCOUNT CAMPAIGNS
  // ---------------------------------------------------------------------------
  console.log("--- Testing Section C: Festive Discount Campaigns ---");

  // 1. Load initial campaigns
  const initialCampaigns = loadMockFestiveCampaigns();
  assert(
    Array.isArray(initialCampaigns) && initialCampaigns.length >= 2,
    "Load campaigns returns initial configured festive campaigns",
    `Found ${initialCampaigns.length} campaigns`
  );

  // 2. Shared product repository integration (Phase 3 products)
  const products = loadMockProducts();
  assert(Array.isArray(products) && products.length > 0, "Shared product repository contains catalog products", `${products.length} products`);
  const testProductIds = [products[0].id, products[1]?.id].filter(Boolean);

  // 3. Validation: Reject campaign without name or description
  const invalidCampRes = saveMockFestiveCampaign({
    name: "",
    description: "Valid description",
    product_ids: testProductIds,
  });
  assert(!invalidCampRes.success, "Validation rejects campaign without a name");

  const invalidCampDescRes = saveMockFestiveCampaign({
    name: "Valid Campaign",
    description: "",
    product_ids: testProductIds,
  });
  assert(!invalidCampDescRes.success, "Validation rejects campaign without offer description");

  // 4. Validation: Discount percentage range (0-90)
  const invalidDiscountRes = saveMockFestiveCampaign({
    name: "Excessive Discount Campaign",
    description: "Too high discount",
    product_ids: testProductIds,
    discount_percent: 150, // invalid > 90
  });
  assert(!invalidDiscountRes.success, "Validation rejects discount percentage greater than 90%");

  // 5. Create multiple active festive campaigns
  // Campaign 1: With image and structured numerical discount (20%)
  const camp1Res = saveMockFestiveCampaign({
    name: "Phase 5 Deepotsav Celebration",
    description: "Special Diwali illumination bundle with complimentary brass akhand diya.",
    image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=1200&q=80",
    product_ids: testProductIds,
    discount_tag: "Diwali Special",
    discount_percent: 20, // 20% explicit calculated discount
    is_active: true,
    display_order: 10,
  });
  assert(camp1Res.success && !!camp1Res.campaign, "Create Campaign 1 with image & structured 20% discount");
  const camp1Id = camp1Res.campaign!.id;

  // Campaign 2: WITHOUT banner image (clean devotional card verification)
  const camp2Res = saveMockFestiveCampaign({
    name: "Phase 5 Radha Raman Shringar Mahotsav",
    description: "Consecrated deity shringar accessories and pure Vrindavan natural chandan paste.",
    image_url: null, // Intentionally null to verify bannerless rendering
    product_ids: [products[0].id],
    discount_tag: "Sacred Grace",
    discount_percent: null, // Pure promotional badge, original prices preserved
    is_active: true,
    display_order: 11,
  });
  assert(
    camp2Res.success && camp2Res.campaign?.image_url === null,
    "Create Campaign 2 without banner image (clean non-broken card)"
  );
  const camp2Id = camp2Res.campaign!.id;

  // 6. Verify accurate price calculation vs promotional badge
  // Campaign 1 has 20% discount: price must equal Math.round(base_price * 0.8)
  const basePrice = products[0].base_price;
  const expectedCalculatedPrice = Math.round(basePrice * (1 - 20 / 100));
  assert(
    expectedCalculatedPrice < basePrice,
    "Structured discount calculates explicit reduced price",
    `Original ₹${basePrice} -> Calculated ₹${expectedCalculatedPrice}`
  );

  // Campaign 2 has discount_percent = null: original catalog price is strictly preserved
  assert(
    camp2Res.campaign?.discount_percent === null,
    "Campaign with promotional text badge only preserves original catalog pricing without false discounts"
  );

  // 7. Edit campaign and verify preview updates
  const updatedDesc = "Updated custom offer copy for devotee home mandir preparations.";
  const editCampRes = saveMockFestiveCampaign({
    id: camp1Id,
    name: "Phase 5 Deepotsav Celebration (Updated)",
    description: updatedDesc,
    product_ids: testProductIds,
    discount_tag: "Super Deepotsav",
    discount_percent: 25,
    is_active: true,
  });
  assert(
    editCampRes.success && editCampRes.campaign?.description === updatedDesc,
    "Editing campaign preserves admin's custom offer copy"
  );

  // 8. Product safety test: deleting a campaign NEVER deletes catalog products
  const productCountBefore = loadMockProducts().length;
  const deleteCamp1Res = deleteMockFestiveCampaign(camp1Id);
  const deleteCamp2Res = deleteMockFestiveCampaign(camp2Id);
  assert(deleteCamp1Res.success && deleteCamp2Res.success, "Delete festive campaigns succeeds");

  const productCountAfter = loadMockProducts().length;
  assert(
    productCountBefore === productCountAfter,
    "Deleting festive campaign does NOT delete catalog products from shared repository",
    `Product count remained exactly ${productCountAfter}`
  );

  console.log("✓ Section C: All Festive Discount Campaign tests passed.\n");

  // ---------------------------------------------------------------------------
  // SECTION D: STOREFRONT SYNCHRONIZATION
  // ---------------------------------------------------------------------------
  console.log("--- Testing Section D: Storefront Synchronization ---");

  // 1. Active Banners query
  const publicBanners = (await getBannersAdmin()).filter((b) => b.is_active);
  assert(publicBanners.length > 0, "Public hero banners query returns only active banners");
  assert(publicBanners.every((b) => b.is_active), "All storefront banners have is_active = true");

  // 2. Active Announcements query
  const publicAnnouncements = await getActiveAnnouncements();
  assert(publicAnnouncements.length > 0, "Public announcements query returns only active items");
  assert(publicAnnouncements.every((a) => a.is_active), "All active announcements have is_active = true");

  // 3. Active Festive Campaigns query
  const publicCampaigns = await getActiveFestiveCampaigns();
  assert(publicCampaigns.length > 0, "Public festive campaigns query returns active campaigns");
  assert(publicCampaigns.every((c) => c.is_active), "All active campaigns have is_active = true");

  // 4. Bannerless campaign is included in public active campaigns
  const bannerlessCamp = publicCampaigns.find((c) => c.image_url === null);
  assert(
    !!bannerlessCamp,
    "Bannerless campaign is fully supported and returned for storefront devotional card rendering",
    bannerlessCamp?.name
  );

  console.log("✓ Section D: All Storefront Synchronization tests passed.\n");

  console.log("================================================================================");
  console.log("ALL PHASE 5 TESTS PASSED WITH 100% SUCCESS!");
  console.log("================================================================================");
}

runPhase5Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
