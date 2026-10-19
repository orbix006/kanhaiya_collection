/**
 * Verification script for Kanhaiya Collection Admin Panel
 * Tests all admin routes, preview access mechanism, and security guards.
 */

const BASE_URL = "http://localhost:3000";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  details?: string;
}

async function runTests() {
  const results: TestResult[] = [];
  console.log("=== Starting Admin Panel Verification Suite ===\n");

  // Helper for fetch
  async function testRoute(name: string, path: string, cookie?: string, expectedStatus = 200) {
    try {
      const headers: Record<string, string> = {};
      if (cookie) {
        headers["Cookie"] = cookie;
      }
      const res = await fetch(`${BASE_URL}${path}`, {
        headers,
        redirect: "manual",
      });

      if (res.status === expectedStatus) {
        results.push({ name, status: "PASS", details: `Status ${res.status}` });
        console.log(`[PASS] ${name} -> Status ${res.status}`);
      } else {
        const location = res.headers.get("location");
        results.push({
          name,
          status: "FAIL",
          details: `Expected ${expectedStatus}, got ${res.status} (Location: ${location})`,
        });
        console.log(`[FAIL] ${name} -> Expected ${expectedStatus}, got ${res.status} (Location: ${location})`);
      }
    } catch (err: any) {
      results.push({ name, status: "FAIL", details: err.message });
      console.log(`[FAIL] ${name} -> Error: ${err.message}`);
    }
  }

  // 1. Check Storefront
  await testRoute("1. Storefront Home Page", "/");

  // 2. Check Login Page
  try {
    const loginRes = await fetch(`${BASE_URL}/login`);
    const loginHtml = await loginRes.text();
    const hasDevPreview = loginHtml.includes("Dev Admin Preview") || loginHtml.includes("Admin Preview Mode");
    if (loginRes.status === 200 && hasDevPreview) {
      results.push({ name: "2. Login Page with Dev Preview Button", status: "PASS" });
      console.log("[PASS] 2. Login Page with Dev Preview Button");
    } else {
      results.push({
        name: "2. Login Page with Dev Preview Button",
        status: "FAIL",
        details: `Status: ${loginRes.status}, Has Button: ${hasDevPreview}`,
      });
      console.log("[FAIL] 2. Login Page with Dev Preview Button");
    }
  } catch (err: any) {
    results.push({ name: "2. Login Page with Dev Preview Button", status: "FAIL", details: err.message });
  }

  // 3. Unauthenticated access to /admin -> should redirect (307) to /login
  await testRoute("3. Unauthenticated /admin protection", "/admin", undefined, 307);

  // 4. Non-admin user access to /admin -> should redirect (307) to /403
  const userCookie = `demo_user=${encodeURIComponent(
    JSON.stringify({
      id: "usr_non_admin",
      email: "buyer@example.com",
      full_name: "Regular Buyer",
      role: "user",
    })
  )}`;
  await testRoute("4. Non-admin /admin access blocked (to /403)", "/admin", userCookie, 307);

  // Admin cookie for development preview
  const adminCookie = `demo_user=${encodeURIComponent(
    JSON.stringify({
      id: "usr_4104acb962ff4cdaae6cd0136b9cee47",
      email: "you@example.com",
      full_name: "Amber",
      role: "admin",
    })
  )}`;

  // 5. Authenticated Admin Dashboard (Item 1)
  await testRoute("5. Admin Executive Dashboard (/admin)", "/admin", adminCookie, 200);

  // 6. Admin Products (Item 2)
  await testRoute("6. Admin Products (/admin/products)", "/admin/products", adminCookie, 200);

  // 7. Admin Categories (Item 3)
  await testRoute("7. Admin Categories (/admin/categories)", "/admin/categories", adminCookie, 200);

  // 8. Admin Orders (Item 4)
  await testRoute("8. Admin Orders (/admin/orders)", "/admin/orders", adminCookie, 200);

  // 9. Admin Customers & Users (Item 5)
  await testRoute("9. Admin Customers / Users (/admin/users)", "/admin/users", adminCookie, 200);

  // 10. Admin Reviews (Item 6)
  await testRoute("10. Admin Reviews (/admin/reviews)", "/admin/reviews", adminCookie, 200);

  // 11. Homepage Management CMS (Item 7)
  await testRoute("11. Admin Homepage CMS (/admin/cms/homepage)", "/admin/cms/homepage", adminCookie, 200);

  // 12. Hero Banners CMS (Item 8)
  await testRoute("12. Admin Banners CMS (/admin/cms/banners)", "/admin/cms/banners", adminCookie, 200);

  // 13. Testimonials CMS (Item 9)
  await testRoute("13. Admin Testimonials CMS (/admin/cms/testimonials)", "/admin/cms/testimonials", adminCookie, 200);

  // 14. About Us CMS (Item 10)
  await testRoute("14. Admin About Us CMS (/admin/cms/about)", "/admin/cms/about", adminCookie, 200);

  // 15. FAQs CMS (Item 11)
  await testRoute("15. Admin FAQs CMS (/admin/cms/faqs)", "/admin/cms/faqs", adminCookie, 200);

  // 16. Policies CMS (Item 12)
  await testRoute("16. Admin Policies CMS (/admin/cms/policies)", "/admin/cms/policies", adminCookie, 200);

  // 17. Contact Submissions Inbox (Item 13)
  await testRoute("17. Admin Contact Submissions (/admin/inbox/contact)", "/admin/inbox/contact", adminCookie, 200);

  // 18. Leads Inbox (Item 14)
  await testRoute("18. Admin Leads Inbox (/admin/inbox/leads)", "/admin/inbox/leads", adminCookie, 200);

  // 19. Site Settings CMS (Item 15)
  await testRoute("19. Admin Site Settings (/admin/cms/settings)", "/admin/cms/settings", adminCookie, 200);

  console.log("\n=== Summary ===");
  const passed = results.filter((r) => r.status === "PASS").length;
  console.log(`Passed: ${passed}/${results.length}`);
  if (passed === results.length) {
    console.log("All Admin Panel verification checks PASSED successfully!");
  } else {
    console.log("Some checks failed. See details above.");
  }
}

runTests();
