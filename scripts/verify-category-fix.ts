import { loadMockStore, upsertCategoryInStore, deleteCategoryFromStore } from "../lib/mock-data/admin-store";
import { buildCategoryTree, getDescendantCategoryIds, isSafeParent, generateSlug } from "../lib/data/categories";
import { getActiveCategories, getAllCategories } from "../lib/store";
import { getAllActiveCategories, getHomepageCategories } from "../lib/data/homepage";
import { saveCategoryAction } from "../app/(admin)/admin/categories/actions";

function assert(condition: any, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

async function verifyCategoryFix() {
  console.log("==================================================");
  console.log("   VERIFYING CATEGORIES MANAGEMENT BUG FIX        ");
  console.log("==================================================\n");

  // Step 1: Verify persistent store contains Poshak and Sringar
  console.log("--- 1. Store Record Existence ---");
  const store = loadMockStore();
  const poshakRecord = store.categories.find((c) => c.slug.toLowerCase() === "poshak");
  const sringarRecord = store.categories.find((c) => c.slug.toLowerCase() === "sringar");

  assert(Boolean(poshakRecord), "'Poshak' category record exists in data/ecomm_store.json");
  assert(poshakRecord?.name === "Poshak", `'Poshak' name matches: "${poshakRecord?.name}"`);
  assert(poshakRecord?.parent_id === null, "'Poshak' is a Root category (parent_id is null)");

  assert(Boolean(sringarRecord), "'Sringar' category record exists in data/ecomm_store.json");
  assert(sringarRecord?.name === "Sringar", `'Sringar' name matches: "${sringarRecord?.name}"`);
  assert(sringarRecord?.parent_id === null, "'Sringar' is a Root category (parent_id is null)");

  // Step 2: Verify category counts
  console.log("\n--- 2. Category Counts & Summary Statistics ---");
  const allCategories = store.categories;
  const rootCount = allCategories.filter((c) => c.parent_id === null).length;
  const subCount = allCategories.filter((c) => c.parent_id !== null).length;
  const activeCount = allCategories.filter((c) => c.is_active).length;

  console.log(`Total categories in store: ${allCategories.length}`);
  console.log(`Root categories: ${rootCount}`);
  console.log(`Nested subcategories: ${subCount}`);
  console.log(`Active categories: ${activeCount}`);

  assert(rootCount >= 2, `Root categories count is at least 2 (Found: ${rootCount})`);
  assert(subCount >= 5, `Subcategories count is at least 5 (Found: ${subCount})`);

  // Verify subcategories under Poshak
  const poshakChildren = allCategories.filter((c) => c.parent_id === poshakRecord?.id);
  console.log(`Subcategories nested under 'Poshak': ${poshakChildren.length}`);
  assert(poshakChildren.length >= 5, `Poshak has at least 5 subcategories (Found: ${poshakChildren.length})`);

  // Step 3: Verify Hierarchy Tree Construction
  console.log("\n--- 3. Hierarchy Tree Structure ---");
  const tree = buildCategoryTree(allCategories as any);
  assert(tree.length === rootCount, `Tree roots count matches rootCount (${tree.length} === ${rootCount})`);

  const poshakNode = tree.find((node) => node.slug === "poshak");
  const sringarNode = tree.find((node) => node.slug === "sringar");

  assert(Boolean(poshakNode), "'Poshak' is present as a root node in category tree");
  assert(poshakNode?.level === 0, `'Poshak' tree level is 0 (Root), level=${poshakNode?.level}`);
  assert(Boolean(poshakNode?.children && poshakNode.children.length >= 5), `'Poshak' has ${poshakNode?.children.length} nested child subcategories in tree`);
  assert(Boolean(sringarNode), "'Sringar' is present as a root node in category tree");
  assert(sringarNode?.level === 0, `'Sringar' tree level is 0 (Root), level=${sringarNode?.level}`);

  // Step 4: Verify Duplicate Slug Prevention
  console.log("\n--- 4. Duplicate Slug Validation ---");
  const duplicatePoshak = await saveCategoryAction({
    name: "Poshak 2",
    slug: "poshak",
    display_order: 99,
    is_active: true,
    show_on_homepage: true,
  });
  assert(Boolean(duplicatePoshak.error), "Attempt to save duplicate slug 'poshak' was correctly rejected");
  assert(duplicatePoshak.error?.includes("already exists"), `Rejection message mentions slug conflict: "${duplicatePoshak.error}"`);

  const duplicateSringar = await saveCategoryAction({
    name: "Sringar 2",
    slug: "sringar",
    display_order: 99,
    is_active: true,
    show_on_homepage: true,
  });
  assert(Boolean(duplicateSringar.error), "Attempt to save duplicate slug 'sringar' was correctly rejected");
  assert(duplicateSringar.error?.includes("already exists"), `Rejection message mentions slug conflict: "${duplicateSringar.error}"`);

  // Step 5: Verify Storefront Category Getters
  console.log("\n--- 5. Storefront Category Synchronization ---");
  const storeActiveCats = await getActiveCategories();
  assert(storeActiveCats.length === allCategories.length, `getActiveCategories() returns all ${allCategories.length} categories`);
  assert(storeActiveCats.some((c) => c.slug === "poshak"), "'Poshak' is returned by getActiveCategories()");
  assert(storeActiveCats.some((c) => c.slug === "sringar"), "'Sringar' is returned by getActiveCategories()");

  const homepageActiveCats = await getAllActiveCategories();
  assert(homepageActiveCats.length === allCategories.length, `getAllActiveCategories() returns all ${allCategories.length} categories`);
  assert(homepageActiveCats.some((c) => c.slug === "poshak"), "'Poshak' is returned by getAllActiveCategories()");
  assert(homepageActiveCats.some((c) => c.slug === "sringar"), "'Sringar' is returned by getAllActiveCategories()");

  const homepageFeatured = await getHomepageCategories();
  assert(homepageFeatured.some((c) => c.slug === "poshak"), "'Poshak' is returned by getHomepageCategories()");
  assert(homepageFeatured.some((c) => c.slug === "sringar"), "'Sringar' is returned by getHomepageCategories()");

  // Step 6: Verify Adding a New Category & Immediate Visibility
  console.log("\n--- 6. Creating & Deleting a Temporary Category ---");
  const testCategoryRes = await saveCategoryAction({
    name: "Test Unique Murti Accessories",
    slug: "test-unique-accessories",
    description: "Temporary verification category",
    display_order: 100,
    is_active: true,
    show_on_homepage: true,
  });
  assert(testCategoryRes.success === true, "New category created successfully via saveCategoryAction");
  const tempId = testCategoryRes.category?.id;
  assert(Boolean(tempId), `Generated category ID: ${tempId}`);

  // Confirm immediate appearance in store
  const storeWithTemp = loadMockStore();
  assert(storeWithTemp.categories.some((c) => c.id === tempId), "New category immediately visible in loadMockStore()");

  // Clean up the temporary category so original data remains pure
  const deleteRes = deleteCategoryFromStore(tempId!);
  assert(deleteRes.success === true, "Temporary test category safely deleted");

  // Confirm Poshak and Sringar remain completely intact after temporary category test
  const finalStore = loadMockStore();
  assert(finalStore.categories.some((c) => c.slug === "poshak"), "'Poshak' still intact in store");
  assert(finalStore.categories.some((c) => c.slug === "sringar"), "'Sringar' still intact in store");
  assert(!finalStore.categories.some((c) => c.id === tempId), "Temporary category verified removed");

  console.log("\n==================================================");
  console.log("   ALL CATEGORY FIX VERIFICATION CHECKS PASSED!   ");
  console.log("==================================================");
}

verifyCategoryFix().catch((err) => {
  console.error("Verification execution error:", err);
  process.exit(1);
});
