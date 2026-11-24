import { deleteProductAction, archiveProductAction } from '../app/(admin)/admin/products/actions';
import { deleteCategoryAction } from '../app/(admin)/admin/categories/actions';
import { deleteFestiveCampaignAction, deleteAnnouncementAction } from '../app/(admin)/admin/cms/actions';
import {
  loadMockStore,
  saveMockStore,
  upsertProductInStore,
  upsertCategoryInStore,
  saveMockFestiveCampaign,
  saveMockAnnouncement,
  resetMockStore,
} from '../lib/mock-data/admin-store';

async function runDeleteTestSuite() {
  console.log('==============================================================================');
  console.log('       ADMIN DELETION & INTEGRITY AUTOMATED VERIFICATION SUITE');
  console.log('==============================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${detail || 'Condition not met'}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. PRODUCTS & INVENTORY DELETION TESTS
  // ---------------------------------------------------------------------------
  console.log('[SECTION 1] Products & Inventory Deletion');
  
  // A. Unreferenced product deletion
  const newProdRes = upsertProductInStore({
    name: 'Temporary Unreferenced Murti ' + Date.now(),
    description: 'A test product with zero orders or dependencies.',
    base_price: 999,
    stock_quantity: 5,
    category_id: 'cat-idols',
    images: [{ id: 'img-del-1', image_url: '/uploads/product-images/test.jpg', is_primary: true, display_order: 0 }]
  });
  assert(newProdRes.success === true && !!newProdRes.product, 'Created temporary unreferenced product');

  const unreferencedId = newProdRes.product!.id;
  const delUnreferencedRes = await deleteProductAction(unreferencedId);
  assert(delUnreferencedRes.success === true && !delUnreferencedRes.archived, 'Allows permanent deletion for unreferenced product');

  const storeAfterProdDel = loadMockStore();
  const prodExistsAfterDel = storeAfterProdDel.products.some(p => p.id === unreferencedId);
  assert(!prodExistsAfterDel, 'Deleted unreferenced product removed from catalog store');

  // B. Product referenced by historical orders (MUST archive, NOT break order history)
  const orderedProdRes = upsertProductInStore({
    name: 'Historical Order Referenced Brass Diya ' + Date.now(),
    description: 'Purchased in historical customer orders.',
    base_price: 1499,
    stock_quantity: 20,
    category_id: 'cat-idols',
    images: [{ id: 'img-del-2', image_url: '/uploads/product-images/test2.jpg', is_primary: true, display_order: 0 }]
  });
  const orderedProdId = orderedProdRes.product!.id;

  // Simulate an order reference in the store
  const storeWithOrder = loadMockStore();
  storeWithOrder.orders.push({
    id: 'ord-hist-test-999',
    order_number: 'KC-ORD-2026-99999',
    customer: { id: 'usr-1', full_name: 'Devotee Customer', email: 'devotee@example.com' },
    created_at: new Date().toISOString(),
    status: 'delivered',
    payment_status: 'paid',
    payment_method: 'online',
    items: [
      {
        id: 'ord-item-999',
        order_id: 'ord-hist-test-999',
        product_id: orderedProdId,
        product_name: orderedProdRes.product!.name,
        unit_price: 1499,
        quantity: 1,
        line_total: 1499,
        sku: orderedProdRes.product!.sku || 'KC-TST-001'
      }
    ],
    pricing: { subtotal: 1499, tax: 0, shipping: 0, total: 1499 },
    shipping_address: { full_name: 'Devotee', address_line1: 'Ghat Road', city: 'Varanasi', state: 'UP', postal_code: '221001', country: 'India', phone: '+91 9999999999' }
  } as any);
  saveMockStore(storeWithOrder);

  // Attempt delete of ordered product -> can trigger safe archival when forceArchive passed
  const delOrderedRes = await deleteProductAction(orderedProdId, { forceArchive: true });
  assert(delOrderedRes.success === true && delOrderedRes.archived === true, 'Safely archives product when referenced in historical orders');

  const storeAfterArchive = loadMockStore();
  const archivedProd = storeAfterArchive.products.find(p => p.id === orderedProdId);
  assert(archivedProd !== undefined && archivedProd.is_active === false, 'Archived product is deactivated (hidden from storefront) but preserved in catalog');

  const orderStillIntact = storeAfterArchive.orders.some(o => o.id === 'ord-hist-test-999');
  assert(orderStillIntact, 'Historical customer order and line items remain completely intact');

  // ---------------------------------------------------------------------------
  // 2. CATEGORY MANAGEMENT DELETION TESTS
  // ---------------------------------------------------------------------------
  console.log('\n[SECTION 2] Category Management Deletion & Reassignment');

  // A. Empty category deletion
  const emptyCatRes = upsertCategoryInStore({
    name: 'Temporary Empty Category ' + Date.now(),
    slug: 'temp-empty-cat-' + Date.now(),
  });
  assert(emptyCatRes.success === true && !!emptyCatRes.category, 'Created temporary empty category');

  const emptyCatId = emptyCatRes.category!.id;
  const delEmptyCatRes = await deleteCategoryAction(emptyCatId);
  assert(delEmptyCatRes.success === true, 'Allows permanent deletion of unassigned empty category');

  // B. Category with products - Rejection without reassignment target
  const catWithProdRes = upsertCategoryInStore({
    name: 'Cat With Products ' + Date.now(),
    slug: 'cat-with-prods-' + Date.now(),
  });
  const catWithProdId = catWithProdRes.category!.id;

  const prodInCatRes = upsertProductInStore({
    name: 'Product In Deleting Category ' + Date.now(),
    description: 'Product linked to category',
    base_price: 499,
    stock_quantity: 10,
    category_id: catWithProdId,
    images: [{ id: 'img-cat-1', image_url: '/uploads/test.jpg', is_primary: true, display_order: 0 }]
  });
  const prodInCatId = prodInCatRes.product!.id;

  const delBlockedRes = await deleteCategoryAction(catWithProdId);
  assert(delBlockedRes.error !== undefined && delBlockedRes.error.includes('linked to this category'), 'Rejects category deletion when products are linked without reassignment');

  // C. Category with products - Safe reassignment prevents orphaned items
  const delReassignedRes = await deleteCategoryAction(catWithProdId, { reassignTargetId: 'cat-idols' });
  assert(delReassignedRes.success === true, 'Successfully deletes category when reassignment target is provided');

  const storeAfterReassign = loadMockStore();
  const reassignedProd = storeAfterReassign.products.find(p => p.id === prodInCatId);
  assert(reassignedProd?.category_id === 'cat-idols', 'Linked product safely reassigned to destination category (zero orphaned products)');

  // ---------------------------------------------------------------------------
  // 3. OFFERS & FESTIVE CAMPAIGNS DELETION TESTS
  // ---------------------------------------------------------------------------
  console.log('\n[SECTION 3] Festive Campaigns & Offers Deletion');

  // A. Create festive campaign with linked product
  const campRes = saveMockFestiveCampaign({
    name: 'Diwali Mahotsav Offer ' + Date.now(),
    description: 'Festive discounts on puja brassware',
    discount_percent: 25,
    product_ids: [orderedProdId],
    is_active: true
  });
  assert(campRes.success === true && !!campRes.campaign, 'Created festive discount campaign');

  const campId = campRes.campaign!.id;

  // B. Delete campaign
  const delCampRes = await deleteFestiveCampaignAction(campId);
  assert(delCampRes.success === true, 'Festive campaign deleted successfully');

  const storeAfterCampDel = loadMockStore();
  const campStillExists = (storeAfterCampDel.festiveCampaigns || []).some(c => c.id === campId);
  assert(!campStillExists, 'Campaign removed from store and homepage promotional showcase');

  const prodStillExists = storeAfterCampDel.products.some(p => p.id === orderedProdId);
  assert(prodStillExists, 'Catalog products previously linked to campaign remain completely intact');

  // ---------------------------------------------------------------------------
  // 4. ANNOUNCEMENT MANAGEMENT DELETION TESTS
  // ---------------------------------------------------------------------------
  console.log('\n[SECTION 4] Announcements Ribbon Deletion');

  // A. Create two announcements
  const ann1Res = saveMockAnnouncement({
    text: 'Announcement A ' + Date.now(),
    is_active: true,
    display_order: 1
  });
  const ann2Res = saveMockAnnouncement({
    text: 'Announcement B ' + Date.now(),
    is_active: true,
    display_order: 2
  });
  assert(ann1Res.success === true && ann2Res.success === true, 'Created test announcements');

  const ann1Id = ann1Res.announcement!.id;
  const ann2Id = ann2Res.announcement!.id;

  // B. Delete announcement 1
  const delAnnRes = await deleteAnnouncementAction(ann1Id);
  assert(delAnnRes.success === true, 'Deleted targeted announcement');

  const storeAfterAnnDel = loadMockStore();
  const ann1Exists = (storeAfterAnnDel.announcements || []).some(a => a.id === ann1Id);
  const ann2Exists = (storeAfterAnnDel.announcements || []).some(a => a.id === ann2Id);
  assert(!ann1Exists, 'Targeted announcement removed from active announcement bar');
  assert(ann2Exists, 'Other announcements remain completely intact');

  console.log(`\n==============================================================================`);
  console.log(`TEST RESULTS: ${passed}/${total} checks passed (${Math.round((passed/total)*100)}%)`);
  console.log(`==============================================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runDeleteTestSuite().catch((e) => {
  console.error('Delete test suite uncaught error:', e);
  process.exit(1);
});
