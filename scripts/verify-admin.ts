import fs from "fs";
import path from "path";
import {
  isSafeParent,
  getDescendantCategoryIds,
  buildCategoryTree,
  generateSlug,
} from "../lib/data/categories";
import type { Category } from "../lib/data/homepage";

async function verifyAdmin() {
  console.log("🔍 Starting Admin Suite Verification Test Suite...\n");
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

  // TEST DATA: Sample unlimited-depth category hierarchy
  const testCategories: Category[] = [
    {
      id: "cat-root-1",
      parent_id: null,
      name: "Menswear",
      slug: "menswear",
      description: "Men's fashion",
      image_url: null,
      display_order: 1,
      is_active: true,
      show_on_homepage: true,
    },
    {
      id: "cat-child-1",
      parent_id: "cat-root-1",
      name: "Shirts",
      slug: "mens-shirts",
      description: "Formal and casual shirts",
      image_url: null,
      display_order: 1,
      is_active: true,
      show_on_homepage: true,
    },
    {
      id: "cat-grandchild-1",
      parent_id: "cat-child-1",
      name: "Linen Shirts",
      slug: "linen-shirts",
      description: "Royal linen collection",
      image_url: null,
      display_order: 1,
      is_active: true,
      show_on_homepage: true,
    },
    {
      id: "cat-great-grandchild-1",
      parent_id: "cat-grandchild-1",
      name: "Full Sleeve Linen",
      slug: "full-sleeve-linen",
      description: "Long sleeve pure linen",
      image_url: null,
      display_order: 1,
      is_active: true,
      show_on_homepage: true,
    },
    {
      id: "cat-root-2",
      parent_id: null,
      name: "Womenswear",
      slug: "womenswear",
      description: "Women's couture",
      image_url: null,
      display_order: 2,
      is_active: true,
      show_on_homepage: true,
    },
  ];

  // TEST 1: Safe Parent Picker - Cycle Prevention
  console.log("--- 1. Safe Parent Picker & Circular Reference Prevention ---");

  // 1.1 Category cannot select itself
  const selfCheck = isSafeParent("cat-root-1", "cat-root-1", testCategories);
  assert(!selfCheck.safe, "Prevents selecting itself as parent");
  assert(
    selfCheck.reason?.includes("cannot be its own parent") ?? false,
    "Provides clear reason for self-selection rejection"
  );

  // 1.2 Category cannot select direct child as parent
  const directChildCheck = isSafeParent(
    "cat-root-1",
    "cat-child-1",
    testCategories
  );
  assert(!directChildCheck.safe, "Prevents selecting direct child as parent");

  // 1.3 Category cannot select grandchild as parent
  const grandchildCheck = isSafeParent(
    "cat-root-1",
    "cat-grandchild-1",
    testCategories
  );
  assert(!grandchildCheck.safe, "Prevents selecting grandchild as parent");

  // 1.4 Category cannot select great-grandchild as parent
  const greatGrandchildCheck = isSafeParent(
    "cat-root-1",
    "cat-great-grandchild-1",
    testCategories
  );
  assert(
    !greatGrandchildCheck.safe,
    "Prevents selecting deeply nested great-grandchild as parent"
  );

  // 1.5 Valid parent selection: Child moving under another root category
  const validReparentCheck = isSafeParent(
    "cat-child-1",
    "cat-root-2",
    testCategories
  );
  assert(
    validReparentCheck.safe,
    "Allows reparenting under a non-descendant category (Womenswear)"
  );

  // 1.6 Setting parent to null (making it a root category)
  const nullParentCheck = isSafeParent("cat-child-1", null, testCategories);
  assert(nullParentCheck.safe, "Allows setting parent to null (promoting to root)");

  // 1.7 New category (no ID yet) can pick any parent
  const newCatCheck = isSafeParent(null, "cat-child-1", testCategories);
  assert(newCatCheck.safe, "Allows new categories to select any existing parent");

  // TEST 2: Descendant Cascade Calculation
  console.log("\n--- 2. Descendant Cascade Calculation ---");

  // Descendants of Root (cat-root-1): child, grandchild, great-grandchild (3 total)
  const rootDescendants = getDescendantCategoryIds(
    "cat-root-1",
    testCategories
  );
  assert(
    rootDescendants.length === 3,
    `Calculates all 3 nested descendants for root category (found: ${rootDescendants.length})`
  );
  assert(
    rootDescendants.includes("cat-child-1") &&
      rootDescendants.includes("cat-grandchild-1") &&
      rootDescendants.includes("cat-great-grandchild-1"),
    "Descendant list contains complete branch down to deepest leaf"
  );

  // Descendants of Child (cat-child-1): grandchild, great-grandchild (2 total)
  const childDescendants = getDescendantCategoryIds(
    "cat-child-1",
    testCategories
  );
  assert(
    childDescendants.length === 2,
    `Calculates 2 descendants for intermediate child (found: ${childDescendants.length})`
  );

  // Descendants of Leaf (cat-great-grandchild-1): 0 total
  const leafDescendants = getDescendantCategoryIds(
    "cat-great-grandchild-1",
    testCategories
  );
  assert(
    leafDescendants.length === 0,
    "Calculates 0 descendants for leaf category (no cascade subcategories)"
  );

  // TEST 3: Unlimited-Depth Tree Construction
  console.log("\n--- 3. Unlimited-Depth Tree Construction ---");
  const tree = buildCategoryTree(testCategories);
  assert(tree.length === 2, `Builds 2 root nodes in tree (found: ${tree.length})`);

  const root1 = tree.find((n) => n.id === "cat-root-1");
  assert(root1 !== undefined && root1.level === 0, "Root node has level 0");
  assert(
    root1?.children.length === 1 && root1.children[0].level === 1,
    "Child node has level 1"
  );
  assert(
    root1?.children[0].children[0].level === 2,
    "Grandchild node has level 2"
  );
  assert(
    root1?.children[0].children[0].children[0].level === 3,
    "Great-grandchild node has level 3"
  );

  // TEST 4: Auto-Slug Generation & Formatting
  console.log("\n--- 4. Editable Auto-Slug Generation ---");
  assert(
    generateSlug("Royal Silk Sarees") === "royal-silk-sarees",
    "Generates clean lowercase hyphenated slug"
  );
  assert(
    generateSlug("Men's Kurtas & Pyjamas! (Festive)") ===
      "mens-kurtas-pyjamas-festive",
    "Strips special characters and punctuation"
  );

  // TEST 5: Security & Authenticated Supabase Access (No Service Role)
  console.log(
    "\n--- 5. Security & Normal Authenticated Access (Never Service Role) ---"
  );
  const usersActionPath = path.join(
    __dirname,
    "../app/(admin)/admin/users/actions.ts"
  );
  const usersActionContent = fs.readFileSync(usersActionPath, "utf-8");

  assert(
    usersActionContent.includes("createClient"),
    "updateUserRoleAction imports createClient from @/lib/supabase/server"
  );
  assert(
    !usersActionContent.includes("SUPABASE_SERVICE_ROLE_KEY") &&
      !usersActionContent.includes("service_role"),
    "updateUserRoleAction strictly avoids service-role access"
  );
  assert(
    usersActionContent.includes("callerProfile.role !== \"admin\""),
    "updateUserRoleAction asserts caller possesses admin role"
  );
  assert(
    usersActionContent.includes("caller.id === targetUserId"),
    "updateUserRoleAction contains safety guard against admin self-demotion"
  );

  // TEST 6: Server-Side and Client-Side Admin Protection
  console.log("\n--- 6. Dual-Layer Admin Protection ---");
  const adminLayoutPath = path.join(
    __dirname,
    "../app/(admin)/layout.tsx"
  );
  const adminLayoutContent = fs.readFileSync(adminLayoutPath, "utf-8");
  assert(
    adminLayoutContent.includes("profileData.role !== \"admin\""),
    "AdminLayout asserts role === 'admin' on the server"
  );
  assert(
    adminLayoutContent.includes("redirect(\"/403\")"),
    "AdminLayout redirects non-admins to /403"
  );

  const middlewarePath = path.join(__dirname, "../middleware.ts");
  const middlewareContent = fs.readFileSync(middlewarePath, "utf-8");
  assert(
    middlewareContent.includes("pathname.startsWith(\"/admin\")"),
    "Middleware intercepts /admin paths"
  );
  assert(
    middlewareContent.includes("profile.role !== \"admin\""),
    "Middleware enforces admin role before granting edge access"
  );

  // TEST 7: Reusable Admin Components
  console.log("\n--- 7. Reusable Admin Components ---");
  const dataTablePath = path.join(
    __dirname,
    "../components/admin/data-table.tsx"
  );
  const formPath = path.join(__dirname, "../components/admin/form.tsx");
  assert(
    fs.existsSync(dataTablePath),
    "AdminDataTable component created and accessible"
  );
  assert(fs.existsSync(formPath), "AdminForm component created and accessible");

  console.log(`\n==================================================`);
  console.log(`Verification Summary: ${passedTests}/${totalTests} tests passed!`);
  console.log(`==================================================\n`);

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

verifyAdmin().catch((err) => {
  console.error("Admin verification error:", err);
  process.exit(1);
});
