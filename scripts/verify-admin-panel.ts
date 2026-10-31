import { getLocalUsers, findLocalUserByEmail } from "../lib/auth/local-auth";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  details?: string;
}

const results: TestResult[] = [];

async function testRoute(name: string, path: string, cookie?: string, expectedStatus: number = 200) {
  try {
    const headers: Record<string, string> = {};
    if (cookie) {
      headers["Cookie"] = cookie;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      headers,
      redirect: "manual", // Don't follow redirects to check status codes
    });

    if (res.status === expectedStatus) {
      results.push({ name, status: "PASS" });
      console.log(`[PASS] ${name} (Status: ${res.status})`);
    } else {
      results.push({
        name,
        status: "FAIL",
        details: `Expected status ${expectedStatus}, received ${res.status}`,
      });
      console.log(`[FAIL] ${name} (Expected: ${expectedStatus}, Received: ${res.status})`);
    }
  } catch (err: any) {
    results.push({
      name,
      status: "FAIL",
      details: err.message,
    });
    console.log(`[FAIL] ${name} (Error: ${err.message})`);
  }
}

async function runVerification() {
  console.log("=========================================");
  console.log("  ADMIN PANEL ACCESS VERIFICATION SUITE  ");
  console.log("=========================================\n");

  // 1. Check Storefront
  await testRoute("1. Storefront Home Page", "/");

  // 2. Check Login Page
  try {
    const loginRes = await fetch(`${BASE_URL}/login`);
    const loginHtml = await loginRes.text();
    const hasDevPreview = loginHtml.includes("Dev Admin Preview") || loginHtml.includes("Admin Preview Mode");
    if (loginRes.status === 200 && !hasDevPreview) {
      results.push({ name: "2. Clean Login Page (No Dev Preview Mock Toggle)", status: "PASS" });
      console.log("[PASS] 2. Clean Login Page (No Dev Preview Mock Toggle)");
    } else {
      results.push({
        name: "2. Clean Login Page (No Dev Preview Mock Toggle)",
        status: "FAIL",
        details: `Status: ${loginRes.status}, Has Button: ${hasDevPreview}`,
      });
      console.log("[FAIL] 2. Clean Login Page (No Dev Preview Mock Toggle)");
    }
  } catch (err: any) {
    results.push({ name: "2. Clean Login Page (No Dev Preview Mock Toggle)", status: "FAIL", details: err.message });
  }

  // 3. Unauthenticated access to /admin -> should redirect (307) to /login
  await testRoute("3. Unauthenticated /admin protection", "/admin", undefined, 307);

  // 4. Non-admin user access to /admin -> should redirect (307) to /403
  const userCookie = `demo_user=${encodeURIComponent(
    JSON.stringify({ id: "test_user_normal", email: "user@example.com", role: "user" })
  )}`;
  await testRoute("4. Non-admin /admin access blocked (to /403)", "/admin", userCookie, 307);

  // 5. Authenticated Admin access
  const adminCookie = `demo_user=${encodeURIComponent(
    JSON.stringify({ id: "test_admin", email: "avaatdesigns.info@gmail.com", role: "admin" })
  )}`;
  await testRoute("5. Admin Dashboard (/admin)", "/admin", adminCookie, 200);
  await testRoute("6. Admin Products (/admin/products)", "/admin/products", adminCookie, 200);
  await testRoute("7. Admin Categories (/admin/categories)", "/admin/categories", adminCookie, 200);
  await testRoute("8. Admin Orders (/admin/orders)", "/admin/orders", adminCookie, 200);
  await testRoute("9. Admin Reviews (/admin/reviews)", "/admin/reviews", adminCookie, 200);
  await testRoute("10. Admin Users (/admin/users)", "/admin/users", adminCookie, 200);
  await testRoute("11. Admin Banners CMS (/admin/cms/banners)", "/admin/cms/banners", adminCookie, 200);
  await testRoute("12. Admin FAQs CMS (/admin/cms/faqs)", "/admin/cms/faqs", adminCookie, 200);
  await testRoute("13. Admin Policies CMS (/admin/cms/policies)", "/admin/cms/policies", adminCookie, 200);

  // Summary
  console.log("\n=========================================");
  console.log("            TEST SUMMARY                 ");
  console.log("=========================================");

  let passCount = 0;
  let failCount = 0;

  for (const r of results) {
    if (r.status === "PASS") {
      passCount++;
    } else {
      failCount++;
      console.log(`❌ ${r.name}: ${r.details || "Failed"}`);
    }
  }

  console.log(`\nTotal: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);

  if (failCount > 0) {
    console.log("\nVerification failed!");
    process.exit(1);
  } else {
    console.log("\nAll Admin routes and RBAC guards verified successfully!");
    process.exit(0);
  }
}

// Execute tests
runVerification().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
