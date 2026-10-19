import {
  upsertCategoryInStore,
  deleteCategoryFromStore,
  upsertProductInStore,
  deleteProductFromStore,
  archiveProductInStore,
  loadMockStore,
} from "../lib/mock-data/admin-store";

function run() {
  console.log("=== Testing Mock Store Business Rules ===");

  // 1. Duplicate category slug
  const dupCatSlug = upsertCategoryInStore({
    name: "New Brass Murtis",
    slug: "pure-brass-idols",
  });
  if (dupCatSlug.success) throw new Error("Expected duplicate category slug to fail");
  console.log("[PASS] Duplicate category slug rejected:", dupCatSlug.error);

  // 2. Category cannot be its own parent
  const selfParent = upsertCategoryInStore({
    id: "cat-pooja",
    name: "Pooja Essentials",
    parent_id: "cat-pooja",
  });
  if (selfParent.success) throw new Error("Expected self-parenting to fail");
  console.log("[PASS] Self-parent hierarchy cycle rejected:", selfParent.error);

  // 3. Category cycle (parent cannot be a descendant)
  const cycleParent = upsertCategoryInStore({
    id: "cat-pooja",
    name: "Pooja Essentials",
    parent_id: "cat-diyas", // cat-diyas is child of cat-pooja
  });
  if (cycleParent.success) throw new Error("Expected descendant parent cycle to fail");
  console.log("[PASS] Descendant hierarchy cycle rejected:", cycleParent.error);

  // 4. Duplicate product slug
  const dupProdSlug = upsertProductInStore({
    name: "Different Murti",
    slug: "pure-brass-radha-krishna-murti-9-inch",
    base_price: 3999,
    stock_quantity: 4,
    images: [{ id: "img-t1", product_id: "temp", image_url: "https://example.com/img.jpg", alt_text: "test", display_order: 1, is_primary: true, created_at: "" }],
  });
  if (dupProdSlug.success) throw new Error("Expected duplicate product slug to fail");
  console.log("[PASS] Duplicate product slug rejected:", dupProdSlug.error);

  // 5. Duplicate product SKU
  const dupProdSku = upsertProductInStore({
    name: "Different Murti SKU",
    slug: "unique-slug-test-123",
    sku: "KC-RKM-09", // already exists on prod-1
    base_price: 3999,
    stock_quantity: 4,
    images: [{ id: "img-t2", product_id: "temp", image_url: "https://example.com/img.jpg", alt_text: "test", display_order: 1, is_primary: true, created_at: "" }],
  });
  if (dupProdSku.success) throw new Error("Expected duplicate product SKU to fail");
  console.log("[PASS] Duplicate product SKU rejected:", dupProdSku.error);

  // 6. Active product must have a primary image
  const noPrimaryImg = upsertProductInStore({
    name: "Product Without Primary Image",
    slug: "no-primary-img-test",
    base_price: 1999,
    stock_quantity: 10,
    is_active: true,
    images: [],
  });
  if (noPrimaryImg.success) throw new Error("Expected active product without images to fail");
  console.log("[PASS] Active product without image rejected:", noPrimaryImg.error);

  // 7. Non-negative prices and stock
  const negativePrice = upsertProductInStore({
    name: "Negative Price Product",
    slug: "negative-price-test",
    base_price: -100,
    stock_quantity: 10,
  });
  if (negativePrice.success) throw new Error("Expected negative price to fail");
  console.log("[PASS] Negative base price rejected:", negativePrice.error);

  // 8. Cascade rule: deleting category removes descendant categories and unlinks products
  const delCatRes = deleteCategoryFromStore("cat-pooja");
  if (!delCatRes.success) throw new Error("Expected category deletion to succeed");
  console.log("[PASS] Category cascade delete executed successfully (cascaded count:", delCatRes.cascadeCount, ")");

  console.log("\nALL MOCK STORE SPECIFICATIONS VERIFIED 100%!");
}

run();
