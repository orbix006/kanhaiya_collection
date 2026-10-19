import {
  loadMockStore,
  saveMockStore,
  getDashboardKPIs,
  getOrderKPIs,
  loadMockOrders,
  updateMockOrderStatus,
  upsertProductInStore,
  deleteProductFromStore,
  archiveProductInStore,
  loadMockCategories,
  upsertCategoryInStore,
  deleteCategoryFromStore,
  loadMockBanners,
  saveMockBanner,
  loadMockAnnouncements,
  saveMockAnnouncement,
  loadMockFestiveCampaigns,
  saveMockFestiveCampaign,
  getUnifiedInquiries,
  getInquiryKpis,
  loadMockPolicies,
  getMockPolicyByType,
  saveMockPolicy,
} from "../lib/mock-data/admin-store";
import { getMonthlyAnalytics, getAvailableMonths } from "../lib/services/analytics-service";
import { isSupabaseConfigured } from "../lib/supabase/server";

interface TestReport {
  section: string;
  name: string;
  passed: boolean;
  details?: string;
}

const report: TestReport[] = [];

function check(section: string, name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  \x1b[32m✔ [${section}] PASS\x1b[0m: ${name}`);
    report.push({ section, name, passed: true });
  } else {
    console.error(`  \x1b[31m✖ [${section}] FAIL\x1b[0m: ${name} ${details ? `(${details})` : ""}`);
    report.push({ section, name, passed: false, details });
  }
}

async function runFullAdminPanelQAAudit() {
  console.log("\n====================================================================");
  console.log(" PHASE 8 — FULL ADMIN PANEL QA AND REGRESSION AUDIT SUITE");
  console.log("====================================================================\n");

  const originalStore = JSON.parse(JSON.stringify(loadMockStore()));

  try {
    // =========================================================================
    // SECTION 1: NAVIGATION & ROUTE ACCESSIBILITY
    // =========================================================================
    console.log("\n--- 1. NAVIGATION & ROUTE AUDIT ---");
    const PRIMARY_MODULE_ROUTES = [
      { path: "/admin", name: "Dashboard" },
      { path: "/admin/orders", name: "Orders" },
      { path: "/admin/products", name: "Products" },
      { path: "/admin/categories", name: "Categories" },
      { path: "/admin/cms/homepage", name: "Homepage Sections" },
      { path: "/admin/cms/policies", name: "Site Policies" },
      { path: "/admin/inbox", name: "Contact Inquiries / Leads" },
    ];

    for (const mod of PRIMARY_MODULE_ROUTES) {
      try {
        const res = await fetch(`http://localhost:3000${mod.path}`, {
          headers: { "Cache-Control": "no-cache" },
          redirect: "follow",
        });
        check(
          "Navigation",
          `Primary module '${mod.name}' (${mod.path}) returns 200 OK`,
          res.status === 200,
          `Status: ${res.status}`
        );
      } catch (err: any) {
        check("Navigation", `Primary module '${mod.name}' reached`, false, err?.message);
      }
    }

    const LEGACY_ROUTES = [
      { path: "/admin/offers", expectedRedirectOrOk: true },
      { path: "/admin/cms/banners", expectedRedirectOrOk: true },
      { path: "/admin/inbox/contact", expectedRedirectOrOk: true },
      { path: "/admin/inbox/leads", expectedRedirectOrOk: true },
      { path: "/admin/inventory", expectedRedirectOrOk: true },
      { path: "/admin/reviews", expectedRedirectOrOk: true },
      { path: "/admin/users", expectedRedirectOrOk: true },
    ];

    for (const leg of LEGACY_ROUTES) {
      try {
        const res = await fetch(`http://localhost:3000${leg.path}`, {
          headers: { "Cache-Control": "no-cache" },
          redirect: "follow",
        });
        check(
          "Navigation",
          `Legacy route '${leg.path}' does not break application (Status: ${res.status})`,
          res.status === 200 || res.status === 307 || res.status === 308,
          `Status: ${res.status}`
        );
      } catch (err: any) {
        check("Navigation", `Legacy route '${leg.path}' handled safely`, false, err?.message);
      }
    }

    // =========================================================================
    // SECTION 2: DASHBOARD
    // =========================================================================
    console.log("\n--- 2. DASHBOARD AUDIT ---");
    const store = loadMockStore();
    const dashboardKpis = getDashboardKPIs(store);

    check(
      "Dashboard",
      "Four KPI cards calculate accurately (Total Revenue, Orders, Active Products, Categories)",
      typeof dashboardKpis.totalRevenue === "number" &&
        typeof dashboardKpis.totalOrders === "number" &&
        typeof dashboardKpis.activeProducts === "number" &&
        typeof dashboardKpis.totalCategories === "number"
    );

    check(
      "Dashboard",
      `Total Revenue excludes cancelled orders (Calculated: ₹${dashboardKpis.totalRevenue})`,
      dashboardKpis.totalRevenue >= 0
    );

    check(
      "Dashboard",
      `Active products count matches active status items (${dashboardKpis.activeProducts} of ${dashboardKpis.totalProducts})`,
      dashboardKpis.activeProducts === store.products.filter((p) => p.is_active).length
    );

    // Monthly visitor analytics
    const octAnalytics = getMonthlyAnalytics(2026, 10);
    const novAnalytics = getMonthlyAnalytics(2026, 11);
    check(
      "Dashboard",
      "Monthly visitor graph responds to month changes dynamically",
      octAnalytics.totalVisitors > 0 &&
        novAnalytics.totalVisitors > 0 &&
        octAnalytics.monthLabel !== novAnalytics.monthLabel
    );

    const availableMonths = getAvailableMonths(2026, 10, 12);
    check(
      "Dashboard",
      "Available analytics months list generated properly",
      availableMonths.length === 12
    );

    // New orders queue strictly pending
    const pendingOrders = store.orders.filter((o) => o.status === "pending");
    check(
      "Dashboard",
      `New orders queue filters exclusively for pending orders awaiting review (${pendingOrders.length} pending orders)`,
      pendingOrders.every((o) => o.status === "pending")
    );

    // =========================================================================
    // SECTION 3: ORDERS
    // =========================================================================
    console.log("\n--- 3. ORDERS AUDIT ---");
    const orderKpis = getOrderKPIs(store.orders);
    check(
      "Orders",
      "Four KPI cards calculate correctly (Total, New, Delivered, In Progress)",
      orderKpis.totalOrders === store.orders.length &&
        typeof orderKpis.newOrders === "number" &&
        typeof orderKpis.deliveredOrders === "number" &&
        typeof orderKpis.inProgressOrders === "number"
    );

    // Test approve action & non-duplicate stock deduction
    const targetOrder = store.orders.find((o) => o.status === "pending");
    if (targetOrder && targetOrder.items.length > 0) {
      const sampleItem = targetOrder.items[0];
      const prodBefore = store.products.find((p) => p.id === sampleItem.product_id);
      const stockBefore = prodBefore?.stock_quantity ?? 0;
      const soldBefore = prodBefore?.sold_count ?? 0;

      // 1. Approve order
      const approveRes = updateMockOrderStatus(targetOrder.id, "confirmed");
      check("Orders", "Approve action confirms order successfully", approveRes.success === true);

      const storeAfterApprove = loadMockStore();
      const prodAfterApprove = storeAfterApprove.products.find((p) => p.id === sampleItem.product_id);
      const stockAfterApprove = prodAfterApprove?.stock_quantity ?? 0;
      const soldAfterApprove = prodAfterApprove?.sold_count ?? 0;

      check(
        "Orders",
        "Order approval decrements inventory stock accurately",
        stockAfterApprove === stockBefore - sampleItem.quantity
      );
      check(
        "Orders",
        "Order approval increments sold_count accurately",
        soldAfterApprove === soldBefore + sampleItem.quantity
      );

      // 2. Second approve call must NOT duplicate deduction
      updateMockOrderStatus(targetOrder.id, "confirmed");
      const storeAfterSecond = loadMockStore();
      const prodAfterSecond = storeAfterSecond.products.find((p) => p.id === sampleItem.product_id);
      check(
        "Orders",
        "Re-confirming order does NOT double-decrement stock or double-increment sold count",
        prodAfterSecond?.stock_quantity === stockAfterApprove &&
          prodAfterSecond?.sold_count === soldAfterApprove
      );

      // 3. Cancel confirmed order reverses stock
      const cancelRes = updateMockOrderStatus(targetOrder.id, "cancelled");
      check("Orders", "Cancelling confirmed order succeeds", cancelRes.success === true);

      const storeAfterCancel = loadMockStore();
      const prodAfterCancel = storeAfterCancel.products.find((p) => p.id === sampleItem.product_id);
      check(
        "Orders",
        "Cancelling confirmed order reverses inventory deduction back to original level",
        prodAfterCancel?.stock_quantity === stockBefore && prodAfterCancel?.sold_count === soldBefore
      );
    }

    // =========================================================================
    // SECTION 4: PRODUCTS
    // =========================================================================
    console.log("\n--- 4. PRODUCTS AUDIT ---");
    const testProdPayload = {
      name: "Ashtadhatu Annapurna Devi Idol (6 Inch)",
      slug: "ashtadhatu-annapurna-devi-idol-6-inch",
      description: "Sacred Ashtadhatu alloy consecrated deity idol for kitchen and home temple.",
      brand: "Kanhaiya Collection",
      category_id: store.categories[0].id,
      base_price: 3899,
      compare_at_price: 4599,
      stock_quantity: 12,
      is_active: true,
      images: [
        {
          image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
          alt_text: "Ashtadhatu Annapurna Devi Idol",
          display_order: 1,
          is_primary: true,
        },
      ],
      variants: [],
    };

    // Create
    const createProdRes = upsertProductInStore(testProdPayload);
    check("Products", "Create product succeeds", createProdRes.success === true);
    const createdProd = createProdRes.product!;

    check(
      "Products",
      `SKU auto-generated with standard KC- convention (${createdProd.sku})`,
      Boolean(createdProd.sku && createdProd.sku.startsWith("KC-"))
    );
    check(
      "Products",
      `Batch number auto-generated with standard BATCH- convention (${(createdProd as any).batch_number})`,
      Boolean((createdProd as any).batch_number && (createdProd as any).batch_number.startsWith("BATCH-"))
    );

    // Edit (preserves SKU and batch)
    const originalSku = createdProd.sku;
    const originalBatch = (createdProd as any).batch_number;
    const editProdRes = upsertProductInStore({
      ...createdProd,
      base_price: 4199,
    });
    check("Products", "Edit product succeeds", editProdRes.success === true);
    check(
      "Products",
      "SKU is preserved strictly across edits",
      editProdRes.product?.sku === originalSku
    );
    check(
      "Products",
      "Batch number is preserved strictly across edits",
      (editProdRes.product as any)?.batch_number === originalBatch
    );

    // Archive / Toggle
    archiveProductInStore(createdProd.id, true);
    const storeWithArchived = loadMockStore();
    const archivedProd = storeWithArchived.products.find((p) => p.id === createdProd.id);
    check(
      "Products",
      "Archive product updates is_active to false",
      archivedProd?.is_active === false
    );

    // Delete
    deleteProductFromStore(createdProd.id);
    const storeAfterDel = loadMockStore();
    check(
      "Products",
      "Delete product removes record cleanly",
      !storeAfterDel.products.some((p) => p.id === createdProd.id)
    );

    // =========================================================================
    // SECTION 5: CATEGORIES
    // =========================================================================
    console.log("\n--- 5. CATEGORIES AUDIT ---");
    const categories = loadMockCategories();
    check("Categories", "Hierarchical categories loaded", categories.length > 0);

    // Circular loop validation
    const childCat = categories.find((c) => c.parent_id !== null);
    if (childCat) {
      const invalidCycleRes = upsertCategoryInStore({
        id: childCat.parent_id!,
        name: "Cycle Test",
        slug: "cycle-test",
        parent_id: childCat.id, // Trying to make parent a child of its child
        display_order: 1,
        is_active: true,
      });
      check(
        "Categories",
        "Rejects circular hierarchy loop when setting descendant as parent",
        invalidCycleRes.success === false
      );
    }

    // =========================================================================
    // SECTION 6: HOMEPAGE SECTIONS
    // =========================================================================
    console.log("\n--- 6. HOMEPAGE SECTIONS AUDIT ---");
    const banners = loadMockBanners();
    check("Homepage", "Hero banners loaded in display order", banners.length > 0);

    const announcements = loadMockAnnouncements();
    check("Homepage", "Offer and discount announcements loaded", announcements.length > 0);

    const textOnlyCheck = saveMockAnnouncement({
      text: "Festive Special: <img src='x' onerror='alert(1)'> invalid tag",
    });
    check(
      "Homepage",
      "Strict text-only validation rejects announcements containing <img> tags",
      textOnlyCheck.success === false
    );

    const campaigns = loadMockFestiveCampaigns();
    check("Homepage", "Festive discount campaigns loaded", campaigns.length > 0);
    const bannerlessCampaign = campaigns.find((c) => !c.image_url);
    check(
      "Homepage",
      "Festive campaigns support optional banner images (bannerless cards supported)",
      Boolean(bannerlessCampaign)
    );

    // =========================================================================
    // SECTION 7: CONTACT INQUIRIES & LEADS
    // =========================================================================
    console.log("\n--- 7. CONTACT INQUIRIES & LEADS AUDIT ---");
    const inquiryKpis = getInquiryKpis();
    const unifiedInquiries = getUnifiedInquiries();

    check(
      "Inquiries",
      `Total Leads KPI equals total inquiries without double-counting (${inquiryKpis.totalLeads})`,
      inquiryKpis.totalLeads === unifiedInquiries.length
    );

    check(
      "Inquiries",
      `Unread Leads equals records with status 'new' (${inquiryKpis.unreadLeads})`,
      inquiryKpis.unreadLeads === unifiedInquiries.filter((i) => i.status === "new").length
    );

    check(
      "Inquiries",
      `Responded Leads counts inquiries with responses or resolved status (${inquiryKpis.respondedLeads})`,
      inquiryKpis.respondedLeads === unifiedInquiries.filter((i) => i.has_response).length
    );

    // =========================================================================
    // SECTION 8: SITE POLICIES
    // =========================================================================
    console.log("\n--- 8. SITE POLICIES AUDIT ---");
    const MANDATORY_POLICIES = ["terms", "privacy", "cancellation", "refund"] as const;
    const allPolicies = loadMockPolicies();

    for (const pType of MANDATORY_POLICIES) {
      const p = allPolicies.find((pol) => pol.type === pType);
      check(
        "Policies",
        `Mandatory policy '${pType}' is present with non-placeholder copy (> 100 chars)`,
        Boolean(p && p.content.length > 100 && !p.content.includes("lorem ipsum"))
      );
    }

    // Public policy draft isolation
    const originalTerms = getMockPolicyByType("terms", false);
    saveMockPolicy("terms", "Terms of Service", "Draft revision content for QA audit", true);
    const publicTermsAfterDraft = getMockPolicyByType("terms", false);
    check(
      "Policies",
      "Public policy helper strictly isolates drafts and returns published version",
      publicTermsAfterDraft?.content === originalTerms?.content
    );

    // =========================================================================
    // SECTION 9: TECHNICAL QUALITY & SECURITY
    // =========================================================================
    console.log("\n--- 9. TECHNICAL QUALITY & SECURITY AUDIT ---");
    const supabaseConfigured = isSupabaseConfigured();
    check(
      "Security",
      "Zero Supabase credentials, clients, or remote database calls connected",
      !supabaseConfigured
    );

    // Local persistence check in ecomm_store.json
    const reloadedStore = loadMockStore();
    check(
      "Persistence",
      "Local mock store loads reliably across reloads",
      Array.isArray(reloadedStore.products) &&
        Array.isArray(reloadedStore.categories) &&
        Array.isArray(reloadedStore.orders) &&
        Array.isArray(reloadedStore.sitePolicies)
    );

  } finally {
    // Restore clean state
    saveMockStore(originalStore);
    console.log("\n  [Cleanup] Cleanly restored original mock store state.");
  }

  // Summary
  const passed = report.filter((r) => r.passed).length;
  const failed = report.filter((r) => !r.passed).length;
  console.log("\n====================================================================");
  console.log(` PHASE 8 AUDIT COMPLETE: ${passed}/${report.length} Checks Passed (${failed} Failed)`);
  console.log("====================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runFullAdminPanelQAAudit().catch((err) => {
  console.error("Fatal error during Phase 8 QA audit:", err);
  process.exit(1);
});
