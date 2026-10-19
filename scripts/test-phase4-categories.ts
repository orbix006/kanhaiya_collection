import {
  loadMockStore,
  saveMockStore,
  getInitialMockStore,
  upsertCategoryInStore,
  deleteCategoryFromStore,
  moveCategoryInStore,
  swapCategoryOrderInStore,
  changeCategoryHierarchyLevelInStore,
  reorderCategoriesInStore,
  loadMockCategories,
  loadMockProducts,
  upsertProductInStore,
  MockCategory,
} from "../lib/mock-data/admin-store";
import {
  buildCategoryTree,
  getDescendantCategoryIds,
  isSafeParent,
  getCategoryPathLabel,
  generateSlug,
} from "../lib/data/categories";
import { getAllActiveCategories, getHomepageCategories } from "../lib/data/homepage";
import { getActiveCategories } from "../lib/store";

function assert(condition: any, msg: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${msg}`);
  }
}

async function runPhase4Tests() {
  console.log("=================================================");
  console.log("   PHASE 4: CATEGORY MANAGEMENT AUDIT SUITE      ");
  console.log("=================================================");

  // Reset to clean seed state for reproducible test run
  const cleanStore = getInitialMockStore();
  saveMockStore(cleanStore);

  console.log("\n[TEST 1] Validation & Schema Rules");
  // 1.1 Category name required
  const emptyName = upsertCategoryInStore({ name: "" });
  assert(!emptyName.success, "Empty name should be rejected");
  console.log("  ✓ Name validation passed:", emptyName.error);

  // 1.2 Duplicate slug rejected (case-insensitive)
  const dupSlug = upsertCategoryInStore({
    name: "Duplicate Idols",
    slug: "pure-brass-idols", // exists in seed
  });
  assert(!dupSlug.success, "Duplicate slug should be rejected");
  console.log("  ✓ Duplicate slug rejected:", dupSlug.error);

  // 1.3 Self-parenting rejected
  const selfParent = upsertCategoryInStore({
    id: "cat-brass-idols",
    name: "Pure Brass Idols",
    parent_id: "cat-brass-idols",
  });
  assert(!selfParent.success, "Self-parenting should be rejected");
  console.log("  ✓ Self-parenting rejected:", selfParent.error);

  // 1.4 Descendant parent cycle rejected
  // cat-radha-krishna is descendant of cat-brass-idols
  const cycleParent = upsertCategoryInStore({
    id: "cat-brass-idols",
    name: "Pure Brass Idols",
    parent_id: "cat-radha-krishna",
  });
  assert(!cycleParent.success, "Descendant parent cycle should be rejected");
  console.log("  ✓ Descendant cycle rejected:", cycleParent.error);

  console.log("\n[TEST 2] Category CRUD Operations");
  // 2.1 Create Root Category
  const createRoot = upsertCategoryInStore({
    name: "Vedic Yantras & Sacred Geometry",
    slug: "vedic-yantras",
    description: "Energized copper and gold-polished geometric yantras for spiritual alignment.",
    image_url: "https://images.unsplash.com/photo-yantra.jpg",
    display_order: 10,
    is_active: true,
    show_on_homepage: true,
  });
  assert(createRoot.success && createRoot.category?.id !== undefined, "Root category creation failed");
  const yantraRootId = createRoot.category!.id;
  console.log("  ✓ Created Root category:", createRoot.category!.name, `(ID: ${yantraRootId})`);

  // 2.2 Create Subcategory under Root (Level 2)
  const createSub = upsertCategoryInStore({
    parent_id: yantraRootId,
    name: "Shree Yantra",
    slug: "shree-yantra",
    description: "Sacred Maha Meru Shree Yantras crafted in heavy brass and copper.",
    display_order: 1,
    is_active: true,
    show_on_homepage: true,
  });
  assert(createSub.success && createSub.category?.parent_id === yantraRootId, "Subcategory creation failed");
  const shreeSubId = createSub.category!.id;
  console.log("  ✓ Created Subcategory (L2):", createSub.category!.name, `(Parent: ${yantraRootId})`);

  // 2.3 Create Nested Sub-subcategory (Level 3)
  const createDeepSub = upsertCategoryInStore({
    parent_id: shreeSubId,
    name: "3D Maha Meru Shree Yantra",
    slug: "maha-meru-shree-yantra",
    description: "Three-dimensional pyramidal Shree Yantras for mandir altars.",
    display_order: 1,
    is_active: true,
    show_on_homepage: false,
  });
  assert(createDeepSub.success && createDeepSub.category?.parent_id === shreeSubId, "Deep subcategory creation failed");
  const deepSubId = createDeepSub.category!.id;
  console.log("  ✓ Created Deep Subcategory (L3):", createDeepSub.category!.name, `(Parent: ${shreeSubId})`);

  // 2.4 Verify Hierarchy Path Label
  const storeAfterAdd = loadMockStore();
  const pathLabel = getCategoryPathLabel(deepSubId, storeAfterAdd.categories);
  assert(
    pathLabel === "Vedic Yantras & Sacred Geometry > Shree Yantra > 3D Maha Meru Shree Yantra",
    `Incorrect path label: ${pathLabel}`
  );
  console.log("  ✓ Hierarchy Path verified:", pathLabel);

  // 2.5 Edit Category
  const editRes = upsertCategoryInStore({
    id: deepSubId,
    name: "3D Maha Meru Shree Yantra (Panchdhatu)",
    slug: "maha-meru-shree-yantra-panchdhatu",
    description: "Consecrated five-metal alloy Maha Meru Yantras.",
    is_active: true,
    show_on_homepage: true,
  });
  assert(editRes.success && editRes.category?.name.includes("Panchdhatu"), "Category update failed");
  console.log("  ✓ Category edited successfully:", editRes.category!.name);

  // 2.6 Toggle Active Status (Deactivate)
  const deactivateRes = upsertCategoryInStore({
    id: deepSubId,
    name: editRes.category!.name,
    is_active: false,
  });
  assert(deactivateRes.success && deactivateRes.category?.is_active === false, "Deactivation failed");
  console.log("  ✓ Category deactivated (is_active: false)");

  // Verify deactivated category is hidden from storefront active categories
  const activeCats = await getAllActiveCategories();
  assert(
    !activeCats.some((c) => c.id === deepSubId),
    "Deactivated category must NOT appear in public getAllActiveCategories"
  );
  console.log("  ✓ Inactive category hidden from public navigation");

  // Reactivate
  upsertCategoryInStore({
    id: deepSubId,
    name: editRes.category!.name,
    is_active: true,
  });

  console.log("\n[TEST 3] Drag-and-Drop Reordering & Hierarchy Manipulation");
  // 3.1 Sibling Reorder (Drop 'before' or 'after')
  // In SEED_CATEGORIES:
  // cat-brass-idols has children cat-radha-krishna (order 1) and cat-laddu-gopal (order 2)
  const moveAfterRes = moveCategoryInStore("cat-radha-krishna", "cat-brass-idols", "after", "cat-laddu-gopal");
  assert(moveAfterRes.success, "Move after failed");
  const reorderedStore1 = loadMockStore();
  const radhaCat = reorderedStore1.categories.find((c) => c.id === "cat-radha-krishna")!;
  const gopalCat = reorderedStore1.categories.find((c) => c.id === "cat-laddu-gopal")!;
  assert(radhaCat.display_order > gopalCat.display_order, "Radha Krishna should be after Laddu Gopal");
  console.log("  ✓ Drag & drop sibling reorder successful (Radha order:", radhaCat.display_order, ", Gopal order:", gopalCat.display_order, ")");

  // 3.2 Nesting (Drop 'inside' another category)
  // Move cat-organic-dhoop (currently child of cat-aromas) inside cat-pooja
  const moveInsideRes = moveCategoryInStore("cat-organic-dhoop", undefined, "inside", "cat-pooja");
  assert(moveInsideRes.success, "Nesting under new parent failed");
  const reorderedStore2 = loadMockStore();
  const movedDhoop = reorderedStore2.categories.find((c) => c.id === "cat-organic-dhoop")!;
  assert(movedDhoop.parent_id === "cat-pooja", "Dhoop parent should be cat-pooja");
  console.log("  ✓ Drag & drop nesting successful: 'cat-organic-dhoop' parent is now", movedDhoop.parent_id);

  // 3.3 Keyboard Accessible Move: Swap Order Up/Down
  const swapRes = swapCategoryOrderInStore("cat-laddu-gopal", "down");
  assert(swapRes.success, "Swap order failed");
  console.log("  ✓ Keyboard accessible swapOrder ('down') successful");

  // 3.4 Keyboard Accessible Hierarchy: Outdent
  // Move deepSubId (parent: shreeSubId) outdent -> parent should become yantraRootId
  const outdentRes = changeCategoryHierarchyLevelInStore(deepSubId, "outdent");
  assert(outdentRes.success, "Outdent failed");
  const storeAfterOutdent = loadMockStore();
  const outdentedCat = storeAfterOutdent.categories.find((c) => c.id === deepSubId)!;
  assert(outdentedCat.parent_id === yantraRootId, `Expected parent ${yantraRootId}, got ${outdentedCat.parent_id}`);
  console.log("  ✓ Keyboard accessible outdent successful (new parent:", outdentedCat.parent_id, ")");

  // 3.5 Keyboard Accessible Hierarchy: Indent
  // Indent deepSubId back under shreeSubId
  const indentRes = changeCategoryHierarchyLevelInStore(deepSubId, "indent");
  assert(indentRes.success, "Indent failed");
  const storeAfterIndent = loadMockStore();
  const indentedCat = storeAfterIndent.categories.find((c) => c.id === deepSubId)!;
  assert(indentedCat.parent_id === shreeSubId, `Expected parent ${shreeSubId}, got ${indentedCat.parent_id}`);
  console.log("  ✓ Keyboard accessible indent successful (new parent:", indentedCat.parent_id, ")");

  // 3.6 Reject Drag & Drop into Descendant
  const badDrop = moveCategoryInStore(yantraRootId, undefined, "inside", deepSubId);
  assert(!badDrop.success, "Dropping category into its descendant must fail");
  console.log("  ✓ Drag & drop invalid cycle rejected:", badDrop.error);

  console.log("\n[TEST 4] Product Integration & Cascade Deletion");
  // 4.1 Assign product to newly created category
  const createProdRes = upsertProductInStore({
    name: "Consecrated Brass Maha Meru Yantra (5 Inch)",
    slug: "consecrated-brass-maha-meru-5-inch",
    category_id: deepSubId,
    brand: "Kanhaiya Collection",
    base_price: 3499,
    stock_quantity: 12,
    images: [
      {
        id: "img-y1",
        product_id: "temp",
        image_url: "https://images.unsplash.com/photo-yantra-1.jpg",
        alt_text: "Yantra view",
        display_order: 1,
        is_primary: true,
        created_at: new Date().toISOString(),
      },
    ],
  });
  assert(createProdRes.success && createProdRes.product?.id !== undefined, "Product creation with category failed");
  const createdProdId = createProdRes.product!.id;
  console.log("  ✓ Product successfully assigned to category:", createProdRes.product!.name);

  // 4.2 Verify product hierarchy path
  const storeWithProd = loadMockStore();
  const prodInStore = storeWithProd.products.find((p) => p.id === createdProdId)!;
  assert(prodInStore.category_id === deepSubId, "Product category_id mismatch");
  const prodCatPath = getCategoryPathLabel(prodInStore.category_id!, storeWithProd.categories);
  console.log("  ✓ Product category path resolved:", prodCatPath);

  // 4.3 Delete Root Category (cascading shreeSubId and deepSubId)
  const delRes = deleteCategoryFromStore(yantraRootId);
  assert(delRes.success, "Category cascade delete failed");
  assert(delRes.cascadeCount === 2, `Expected 2 cascaded subcategories, got ${delRes.cascadeCount}`);
  console.log("  ✓ Cascade deleted root category and its", delRes.cascadeCount, "descendants");

  // Verify categories removed
  const storeAfterDel = loadMockStore();
  assert(!storeAfterDel.categories.some((c) => c.id === yantraRootId), "Root category still exists");
  assert(!storeAfterDel.categories.some((c) => c.id === shreeSubId), "Subcategory still exists");
  assert(!storeAfterDel.categories.some((c) => c.id === deepSubId), "Deep subcategory still exists");

  // 4.4 Verify Product Survival: product is NOT deleted, category_id set to null (Schema ON DELETE SET NULL)
  const survivedProd = storeAfterDel.products.find((p) => p.id === createdProdId);
  assert(survivedProd !== undefined, "Product should NOT be deleted when category is deleted");
  assert(survivedProd!.category_id === null, "Product category_id should be SET NULL");
  console.log("  ✓ Schema rule ON DELETE SET NULL verified: Product survived with category_id = null");

  // 4.5 Verify Customer Orders Preserved
  assert(storeAfterDel.orders.length > 0, "Orders must remain intact");
  console.log("  ✓ Customer orders intact (count:", storeAfterDel.orders.length, ")");

  console.log("\n=================================================");
  console.log("   ✅ ALL PHASE 4 TESTS PASSED SUCCESSFULLY!     ");
  console.log("=================================================\n");
}

runPhase4Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
