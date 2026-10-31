import { isUserAdmin, resolveUserRole, isAdminEmail, isAdminUid } from "../lib/auth/role-check";
import { getLocalUsers, findLocalUserByEmail, ensureDefaultAdminUsers } from "../lib/auth/local-auth";

async function runTests() {
  console.log("=============================================================");
  console.log("  VERIFYING RBAC & ADMIN PERMISSION OVERHAUL");
  console.log("=============================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`);
    }
  }

  // 1. Email Whitelist Checks
  assert(isAdminEmail("avaatdesigns.info@gmail.com"), "avaatdesigns.info@gmail.com is identified as admin email");
  assert(isAdminEmail("AVAATDESIGNS.INFO@GMAIL.COM"), "Email check is case-insensitive (uppercase)");
  assert(isAdminEmail("admin@kanhaiya.local"), "admin@kanhaiya.local is identified as admin email");
  assert(isAdminEmail("you@example.com"), "you@example.com is identified as admin email");
  assert(!isAdminEmail("customer@kanhaiya.test"), "Standard customer email is NOT admin");
  assert(!isAdminEmail(null), "Null email safely returns false");

  // 2. UID Whitelist Checks
  assert(isAdminUid("8ccd5c84-1b51-4bed-a3b7-7727387cbaa2"), "UID 8ccd5c84-1b51-4bed-a3b7-7727387cbaa2 is identified as admin UID");
  assert(!isAdminUid("usr_customer_random"), "Customer UID safely returns false");

  // 3. User Object Evaluation Scenarios
  // Scenario A: avaatdesigns.info@gmail.com with unpopulated profile role
  assert(
    isUserAdmin({ id: "8ccd5c84-1b51-4bed-a3b7-7727387cbaa2", email: "avaatdesigns.info@gmail.com" }, null),
    "Target user avaatdesigns.info@gmail.com is admin even before database profile is fetched"
  );

  // Scenario B: avaatdesigns.info@gmail.com where profile.role is currently 'user' (pending migration)
  assert(
    isUserAdmin(
      { id: "8ccd5c84-1b51-4bed-a3b7-7727387cbaa2", email: "avaatdesigns.info@gmail.com" },
      { id: "8ccd5c84-1b51-4bed-a3b7-7727387cbaa2", role: "user" }
    ),
    "Target user avaatdesigns.info@gmail.com is authorized even if profile.role was previously 'user'"
  );

  // Scenario C: Supabase app_metadata admin
  assert(
    isUserAdmin(
      { id: "uid_app_meta", email: "cloud_admin@test.com", app_metadata: { role: "admin" } },
      null
    ),
    "User with Supabase app_metadata.role === 'admin' is authorized"
  );

  // Scenario D: Supabase user_metadata admin
  assert(
    isUserAdmin(
      { id: "uid_user_meta", email: "cloud_admin2@test.com", user_metadata: { role: "admin" } },
      null
    ),
    "User with Supabase user_metadata.role === 'admin' is authorized"
  );

  // Scenario E: Database profiles table role === 'admin'
  assert(
    isUserAdmin(
      { id: "uid_db_admin", email: "db_admin@test.com" },
      { id: "uid_db_admin", role: "admin" }
    ),
    "User with database profiles.role === 'admin' is authorized"
  );

  // Scenario F: Standard regular customer MUST NOT have admin access
  assert(
    !isUserAdmin(
      { id: "usr_customer_normal", email: "customer@example.com", role: "user" },
      { id: "usr_customer_normal", role: "user" }
    ),
    "Standard customer (role === 'user') is strictly denied admin access"
  );

  // Scenario G: Unauthenticated guest MUST NOT have admin access
  assert(!isUserAdmin(null, null), "Unauthenticated guest is strictly denied admin access");

  // 4. Role Resolver String Tests
  assert(
    resolveUserRole({ email: "avaatdesigns.info@gmail.com" }, null) === "admin",
    "resolveUserRole resolves 'admin' for avaatdesigns.info@gmail.com"
  );
  assert(
    resolveUserRole({ email: "customer@example.com", role: "user" }, { role: "user" }) === "user",
    "resolveUserRole resolves 'user' for normal customer"
  );

  // 5. Local Auth Database Verification
  ensureDefaultAdminUsers();
  const localTargetUser = findLocalUserByEmail("avaatdesigns.info@gmail.com");
  assert(Boolean(localTargetUser), "avaatdesigns.info@gmail.com exists in local auth store");
  assert(localTargetUser?.role === "admin", "Local auth record has role === 'admin'");
  assert(localTargetUser?.id === "8ccd5c84-1b51-4bed-a3b7-7727387cbaa2", "Local auth record has the exact target UID");

  console.log("\n=============================================================");
  console.log(`  RESULTS: ${passed}/${total} assertions passed.`);
  console.log("=============================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

