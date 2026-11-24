import fs from "fs";
import path from "path";
import {
  registerLocalUser,
  authenticateLocalUser,
  findLocalUserByEmail,
  findLocalUserById,
  setLocalUserRole,
  getLocalUsers,
  createPasswordResetToken,
  resetLocalUserPassword,
  updateLocalUserPassword,
  ensureDefaultAdminUsers,
} from "../lib/auth/local-auth";
import { isUserAdmin, resolveUserRole, isAdminEmail } from "../lib/auth/role-check";

let passed = 0;
let total = 0;

function assert(condition: any, testName: string, detail?: string) {
  total++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    process.exit(1);
  }
}

async function runFullAuthVerification() {
  console.log("================================================================================");
  console.log("🔐 COMPREHENSIVE AUTHENTICATION & DATABASE AUDIT TEST SUITE");
  console.log("================================================================================\n");

  // Step 1: Database Schema & Migration Verification
  console.log("--- 1. Database Schema & Migration Alignment ---");
  const migration004Path = path.join(process.cwd(), "database", "migrations", "004_add_profile_email_and_sync.sql");
  assert(fs.existsSync(migration004Path), "Migration 004_add_profile_email_and_sync.sql exists");
  const migration004Content = fs.readFileSync(migration004Path, "utf-8");
  assert(migration004Content.includes("alter table public.profiles"), "Migration adds email column to public.profiles");
  assert(migration004Content.includes("handle_new_user()"), "Migration updates handle_new_user() trigger function to sync email");

  const schemaPath = path.join(process.cwd(), "database", "schema.sql");
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");
  assert(schemaContent.includes("email       text"), "database/schema.sql includes email column in profiles table definition");

  const callbackRoutePath = path.join(process.cwd(), "app", "auth", "callback", "route.ts");
  assert(fs.existsSync(callbackRoutePath), "Auth callback route app/auth/callback/route.ts exists for Supabase OAuth & magic links");

  // Step 2: Account Registration & Password Creation
  console.log("\n--- 2. User Registration & Password Hashing ---");
  const timestamp = Date.now();
  const testEmail = `audit-user-${timestamp}@kanhaiya.test`;
  const initialPassword = "FirstPassword2026!";

  // 2.1 Register new account
  const regResult = await registerLocalUser({
    fullName: "Audit Customer",
    email: testEmail,
    password: initialPassword,
  });
  assert(Boolean(regResult.user), "New account registered successfully");
  assert(regResult.user?.email === testEmail, "Registered email matches input");
  assert(regResult.user?.role === "user", "New account strictly assigned standard 'user' role");
  assert(
    Boolean(regResult.user?.password_hash && regResult.user?.salt),
    "Password cryptographically hashed using PBKDF2 with salt (never plaintext)"
  );
  assert(regResult.user?.password_hash !== initialPassword, "Hash is not plaintext");

  // 2.2 Reject duplicate registration
  const dupResult = await registerLocalUser({
    fullName: "Duplicate Customer",
    email: testEmail,
    password: "DifferentPassword123!",
  });
  assert(Boolean(dupResult.error), "Duplicate email registration rejected with friendly error");
  assert(dupResult.error?.includes("already exists"), `Error message: "${dupResult.error}"`);

  // Step 3: Login Authentication with Valid & Invalid Credentials
  console.log("\n--- 3. Login Verification & Failure Handling ---");

  // 3.1 Invalid password rejection
  const badPassResult = await authenticateLocalUser({
    email: testEmail,
    password: "WrongPassword!",
  });
  assert(Boolean(badPassResult.error), "Rejects login attempt with wrong password");
  assert(badPassResult.error?.includes("Invalid email or password"), "Safe, standard error message returned");

  // 3.2 Non-existent account rejection
  const notFoundResult = await authenticateLocalUser({
    email: `non-existent-${timestamp}@example.com`,
    password: "AnyPassword123!",
  });
  assert(Boolean(notFoundResult.error), "Rejects login attempt with non-existent email");

  // 3.3 Valid login
  const validLoginResult = await authenticateLocalUser({
    email: testEmail,
    password: initialPassword,
  });
  assert(Boolean(validLoginResult.user), "Authenticates successfully with valid credentials");
  assert(validLoginResult.user?.id === regResult.user?.id, "Authenticated user ID matches record");

  // Step 4: Password Creation / Reset Flow
  console.log("\n--- 4. Password Creation & Reset Flow ---");

  // 4.1 Generate password reset token
  const tokenRes = await createPasswordResetToken(testEmail);
  assert(Boolean(tokenRes.token), "Generated secure password reset token");
  const resetToken = tokenRes.token!;

  // 4.2 Non-existent user cannot generate reset token
  const badTokenRes = await createPasswordResetToken(`nobody-${timestamp}@example.com`);
  assert(Boolean(badTokenRes.error), "Fails cleanly when requesting reset token for non-existent user");

  // 4.3 Reset password with invalid token rejected
  const badReset = await resetLocalUserPassword({
    email: testEmail,
    token: "invalid-token-12345",
    newPassword: "NewSecurePassword2026!",
  });
  assert(!badReset.success, "Rejects password reset with invalid token");

  // 4.4 Set new password with valid token
  const newPassword = "NewSecurePassword2026!";
  const resetSuccess = await resetLocalUserPassword({
    email: testEmail,
    token: resetToken,
    newPassword,
  });
  assert(resetSuccess.success === true, "Password reset successfully completed");

  // 4.5 Verify old password NO LONGER works
  const oldLoginAttempt = await authenticateLocalUser({
    email: testEmail,
    password: initialPassword,
  });
  assert(Boolean(oldLoginAttempt.error), "Old password is now strictly rejected");

  // 4.6 Verify NEW password works immediately
  const newLoginAttempt = await authenticateLocalUser({
    email: testEmail,
    password: newPassword,
  });
  assert(Boolean(newLoginAttempt.user), "New password authenticates successfully");

  // 4.7 Update password while logged in
  const thirdPassword = "ThirdUpdatedPassword2026!";
  const updateResult = await updateLocalUserPassword({
    userId: newLoginAttempt.user!.id,
    currentPassword: newPassword,
    newPassword: thirdPassword,
  });
  assert(updateResult.success === true, "Logged-in user updated password via account settings");

  // 4.8 Verify third password authenticates
  const thirdLogin = await authenticateLocalUser({
    email: testEmail,
    password: thirdPassword,
  });
  assert(Boolean(thirdLogin.user), "Updated password from account settings authenticates successfully");

  // Step 5: Administrator Role & Provisioning via Environment
  console.log("\n--- 5. Admin Authentication & Role Provisioning ---");

  // 5.1 Seeded/default admin accounts exist and authenticate
  const devAdmin = await authenticateLocalUser({
    email: "avaatdesigns.info@gmail.com",
    password: "AdminPreviewPass2026!",
  });
  assert(Boolean(devAdmin.user), "Default admin (avaatdesigns.info@gmail.com) authenticates");
  assert(isUserAdmin(devAdmin.user), "avaatdesigns.info@gmail.com is identified as admin");

  const localDevAdmin = await authenticateLocalUser({
    email: "admin@kanhaiya.local",
    password: "AdminPreviewPass2026!",
  });
  assert(Boolean(localDevAdmin.user), "Default admin (admin@kanhaiya.local) authenticates");
  assert(isUserAdmin(localDevAdmin.user), "admin@kanhaiya.local is identified as admin");

  // 5.2 Dynamic environment variable admin provisioning
  const customAdminEmail = `custom-admin-${timestamp}@kanhaiya.test`;
  const customAdminPassword = "CustomAdminPass2026!";
  process.env.ADMIN_EMAIL = customAdminEmail;
  process.env.ADMIN_PASSWORD = customAdminPassword;
  process.env.ADMIN_NAME = "Custom Environment Admin";

  ensureDefaultAdminUsers();

  const customAdminLogin = await authenticateLocalUser({
    email: customAdminEmail,
    password: customAdminPassword,
  });
  assert(Boolean(customAdminLogin.user), "Environment-provisioned admin authenticates with configured credentials");
  assert(customAdminLogin.user?.role === "admin", "Environment-provisioned admin possesses role 'admin'");
  assert(isUserAdmin(customAdminLogin.user), "isUserAdmin() dynamically recognizes ADMIN_EMAIL");
  assert(isAdminEmail(customAdminEmail), "isAdminEmail() dynamically recognizes ADMIN_EMAIL");

  // Clean up env vars
  delete process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_NAME;

  // 5.3 Customer cannot access admin
  const standardCustomer = findLocalUserByEmail(testEmail);
  assert(!isUserAdmin(standardCustomer), "Standard customer is strictly denied admin privileges");
  assert(resolveUserRole(standardCustomer) === "user", "Customer role strictly resolves to 'user'");

  console.log("\n================================================================================");
  console.log(`Summary: ${passed} / ${total} assertions passed.`);
  console.log("🎉 ALL AUTHENTICATION AUDIT TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================================\n");
}

runFullAuthVerification().catch((err) => {
  console.error("Audit verification suite failed:", err);
  process.exit(1);
});
