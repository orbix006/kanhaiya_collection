import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { POST as catalogPost } from "../app/api/catalog/route";
import { POST as devUploadPost } from "../app/api/dev-upload/route";
import { createServiceClient, isSupabaseServiceConfigured } from "../lib/supabase/service";
import {
  registerLocalUser,
  setLocalUserRole,
  ensureDevAdminUser,
} from "../lib/auth/local-auth";

async function runSecurityAudit() {
  console.log("================================================================================");
  console.log("🛡️  PHASE 1 SECURITY & VULNERABILITY VERIFICATION AUDIT");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. SUPABASE SERVICE CLIENT HARDENING AUDIT
  // ---------------------------------------------------------------------------
  console.log("--- 1. Supabase Service Client Security Checks ---");

  const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalServiceKeyAlt = process.env.SUPABASE_SERVICE_KEY;
  const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  try {
    // 1.1 Unconfigured / missing service key throws error
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "dummy-anon-key-should-not-be-used";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

    let threwExpected = false;
    let caughtMessage = "";
    try {
      createServiceClient();
    } catch (e: unknown) {
      threwExpected = true;
      caughtMessage = e instanceof Error ? e.message : String(e);
    }
    assert(
      threwExpected,
      "Throws error when SUPABASE_SERVICE_ROLE_KEY is missing",
      caughtMessage
    );
    assert(
      !caughtMessage.includes("dummy-anon-key"),
      "Never leaks or prints anon key in error output"
    );
    assert(
      !isSupabaseServiceConfigured(),
      "isSupabaseServiceConfigured() accurately reports false when key is missing"
    );

    // 1.2 Placeholder service key is rejected
    process.env.SUPABASE_SERVICE_ROLE_KEY = "placeholder-service-key";
    let threwPlaceholder = false;
    try {
      createServiceClient();
    } catch {
      threwPlaceholder = true;
    }
    assert(
      threwPlaceholder,
      "Throws error and fails closed when SUPABASE_SERVICE_ROLE_KEY is a placeholder"
    );
    assert(
      !isSupabaseServiceConfigured(),
      "isSupabaseServiceConfigured() accurately reports false for placeholder values"
    );
  } finally {
    // Restore environment
    if (originalServiceKey !== undefined) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
    } else {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }
    if (originalServiceKeyAlt !== undefined) {
      process.env.SUPABASE_SERVICE_KEY = originalServiceKeyAlt;
    } else {
      delete process.env.SUPABASE_SERVICE_KEY;
    }
    if (originalAnonKey !== undefined) {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
    } else {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
    if (originalUrl !== undefined) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    } else {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    }
  }

  // ---------------------------------------------------------------------------
  // 2. SETUP LOCAL TEST USERS FOR ROLE-BASED ACCESS CONTROL
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Setting Up Test Identities for Auth Verification ---");
  const testCustomerEmail = `customer-test-${Date.now()}@kanhaiya.test`;
  const customerResult = await registerLocalUser({
    fullName: "Ordinary Customer",
    email: testCustomerEmail,
    password: "Password123!",
  });
  const customer = customerResult.user!;
  assert(customer && customer.role === "user", "Standard customer account established with 'user' role");

  const admin = ensureDevAdminUser();
  assert(admin && admin.role === "admin", "Admin test account established with 'admin' role");

  const customerCookieHeader = `demo_user=${encodeURIComponent(
    JSON.stringify({ id: customer.id, email: customer.email, role: "user" })
  )}`;
  const adminCookieHeader = `demo_user=${encodeURIComponent(
    JSON.stringify({ id: admin.id, email: admin.email, role: "admin" })
  )}`;

  // ---------------------------------------------------------------------------
  // 3. CATALOG API AUTHORIZATION AUDIT (POST /api/catalog)
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Catalog API Route Security (POST /api/catalog) ---");

  // 3.1 Unauthenticated mutation request -> Must return 401
  const unauthCatalogReq = new NextRequest("http://localhost:3000/api/catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "sync", store: { products: [] } }),
  });
  const unauthCatalogRes = await catalogPost(unauthCatalogReq);
  const unauthCatalogJson = await unauthCatalogRes.json();
  assert(
    unauthCatalogRes.status === 401,
    "Unauthenticated catalog mutation is rejected with HTTP 401",
    `Status: ${unauthCatalogRes.status}`
  );
  assert(
    Boolean(unauthCatalogJson.error),
    "Returns descriptive error without leaking server stack",
    unauthCatalogJson.error
  );

  // 3.2 Authenticated NON-ADMIN mutation request -> Must return 403
  const nonAdminCatalogReq = new NextRequest("http://localhost:3000/api/catalog", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: customerCookieHeader,
    },
    body: JSON.stringify({ action: "delete_product", productId: "test-prod-1" }),
  });
  const nonAdminCatalogRes = await catalogPost(nonAdminCatalogReq);
  assert(
    nonAdminCatalogRes.status === 403,
    "Non-admin authenticated customer mutation is rejected with HTTP 403 Forbidden",
    `Status: ${nonAdminCatalogRes.status}`
  );

  // 3.3 Client-spoofed role in cookie -> Must be authoritatively checked against DB
  const spoofedCookieHeader = `demo_user=${encodeURIComponent(
    JSON.stringify({ id: customer.id, email: customer.email, role: "admin" }) // client claiming admin!
  )}`;
  const spoofedCatalogReq = new NextRequest("http://localhost:3000/api/catalog", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: spoofedCookieHeader,
    },
    body: JSON.stringify({ action: "delete_product", productId: "test-prod-1" }),
  });
  const spoofedCatalogRes = await catalogPost(spoofedCatalogReq);
  assert(
    spoofedCatalogRes.status === 403,
    "Client-spoofed role cookie is overridden by authoritative server store and rejected with 403",
    `Status: ${spoofedCatalogRes.status}`
  );

  // 3.4 Production guard: local demo mock sync rejected when NODE_ENV === 'production'
  const originalNodeEnv = process.env.NODE_ENV;
  try {
    (process.env as any).NODE_ENV = "production";
    const prodCatalogReq = new NextRequest("http://localhost:3000/api/catalog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookieHeader,
      },
      body: JSON.stringify({ action: "sync", store: { products: [] } }),
    });
    const prodCatalogRes = await catalogPost(prodCatalogReq);
    assert(
      prodCatalogRes.status === 403,
      "Local mock catalog mutations are strictly rejected with 403 in production environment",
      `Status: ${prodCatalogRes.status}`
    );
  } finally {
    (process.env as any).NODE_ENV = originalNodeEnv;
  }

  // 3.5 Authorized administrator legitimate request
  const validAdminReq = new NextRequest("http://localhost:3000/api/catalog", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      action: "upsert",
      payload: {
        name: `Security Test Silk Sari ${Date.now()}`,
        base_price: 4999,
        category_id: "cat_sarees",
        stock_quantity: 10,
        is_active: false,
      },
    }),
  });
  const validAdminRes = await catalogPost(validAdminReq);
  const validAdminJson = await validAdminRes.json();
  assert(
    validAdminRes.status === 200 && validAdminJson.success === true,
    "Authorized administrator mutation succeeds with HTTP 200",
    `Status: ${validAdminRes.status}, Body: ${JSON.stringify(validAdminJson)}`
  );

  // ---------------------------------------------------------------------------
  // 4. DEV UPLOAD ROUTE AUDIT (POST /api/dev-upload)
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Development Upload Route Security (POST /api/dev-upload) ---");

  // 4.1 Production Fail-Closed Guard
  try {
    (process.env as any).NODE_ENV = "production";
    const prodUploadReq = new NextRequest("http://localhost:3000/api/dev-upload", {
      method: "POST",
      headers: { Cookie: adminCookieHeader },
    });
    const prodUploadRes = await devUploadPost(prodUploadReq);
    assert(
      prodUploadRes.status === 403,
      "Dev upload endpoint is unconditionally disabled with 403 in production environment",
      `Status: ${prodUploadRes.status}`
    );
  } finally {
    (process.env as any).NODE_ENV = originalNodeEnv;
  }

  // 4.2 Unauthenticated upload request -> 401
  const unauthUploadReq = new NextRequest("http://localhost:3000/api/dev-upload", {
    method: "POST",
  });
  const unauthUploadRes = await devUploadPost(unauthUploadReq);
  assert(
    unauthUploadRes.status === 401,
    "Unauthenticated file upload is rejected with HTTP 401",
    `Status: ${unauthUploadRes.status}`
  );

  // 4.3 Non-admin authenticated user -> 403
  const nonAdminUploadReq = new NextRequest("http://localhost:3000/api/dev-upload", {
    method: "POST",
    headers: { Cookie: customerCookieHeader },
  });
  const nonAdminUploadRes = await devUploadPost(nonAdminUploadReq);
  assert(
    nonAdminUploadRes.status === 403,
    "Non-admin customer file upload is rejected with HTTP 403",
    `Status: ${nonAdminUploadRes.status}`
  );

  // Helper to create multipart form data request
  function createUploadRequest(
    cookie: string,
    fileBytes: Buffer,
    fileName: string,
    mimeType: string
  ): NextRequest {
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const pre = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const post = Buffer.from(`\r\n--${boundary}--\r\n`);
    const fullBody = Buffer.concat([pre, fileBytes, post]);

    return new NextRequest("http://localhost:3000/api/dev-upload", {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: fullBody,
    });
  }

  // 4.4 Reject SVG uploads (Stored XSS mitigation)
  const svgPayload = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  const svgReq = createUploadRequest(
    adminCookieHeader,
    svgPayload,
    "malicious.svg",
    "image/svg+xml"
  );
  const svgRes = await devUploadPost(svgReq);
  const svgJson = await svgRes.json();
  assert(
    svgRes.status === 400,
    "Unsafe SVG upload is strictly rejected with HTTP 400",
    `Status: ${svgRes.status}, Error: ${svgJson.error}`
  );

  // 4.5 Reject MIME-spoofed files (e.g. PHP/HTML script with .png extension and image/png MIME)
  const spoofedPayload = Buffer.from("<?php echo 'system access'; ?>");
  const spoofedReq = createUploadRequest(
    adminCookieHeader,
    spoofedPayload,
    "exploit.png",
    "image/png"
  );
  const spoofedRes = await devUploadPost(spoofedReq);
  const spoofedJson = await spoofedRes.json();
  assert(
    spoofedRes.status === 400,
    "MIME-spoofed file failing magic byte signature is rejected with HTTP 400",
    `Status: ${spoofedRes.status}, Error: ${spoofedJson.error}`
  );

  // 4.6 Reject files exceeding 5MB limit
  const oversizedPayload = Buffer.alloc(5 * 1024 * 1024 + 1024); // 5MB + 1KB
  const oversizedReq = createUploadRequest(
    adminCookieHeader,
    oversizedPayload,
    "huge.jpg",
    "image/jpeg"
  );
  const oversizedRes = await devUploadPost(oversizedReq);
  assert(
    oversizedRes.status === 400,
    "File exceeding 5MB limit is rejected with HTTP 400",
    `Status: ${oversizedRes.status}`
  );

  // 4.7 Accept legitimate PNG file with valid magic bytes
  // Minimal valid 1x1 PNG bytes
  const validPngBytes = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]);
  const validUploadReq = createUploadRequest(
    adminCookieHeader,
    validPngBytes,
    "../../etc/passwd.png", // Attempt path traversal in filename
    "image/png"
  );
  const validUploadRes = await devUploadPost(validUploadReq);
  const validUploadJson = await validUploadRes.json();
  assert(
    validUploadRes.status === 200 && validUploadJson.success === true,
    "Legitimate PNG image upload succeeds with HTTP 200",
    `Status: ${validUploadRes.status}, Error: ${validUploadJson.error}`
  );
  assert(
    typeof validUploadJson.fileName === "string" &&
      validUploadJson.fileName.startsWith("img_") &&
      validUploadJson.fileName.endsWith(".png") &&
      !validUploadJson.fileName.includes(".."),
    "Server-side randomized filename generated safely, neutralizing path traversal filename"
  );
  assert(
    validUploadJson.url === `/uploads/${validUploadJson.fileName}`,
    "Returned public URL points to /uploads/<safeFileName>"
  );

  // Clean up uploaded test artifact
  if (validUploadJson?.fileName) {
    const testFilePath = path.join(process.cwd(), "public", "uploads", validUploadJson.fileName);
    if (fs.existsSync(testFilePath)) {
      try {
        fs.unlinkSync(testFilePath);
      } catch {
        // Non-fatal
      }
    }
  }

  console.log("\n================================================================================");
  console.log(`Summary: ${passed} / ${total} security checks passed.`);
  if (passed === total) {
    console.log("🎉 ALL PHASE 1 SECURITY AUDIT CHECKS PASSED PERFECTLY!");
  } else {
    console.error("❌ SOME SECURITY CHECKS FAILED.");
    process.exit(1);
  }
  console.log("================================================================================\n");
}

runSecurityAudit().catch((err) => {
  console.error("Fatal error during security audit:", err);
  process.exit(1);
});
