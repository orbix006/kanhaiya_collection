import {
  getPublicAboutSections,
  getPublicFaqs,
  getPublicPolicies,
  getPublicPolicy,
  getSiteSettings,
  FALLBACK_ABOUT_SECTIONS,
  FALLBACK_FAQS,
  FALLBACK_POLICIES,
  FALLBACK_FOOTER_SETTINGS,
} from "../lib/data/cms";
import { submitContactAction, submitNewsletterAction } from "../app/(public)/contact/actions";
import { createClient } from "@supabase/supabase-js";

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`, details ?? "");
    failedTests++;
  }
}

async function runVerification() {
  console.log("=================================================");
  console.log("🚀 Starting Public CMS, Security & Form Validation Tests");
  console.log("=================================================\n");

  // ---------------------------------------------------------------------------
  // 1. Verify Public CMS Data Fetching
  // ---------------------------------------------------------------------------
  console.log("📋 1. Verifying Public CMS Data Functions...");

  const aboutSections = await getPublicAboutSections();
  assert(Array.isArray(aboutSections) && aboutSections.length > 0, "About sections load properly");
  assert(aboutSections.every((s) => s.heading && s.body), "All about sections contain headings and body text");

  const faqs = await getPublicFaqs();
  assert(Array.isArray(faqs) && faqs.length > 0, "FAQs load properly");
  assert(faqs.every((f) => f.question && f.answer), "All FAQs contain question and answer");

  const policies = await getPublicPolicies();
  assert(Array.isArray(policies) && policies.length >= 4, "Public policies load at least 4 policies");

  const privacy = await getPublicPolicy("privacy");
  assert(privacy.type === "privacy" && privacy.content.length > 50, "Privacy policy loads with full markdown content");

  const terms = await getPublicPolicy("terms");
  assert(terms.type === "terms" && terms.content.length > 50, "Terms policy loads with full markdown content");

  const shipping = await getPublicPolicy("shipping");
  assert(shipping.type === "shipping" && shipping.content.length > 50, "Shipping policy loads with full markdown content");

  const returnPolicy = await getPublicPolicy("return");
  assert(returnPolicy.type === "return" && returnPolicy.content.length > 50, "Return policy loads with full markdown content");

  const settings = await getSiteSettings("footer");
  assert(Boolean(settings.brand_name && settings.email && settings.phone), "Site settings footer has brand, email, and phone");

  // ---------------------------------------------------------------------------
  // 2. Verify Row-Level Security: Public cannot read private submissions or leads
  // ---------------------------------------------------------------------------
  console.log("\n🔒 2. Verifying Row-Level Security (Write-Only Submissions)...");

  const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && anonUrl !== "https://placeholder-project.supabase.co";

  if (isConfigured) {
    const publicClient = createClient(anonUrl, anonKey);

    // Attempt to SELECT from contact_submissions as an unauthenticated visitor
    const { data: contactData, error: contactError } = await publicClient
      .from("contact_submissions")
      .select("*");
    
    // In Supabase with RLS enabled and no select policy, data is empty [] or returns error
    const contactReadForbidden = contactError !== null || (Array.isArray(contactData) && contactData.length === 0);
    assert(contactReadForbidden, "Public unauthenticated client CANNOT read private contact_submissions (RLS write-only enforced)");

    // Attempt to SELECT from leads as an unauthenticated visitor
    const { data: leadsData, error: leadsError } = await publicClient
      .from("leads")
      .select("*");
    
    const leadsReadForbidden = leadsError !== null || (Array.isArray(leadsData) && leadsData.length === 0);
    assert(leadsReadForbidden, "Public unauthenticated client CANNOT read private leads (RLS write-only enforced)");
  } else {
    console.log("  ℹ️ Database URL is placeholder (demo mode). Verifying database schema SQL definition...");
    // Let's verify schema.sql rules in code
    const fs = await import("fs");
    const schemaSql = fs.readFileSync("database/schema.sql", "utf8");
    const hasContactInsertAnyone = schemaSql.includes('create policy "contact_insert_anyone" on public.contact_submissions for insert with check (true);');
    const hasContactAdminOnly = schemaSql.includes('create policy "contact_admin_all"     on public.contact_submissions for all using (public.is_admin()) with check (public.is_admin());');
    const hasLeadsInsertAnyone = schemaSql.includes('create policy "leads_insert_anyone" on public.leads for insert with check (true);');
    const hasLeadsAdminOnly = schemaSql.includes('create policy "leads_admin_all"     on public.leads for all using (public.is_admin()) with check (public.is_admin());');

    assert(hasContactInsertAnyone && hasContactAdminOnly, "Schema enforces write-only insert for anyone, full CRUD only for admin on contact_submissions");
    assert(hasLeadsInsertAnyone && hasLeadsAdminOnly, "Schema enforces write-only insert for anyone, full CRUD only for admin on leads");
  }

  // ---------------------------------------------------------------------------
  // 3. Contact Form Validation Tests
  // ---------------------------------------------------------------------------
  console.log("\n📝 3. Verifying Contact Inquiry Form Validation & Failure States...");

  // Missing name
  const missingNameForm = new FormData();
  missingNameForm.append("name", " ");
  missingNameForm.append("email", "customer@example.com");
  missingNameForm.append("message", "This is an inquiry message with enough characters.");
  const resMissingName = await submitContactAction(missingNameForm);
  assert(resMissingName.success === false && Boolean(resMissingName.fieldErrors?.name), "Rejects empty or missing name");

  // Invalid email
  const invalidEmailForm = new FormData();
  invalidEmailForm.append("name", "Devika Roy");
  invalidEmailForm.append("email", "not-a-valid-email");
  invalidEmailForm.append("message", "This is an inquiry message with enough characters.");
  const resInvalidEmail = await submitContactAction(invalidEmailForm);
  assert(resInvalidEmail.success === false && Boolean(resInvalidEmail.fieldErrors?.email), "Rejects invalid email format");

  // Invalid phone (too short or letters)
  const invalidPhoneForm = new FormData();
  invalidPhoneForm.append("name", "Devika Roy");
  invalidPhoneForm.append("email", "devika@example.com");
  invalidPhoneForm.append("phone", "123");
  invalidPhoneForm.append("message", "This is an inquiry message with enough characters.");
  const resInvalidPhone = await submitContactAction(invalidPhoneForm);
  assert(resInvalidPhone.success === false && Boolean(resInvalidPhone.fieldErrors?.phone), "Rejects invalid phone number (< 7 digits)");

  // Valid optional phone
  const validPhoneForm = new FormData();
  validPhoneForm.append("name", "Devika Roy");
  validPhoneForm.append("email", "devika@example.com");
  validPhoneForm.append("phone", "+91 98290 12345");
  validPhoneForm.append("message", "This is an inquiry message with enough characters.");
  const resValidPhone = await submitContactAction(validPhoneForm);
  assert(resValidPhone.success === true, "Accepts valid phone formatted number");

  // Message too short (< 10 chars)
  const shortMsgForm = new FormData();
  shortMsgForm.append("name", "Devika Roy");
  shortMsgForm.append("email", "devika@example.com");
  shortMsgForm.append("message", "Too short");
  const resShortMsg = await submitContactAction(shortMsgForm);
  assert(resShortMsg.success === false && Boolean(resShortMsg.fieldErrors?.message), "Rejects message shorter than 10 characters");

  // Valid full submission
  const validForm = new FormData();
  validForm.append("name", "Siddharth Rao");
  validForm.append("email", "siddharth.rao@example.com");
  validForm.append("phone", "+91 98111 22334");
  validForm.append("message", "We are interested in bespoke wedding sherwanis for a family event.");
  const resValid = await submitContactAction(validForm);
  assert(resValid.success === true && Boolean(resValid.message), "Successfully accepts and processes valid contact submission");

  // ---------------------------------------------------------------------------
  // 4. Newsletter Capture & Anti-Enumeration Privacy Tests
  // ---------------------------------------------------------------------------
  console.log("\n📬 4. Verifying Newsletter Capture & Anti-Enumeration Privacy...");

  // Invalid email
  const newsInvalid = await submitNewsletterAction("bad-email");
  assert(newsInvalid.success === false && Boolean(newsInvalid.error), "Newsletter rejects invalid email");

  // Valid email subscription
  const testEmail = `subscriber-${Date.now()}@example.com`;
  const newsValid1 = await submitNewsletterAction(testEmail);
  assert(newsValid1.success === true && Boolean(newsValid1.message), "Newsletter accepts valid email subscription");

  // Duplicate email subscription: Must return identical success and NOT leak whether email already exists
  const newsValid2 = await submitNewsletterAction(testEmail);
  assert(
    newsValid2.success === true && newsValid2.message === newsValid1.message,
    "Newsletter does NOT expose existing email: returns identical friendly success message for duplicates"
  );

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n=================================================");
  console.log(`Results: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("=================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
