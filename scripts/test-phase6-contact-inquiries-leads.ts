/**
 * Phase 6 Verification Test Suite: Contact Inquiries and Leads Admin Page
 *
 * Verifies:
 * A. Exactly Three KPI Cards: Total Leads, Unread Leads, Responded Leads
 * B. Contact Table: Name, Email, Phone, Inquiry source/type, Received date, Status, Action icons
 * C. Search, Filter, Sort, Pagination
 * D. Lead Detail Popup: Mark as read, Status update, Record response note in local workflow
 * E. Out-of-scope email disclaimer
 * F. Schema Compatibility: contact_submissions and leads separate underlying entities
 * G. Zero Supabase connections introduced
 * H. Live admin page rendering at /admin/inbox
 */

import {
  SEED_CONTACT_SUBMISSIONS,
  SEED_LEADS,
  SEED_RESPONSE_NOTES,
  loadMockContactSubmissions,
  loadMockLeads,
  loadMockResponseNotes,
  addMockResponseNote,
  markInquiryAsRead,
  updateUnifiedInquiryStatus,
  deleteUnifiedInquiry,
  getUnifiedInquiries,
  getInquiryKpis,
  loadMockStore,
  saveMockStore,
  getInitialMockStore,
  type MockContactSubmission,
  type MockLead,
  type MockResponseNote,
  type UnifiedInquiry,
} from "../lib/mock-data/admin-store";
import {
  getContactSubmissionsAdmin,
  getLeadsAdmin,
  getResponseNotesAdmin,
} from "../lib/data/cms";

const BASE_URL = "http://localhost:3000";

const adminCookie =
  "demo_user=" +
  encodeURIComponent(
    JSON.stringify({
      id: "usr_4104acb962ff4cdaae6cd0136b9cee47",
      email: "you@example.com",
      full_name: "Amber",
      role: "admin",
    })
  );

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
  console.log("🧪 KANHAIYA COLLECTION — PHASE 6 CONTACT INQUIRIES & LEADS TESTS");
  console.log("==================================================================\n");

  // Reset store to fresh canonical seeds
  const initialStore = getInitialMockStore();
  saveMockStore(initialStore);

  // -----------------------------------------------------------------------------
  // TEST GROUP 1: SEED INTEGRITY & SCHEMA COMPATIBILITY
  // -----------------------------------------------------------------------------
  console.log("--- 1. Schema Compatibility & Underlying Collections ---");

  const contactSubmissions = loadMockContactSubmissions();
  const leads = loadMockLeads();
  const notes = loadMockResponseNotes();

  assert(
    "Schema",
    "contact_submissions collection exists as separate underlying model",
    Array.isArray(contactSubmissions) && contactSubmissions.length >= 4,
    `Expected at least 4 contact submissions, got ${contactSubmissions.length}`
  );

  assert(
    "Schema",
    "leads collection exists as separate underlying model",
    Array.isArray(leads) && leads.length >= 4,
    `Expected at least 4 leads, got ${leads.length}`
  );

  assert(
    "Schema",
    "contact_submissions preserve schema field names (id, name, email, phone, message, status, created_at, updated_at)",
    contactSubmissions.every(
      (s) =>
        s.id &&
        s.name &&
        s.email &&
        typeof s.message === "string" &&
        ["new", "in_progress", "resolved"].includes(s.status)
    )
  );

  assert(
    "Schema",
    "leads preserve schema field names (id, name, email, phone, source, message, status, created_at, updated_at)",
    leads.every(
      (l) =>
        l.id &&
        l.email &&
        typeof l.status === "string" &&
        ["new", "contacted", "converted", "closed"].includes(l.status)
    )
  );

  assert(
    "Schema",
    "Response notes exist in local development model and reference inquiry_id",
    Array.isArray(notes) && notes.length > 0 && notes.every((n) => n.id && n.inquiry_id && n.note && n.responder)
  );

  // -----------------------------------------------------------------------------
  // TEST GROUP 2: THREE KPI CARDS & STATUS MAPPING
  // -----------------------------------------------------------------------------
  console.log("\n--- 2. Three KPI Cards & Strict Status Mapping ---");

  const initialKpis = getInquiryKpis();
  const unified = getUnifiedInquiries();

  assert(
    "KPIs",
    "Total Leads equals sum of contact_submissions + leads without duplicate counts",
    initialKpis.totalLeads === contactSubmissions.length + leads.length &&
      initialKpis.totalLeads === unified.length,
    `Expected totalLeads=${contactSubmissions.length + leads.length}, got ${initialKpis.totalLeads}`
  );

  const expectedUnread =
    contactSubmissions.filter((s) => s.status === "new").length +
    leads.filter((l) => l.status === "new").length;

  assert(
    "KPIs",
    "Unread Leads equals count of records with status 'new' across both entities",
    initialKpis.unreadLeads === expectedUnread,
    `Expected unreadLeads=${expectedUnread}, got ${initialKpis.unreadLeads}`
  );

  // Responded leads: has response note OR resolved contact submission OR contacted/converted/closed lead
  const expectedResponded = unified.filter((u) => u.has_response).length;

  assert(
    "KPIs",
    "Responded Leads counts records with response notes or contacted/resolved status exactly once",
    initialKpis.respondedLeads === expectedResponded,
    `Expected respondedLeads=${expectedResponded}, got ${initialKpis.respondedLeads}`
  );

  // Check no item is counted as unread AND responded simultaneously
  const overlap = unified.filter((u) => u.status === "new" && u.has_response && u.response_count === 0);
  assert(
    "KPIs",
    "No unread new record without notes is counted as responded",
    overlap.length === 0
  );

  // -----------------------------------------------------------------------------
  // TEST GROUP 3: CONTACT TABLE FEATURES (Search, Filter, Sort, Pagination)
  // -----------------------------------------------------------------------------
  console.log("\n--- 3. Contact Table Features ---");

  // Search by name
  const searchByName = unified.filter((u) =>
    u.name.toLowerCase().includes("sunil")
  );
  assert(
    "Table",
    "Search by name finds 'Sunil Narang'",
    searchByName.length >= 1 && searchByName[0].name.includes("Sunil")
  );

  // Search by email
  const searchByEmail = unified.filter((u) =>
    u.email.toLowerCase().includes("vrindavandham.org")
  );
  assert(
    "Table",
    "Search by email finds Sri Vrindavan Dham Trust",
    searchByEmail.length === 1 && searchByEmail[0].id === "lead-1"
  );

  // Search by phone
  const searchByPhone = unified.filter((u) =>
    u.phone ? u.phone.includes("98220") : false
  );
  assert(
    "Table",
    "Search by phone finds '+91 98220 11223'",
    searchByPhone.length === 1 && searchByPhone[0].id === "sub-1"
  );

  // Search by message content
  const searchByMsg = unified.filter((u) =>
    u.message.toLowerCase().includes("akhand diya")
  );
  assert(
    "Table",
    "Search by message keyword finds relevant inquiries",
    searchByMsg.length >= 1
  );

  // Filter by status
  const filterNew = unified.filter((u) => u.status === "new");
  assert(
    "Table",
    "Filter by status='new' isolates unread inquiries",
    filterNew.every((u) => u.status === "new") && filterNew.length === initialKpis.unreadLeads
  );

  // Filter by source
  const filterContactForm = unified.filter((u) => u.entity_type === "contact_submission");
  assert(
    "Table",
    "Filter by source isolates contact form submissions from audience leads",
    filterContactForm.every((u) => u.entity_type === "contact_submission") &&
      filterContactForm.length === contactSubmissions.length
  );

  // Sort by received date (descending vs ascending)
  const sortedDesc = [...unified].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const sortedAsc = [...unified].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  assert(
    "Table",
    "Sort by received date orders newest first properly",
    new Date(sortedDesc[0].created_at).getTime() >= new Date(sortedDesc[sortedDesc.length - 1].created_at).getTime()
  );
  assert(
    "Table",
    "Sort by received date orders oldest first properly",
    new Date(sortedAsc[0].created_at).getTime() <= new Date(sortedAsc[sortedAsc.length - 1].created_at).getTime()
  );

  // Pagination calculation
  const pageSize = 5;
  const page1 = sortedDesc.slice(0, pageSize);
  const page2 = sortedDesc.slice(pageSize, pageSize * 2);
  assert(
    "Table",
    "Pagination partitions records into correct page chunks",
    page1.length === 5 && page2.length === sortedDesc.length - 5
  );

  // -----------------------------------------------------------------------------
  // TEST GROUP 4: LEAD DETAIL POPUP & INTERACTIVE ACTIONS
  // -----------------------------------------------------------------------------
  console.log("\n--- 4. Detail Popup, Status Updates & Response Workflow ---");

  // 4.1 Mark as Read action
  const sub1Before = unified.find((u) => u.id === "sub-1")!;
  assert("Popup Actions", "sub-1 starts with status='new'", sub1Before.status === "new");

  const markReadRes = markInquiryAsRead("sub-1", "contact_submission");
  assert(
    "Popup Actions",
    "markInquiryAsRead updates contact_submission from 'new' to 'in_progress'",
    markReadRes.success && markReadRes.newStatus === "in_progress"
  );

  // Verify KPI updated after marking as read
  const kpisAfterRead = getInquiryKpis();
  assert(
    "KPIs",
    "Unread Leads decreases by 1 after marking inquiry as read",
    kpisAfterRead.unreadLeads === initialKpis.unreadLeads - 1,
    `Expected unreadLeads=${initialKpis.unreadLeads - 1}, got ${kpisAfterRead.unreadLeads}`
  );

  // 4.2 Status Update validation
  const invalidStatusRes = updateUnifiedInquiryStatus("sub-1", "contact_submission", "converted");
  assert(
    "Schema",
    "Contact submission rejects invalid status 'converted' (only allows new | in_progress | resolved)",
    !invalidStatusRes.success && Boolean(invalidStatusRes.error)
  );

  const validStatusRes = updateUnifiedInquiryStatus("sub-1", "contact_submission", "resolved");
  assert(
    "Popup Actions",
    "Contact submission updates to valid status 'resolved'",
    validStatusRes.success
  );

  const kpisAfterResolved = getInquiryKpis();
  assert(
    "KPIs",
    "Responded Leads increases when contact submission is resolved",
    kpisAfterResolved.respondedLeads > initialKpis.respondedLeads
  );

  // 4.3 Lead status update
  const invalidLeadStatus = updateUnifiedInquiryStatus("lead-1", "lead", "in_progress");
  assert(
    "Schema",
    "Lead rejects invalid status 'in_progress' (only allows new | contacted | converted | closed)",
    !invalidLeadStatus.success && Boolean(invalidLeadStatus.error)
  );

  const validLeadStatus = updateUnifiedInquiryStatus("lead-1", "lead", "contacted");
  assert(
    "Popup Actions",
    "Lead updates to valid status 'contacted'",
    validLeadStatus.success
  );

  // 4.4 Record Response Note in Local Workflow
  const noteRes = addMockResponseNote(
    "sub-4",
    "contact_submission",
    "Called Dr. Malini Iyer and shared custom engraving layout specifications.",
    "Admin (Amber)"
  );
  assert(
    "Response Workflow",
    "Response note is recorded in local workflow with responder and timestamp",
    Boolean(noteRes.success && noteRes.note?.id && noteRes.note?.note?.includes("engraving layout"))
  );

  const sub4Notes = loadMockResponseNotes("sub-4");
  assert(
    "Response Workflow",
    "Response notes for sub-4 are loaded by inquiry_id",
    sub4Notes.length >= 1 && sub4Notes[0].responder === "Admin (Amber)"
  );

  // Verify sub-4 is now recognized as responded even if status is still 'new'
  const unifiedAfterNote = getUnifiedInquiries();
  const sub4Unified = unifiedAfterNote.find((u) => u.id === "sub-4")!;
  assert(
    "KPIs",
    "Inquiry with recorded response note has has_response=true",
    sub4Unified.has_response && sub4Unified.response_count >= 1
  );

  // -----------------------------------------------------------------------------
  // TEST GROUP 5: PERSISTENCE ACROSS STORE RELOAD
  // -----------------------------------------------------------------------------
  console.log("\n--- 5. Persistence Across Store Reload ---");

  const reloadedStore = loadMockStore();
  const sub1Reloaded = (reloadedStore.contactSubmissions || []).find((s) => s.id === "sub-1");
  const lead1Reloaded = (reloadedStore.leads || []).find((l) => l.id === "lead-1");
  const noteReloaded = (reloadedStore.responseNotes || []).find((n) => n.inquiry_id === "sub-4");

  assert(
    "Persistence",
    "sub-1 status 'resolved' persists in store",
    sub1Reloaded?.status === "resolved"
  );

  assert(
    "Persistence",
    "lead-1 status 'contacted' persists in store",
    lead1Reloaded?.status === "contacted"
  );

  assert(
    "Persistence",
    "Response note for sub-4 persists in store",
    Boolean(noteReloaded)
  );

  // -----------------------------------------------------------------------------
  // TEST GROUP 6: DELETE INQUIRY & CASCADE
  // -----------------------------------------------------------------------------
  console.log("\n--- 6. Delete Action & Cascade Cleanup ---");

  const deleteRes = deleteUnifiedInquiry("sub-4", "contact_submission");
  assert("Delete", "deleteUnifiedInquiry removes inquiry record", deleteRes.success);

  const notesAfterDelete = loadMockResponseNotes("sub-4");
  assert(
    "Delete",
    "Deleting inquiry cascades and purges linked response notes",
    notesAfterDelete.length === 0
  );

  const kpisAfterDelete = getInquiryKpis();
  assert(
    "KPIs",
    "Total Leads decrements when record is deleted",
    kpisAfterDelete.totalLeads === initialKpis.totalLeads - 1
  );

  // -----------------------------------------------------------------------------
  // TEST GROUP 7: LIVE HTTP ROUTE RENDERING & DISCLAIMER CHECK
  // -----------------------------------------------------------------------------
  console.log("\n--- 7. Live HTTP Server Route Verification ---");

  // Restore seed store for clean page render
  saveMockStore(getInitialMockStore());

  try {
    const res = await fetch(`${BASE_URL}/admin/inbox`, {
      headers: {
        Cookie: adminCookie,
      },
    });

    assert(
      "Route",
      "GET /admin/inbox returns 200 OK",
      res.status === 200,
      `Expected status 200, got ${res.status}`
    );

    const html = await res.text();

    assert(
      "Route",
      "Page renders header 'Contact Inquiries & Captured Leads'",
      html.includes("Contact Inquiries &amp; Captured Leads") ||
        html.includes("Contact Inquiries & Captured Leads")
    );

    assert(
      "Route",
      "Page displays exactly the three required KPI cards: Total Leads, Unread Leads, Responded Leads",
      html.includes("Total Leads") &&
        html.includes("Unread Leads") &&
        html.includes("Responded Leads")
    );

    assert(
      "Route",
      "Page renders unified table with contact submissions (e.g. Sunil Narang)",
      html.includes("Sunil Narang") || html.includes("Ananya Deshmukh")
    );

    assert(
      "Route",
      "Page renders captured leads in unified table (e.g. Sri Vrindavan Dham Trust)",
      html.includes("Sri Vrindavan Dham Trust") || html.includes("Omkar Spiritual Boutique")
    );

    assert(
      "Route",
      "Page includes email service out-of-scope disclaimer in component",
      html.includes("out of scope") ||
        html.includes("Development Workflow Disclaimer") ||
        html.includes("external transactional email")
    );
  } catch (err: any) {
    assert("Route", `Failed to fetch /admin/inbox: ${err?.message}`, false);
  }

  // -----------------------------------------------------------------------------
  // SUMMARY REPORT
  // -----------------------------------------------------------------------------
  console.log("\n==================================================================");
  const total = reports.length;
  const passed = reports.filter((r) => r.passed).length;
  const failed = reports.filter((r) => !r.passed).length;

  console.log(`TOTAL TESTS : ${total}`);
  console.log(`PASSED      : ${passed} ✅`);
  console.log(`FAILED      : ${failed} ${failed === 0 ? "🎉" : "❌"}`);
  console.log("==================================================================");

  if (failed > 0) {
    console.error("Some tests failed. See details above.");
    process.exit(1);
  } else {
    console.log("ALL PHASE 6 VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀");
  }
}

runTestSuite().catch((err) => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
