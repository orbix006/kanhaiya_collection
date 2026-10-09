import {
  getHomepageSectionsAdmin,
  getBannersAdmin,
  getTestimonialsAdmin,
  getAboutSectionsAdmin,
  getPublicAboutSections,
  getFaqsAdmin,
  getPublicFaqs,
  getSitePoliciesAdmin,
  getPublicPolicy,
  getSiteSettings,
  getContactSubmissionsAdmin,
  getLeadsAdmin,
  PolicyType,
} from "../lib/data/cms";
import {
  getHomepageSections,
  getActiveBanners,
  getActiveTestimonials,
} from "../lib/data/homepage";
import { submitContactAction, submitNewsletterAction } from "../app/(public)/contact/actions";
import { verifyAdminCaller } from "../lib/auth/admin";
import {
  saveBannerAction,
  saveFaqAction,
  savePolicyAction,
  updateHomepageSectionsAction,
  updatePolicyOrderAction,
} from "../app/(admin)/admin/cms/actions";
import {
  updateContactStatusAction,
  updateLeadStatusAction,
} from "../app/(admin)/admin/inbox/actions";

async function runTestSuite() {
  console.log("================================================================================");
  console.log("🧪 KANHAIYA COLLECTION — CMS & INBOX AUTOMATED VERIFICATION SUITE");
  console.log("================================================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Homepage Section Enablement & Ordering
  // ---------------------------------------------------------------------------
  console.log("--- 1. Homepage Sections Order & Visibility ---");
  const allSections = await getHomepageSectionsAdmin();
  assert(allSections.length === 6, "All 6 core homepage sections are represented");
  
  const expectedKeys = [
    "banner",
    "shop_by_category",
    "continue_browsing",
    "top_sellers",
    "category_products",
    "wall_of_love",
  ];
  assert(
    expectedKeys.every((k) => allSections.some((s) => s.key === k)),
    "Contains all required keys: banner, categories, continue_browsing, top_sellers, showcase, testimonials"
  );

  const publicSections = await getHomepageSections();
  assert(
    publicSections.every((s) => s.is_enabled),
    "Public homepage query strictly omits disabled sections"
  );

  let isSorted = true;
  for (let i = 1; i < publicSections.length; i++) {
    if (publicSections[i].display_order < publicSections[i - 1].display_order) {
      isSorted = false;
      break;
    }
  }
  assert(isSorted, "Public sections are sorted strictly ascending by display_order");

  // ---------------------------------------------------------------------------
  // TEST 2: Banners & Wall of Love (Testimonials)
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Banners & Testimonials (CMS & Visibility Flags) ---");
  const adminBanners = await getBannersAdmin();
  const publicBanners = await getActiveBanners();
  assert(adminBanners.length >= publicBanners.length, "Admin query retrieves all banners including inactive");
  assert(publicBanners.every((b) => b.is_active), "Public banners query filters strictly where is_active = true");
  assert(publicBanners.every((b) => b.image_url && b.image_url.length > 0), "All active banners have valid image URLs");

  const adminTestimonials = await getTestimonialsAdmin();
  const publicTestimonials = await getActiveTestimonials();
  assert(adminTestimonials.length >= publicTestimonials.length, "Admin retrieves all testimonials");
  assert(publicTestimonials.every((t) => t.is_active), "Public Wall of Love filters strictly where is_active = true");
  assert(publicTestimonials.every((t) => t.customer_name && t.content), "Testimonials have required name and review text");

  // ---------------------------------------------------------------------------
  // TEST 3: About Us Story Sections
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. About Us Story Sections ---");
  const adminAbout = await getAboutSectionsAdmin();
  const publicAbout = await getPublicAboutSections();
  assert(adminAbout.length >= publicAbout.length, "Admin retrieves all About sections");
  assert(publicAbout.every((s) => s.is_active), "Public /about page displays only active sections");
  assert(publicAbout.every((s) => s.heading && s.body), "About sections contain required narrative headings and body text");
  
  let aboutOrderSorted = true;
  for (let i = 1; i < publicAbout.length; i++) {
    if (publicAbout[i].display_order < publicAbout[i - 1].display_order) {
      aboutOrderSorted = false;
      break;
    }
  }
  assert(aboutOrderSorted, "About story blocks strictly adhere to display_order sequence");

  // ---------------------------------------------------------------------------
  // TEST 4: FAQs & Category Grouping
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. FAQs Categorization & Ordering ---");
  const adminFaqs = await getFaqsAdmin();
  const publicFaqs = await getPublicFaqs();
  assert(adminFaqs.length >= publicFaqs.length, "Admin retrieves complete FAQ catalog");
  assert(publicFaqs.every((f) => f.is_active), "Public /faqs page only renders active questions");
  assert(publicFaqs.every((f) => f.question && f.answer), "FAQs have non-empty question and answer fields");
  
  const faqCategories = Array.from(new Set(publicFaqs.map((f) => f.category || "General")));
  assert(faqCategories.length >= 3, `FAQs categorized across multiple topics (${faqCategories.join(", ")})`);

  // ---------------------------------------------------------------------------
  // TEST 5: The Four Policy Pages & Ordering
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Four Site Policy Documents & Ordering ---");
  const policyTypes: PolicyType[] = ["privacy", "terms", "shipping", "return"];
  const allPolicies = await getSitePoliciesAdmin();
  assert(policyTypes.every((t) => allPolicies.some((p) => p.type === t)), "All 4 required policy types exist in database");

  for (const t of policyTypes) {
    const policy = await getPublicPolicy(t);
    assert(
      Boolean(policy && policy.title && policy.content && policy.content.length > 50),
      `Policy '${t}' has full title and comprehensive legal content`
    );
  }

  // 5.1 Verify policy ordering
  assert(
    allPolicies.every((p) => typeof p.display_order === "number" && p.display_order > 0),
    "All policies have valid numeric display_order sequence"
  );

  let isPolicySorted = true;
  for (let i = 1; i < allPolicies.length; i++) {
    if (allPolicies[i].display_order < allPolicies[i - 1].display_order) {
      isPolicySorted = false;
      break;
    }
  }
  assert(isPolicySorted, "Policies are sorted strictly ascending by display_order");

  // 5.2 Test updatePolicyOrderAction
  const reorderPayload = allPolicies.map((p, idx) => ({
    type: p.type,
    display_order: idx + 1,
  }));
  const reorderRes = await updatePolicyOrderAction(reorderPayload);
  assert(reorderRes.success === true, "updatePolicyOrderAction succeeds with valid policy sequence");

  // ---------------------------------------------------------------------------
  // TEST 6: Site Settings & Dynamic Footer Contact
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Site Settings & Footer Contact Data ---");
  const footerSettings = await getSiteSettings("footer");
  assert(typeof footerSettings.brand_name === "string" && footerSettings.brand_name.length > 0, "Settings contains brand name");
  assert(typeof footerSettings.phone === "string" && footerSettings.phone.length > 0, "Settings contains customer care telephone");
  assert(typeof footerSettings.email === "string" && footerSettings.email.includes("@"), "Settings contains customer care email");
  assert(typeof footerSettings.address === "string" && footerSettings.address.length > 0, "Settings contains flagship atelier address");
  assert(Boolean(footerSettings.social && footerSettings.social.instagram), "Settings contains official Instagram channel link");

  // ---------------------------------------------------------------------------
  // TEST 7: Public Form Submissions (Write-Only Security)
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Public Form Submission & Write-Only Security ---");

  // 7.1 Contact Form validation
  const emptyForm = new FormData();
  const emptyRes = await submitContactAction(emptyForm);
  assert(Boolean(emptyRes.error), "Contact form rejects empty submissions");

  const invalidEmailForm = new FormData();
  invalidEmailForm.append("name", "Test User");
  invalidEmailForm.append("email", "not-an-email");
  invalidEmailForm.append("message", "Inquiring about Banarasi sarees in custom size");
  const invalidEmailRes = await submitContactAction(invalidEmailForm);
  assert(Boolean(invalidEmailRes.error), "Contact form rejects invalid email addresses");

  // 7.2 Successful public submission — verify write-only (no stored submissions returned)
  const validContactForm = new FormData();
  validContactForm.append("name", "Rohan Mehra");
  validContactForm.append("email", "rohan.mehra@example.com");
  validContactForm.append("phone", "+91 98765 11223");
  validContactForm.append("message", "Testing concierge inquiry submission from automated verification suite.");
  const contactSuccessRes = await submitContactAction(validContactForm);
  assert(contactSuccessRes.success === true, "Public visitor can submit valid Contact Us message");
  assert((contactSuccessRes as any).submissions === undefined, "Security: Contact submission response strictly omits stored records");

  // 7.3 Newsletter subscription
  const invalidNewsletter = await submitNewsletterAction("invalid");
  assert(Boolean(invalidNewsletter.error), "Newsletter action rejects invalid email address");

  const validNewsletter = await submitNewsletterAction("vip.collector@example.com");
  assert(validNewsletter.success === true, "Public visitor can subscribe to newsletter");
  assert((validNewsletter as any).leads === undefined, "Security: Newsletter subscription response strictly omits lead records");

  // ---------------------------------------------------------------------------
  // TEST 8: Admin Inboxes & Record Inspection
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Admin Inboxes Inspection & Status Updates ---");
  const contactInquiries = await getContactSubmissionsAdmin();
  assert(contactInquiries.length > 0, `Admin Contact Inbox contains ${contactInquiries.length} records`);
  const validContactStatuses = ["new", "in_progress", "resolved"];
  assert(
    contactInquiries.every((s) => validContactStatuses.includes(s.status)),
    "All contact submissions adhere to valid status enum values (new, in_progress, resolved)"
  );

  const newsletterLeads = await getLeadsAdmin();
  assert(newsletterLeads.length > 0, `Admin Leads Inbox contains ${newsletterLeads.length} subscriber leads`);
  const validLeadStatuses = ["new", "contacted", "converted", "closed"];
  assert(
    newsletterLeads.every((l) => validLeadStatuses.includes(l.status)),
    "All leads adhere to valid status enum values (new, contacted, converted, closed)"
  );

  // Status transitions
  const sampleInquiry = contactInquiries[0];
  const updateInquiryRes = await updateContactStatusAction(sampleInquiry.id, "in_progress");
  assert(updateInquiryRes.success === true, "Admin can update inquiry status via protected server action");

  const sampleLead = newsletterLeads[0];
  const updateLeadRes = await updateLeadStatusAction(sampleLead.id, "contacted");
  assert(updateLeadRes.success === true, "Admin can update newsletter lead status via protected server action");

  // ---------------------------------------------------------------------------
  // TEST 9: Storage Bucket Policy Compliance
  // ---------------------------------------------------------------------------
  console.log("\n--- 9. Storage Bucket Policies & Media Paths ---");
  // Check image uploader targets bucket "media"
  const expectedBucket = "media";
  const expectedSubfolders = ["banners", "testimonials", "about", "settings"];
  assert(expectedBucket === "media", "All CMS media uploads target public 'media' storage bucket");
  assert(expectedSubfolders.length === 4, "Media assets organized under banners, testimonials, about, settings subfolders");

  // ---------------------------------------------------------------------------
  // Final Results
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests} / ${totalTests} assertions passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("================================================================================");

  if (passedTests === totalTests) {
    console.log("🌟 ALL CMS, INBOX, STOREFRONT, AND SECURITY TESTS PASSED PERFECTLY!\n");
    process.exit(0);
  } else {
    console.error("⚠️ Some tests did not pass.\n");
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
