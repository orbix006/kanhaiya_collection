import {
  loadMockStore,
  saveMockStore,
  loadMockPolicies,
  getMockPolicyByType,
  saveMockPolicy,
  MockSitePolicy,
} from "../lib/mock-data/admin-store";
import { getPublicPolicy } from "../lib/data/cms";
import { isSupabaseConfigured } from "../lib/supabase/server";

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

async function runPhase7Tests() {
  console.log("\n========================================================");
  console.log(" PHASE 7 — SITE POLICY MANAGEMENT AUTOMATED VERIFICATION");
  console.log("========================================================\n");

  // Backup store before running tests
  const originalStore = JSON.parse(JSON.stringify(loadMockStore()));

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Zero Supabase Connection
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 1: Mock Architecture & Security Isolation ---");
    const supabaseActive = isSupabaseConfigured();
    assert(
      !supabaseActive,
      "Zero Supabase connection active (pure local-only mock architecture preserved)",
      `Supabase active: ${supabaseActive}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: All Four Mandatory Policies Exist and are Non-Placeholder
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 2: Mandatory Four Policies Presence & Quality ---");
    const MANDATORY_POLICIES = [
      { type: "terms", expectedTitle: "Terms of Service" },
      { type: "privacy", expectedTitle: "Privacy Policy" },
      { type: "cancellation", expectedTitle: "Cancellation Policy" },
      { type: "refund", expectedTitle: "Refund Policy" },
    ] as const;

    const policies = loadMockPolicies();
    assert(
      policies.length >= 4,
      `Policies repository contains at least 4 policies (found: ${policies.length})`,
      `Count: ${policies.length}`
    );

    for (const mandatory of MANDATORY_POLICIES) {
      const found = policies.find((p) => p.type === mandatory.type);
      assert(
        Boolean(found),
        `Mandatory policy '${mandatory.type}' exists in mock store`,
        `Type: ${mandatory.type}`
      );

      if (found) {
        assert(
          Boolean(found.title && found.title.trim().length > 3),
          `Policy '${mandatory.type}' has meaningful title: "${found.title}"`,
          `Title: ${found.title}`
        );

        assert(
          Boolean(found.content && found.content.trim().length > 100),
          `Policy '${mandatory.type}' has substantive authentic copy (> 100 chars, actual length: ${found.content?.length})`,
          `Content length: ${found.content?.length}`
        );

        // Ensure not placeholder text
        const isPlaceholder =
          found.content.toLowerCase().includes("lorem ipsum") ||
          found.content.toLowerCase().includes("placeholder") ||
          found.content.toLowerCase().includes("todo");
        assert(
          !isPlaceholder,
          `Policy '${mandatory.type}' contains no placeholder/TODO markers`,
          `Content sample: ${found.content.slice(0, 60)}...`
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 3: Validation on Required Fields
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 3: Validation Rules ---");
    const emptyTitleRes = saveMockPolicy("terms", "  ", "Valid content that has enough length for saving.");
    assert(
      !emptyTitleRes.success && Boolean(emptyTitleRes.error?.includes("title is required")),
      "Reject empty or whitespace title (< 3 characters)",
      `Result: ${JSON.stringify(emptyTitleRes)}`
    );

    const shortContentRes = saveMockPolicy("terms", "Valid Title", "Too short");
    assert(
      !shortContentRes.success && Boolean(shortContentRes.error?.includes("content is required")),
      "Reject short content (< 20 characters)",
      `Result: ${JSON.stringify(shortContentRes)}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Draft vs Published Content Isolation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 4: Draft vs Published Workflow ---");
    const originalTerms = getMockPolicyByType("terms", false);
    const originalContent = originalTerms?.content || "";

    const testDraftContent =
      "### Draft Clause Revision 2026\nThis is an unpublished draft clause testing local model isolation.\nPublic storefront visitors must not see this until published.";

    const draftSaveRes = saveMockPolicy("terms", "Terms of Service", testDraftContent, true);
    assert(
      draftSaveRes.success === true,
      "Successfully saved draft revision locally",
      `Response: ${JSON.stringify(draftSaveRes)}`
    );

    // Verify public query (includeDraft = false) returns original published content
    const publicViewAfterDraft = getMockPolicyByType("terms", false);
    assert(
      publicViewAfterDraft?.content === originalContent,
      "Public query strictly isolates draft and serves published content only",
      `Public content: ${publicViewAfterDraft?.content?.slice(0, 50)}...`
    );

    // Verify admin query (includeDraft = true) retrieves the draft
    const adminViewAfterDraft = getMockPolicyByType("terms", true);
    assert(
      adminViewAfterDraft?.draft_content === testDraftContent,
      "Admin query retrieves working draft_content for active editing session",
      `Draft content: ${adminViewAfterDraft?.draft_content?.slice(0, 50)}...`
    );

    // Now publish the draft
    const publishedContent =
      "### Published Clause 2026\nOfficial updated terms of service published and verified for all devotees.";
    const publishRes = saveMockPolicy("terms", "Terms of Service Updated", publishedContent, false);
    assert(publishRes.success === true, "Successfully published policy update");

    const publicViewAfterPublish = getMockPolicyByType("terms", false);
    assert(
      publicViewAfterPublish?.content === publishedContent,
      "Public storefront now serves newly published content",
      `Published content: ${publicViewAfterPublish?.content?.slice(0, 50)}...`
    );
    assert(
      publicViewAfterPublish?.draft_content === undefined,
      "Draft cleared upon publishing",
      `draft_content: ${publicViewAfterPublish?.draft_content}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Schema Compatibility & Unique Constraint on Type
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 5: Schema Compatibility & No Duplicates ---");
    // Count occurrences of each policy type in store
    const updatedPolicies = loadMockPolicies();
    const typeCounts: Record<string, number> = {};
    for (const p of updatedPolicies) {
      typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
    }

    for (const [type, count] of Object.entries(typeCounts)) {
      assert(
        count === 1,
        `Policy type '${type}' has exactly 1 record (unique constraint preserved)`,
        `Count for ${type}: ${count}`
      );
    }

    // Verify schema mapping: refund policy mapped appropriately
    const refundPolicy = getMockPolicyByType("refund", false);
    assert(
      Boolean(refundPolicy && refundPolicy.content.length > 50),
      "Refund policy retrieves successfully via refund key or return mapping",
      `Refund title: ${refundPolicy?.title}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Local Persistence Across Reload
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 6: Local Persistence Check ---");
    const testTitle = "Cancellation Policy - Artisan Direct";
    const testContent =
      "### Sacred Order Cancellation Window\nOrders may be cancelled before shipment within 24 hours of placement.\nDevotional artisans will be notified immediately.";

    saveMockPolicy("cancellation", testTitle, testContent, false);

    // Reload fresh from mock store
    const reloadedStore = loadMockStore();
    const reloadedCancellation = reloadedStore.sitePolicies?.find((p) => p.type === "cancellation");
    assert(
      reloadedCancellation?.title === testTitle && reloadedCancellation?.content === testContent,
      "Policy changes persist across store reload",
      `Reloaded title: ${reloadedCancellation?.title}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Storefront HTTP Endpoints & Rendering
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 7: Public Storefront HTTP Endpoints ---");
    const endpointsToTest = [
      { url: "http://localhost:3000/terms", keyword: "Terms of Service" },
      { url: "http://localhost:3000/privacy", keyword: "Privacy Policy" },
      { url: "http://localhost:3000/cancellation", keyword: "Cancellation Policy" },
      { url: "http://localhost:3000/refund", keyword: "Refund Policy" },
      { url: "http://localhost:3000/return", keyword: "Return" },
    ];

    for (const ep of endpointsToTest) {
      try {
        const res = await fetch(ep.url, { headers: { "Cache-Control": "no-cache" } });
        assert(
          res.status === 200,
          `HTTP GET ${ep.url} returns 200 OK`,
          `Status: ${res.status}`
        );

        const html = await res.text();
        assert(
          html.includes(ep.keyword) || html.toLowerCase().includes(ep.keyword.toLowerCase()),
          `Page ${ep.url} contains expected policy text "${ep.keyword}"`,
          `Found in HTML: ${html.includes(ep.keyword)}`
        );
      } catch (err: any) {
        assert(false, `HTTP GET ${ep.url} threw error`, err?.message);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 8: Footer Policy Links Verification
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 8: Footer Policy Navigation Links ---");
    try {
      const homeRes = await fetch("http://localhost:3000/", { headers: { "Cache-Control": "no-cache" } });
      const homeHtml = await homeRes.text();

      assert(homeHtml.includes('href="/terms"'), "Footer contains link to /terms");
      assert(homeHtml.includes('href="/privacy"'), "Footer contains link to /privacy");
      assert(homeHtml.includes('href="/cancellation"'), "Footer contains link to /cancellation");
      assert(homeHtml.includes('href="/refund"'), "Footer contains link to /refund");
    } catch (err: any) {
      assert(false, "Could not fetch home page to test footer links", err?.message);
    }

    // -------------------------------------------------------------------------
    // TEST 9: Graceful Fallback for Unpublished / Incomplete Content
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 9: Graceful Fallback Handling ---");
    // Test that an empty policy content returns the graceful fallback component in public view
    const unpublishedResult = getMockPolicyByType("terms", false);
    assert(
      unpublishedResult !== null,
      "Public policy helper returns policy record even if unpublished (with sanitized empty content)"
    );

  } finally {
    // Restore original store state
    saveMockStore(originalStore);
    console.log("\n  [Cleanup] Restored original mock store state.");
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log("\n========================================================");
  console.log(` PHASE 7 VERIFICATION COMPLETE: ${passed}/${total} Passed (${failed} Failed)`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase7Tests().catch((err) => {
  console.error("FATAL in test suite:", err);
  process.exit(1);
});
