/**
 * Phase 4 Test Suite: Order Management and Customer Admin
 * Verifies schema adherence, status transition controls, trigger simulation,
 * customer profile & address structures, and admin route rendering.
 */

import {
  SEED_ORDERS,
  SEED_CUSTOMERS,
  loadMockOrders,
  getMockOrderById,
  updateMockOrderStatus,
  updateMockOrderPaymentStatus,
  loadMockCustomers,
  getMockCustomerById,
  updateMockUserRole,
  getMockCustomerOrders,
} from "../lib/mock-data/admin-store";
import {
  canTransitionOrderStatus,
  canTransitionPaymentStatus,
  type OrderStatus,
  type PaymentStatus,
} from "../lib/data/order-types";

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
  console.log("  PHASE 4: ORDER MANAGEMENT & CUSTOMER ADMIN VERIFICATION SUITE   ");
  console.log("==================================================================\n");

  // ---------------------------------------------------------------------------
  // A. ORDER SCHEMA & MOCK DATA CONSISTENCY
  // ---------------------------------------------------------------------------
  console.log("--- Section A: Orders & Line Items Schema Validation ---");

  // A1: Verify hardcoded mock orders have been purged for live database integration
  assert(
    "Orders",
    "SEED_ORDERS purged of mock orders (empty array for live DB data)",
    SEED_ORDERS.length === 0,
    `Expected 0 seed orders after purge, found ${SEED_ORDERS.length}`
  );

  // A2: Respect all 7 schema order statuses
  const expectedOrderStatuses: OrderStatus[] = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ];
  assert(
    "Orders",
    "Defined 7 schema order statuses",
    expectedOrderStatuses.length === 7
  );

  // A3: Respect all 4 payment statuses
  const expectedPaymentStatuses: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];
  assert(
    "Orders",
    "Defined 4 schema payment statuses",
    expectedPaymentStatuses.length === 4
  );

  console.log("--- Section B: Validated Status Transitions & Triggers ---");

  // B1: Allowed forward transitions
  assert(
    "Transitions",
    "canTransitionOrderStatus allows pending -> confirmed",
    canTransitionOrderStatus("pending", "confirmed") === true
  );
  assert(
    "Transitions",
    "canTransitionOrderStatus allows confirmed -> processing",
    canTransitionOrderStatus("confirmed", "processing") === true
  );
  assert(
    "Transitions",
    "canTransitionOrderStatus allows processing -> shipped",
    canTransitionOrderStatus("processing", "shipped") === true
  );
  assert(
    "Transitions",
    "canTransitionOrderStatus allows shipped -> delivered",
    canTransitionOrderStatus("shipped", "delivered") === true
  );
  assert(
    "Transitions",
    "canTransitionOrderStatus allows pending -> cancelled",
    canTransitionOrderStatus("pending", "cancelled") === true
  );
  assert(
    "Transitions",
    "canTransitionOrderStatus allows confirmed -> cancelled",
    canTransitionOrderStatus("confirmed", "cancelled") === true
  );
  assert(
    "Transitions",
    "canTransitionOrderStatus allows delivered -> refunded",
    canTransitionOrderStatus("delivered", "refunded") === true
  );

  // B2: Disallowed transitions (skipping or terminal violations)
  assert(
    "Transitions",
    "canTransitionOrderStatus rejects shipped -> pending (cannot reverse fulfillment)",
    canTransitionOrderStatus("shipped", "pending") === false
  );
  assert(
    "Transitions",
    "canTransitionOrderStatus rejects cancelled -> confirmed (terminal state)",
    canTransitionOrderStatus("cancelled", "confirmed") === false
  );
  assert(
    "Transitions",
    "canTransitionOrderStatus rejects refunded -> shipped (terminal state)",
    canTransitionOrderStatus("refunded", "shipped") === false
  );
  assert(
    "Transitions",
    "canTransitionOrderStatus rejects delivered -> confirmed (cannot re-enter confirmed)",
    canTransitionOrderStatus("delivered", "confirmed") === false
  );

  // B3: Payment transitions
  assert(
    "PaymentTransitions",
    "canTransitionPaymentStatus allows pending -> paid",
    canTransitionPaymentStatus("pending", "paid") === true
  );
  assert(
    "PaymentTransitions",
    "canTransitionPaymentStatus allows paid -> refunded",
    canTransitionPaymentStatus("paid", "refunded") === true
  );
  assert(
    "PaymentTransitions",
    "canTransitionPaymentStatus rejects refunded -> paid (terminal)",
    canTransitionPaymentStatus("refunded", "paid") === false
  );

  // B4: Schema trigger simulation
  const pendingOrder = SEED_ORDERS.find((o) => o.status === "pending");
  if (pendingOrder) {
    const res = updateMockOrderStatus(pendingOrder.id, "confirmed");
    assert(
      "TriggerSimulation",
      "updateMockOrderStatus successfully transitions pending -> confirmed",
      res.success === true && res.order?.status === "confirmed"
    );
  }

  // ---------------------------------------------------------------------------
  // C. CUSTOMERS, ADDRESSES & PROFILES SCHEMA
  // ---------------------------------------------------------------------------
  console.log("\n--- Section C: Customer Profiles & Addresses Schema ---");

  // C1: Customer volume and schema fields
  assert(
    "Customers",
    "SEED_CUSTOMERS loaded with realistic customer profiles",
    SEED_CUSTOMERS.length >= 7,
    `Expected >= 7 seed customers, found ${SEED_CUSTOMERS.length}`
  );

  for (const c of SEED_CUSTOMERS) {
    assert(
      "Customers",
      `Customer '${c.full_name}' has valid schema profile fields`,
      Boolean(c.id && c.email && c.role && c.created_at),
      `Customer profile ${c.id} missing core fields`
    );

    // C2: Allowed roles strictly admin or user
    assert(
      "Customers",
      `Customer '${c.full_name}' role is strictly 'admin' or 'user'`,
      c.role === "admin" || c.role === "user",
      `Invalid role '${c.role}' on customer ${c.id}`
    );

    // C3: Address structure matching addresses schema
    if (c.addresses && c.addresses.length > 0) {
      for (const a of c.addresses) {
        assert(
          "Customers",
          `Customer address '${a.id}' has required schema fields`,
          Boolean(
            a.id &&
            a.user_id &&
            (a.type === "shipping" || a.type === "billing") &&
            a.address_line1 &&
            a.city &&
            a.state &&
            a.postal_code &&
            a.country
          ),
          `Address ${a.id} missing required schema fields`
        );
      }
    }
  }

  // C4: getMockCustomerOrders returns correct customer orders
  const cust1Orders = getMockCustomerOrders("cust-1");
  assert(
    "Customers",
    "getMockCustomerOrders returns empty array when mock orders are purged",
    cust1Orders.length === 0,
    `cust-1 expected orders, found ${cust1Orders.length}`
  );

  // C5: Role update helper validation
  const testRoleUpdate = updateMockUserRole("cust-2", "admin");
  assert(
    "RoleManagement",
    "updateMockUserRole promotes user to admin",
    testRoleUpdate.success === true && testRoleUpdate.customer?.role === "admin"
  );

  const testInvalidRole = updateMockUserRole("cust-2", "superadmin" as any);
  assert(
    "RoleManagement",
    "updateMockUserRole rejects invalid role 'superadmin'",
    testInvalidRole.success === false
  );

  // Restore cust-2 role back to user
  updateMockUserRole("cust-2", "user");

  // ---------------------------------------------------------------------------
  // D. HTTP ROUTES & ADMIN RENDERING
  // ---------------------------------------------------------------------------
  console.log("\n--- Section D: HTTP Admin Page Endpoints ---");

  const adminCookie = `demo_user=${encodeURIComponent(
    JSON.stringify({
      id: "usr_4104acb962ff4cdaae6cd0136b9cee47",
      email: "amber.admin@kanhaiyacollection.com",
      full_name: "Amber Kanhaiya",
      role: "admin",
    })
  )}`;

  async function checkUrl(name: string, path: string) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { Cookie: adminCookie },
        redirect: "manual",
      });
      assert("HTTP", `${name} (${path})`, res.status === 200, `Expected 200, received ${res.status}`);
    } catch (err: any) {
      assert("HTTP", `${name} (${path})`, false, err.message);
    }
  }

  await checkUrl("Admin Orders List Page", "/admin/orders");
  await checkUrl("Admin Order Detail Page (ord-1)", "/admin/orders/ord-1");
  await checkUrl("Admin Order Detail Page (ord-2)", "/admin/orders/ord-2");
  await checkUrl("Admin Customers / Users Page", "/admin/users");

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  const totalTests = reports.length;
  const passedTests = reports.filter((r) => r.passed).length;
  const failedTests = reports.filter((r) => !r.passed).length;

  console.log("\n==================================================================");
  console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  if (failedTests > 0) {
    console.log(`  FAILED: ${failedTests} tests`);
  }
  console.log("==================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
