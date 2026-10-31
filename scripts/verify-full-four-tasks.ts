import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { GET as getCategoriesHandler } from "../app/api/categories/route";
import { GET as getProductsHandler } from "../app/api/products/route";
import { GET as getCatalogHandler, POST as postCatalogHandler } from "../app/api/catalog/route";
import { verifyToken, verifyAdmin, verifyAdminCaller } from "../lib/auth/admin";
import { FALLBACK_PRODUCTS } from "../lib/data/homepage";
import { FALLBACK_PRODUCT_DETAILS, getShopProducts } from "../lib/data/products";
import { NextRequest } from "next/server";

let totalTests = 0;
let passedTests = 0;

function assert(description: string, condition: boolean, extra?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${description}`);
  } else {
    console.error(`  ❌ FAIL: ${description}${extra ? ` (${extra})` : ""}`);
  }
}

async function runVerification() {
  console.log("\n==================================================================");
  console.log("🔍 COMPREHENSIVE VERIFICATION: TASKS 1, 2, 3, & 4");
  console.log("==================================================================\n");

  // ---------------------------------------------------------------------------
  // TASK 1: Dependencies, Build, CORS & Environment
  // ---------------------------------------------------------------------------
  console.log("--- TASK 1: Dependency & Environment Connectivity ---");
  assert("Environment configuration exists", Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_APP_URL));
  assert("API client module exists", typeof require("../lib/api-client").getBaseUrl === "function");
  const baseUrl = require("../lib/api-client").getBaseUrl();
  assert("Base URL resolves properly", typeof baseUrl === "string" && baseUrl.length > 0, baseUrl);

  // ---------------------------------------------------------------------------
  // TASK 2: Categories Pipeline & Schema Dual Payload
  // ---------------------------------------------------------------------------
  console.log("\n--- TASK 2: Categories Pipeline & Defensive Schema ---");
  const catReq = new NextRequest("http://localhost:3000/api/categories");
  const catRes = await getCategoriesHandler(catReq);
  assert("GET /api/categories returns HTTP 200", catRes.status === 200);

  const catData = await catRes.json();
  assert("Response has success: true", catData.success === true);
  assert("Response provides 'data' array (res.data)", Array.isArray(catData.data));
  assert("Response provides 'categories' array (res.categories)", Array.isArray(catData.categories));
  assert("Both res.data and res.categories contain active categories", catData.data.length > 0 && catData.categories.length > 0);

  const catalogRes = await getCatalogHandler();
  const catalogData = await catalogRes.json();
  assert("GET /api/catalog provides defensive 'data' object", Boolean(catalogData.data && Array.isArray(catalogData.data.categories)));

  // ---------------------------------------------------------------------------
  // TASK 3: Strict RBAC & Admin Route Protection
  // ---------------------------------------------------------------------------
  console.log("\n--- TASK 3: Strict RBAC & Backend Authorization ---");
  // 1. Unauthenticated client
  const unauthReq = new NextRequest("http://localhost:3000/api/catalog", { method: "POST" });
  const unauthCheck = await verifyAdmin(unauthReq);
  assert("Unauthenticated client is unauthorized", unauthCheck.authorized === false);
  assert("Unauthenticated client receives 401 response", unauthCheck.response?.status === 401);

  // 2. Standard customer client (role: 'user')
  const customerCookie = encodeURIComponent(JSON.stringify({
    id: "usr_4d9c77101ddf4057afbdfb27ad1ab494",
    email: "customer@example.com",
    role: "user"
  }));
  const customerReq = new NextRequest("http://localhost:3000/api/catalog", {
    method: "POST",
    headers: {
      cookie: `demo_user=${customerCookie}`
    }
  });
  const customerCheck = await verifyAdmin(customerReq);
  assert("Standard user ('user' role) is blocked from admin operations", customerCheck.authorized === false);
  assert("Standard user ('user' role) is returned HTTP 403 Forbidden", customerCheck.response?.status === 403);

  // 3. Admin client (role: 'admin')
  const adminCookie = encodeURIComponent(JSON.stringify({
    id: "usr_dev_admin_preview",
    email: "admin@kanhaiya.local",
    role: "admin"
  }));
  const adminReq = new NextRequest("http://localhost:3000/api/catalog", {
    method: "POST",
    headers: {
      cookie: `demo_user=${adminCookie}`
    }
  });
  const adminCheck = await verifyAdmin(adminReq);
  assert("Legitimate admin user ('admin' role) is authorized", adminCheck.authorized === true);

  // 4. API caller function verifyAdminCaller
  const callerCheckUnauth = await verifyAdminCaller(unauthReq);
  assert("verifyAdminCaller rejects unauthenticated caller", callerCheckUnauth.authorized === false);

  const callerCheckUser = await verifyAdminCaller(customerReq);
  assert("verifyAdminCaller rejects standard user caller", callerCheckUser.authorized === false && Boolean(callerCheckUser.error?.includes("Forbidden")));

  const callerCheckAdmin = await verifyAdminCaller(adminReq);
  assert("verifyAdminCaller authorizes administrator", callerCheckAdmin.authorized === true);

  // ---------------------------------------------------------------------------
  // TASK 4: Dummy Products Purged, Live API & AI Empty State
  // ---------------------------------------------------------------------------
  console.log("\n--- TASK 4: Purged Dummy Data & Live Products API ---");
  assert("FALLBACK_PRODUCTS hardcoded array in homepage.ts is purged", FALLBACK_PRODUCTS.length === 0);
  assert("FALLBACK_PRODUCT_DETAILS hardcoded array in products.ts is purged", FALLBACK_PRODUCT_DETAILS.length === 0);

  const prodReq = new NextRequest("http://localhost:3000/api/products?pageSize=6");
  const prodRes = await getProductsHandler(prodReq);
  assert("GET /api/products returns HTTP 200", prodRes.status === 200);

  const prodData = await prodRes.json();
  assert("Response has success: true", prodData.success === true);
  assert("Response provides 'data' array (res.data)", Array.isArray(prodData.data));
  assert("Response provides 'products' array (res.products)", Array.isArray(prodData.products));
  assert("Response includes pagination metadata (totalCount, page, totalPages)", typeof prodData.totalCount === "number" && typeof prodData.page === "number");

  // Query filtered products
  const filterReq = new NextRequest("http://localhost:3000/api/products?q=nonexistentsearchterm12345");
  const filterRes = await getProductsHandler(filterReq);
  const filterData = await filterRes.json();
  assert("Non-matching search returns 0 products without throwing", filterData.products.length === 0);
  assert("Non-matching search does not fall back to fake clothing dummy data", filterData.products.length === 0);

  // Direct getShopProducts check
  const shopResult = await getShopProducts({ searchQuery: "nonexistentsearchterm12345" });
  assert("getShopProducts with no matches returns products: []", Array.isArray(shopResult.products) && shopResult.products.length === 0);

  console.log("\n==================================================================");
  console.log(`📊 FINAL REPORT: ${passedTests} / ${totalTests} VERIFICATION CHECKS PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
  if (passedTests === totalTests) {
    console.log("🎉 ALL TASKS 1, 2, 3, AND 4 VERIFIED WITH ZERO ERRORS (100% PASS)!");
  } else {
    console.error("⚠️ SOME CHECKS FAILED!");
  }
  console.log("==================================================================\n");
}

runVerification().catch(console.error);
