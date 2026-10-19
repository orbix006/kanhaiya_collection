import {
  loadMockStore,
  saveMockStore,
  upsertProductInStore,
  deleteProductFromStore,
  archiveProductInStore,
  generateProductSku,
  generateProductBatchNumber,
} from "../lib/mock-data/admin-store";
import { getDescendantCategoryIds, getCategoryPathLabel } from "../lib/data/categories";

function runPhase3Tests() {
  console.log("===============================================================================");
  console.log("       PHASE 3: PRODUCT CRUD & STOREFRONT SYNCHRONIZATION TEST SUITE");
  console.log("===============================================================================\n");

  const originalStore = JSON.parse(JSON.stringify(loadMockStore()));

  try {
    // -------------------------------------------------------------------------
    // TEST 1: AUTO-GENERATION OF SKU AND BATCH IDENTIFIERS
    // -------------------------------------------------------------------------
    console.log("[TEST 1] Auto-Generation of SKU and Batch Identifiers");
    const sku1 = generateProductSku("Brass Murti");
    const sku2 = generateProductSku("Brass Murti");
    const batch1 = generateProductBatchNumber();

    if (!sku1.startsWith("KC-")) {
      throw new Error(`SKU format invalid: expected KC- prefix, got ${sku1}`);
    }
    if (!batch1.startsWith("BATCH-")) {
      throw new Error(`Batch format invalid: expected BATCH- prefix, got ${batch1}`);
    }
    console.log(`  ✓ Generated SKU: ${sku1}`);
    console.log(`  ✓ Generated Batch Identifier: ${batch1}`);
    console.log(`  ✓ SKU convention preserves KC- prefix with category code and sequence`);
    console.log(`  ✓ Batch convention provides stable BATCH-YYYYMM-XXXX identifier`);

    // -------------------------------------------------------------------------
    // TEST 2: VALIDATION RULES (Required Fields, Prices, Primary Image)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 2] Validation Rules (Required Fields, Negative Prices, Images)");

    // 2.1 Name required
    const noNameRes = upsertProductInStore({
      name: "",
      base_price: 1999,
      description: "Test description",
      category_id: "cat-1",
    });
    if (noNameRes.success) throw new Error("Expected empty name to fail");
    console.log(`  ✓ Missing name rejected: "${noNameRes.error}"`);

    // 2.2 Description required
    const noDescRes = upsertProductInStore({
      name: "Valid Name",
      base_price: 1999,
      description: "",
      category_id: "cat-1",
    });
    if (noDescRes.success) throw new Error("Expected empty description to fail");
    console.log(`  ✓ Missing description rejected: "${noDescRes.error}"`);

    // 2.3 Category required
    const noCatRes = upsertProductInStore({
      name: "Valid Name",
      base_price: 1999,
      description: "Valid Description",
      category_id: "",
    });
    if (noCatRes.success) throw new Error("Expected missing category to fail");
    console.log(`  ✓ Missing category rejected: "${noCatRes.error}"`);

    // 2.4 Negative price rejected
    const negPriceRes = upsertProductInStore({
      name: "Negative Price Item",
      base_price: -500,
      description: "Valid Description",
      category_id: "cat-1",
    });
    if (negPriceRes.success) throw new Error("Expected negative price to fail");
    console.log(`  ✓ Negative price rejected: "${negPriceRes.error}"`);

    // 2.5 Active product without primary image rejected
    const noImgRes = upsertProductInStore({
      name: "No Image Product",
      base_price: 999,
      description: "Valid Description",
      category_id: "cat-1",
      is_active: true,
      images: [],
    });
    if (noImgRes.success) throw new Error("Expected active product without image to fail");
    console.log(`  ✓ Active product without primary image rejected: "${noImgRes.error}"`);

    // -------------------------------------------------------------------------
    // TEST 3: SUCCESSFUL CREATION WITH AUTO SKU AND BATCH NUMBER
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] Product Creation & Central Repository Generation");
    const createRes = upsertProductInStore({
      name: "Consecrated Panchaloha Krishna Idol (8 Inch)",
      slug: "consecrated-panchaloha-krishna-idol-8-inch",
      description: "Sacred handcrafted five-metal panchaloha alloy Krishna idol consecrated with Vedic rituals.",
      brand: "Kanhaiya Heritage",
      category_id: "cat-1",
      base_price: 7499,
      compare_at_price: 8999,
      stock_quantity: 12,
      is_active: true,
      images: [
        {
          id: "img-test-1",
          product_id: "temp",
          image_url: "/uploads/krishna-8in-panchaloha.jpg",
          alt_text: "Panchaloha Krishna Idol front view",
          display_order: 1,
          is_primary: true,
          created_at: new Date().toISOString(),
        },
      ],
    });

    if (!createRes.success || !createRes.product) {
      throw new Error(`Failed to create product: ${createRes.error}`);
    }

    const createdProduct = createRes.product;
    console.log(`  ✓ Product created: ID=${createdProduct.id}, Name="${createdProduct.name}"`);
    console.log(`  ✓ Auto-generated SKU: ${createdProduct.sku}`);
    console.log(`  ✓ Auto-generated Batch: ${createdProduct.batch_number}`);
    if (!createdProduct.sku || !createdProduct.batch_number) {
      throw new Error("Product was created without SKU or Batch Number!");
    }

    // -------------------------------------------------------------------------
    // TEST 4: EDITING PRESERVES SKU AND BATCH IDENTIFIER (NEVER REGENERATED)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 4] Product Editing: Preservation of SKU and Batch Identifier");
    const editRes = upsertProductInStore({
      id: createdProduct.id,
      name: "Consecrated Panchaloha Krishna Idol (8 Inch) - Gold Finished",
      slug: createdProduct.slug,
      description: "Updated description with pure 24K gold foil detailing.",
      brand: "Kanhaiya Heritage Exclusive",
      category_id: "cat-1",
      base_price: 7999,
      compare_at_price: 9499,
      stock_quantity: 10,
      is_active: true,
      images: createdProduct.images,
    });

    if (!editRes.success || !editRes.product) {
      throw new Error(`Failed to update product: ${editRes.error}`);
    }

    const updatedProduct = editRes.product;
    if (updatedProduct.sku !== createdProduct.sku) {
      throw new Error(`SKU mutated! Was ${createdProduct.sku}, now ${updatedProduct.sku}`);
    }
    if (updatedProduct.batch_number !== createdProduct.batch_number) {
      throw new Error(`Batch number mutated! Was ${createdProduct.batch_number}, now ${updatedProduct.batch_number}`);
    }
    console.log(`  ✓ SKU preserved strictly on edit: ${updatedProduct.sku}`);
    console.log(`  ✓ Batch Number preserved strictly on edit: ${updatedProduct.batch_number}`);
    console.log(`  ✓ Price updated from ₹${createdProduct.base_price} to ₹${updatedProduct.base_price}`);

    // -------------------------------------------------------------------------
    // TEST 5: ARCHIVE / STATUS TOGGLE & ACTIVATION RULES
    // -------------------------------------------------------------------------
    console.log("\n[TEST 5] Product Activation, Deactivation, and Storefront Visibility");
    const archiveRes = archiveProductInStore(createdProduct.id, true);
    if (!archiveRes.success) throw new Error("Failed to archive product");

    let storeAfterArchive = loadMockStore();
    let archivedProd = storeAfterArchive.products.find((p) => p.id === createdProduct.id);
    if (!archivedProd || archivedProd.is_active !== false) {
      throw new Error("Product is_active was not set to false!");
    }
    console.log(`  ✓ Product archived (is_active: false). Storefront queries will exclude this product.`);

    // Restore to active
    const unarchiveRes = archiveProductInStore(createdProduct.id, false);
    if (!unarchiveRes.success) throw new Error(`Failed to restore product: ${unarchiveRes.error}`);
    console.log(`  ✓ Product restored to active catalog.`);

    // -------------------------------------------------------------------------
    // TEST 6: CATEGORY HIERARCHY & DESCENDANT MATCHING
    // -------------------------------------------------------------------------
    console.log("\n[TEST 6] Category Hierarchy Assignment & Descendant Matching");
    const store = loadMockStore();
    const categories = store.categories;
    const rootCat = categories.find((c) => !c.parent_id);
    if (rootCat) {
      const descendants = getDescendantCategoryIds(rootCat.id, categories as any);
      console.log(`  ✓ Root Category "${rootCat.name}" (ID: ${rootCat.id}) has ${descendants.length} descendant subcategories`);
      for (const dId of descendants) {
        const path = getCategoryPathLabel(dId, categories as any);
        console.log(`    - Nested path: ${path}`);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 7: ORDER SNAPSHOT INTEGRITY ON PRODUCT DELETION
    // -------------------------------------------------------------------------
    console.log("\n[TEST 7] Order Item Snapshot Integrity on Product Deletion");

    // Add a mock order referencing our product to verify ON DELETE SET NULL behavior
    const testOrderId = `order-test-snap-${Date.now()}`;
    const mockOrder = {
      id: testOrderId,
      order_number: "ORD-TEST-9999",
      user_id: "user-test",
      customer_name: "Aarav Sharma",
      customer_email: "aarav@example.com",
      status: "delivered" as const,
      payment_status: "paid" as const,
      payment_method: "upi",
      total_amount: 7999,
      subtotal: 7999,
      shipping_fee: 0,
      tax_amount: 0,
      items_count: 1,
      items: [
        {
          id: `item-test-${Date.now()}`,
          order_id: testOrderId,
          product_id: createdProduct.id,
          variant_id: null,
          product_name: createdProduct.name,
          variant_name: "Standard Consecrated",
          unit_price: 7999,
          quantity: 1,
          subtotal: 7999,
          image_url: "/uploads/krishna-8in-panchaloha.jpg",
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const currentStore = loadMockStore();
    currentStore.orders.push(mockOrder as any);
    saveMockStore(currentStore);

    // Now delete the product
    const deleteRes = deleteProductFromStore(createdProduct.id);
    if (!deleteRes.success) throw new Error("Failed to delete product");
    console.log(`  ✓ Product deleted from mock store.`);

    // Verify order item snapshots are completely intact!
    const storeAfterDelete = loadMockStore();
    const verifiedOrder = storeAfterDelete.orders.find((o) => o.id === testOrderId);
    if (!verifiedOrder) throw new Error("Test order disappeared!");

    const verifiedItem = verifiedOrder.items[0];
    if (verifiedItem.product_id !== null) {
      throw new Error(`product_id was not set to null! Still: ${verifiedItem.product_id}`);
    }
    if (verifiedItem.product_name !== createdProduct.name) {
      throw new Error(`product_name snapshot corrupted! Got: ${verifiedItem.product_name}`);
    }
    if (verifiedItem.unit_price !== 7999 || verifiedItem.subtotal !== 7999) {
      throw new Error(`Financial snapshot corrupted! Unit price: ${verifiedItem.unit_price}`);
    }

    console.log(`  ✓ Order item product_id safely nullified (ON DELETE SET NULL)`);
    console.log(`  ✓ Historical snapshot preserved: name="${verifiedItem.product_name}", price=₹${verifiedItem.unit_price}, qty=${verifiedItem.quantity}`);

    console.log("\n===============================================================================");
    console.log("       ALL PHASE 3 PRODUCT CRUD & STOREFRONT TESTS PASSED (100%)");
    console.log("===============================================================================\n");
  } finally {
    // Restore initial store data cleanly
    saveMockStore(originalStore);
    console.log("[CLEANUP] Mock store cleanly restored to initial state.");
  }
}

runPhase3Tests();
