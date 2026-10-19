import fs from "fs";
import path from "path";
import {
  registerLocalUser,
  authenticateLocalUser,
  findLocalUserByEmail,
  setLocalUserRole,
  getLocalUsers,
} from "../lib/auth/local-auth";

async function runAuthVerification() {
  console.log("================================================================================");
  console.log("🧪 Kanhaiya Collection — Authentication & Admin Security Test Suite");
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

  // 1. Data Integrity Check: Verify existing catalog data is intact
  console.log("--- 1. Data & Storefront Preservation Check ---");
  const storePath = path.join(process.cwd(), "data", "ecomm_store.json");
  assert(fs.existsSync(storePath), "data/ecomm_store.json exists and is preserved");
  const storeData = JSON.parse(fs.readFileSync(storePath, "utf-8"));
  assert(Array.isArray(storeData.products) && storeData.products.length > 0, "Products catalog is preserved intact");
  assert(Array.isArray(storeData.categories) && storeData.categories.length > 0, "Categories catalog is preserved intact");
  assert(Array.isArray(storeData.banners) && storeData.banners.length > 0, "Hero banners are preserved intact");

  // 2. Signup Validation & Execution
  console.log("\n--- 2. Signup Functionality & Default Security Role ---");
  const testEmail = `testuser-${Date.now()}@example.com`;
  const testPassword = "SecurePassword123!";

  // 2.1 Successful registration
  const regResult = await registerLocalUser({
    fullName: "Test Customer",
    email: testEmail,
    password: testPassword,
  });

  assert(Boolean(regResult.user), "User account registered successfully");
  assert(regResult.user?.email === testEmail, "Email stored accurately");
  assert(regResult.user?.role === "user", "CRITICAL SECURITY: New user strictly assigned 'user' role (not admin)");
  assert(Boolean(regResult.user?.password_hash && regResult.user?.salt), "Password cryptographically hashed with salt (never plaintext)");

  // 2.2 Duplicate email rejection
  const dupResult = await registerLocalUser({
    fullName: "Duplicate User",
    email: testEmail,
    password: "DifferentPassword123",
  });
  assert(Boolean(dupResult.error), "Rejects duplicate signup for already registered email");

  // 3. Login Authentication
  console.log("\n--- 3. Login Authentication & Credential Verification ---");

  // 3.1 Invalid password rejected
  const badPassResult = await authenticateLocalUser({
    email: testEmail,
    password: "WrongPassword!",
  });
  assert(Boolean(badPassResult.error), "Rejects incorrect password with error message");

  // 3.2 Non-existent user rejected
  const nonExistentResult = await authenticateLocalUser({
    email: "nobody@example.com",
    password: "AnyPassword123",
  });
  assert(Boolean(nonExistentResult.error), "Rejects non-existent email with error message");

  // 3.3 Valid credentials accepted
  const validLogin = await authenticateLocalUser({
    email: testEmail,
    password: testPassword,
  });
  assert(Boolean(validLogin.user), "Logs in successfully with valid credentials");
  assert(validLogin.user?.id === regResult.user?.id, "Authenticated user ID matches registered account");

  // 4. Admin Role System & Promotion Guard
  console.log("\n--- 4. Role-Based Access Control (RBAC) & Admin Promotion ---");

  // 4.1 Ordinary user cannot be an admin
  const userBeforePromotion = findLocalUserByEmail(testEmail);
  assert(userBeforePromotion?.role === "user", "Customer role is verified as standard 'user'");

  // 4.2 Legitimate promotion to administrator
  const promotedUser = await setLocalUserRole(testEmail, "admin");
  assert(promotedUser?.role === "admin", "Promotes user to 'admin' role via authoritative mechanism");

  // 4.3 Verified login reflects admin role
  const adminLogin = await authenticateLocalUser({
    email: testEmail,
    password: testPassword,
  });
  assert(adminLogin.user?.role === "admin", "Admin role persists on re-authentication");

  // 4.4 Demotion / role change safety
  const demotedUser = await setLocalUserRole(testEmail, "user");
  assert(demotedUser?.role === "user", "Role can be toggled back to 'user'");

  console.log("\n================================================================================");
  console.log(`Summary: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log("🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!");
  } else {
    console.error("❌ SOME TESTS FAILED.");
    process.exit(1);
  }
  console.log("================================================================================\n");
}

runAuthVerification().catch((err) => {
  console.error("Verification suite encountered an error:", err);
  process.exit(1);
});
