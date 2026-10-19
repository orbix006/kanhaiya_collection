/**
 * Phase 6 Verification Test Suite: Content Management, Contact Inbox, Leads, and Site Settings
 * Validates schema fidelity to `schema ecomm.txt`, CRUD operations, status transitions,
 * reordering, preview integrity, validations, and admin route rendering.
 */

import {
  SEED_ABOUT_SECTIONS,
  SEED_FAQS,
  SEED_POLICIES,
  SEED_SETTINGS,
  SEED_CONTACT_SUBMISSIONS,
  SEED_LEADS,
  loadMockAboutSections,
  saveMockAboutSection,
  deleteMockAboutSection,
  toggleMockAboutSectionStatus,
  reorderMockAboutSections,
  loadMockFaqs,
  saveMockFaq,
  deleteMockFaq,
  toggleMockFaqStatus,
  reorderMockFaqs,
  loadMockPolicies,
  getMockPolicyByType,
  saveMockPolicy,
  loadMockSettings,
  saveMockSettings,
  loadMockContactSubmissions,
  getMockContactSubmissionById,
  updateMockContactStatus,
  deleteMockContactSubmission,
  loadMockLeads,
  getMockLeadById,
  updateMockLeadStatus,
  deleteMockLead,
  loadMockStore,
  saveMockStore,
  getInitialMockStore,
} from "../lib/mock-data/admin-store";
import {
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

const BASE_URL = "http://localhost:3000";

interface TestReport {
  category: string;
  name: string;
  passed: boolean;
  message?: string;
}

const reports: TestReport[] = [];

function assert(category: string, name: string, condition: boolean, message?: string) {
  reports.push({
    category,
    name,
    passed: condition,
    message: condition ? "OK" : message || "Assertion failed",
  });
  console.log(`[${condition ? "PASS" : "FAIL"}] [${category}] ${name}${condition ? "" : " -> " + message}`);
}

async function runTestSuite() {
  console.log("==================================================================");
  console.log("🧪 KANHAIYA COLLECTION — PHASE 6 CMS, INBOX & SETTINGS VERIFICATION");
  console.log("==================================================================\n");

  // Reset store to fresh seed state
  saveMockStore(getInitialMockStore());

  // ---------------------------------------------------------------------------
  // SECTION A: ABOUT US SECTIONS
  // ---------------------------------------------------------------------------
  console.log("--- SECTION A: ABOUT US MANAGEMENT ---");
  const initialAbout = loadMockAboutSections();
  assert(
    "About Us",
    "Baseline seed sections loaded",
    initialAbout.length >= 3,
    `Expected at least 3 sections, found ${initialAbout.length}`
  );

  // Schema exact fields check
  const firstAbout = initialAbout[0];
  assert(
    "About Us",
    "Schema fields fidelity (id, heading, subheading, body, image_url, display_order, is_active)",
    Boolean(
      firstAbout.id &&
      "heading" in firstAbout &&
      "subheading" in firstAbout &&
      "body" in firstAbout &&
      "image_url" in firstAbout &&
      typeof firstAbout.display_order === "number" &&
      typeof firstAbout.is_active === "boolean" &&
      firstAbout.created_at &&
      firstAbout.updated_at
    )
  );

  // Create new About section
  const newSectionPayload = {
    heading: "Vedic Weaving Lineage",
    subheading: "Four Generations of Master Craftsmanship",
    body: "Every Kanhaiya drape carries the sacred devotion of Banaras master weavers, handloomed with pure mulberry silk.",
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200",
    display_order: 99,
    is_active: true,
  };
  const createAboutRes = saveMockAboutSection(newSectionPayload);
  const createdAbout = createAboutRes.section!;
  assert("About Us", "Create new About section succeeds", Boolean(createAboutRes.success && createdAbout?.id && createdAbout.heading === newSectionPayload.heading));

  // Edit About section
  const editAboutRes = saveMockAboutSection({
    id: createdAbout.id,
    heading: "Vedic Weaving Lineage Updated",
    subheading: "Five Generations of Craftsmanship",
    body: createdAbout.body,
    image_url: createdAbout.image_url,
    display_order: 10,
    is_active: true,
  });
  const editedAbout = editAboutRes.section!;
  assert("About Us", "Edit existing About section persists", Boolean(editAboutRes.success && editedAbout?.heading === "Vedic Weaving Lineage Updated"));

  // Toggle active status
  const toggleAboutRes = toggleMockAboutSectionStatus(createdAbout.id);
  assert("About Us", "Toggle active/inactive status", Boolean(toggleAboutRes.success && toggleAboutRes.section?.is_active === false));

  // Reorder sections
  const currentAbout = loadMockAboutSections();
  const reorderedIds = [createdAbout.id, ...currentAbout.filter((s) => s.id !== createdAbout.id).map((s) => s.id)];
  const reorderAboutRes = reorderMockAboutSections(reorderedIds);
  assert(
    "About Us",
    "Reorder content blocks updates display_order",
    Boolean(reorderAboutRes.success && reorderAboutRes.sections && reorderAboutRes.sections[0].id === createdAbout.id && reorderAboutRes.sections[0].display_order === 1)
  );

  // Delete About section
  const deleteAboutSuccess = deleteMockAboutSection(createdAbout.id);
  assert("About Us", "Delete content block successfully", deleteAboutSuccess.success === true);
  assert("About Us", "Deleted block is absent from store", !loadMockAboutSections().some((s) => s.id === createdAbout.id));

  // Preview data check: public query only returns active sections sorted by display_order
  const publicAbout = await getPublicAboutSections();
  assert("About Us", "Preview/Public query contains only active sections", publicAbout.every((s) => s.is_active));
  let aboutSorted = true;
  for (let i = 1; i < publicAbout.length; i++) {
    if (publicAbout[i].display_order < publicAbout[i - 1].display_order) {
      aboutSorted = false;
      break;
    }
  }
  assert("About Us", "Preview/Public sections are ordered by display_order ascending", aboutSorted);

  // ---------------------------------------------------------------------------
  // SECTION B: FAQs MANAGEMENT
  // ---------------------------------------------------------------------------
  console.log("\n--- SECTION B: FAQs MANAGEMENT ---");
  const initialFaqs = loadMockFaqs();
  assert("FAQs", "Baseline seed FAQs loaded", initialFaqs.length >= 6, `Found ${initialFaqs.length}`);

  // Schema exact fields check
  const firstFaq = initialFaqs[0];
  assert(
    "FAQs",
    "Schema fields fidelity (id, question, answer, category, display_order, is_active, created_at, updated_at)",
    Boolean(
      firstFaq.id &&
      firstFaq.question &&
      firstFaq.answer &&
      "category" in firstFaq &&
      typeof firstFaq.display_order === "number" &&
      typeof firstFaq.is_active === "boolean" &&
      firstFaq.created_at &&
      firstFaq.updated_at
    )
  );

  // FAQ Validations
  const invalidFaqRes = saveMockFaq({
    question: "",
    answer: "",
    category: "General",
    display_order: 1,
    is_active: true,
  });
  assert("FAQs", "Validation rejects empty question and answer", invalidFaqRes.success === false);

  // Create FAQ
  const newFaqPayload = {
    question: "Do you ship worldwide with insurance coverage?",
    answer: "Yes, all international parcels are dispatched via DHL Express with complimentary transit insurance.",
    category: "Shipping",
    display_order: 99,
    is_active: true,
  };
  const createFaqRes = saveMockFaq(newFaqPayload);
  const createdFaq = createFaqRes.faq!;
  assert("FAQs", "Create new FAQ succeeds", Boolean(createFaqRes.success && createdFaq?.id && createdFaq.question === newFaqPayload.question));

  // Edit FAQ
  const editFaqRes = saveMockFaq({
    id: createdFaq.id,
    question: "Do you ship worldwide with full transit insurance?",
    answer: createdFaq.answer,
    category: "Shipping & Delivery",
    display_order: 5,
    is_active: true,
  });
  const editedFaq = editFaqRes.faq!;
  assert("FAQs", "Edit existing FAQ persists", Boolean(editFaqRes.success && editedFaq?.question.includes("full transit insurance")));

  // Toggle FAQ status
  const toggleFaqRes = toggleMockFaqStatus(createdFaq.id);
  assert("FAQs", "Toggle FAQ active status", Boolean(toggleFaqRes.success && toggleFaqRes.faq?.is_active === false));

  // Reorder FAQs
  const currentFaqs = loadMockFaqs();
  const reorderFaqIds = [createdFaq.id, ...currentFaqs.filter((f) => f.id !== createdFaq.id).map((f) => f.id)];
  const reorderFaqsRes = reorderMockFaqs(reorderFaqIds);
  assert(
    "FAQs",
    "Reorder FAQs updates display_order",
    Boolean(reorderFaqsRes.success && reorderFaqsRes.faqs && reorderFaqsRes.faqs[0].id === createdFaq.id && reorderFaqsRes.faqs[0].display_order === 1)
  );

  // Delete FAQ
  const deleteFaqSuccess = deleteMockFaq(createdFaq.id);
  assert("FAQs", "Delete FAQ succeeds", deleteFaqSuccess.success === true);
  assert("FAQs", "Deleted FAQ absent from store", !loadMockFaqs().some((f) => f.id === createdFaq.id));

  // Preview check: public faqs only return active items
  const publicFaqs = await getPublicFaqs();
  assert("FAQs", "Preview/Public FAQs contain only active entries", publicFaqs.every((f) => f.is_active));

  // ---------------------------------------------------------------------------
  // SECTION C: SITE POLICIES
  // ---------------------------------------------------------------------------
  console.log("\n--- SECTION C: SITE POLICIES ---");
  const supportedTypes: PolicyType[] = ["privacy", "terms", "shipping", "return"];
  const allPolicies = loadMockPolicies();
  assert("Site Policies", "All 4 supported policy types exist", supportedTypes.every((t) => allPolicies.some((p) => p.type === t)));

  // Verify uniqueness (no duplicate policy records for same type)
  const typeCounts = supportedTypes.map((t) => allPolicies.filter((p) => p.type === t).length);
  assert("Site Policies", "Strictly exactly 1 record per policy type (no duplicates)", typeCounts.every((count) => count === 1));

  // Validation: empty title or content rejected
  const emptyPolicyRes = saveMockPolicy("privacy", "", "");
  assert("Site Policies", "Validation rejects empty title or content", emptyPolicyRes.success === false);

  // Edit existing policy without creating duplicate
  const updatePolicyRes = saveMockPolicy(
    "shipping",
    "Worldwide Express Shipping & Transit Policy",
    "# Shipping Policy\n\nAll bespoke garments are dispatched via trusted global carriers with comprehensive insurance."
  );
  assert("Site Policies", "Edit existing policy succeeds", Boolean(updatePolicyRes.success && updatePolicyRes.policy?.title.includes("Worldwide Express")));

  // Check policies count remained exactly 4 (no duplicates added)
  const policiesAfterEdit = loadMockPolicies();
  assert("Site Policies", "Editing does not duplicate records (count remains 4)", policiesAfterEdit.length === 4);

  // Content preview readable check
  const shippingPolicy = await getPublicPolicy("shipping");
  assert("Site Policies", "Preview reflects updated policy content", Boolean(shippingPolicy && shippingPolicy.title.includes("Worldwide Express")));

  // ---------------------------------------------------------------------------
  // SECTION D: SITE SETTINGS (FOOTER JSON)
  // ---------------------------------------------------------------------------
  console.log("\n--- SECTION D: SITE SETTINGS ---");
  const settings = loadMockSettings("footer");
  assert("Site Settings", "Footer settings exist and contain JSON value", Boolean(settings && settings.brand_name));
  assert(
    "Site Settings",
    "Footer structure contains all documented fields (brand_name, tagline, phone, email, address, business_hours, social)",
    Boolean(
      settings?.brand_name &&
      settings?.tagline &&
      settings?.phone &&
      settings?.email &&
      settings?.address &&
      settings?.business_hours &&
      settings?.social
    )
  );

  // Validate URL and Email rejected
  const invalidEmailSettingsRes = saveMockSettings("footer", {
    ...settings,
    email: "not-an-email",
  });
  assert("Site Settings", "Rejects invalid email format", invalidEmailSettingsRes.success === false);

  const invalidUrlSettingsRes = saveMockSettings("footer", {
    ...settings,
    social: {
      ...settings.social,
      instagram: "invalid-url",
    },
  });
  assert("Site Settings", "Rejects invalid social URL format", invalidUrlSettingsRes.success === false);

  // Valid update persists
  const validSettingsUpdate = saveMockSettings("footer", {
    ...settings,
    phone: "+91 99999 00000",
    email: "concierge@kanhaiyacollection.com",
    tagline: "Preserving sacred Indian weaves since 1992",
  });
  assert("Site Settings", "Valid settings update succeeds", validSettingsUpdate.success === true);

  const updatedSettings = await getSiteSettings("footer");
  assert("Site Settings", "Updated settings reflect in getSiteSettings", updatedSettings.email === "concierge@kanhaiyacollection.com");

  // ---------------------------------------------------------------------------
  // SECTION E: CONTACT SUBMISSIONS INBOX
  // ---------------------------------------------------------------------------
  console.log("\n--- SECTION E: CONTACT SUBMISSIONS INBOX ---");
  const contacts = loadMockContactSubmissions();
  assert("Contact Submissions", "Baseline contact submissions loaded", contacts.length >= 4);

  // Check schema fields: id, name, email, phone, message, status, created_at, updated_at
  const firstContact = contacts[0];
  assert(
    "Contact Submissions",
    "Schema exact fields (id, name, email, phone, message, status, created_at, updated_at)",
    Boolean(
      firstContact.id &&
      firstContact.name &&
      firstContact.email &&
      "phone" in firstContact &&
      firstContact.message &&
      firstContact.status &&
      firstContact.created_at &&
      firstContact.updated_at
    )
  );

  // Status enum values check: strictly 'new' | 'in_progress' | 'resolved'
  const validContactStatuses = ["new", "in_progress", "resolved"];
  assert(
    "Contact Submissions",
    "All contact statuses adhere strictly to enum ('new' | 'in_progress' | 'resolved')",
    contacts.every((c) => validContactStatuses.includes(c.status))
  );

  // Status transitions
  const newContact = contacts.find((c) => c.status === "new") || contacts[0];
  const updatedToInProgress = updateMockContactStatus(newContact.id, "in_progress");
  assert("Contact Submissions", "Update status to 'in_progress' persists", updatedToInProgress.submission?.status === "in_progress");

  const updatedToResolved = updateMockContactStatus(newContact.id, "resolved");
  assert("Contact Submissions", "Update status to 'resolved' persists", updatedToResolved.submission?.status === "resolved");

  // Protection against invalid status
  const invalidStatusRes = updateMockContactStatus(newContact.id, "invalid_status" as any);
  assert("Contact Submissions", "Rejects invalid contact status value", invalidStatusRes.success === false);

  // Detail view fetcher
  const contactDetail = getMockContactSubmissionById(newContact.id);
  assert("Contact Submissions", "Detail lookup returns full submitted information", Boolean(contactDetail && contactDetail.id === newContact.id));

  // Safe deletion workflow
  const deleteContactRes = deleteMockContactSubmission(newContact.id);
  assert("Contact Submissions", "Confirmed deletion succeeds", deleteContactRes.success === true);
  assert("Contact Submissions", "Deleted submission removed from store", getMockContactSubmissionById(newContact.id) === null);

  // ---------------------------------------------------------------------------
  // SECTION F: LEADS INBOX
  // ---------------------------------------------------------------------------
  console.log("\n--- SECTION F: LEADS INBOX ---");
  const leads = loadMockLeads();
  assert("Leads", "Baseline leads loaded", leads.length >= 4);

  // Check schema fields: id, name, email, phone, source, message, status, created_at, updated_at
  const firstLead = leads[0];
  assert(
    "Leads",
    "Schema exact fields (id, name, email, phone, source, message, status, created_at, updated_at)",
    Boolean(
      firstLead.id &&
      "name" in firstLead &&
      firstLead.email &&
      "phone" in firstLead &&
      "source" in firstLead &&
      "message" in firstLead &&
      firstLead.status &&
      firstLead.created_at &&
      firstLead.updated_at
    )
  );

  // Status enum values check: strictly 'new' | 'contacted' | 'converted' | 'closed'
  const validLeadStatuses = ["new", "contacted", "converted", "closed"];
  assert(
    "Leads",
    "All lead statuses adhere strictly to enum ('new' | 'contacted' | 'converted' | 'closed')",
    leads.every((l) => validLeadStatuses.includes(l.status))
  );

  // Status transitions
  const sampleLead = leads.find((l) => l.status === "new") || leads[0];
  const toContacted = updateMockLeadStatus(sampleLead.id, "contacted");
  assert("Leads", "Update status to 'contacted' persists", toContacted.lead?.status === "contacted");

  const toConverted = updateMockLeadStatus(sampleLead.id, "converted");
  assert("Leads", "Update status to 'converted' persists", toConverted.lead?.status === "converted");

  const toClosed = updateMockLeadStatus(sampleLead.id, "closed");
  assert("Leads", "Update status to 'closed' persists", toClosed.lead?.status === "closed");

  // Protection against invalid status
  const invalidLeadStatusRes = updateMockLeadStatus(sampleLead.id, "unknown_status" as any);
  assert("Leads", "Rejects invalid lead status value", invalidLeadStatusRes.success === false);

  // Detail view fetcher
  const leadDetail = getMockLeadById(sampleLead.id);
  assert("Leads", "Detail lookup returns lead information and contact details", Boolean(leadDetail && leadDetail.id === sampleLead.id));

  // Safe deletion workflow
  const deleteLeadRes = deleteMockLead(sampleLead.id);
  assert("Leads", "Confirmed deletion succeeds", deleteLeadRes.success === true);
  assert("Leads", "Deleted lead removed from store", getMockLeadById(sampleLead.id) === null);

  // ---------------------------------------------------------------------------
  // SECTION G: HTTP GET ROUTE VALIDATION
  // ---------------------------------------------------------------------------
  console.log("\n--- SECTION G: ADMIN HTTP ROUTES VALIDATION ---");
  const routesToTest = [
    "/admin/cms/about",
    "/admin/cms/faqs",
    "/admin/cms/policies",
    "/admin/cms/settings",
    "/admin/inbox/contact",
    "/admin/inbox/leads",
  ];

  for (const route of routesToTest) {
    try {
      const res = await fetch(`${BASE_URL}${route}`, {
        headers: {
          Cookie: "admin_preview_active=true",
        },
      });
      assert("HTTP Routes", `Route ${route} returns HTTP 200 OK`, res.status === 200, `Status was ${res.status}`);
    } catch (err: any) {
      assert("HTTP Routes", `Route ${route} is reachable`, false, err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  const total = reports.length;
  const passed = reports.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log("\n==================================================================");
  console.log(`📊 PHASE 6 TEST RESULTS: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  if (failed > 0) {
    console.log(`❌ ${failed} TESTS FAILED`);
    process.exit(1);
  } else {
    console.log("🌟 ALL PHASE 6 CMS, INBOX, LEADS, AND SETTINGS CHECKS PASSED!");
    console.log("==================================================================\n");
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
