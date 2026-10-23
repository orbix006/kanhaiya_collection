import { submitContactAction, submitNewsletterAction } from "../app/(public)/contact/actions";
import {
  mapPolicyTypeToDatabase,
  isSupportedDatabasePolicyType,
  SUPPORTED_DB_POLICY_TYPES,
  getPublicPolicy,
  type PolicyType,
} from "../lib/data/cms";
import { CONTACT_CONFIG } from "../lib/constants";
import sitemap from "../app/sitemap";
import { loadMockStore, saveMockStore } from "../lib/mock-data/admin-store";

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${name}`);
    results.push({ name, passed: true });
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${name} ${details ? `(${details})` : ""}`);
    results.push({ name, passed: false, details });
  }
}

async function runPhase3Tests() {
  console.log("\n========================================================");
  console.log(" PHASE 3 — CONTACT, SEO, POLICIES & ROUTING VERIFICATION");
  console.log("========================================================\n");

  const originalStore = JSON.parse(JSON.stringify(loadMockStore()));

  try {
    // -------------------------------------------------------------------------
    // TEST SECTION 1: Contact Form Validation & Submission Handling
    // -------------------------------------------------------------------------
    console.log("--- Section 1: Contact Form Validation & Submission ---");

    // 1. Empty submission
    const emptyForm = new FormData();
    const emptyRes = await submitContactAction(emptyForm);
    assert(
      !emptyRes.success && Boolean(emptyRes.fieldErrors?.name && emptyRes.fieldErrors?.email && emptyRes.fieldErrors?.message),
      "Empty form submission returns validation errors for all required fields"
    );

    // 2. Invalid email format
    const badEmailForm = new FormData();
    badEmailForm.append("name", "Arjun Sharma");
    badEmailForm.append("email", "not-a-valid-email");
    badEmailForm.append("message", "Inquiry regarding custom brass murti sizing.");
    const badEmailRes = await submitContactAction(badEmailForm);
    assert(
      !badEmailRes.success && Boolean(badEmailRes.fieldErrors?.email),
      "Rejects invalid email format"
    );

    // 3. Short message (< 10 chars)
    const shortMsgForm = new FormData();
    shortMsgForm.append("name", "Arjun Sharma");
    shortMsgForm.append("email", "arjun@example.com");
    shortMsgForm.append("message", "Hi");
    const shortMsgRes = await submitContactAction(shortMsgForm);
    assert(
      !shortMsgRes.success && Boolean(shortMsgRes.fieldErrors?.message),
      "Rejects short messages below 10 characters"
    );

    // 4. Invalid phone number
    const badPhoneForm = new FormData();
    badPhoneForm.append("name", "Arjun Sharma");
    badPhoneForm.append("email", "arjun@example.com");
    badPhoneForm.append("phone", "123");
    badPhoneForm.append("message", "Inquiry regarding custom brass murti sizing.");
    const badPhoneRes = await submitContactAction(badPhoneForm);
    assert(
      !badPhoneRes.success && Boolean(badPhoneRes.fieldErrors?.phone),
      "Rejects phone numbers with fewer than 7 digits"
    );

    // 5. Valid submission & Local persistence
    const testEmail = `test.devotee.${Date.now()}@example.com`;
    const validForm = new FormData();
    validForm.append("name", "Bhakti Patel");
    validForm.append("email", testEmail);
    validForm.append("phone", "+91 98220 11223");
    validForm.append("message", "Requesting custom temple sanctum brass bell consultation.");
    const validRes = await submitContactAction(validForm);
    assert(
      Boolean(validRes.success && validRes.message),
      "Valid submission succeeds and returns friendly confirmation"
    );

    const reloadedStore = loadMockStore();
    const foundSubmission = (reloadedStore.contactSubmissions || []).find((s) => s.email === testEmail);
    assert(
      Boolean(foundSubmission && foundSubmission.name === "Bhakti Patel" && foundSubmission.status === "new"),
      "Contact inquiry is safely persisted into message storage / local store"
    );

    // 6. Newsletter Subscription
    const newsletterRes = await submitNewsletterAction("subscriber@example.com", "Devotee Reader");
    assert(
      Boolean(newsletterRes.success),
      "Newsletter lead capture succeeds"
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 2: Sitemap & Canonical Product URLs
    // -------------------------------------------------------------------------
    console.log("\n--- Section 2: Sitemap & Canonical URLs ---");

    const sitemapEntries = await sitemap();
    assert(Array.isArray(sitemapEntries) && sitemapEntries.length > 0, "Sitemap generates successfully");

    const sitemapUrls = sitemapEntries.map((e) => e.url);

    // Check base URL has no trailing double slashes
    const hasDoubleSlashes = sitemapUrls.some((u) => u.includes("kanhaiyacollection.com//"));
    assert(!hasDoubleSlashes, "Base URL normalization prevents double slashes (no '//')");

    // Product routes must use canonical /shop/product/[slug]
    const productEntries = sitemapUrls.filter((u) => u.includes("/product"));
    assert(productEntries.length > 0, `Sitemap contains product URLs (found: ${productEntries.length})`);

    const allCanonical = productEntries.every((u) => u.includes("/shop/product/"));
    assert(allCanonical, "All product sitemap entries use canonical route: /shop/product/[slug]");

    const hasObsoleteProductRoutes = sitemapUrls.some(
      (u) => u.includes("/products/") || (u.includes("/shop/") && !u.includes("/shop/product/") && !u.includes("/shop?category="))
    );
    assert(!hasObsoleteProductRoutes, "Sitemap contains NO obsolete /products/[slug] or /shop/[slug] routes");

    // Canonical static routes checks
    assert(sitemapUrls.some((u) => u.endsWith("/faqs")), "Sitemap includes canonical /faqs");
    assert(!sitemapUrls.some((u) => u.endsWith("/faq")), "Sitemap excludes redirecting /faq");
    assert(sitemapUrls.some((u) => u.endsWith("/return")), "Sitemap includes canonical /return");
    assert(!sitemapUrls.some((u) => u.endsWith("/refund")), "Sitemap excludes redirecting /refund");
    assert(sitemapUrls.some((u) => u.endsWith("/privacy")), "Sitemap includes canonical /privacy");
    assert(!sitemapUrls.some((u) => u.endsWith("/privacy-policy")), "Sitemap excludes noncanonical /privacy-policy");

    // -------------------------------------------------------------------------
    // TEST SECTION 3: Policy Database Enum & Type-Safe Mapping
    // -------------------------------------------------------------------------
    console.log("\n--- Section 3: Policy Types & Database Enum Safety ---");

    assert(
      SUPPORTED_DB_POLICY_TYPES.length === 4 &&
      SUPPORTED_DB_POLICY_TYPES.includes("privacy") &&
      SUPPORTED_DB_POLICY_TYPES.includes("terms") &&
      SUPPORTED_DB_POLICY_TYPES.includes("shipping") &&
      SUPPORTED_DB_POLICY_TYPES.includes("return"),
      "Database policy enum accurately reflects postgres schema ('privacy','terms','shipping','return')"
    );

    assert(mapPolicyTypeToDatabase("privacy") === "privacy", "mapPolicyTypeToDatabase('privacy') maps to 'privacy'");
    assert(mapPolicyTypeToDatabase("terms") === "terms", "mapPolicyTypeToDatabase('terms') maps to 'terms'");
    assert(mapPolicyTypeToDatabase("shipping") === "shipping", "mapPolicyTypeToDatabase('shipping') maps to 'shipping'");
    assert(mapPolicyTypeToDatabase("return") === "return", "mapPolicyTypeToDatabase('return') maps to 'return'");
    assert(mapPolicyTypeToDatabase("refund") === "return", "mapPolicyTypeToDatabase('refund') maps to canonical 'return'");
    assert(mapPolicyTypeToDatabase("cancellation") === null, "mapPolicyTypeToDatabase('cancellation') returns null (safe unsupported enum)");

    assert(isSupportedDatabasePolicyType("return") === true, "isSupportedDatabasePolicyType('return') is true");
    assert(isSupportedDatabasePolicyType("cancellation") === false, "isSupportedDatabasePolicyType('cancellation') is false");

    // Test getPublicPolicy for all types
    const typesToTest: PolicyType[] = ["terms", "privacy", "shipping", "return", "refund", "cancellation"];
    for (const pType of typesToTest) {
      const pol = await getPublicPolicy(pType);
      assert(
        Boolean(pol && pol.title && pol.content && pol.content.length > 50),
        `getPublicPolicy('${pType}') successfully returns substantive policy content`
      );
    }

    const returnPol = await getPublicPolicy("return");
    assert(
      returnPol.title.includes("Return & Refund"),
      "Return policy has combined canonical title 'Return & Refund Policy'"
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 4: Contact Information Verification
    // -------------------------------------------------------------------------
    console.log("\n--- Section 4: Contact Information Verification ---");

    const phoneUrl = CONTACT_CONFIG.phoneUrl;
    const whatsappUrl = CONTACT_CONFIG.whatsappUrl;

    assert(!phoneUrl.includes("0000000000"), "CONTACT_CONFIG.phoneUrl does not contain fake 0000000000");
    assert(!whatsappUrl.includes("0000000000"), "CONTACT_CONFIG.whatsappUrl does not contain fake 0000000000");
    assert(phoneUrl.includes("9829012345"), `CONTACT_CONFIG.phoneUrl uses verified number (+91 98290 12345)`);
    assert(whatsappUrl.includes("9829012345"), `CONTACT_CONFIG.whatsappUrl uses verified number (+91 98290 12345)`);
    assert(CONTACT_CONFIG.email === "care@kanhaiyacollection.com", "CONTACT_CONFIG.email is care@kanhaiyacollection.com");

  } finally {
    saveMockStore(originalStore);
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log("\n========================================================");
  console.log(`PHASE 3 VERIFICATION COMPLETE: ${passed}/${results.length} Passed (${failed} Failed)`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
