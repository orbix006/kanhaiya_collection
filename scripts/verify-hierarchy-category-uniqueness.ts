(process.env as any).NODE_ENV = "test";

import { saveCategoryAction } from "../app/(admin)/admin/categories/actions";
import {
  loadMockStore,
  saveMockStore,
  upsertCategoryInStore,
  deleteCategoryFromStore,
} from "../lib/mock-data/admin-store";

function assert(condition: any, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runVerification() {
  console.log("================================================================");
  console.log("   VERIFYING HIERARCHY-AWARE CATEGORY/SLUG DUPLICATE LOGIC     ");
  console.log("================================================================\n");

  const store = loadMockStore();

  // 1. Setup / Find Root "Poshak"
  let poshak = store.categories.find(
    (c) => c.name.toLowerCase() === "poshak" && c.parent_id === null
  );
  if (!poshak) {
    console.log("Creating root category 'Poshak'...");
    const res = upsertCategoryInStore({
      name: "Poshak",
      slug: "poshak",
      parent_id: null,
    });
    assert(res.success, "Root 'Poshak' created");
    poshak = res.category!;
  } else {
    console.log(`Found existing root 'Poshak' (ID: ${poshak.id})`);
  }

  // 2. Setup Subcategory 1: "Laddu Gopal" under "Poshak"
  let ladduGopal = store.categories.find(
    (c) => c.name.toLowerCase() === "laddu gopal" && c.parent_id === poshak!.id
  );
  if (!ladduGopal) {
    console.log("Creating subcategory 'Laddu Gopal' under 'Poshak'...");
    const res = upsertCategoryInStore({
      name: "Laddu Gopal",
      slug: "laddu-gopal",
      parent_id: poshak.id,
    });
    assert(res.success, "Subcategory 'Laddu Gopal' created under Poshak");
    ladduGopal = res.category!;
  } else {
    console.log(`Found existing subcategory 'Laddu Gopal' (ID: ${ladduGopal.id})`);
  }

  // 3. Setup Subcategory 2: "Radhe Krishna" under "Poshak"
  let radheKrishna = store.categories.find(
    (c) => c.name.toLowerCase() === "radhe krishna" && c.parent_id === poshak!.id
  );
  if (!radheKrishna) {
    console.log("Creating subcategory 'Radhe Krishna' under 'Poshak'...");
    const res = upsertCategoryInStore({
      name: "Radhe Krishna",
      slug: "radhe-krishna",
      parent_id: poshak.id,
    });
    assert(res.success, "Subcategory 'Radhe Krishna' created under Poshak");
    radheKrishna = res.category!;
  } else {
    console.log(`Found existing subcategory 'Radhe Krishna' (ID: ${radheKrishna.id})`);
  }

  // Clean up any previous test instances of "Hand Work Poshak" to start fresh
  const existingHandWorks = store.categories.filter(
    (c) => c.name.toLowerCase() === "hand work poshak"
  );
  for (const hw of existingHandWorks) {
    deleteCategoryFromStore(hw.id);
  }

  console.log("\n--- TEST CASE 1: Create 'Hand Work Poshak' under 'Laddu Gopal' ---");
  const tc1 = await saveCategoryAction({
    name: "Hand Work Poshak",
    slug: "hand-work-poshak",
    parent_id: ladduGopal.id,
    is_active: true,
  });
  assert(tc1.success, `TC1: Created 'Hand Work Poshak' under 'Laddu Gopal' successfully (Msg: ${tc1.message})`);
  const ladduHwId = tc1.category?.id;
  assert(Boolean(ladduHwId), "TC1: Created record has valid ID");

  console.log("\n--- TEST CASE 2: Create exact same 'Hand Work Poshak' under 'Radhe Krishna' ---");
  const tc2 = await saveCategoryAction({
    name: "Hand Work Poshak",
    slug: "hand-work-poshak",
    parent_id: radheKrishna.id,
    is_active: true,
  });
  assert(
    tc2.success,
    `TC2: Created exact same 'Hand Work Poshak' under 'Radhe Krishna' successfully! (Msg: ${tc2.message})`
  );
  const radheHwId = tc2.category?.id;
  assert(Boolean(radheHwId), "TC2: Created record has valid ID");
  assert(ladduHwId !== radheHwId, "TC2: Both categories exist with distinct IDs under different parents");

  console.log("\n--- TEST CASE 3: Create 'Hand Work Poshak' AGAIN under 'Laddu Gopal' (Duplicate under SAME parent) ---");
  const tc3 = await saveCategoryAction({
    name: "Hand Work Poshak",
    slug: "hand-work-poshak",
    parent_id: ladduGopal.id,
    is_active: true,
  });
  assert(!tc3.success && Boolean(tc3.error), `TC3: Correctly blocked duplicate under same parent! (Error: ${tc3.error})`);

  console.log("\n--- TEST CASE 4: Create 'Hand Work Poshak' AGAIN under 'Radhe Krishna' (Duplicate under SAME parent) ---");
  const tc4 = await saveCategoryAction({
    name: "Hand Work Poshak",
    slug: "hand-work-poshak",
    parent_id: radheKrishna.id,
    is_active: true,
  });
  assert(!tc4.success && Boolean(tc4.error), `TC4: Correctly blocked duplicate under same parent! (Error: ${tc4.error})`);

  console.log("\n--- TEST CASE 5: Same Subcategory Name across Two Different Root Categories ---");
  // Setup another root category "Sringar"
  let sringar = store.categories.find(
    (c) => c.name.toLowerCase() === "sringar" && c.parent_id === null
  );
  if (!sringar) {
    const res = upsertCategoryInStore({
      name: "Sringar",
      slug: "sringar",
      parent_id: null,
    });
    sringar = res.category!;
  }

  // Create "Special Mukut" under Poshak
  const sub1 = await saveCategoryAction({
    name: "Special Mukut",
    slug: "special-mukut",
    parent_id: poshak.id,
    is_active: true,
  });
  assert(sub1.success, "TC5: Created 'Special Mukut' under root 'Poshak'");

  // Create exact same "Special Mukut" under Sringar
  const sub2 = await saveCategoryAction({
    name: "Special Mukut",
    slug: "special-mukut",
    parent_id: sringar.id,
    is_active: true,
  });
  assert(sub2.success, "TC5: Created exact same 'Special Mukut' under root 'Sringar'");

  // Try creating "Special Mukut" AGAIN under Sringar (same root parent)
  const subDup = await saveCategoryAction({
    name: "Special Mukut",
    slug: "special-mukut",
    parent_id: sringar.id,
    is_active: true,
  });
  assert(!subDup.success && Boolean(subDup.error), `TC5: Blocked duplicate 'Special Mukut' under same parent Sringar (Error: ${subDup.error})`);

  console.log("\n--- TEST CASE 6: Root Category Duplicate Prevention ---");
  const rootDup = await saveCategoryAction({
    name: "Poshak",
    slug: "poshak",
    parent_id: null,
    is_active: true,
  });
  assert(!rootDup.success && Boolean(rootDup.error), `TC6: Correctly blocked duplicate root category 'Poshak' (Error: ${rootDup.error})`);

  // Cleanup test categories created for subcases
  if (sub1.category?.id) deleteCategoryFromStore(sub1.category.id);
  if (sub2.category?.id) deleteCategoryFromStore(sub2.category.id);

  console.log("\n================================================================");
  console.log("   ALL 5 USER TEST CASES PASSED SUCCESSFULLY!                  ");
  console.log("================================================================\n");
}

runVerification().catch((err) => {
  console.error("Unhandled test exception:", err);
  process.exit(1);
});
