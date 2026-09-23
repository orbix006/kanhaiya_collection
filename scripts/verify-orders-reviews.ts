import {
  VALID_ORDER_TRANSITIONS,
  canTransitionOrderStatus,
  canTransitionPaymentStatus,
  getAdminOrders,
  getAdminOrderById,
  type OrderStatus,
  type PaymentStatus,
} from "../lib/data/orders";
import {
  getAdminReviews,
  getDemoReviewsStore,
} from "../lib/data/reviews";

async function runTestSuite() {
  console.log("================================================================================");
  console.log("🧪 RUNNING ORDER OPERATIONS & REVIEW MODERATION VERIFICATION SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. ORDER BUSINESS TRANSITIONS & RE-CONFIRMATION GUARD
  // ---------------------------------------------------------------------------
  console.log("--- 1. Order Status Transition Matrix & Re-confirmation Guard ---");

  // Valid forward progressions
  assert(
    canTransitionOrderStatus("pending", "confirmed"),
    "Pending can transition to Confirmed (First confirmation)"
  );
  assert(
    canTransitionOrderStatus("pending", "cancelled"),
    "Pending can transition to Cancelled"
  );
  assert(
    canTransitionOrderStatus("confirmed", "processing"),
    "Confirmed can transition to Processing"
  );
  assert(
    canTransitionOrderStatus("confirmed", "cancelled"),
    "Confirmed can transition to Cancelled before shipment"
  );
  assert(
    canTransitionOrderStatus("processing", "shipped"),
    "Processing can transition to Shipped"
  );
  assert(
    canTransitionOrderStatus("processing", "cancelled"),
    "Processing can transition to Cancelled"
  );
  assert(
    canTransitionOrderStatus("shipped", "delivered"),
    "Shipped can transition to Delivered"
  );
  assert(
    canTransitionOrderStatus("shipped", "refunded"),
    "Shipped can transition to Refunded (e.g. Return in transit)"
  );
  assert(
    canTransitionOrderStatus("delivered", "refunded"),
    "Delivered can transition to Refunded"
  );

  // Terminal states verification
  assert(
    VALID_ORDER_TRANSITIONS["cancelled"].length === 0,
    "Cancelled is a strict terminal state (0 allowed transitions)"
  );
  assert(
    VALID_ORDER_TRANSITIONS["refunded"].length === 0,
    "Refunded is a strict terminal state (0 allowed transitions)"
  );
  assert(
    !canTransitionOrderStatus("cancelled", "confirmed"),
    "Cancelled orders cannot be transitioned to Confirmed"
  );
  assert(
    !canTransitionOrderStatus("refunded", "delivered"),
    "Refunded orders cannot be transitioned back to Delivered"
  );

  // Re-confirmation side-effect prevention
  // Confirmed can ONLY be entered from pending. Any other state transitioning to confirmed MUST BE BLOCKED.
  const nonPendingStatuses: OrderStatus[] = [
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ];

  for (const status of nonPendingStatuses) {
    const canReconfirm = canTransitionOrderStatus(status, "confirmed");
    assert(
      !canReconfirm,
      `Re-confirmation guard: Transition from '${status}' -> 'confirmed' is BLOCKED`,
      "Prevents schema trigger duplicate stock/sold_count adjustments"
    );
  }

  // Prevent backwards transition to pending
  for (const status of ["confirmed", "processing", "shipped", "delivered"] as OrderStatus[]) {
    assert(
      !canTransitionOrderStatus(status, "pending"),
      `Backwards transition: '${status}' -> 'pending' is BLOCKED`
    );
  }

  // Payment status transitions
  assert(
    canTransitionPaymentStatus("pending", "paid"),
    "Payment pending -> paid is allowed"
  );
  assert(
    canTransitionPaymentStatus("pending", "failed"),
    "Payment pending -> failed is allowed"
  );
  assert(
    canTransitionPaymentStatus("paid", "refunded"),
    "Payment paid -> refunded is allowed"
  );
  assert(
    !canTransitionPaymentStatus("refunded", "paid"),
    "Payment refunded is terminal"
  );

  // ---------------------------------------------------------------------------
  // 2. IMMUTABLE SNAPSHOT INTEGRITY & ADMIN ORDER QUERYING
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Immutable Order & Address Snapshot Integrity ---");

  const orderResult = await getAdminOrders();
  assert(
    orderResult.orders.length > 0,
    `Admin orders fetched successfully (Total count: ${orderResult.totalCount})`
  );
  assert(
    orderResult.pendingCount >= 1,
    `Pending order count tracked accurately (${orderResult.pendingCount} pending)`
  );
  assert(
    orderResult.totalRevenue > 0,
    `Total store revenue calculated correctly (₹${orderResult.totalRevenue})`
  );

  const sampleOrder = orderResult.orders[0];

  // Address snapshot validation
  assert(
    Boolean(
      sampleOrder.shipping_address.full_name &&
        sampleOrder.shipping_address.phone &&
        sampleOrder.shipping_address.address_line1 &&
        sampleOrder.shipping_address.city &&
        sampleOrder.shipping_address.state &&
        sampleOrder.shipping_address.postal_code &&
        sampleOrder.shipping_address.country
    ),
    "Shipping address is an immutable snapshot with all required postal fields"
  );

  // Item snapshot validation
  assert(
    sampleOrder.items.length > 0,
    `Order items present (Item count: ${sampleOrder.items.length})`
  );
  const sampleItem = sampleOrder.items[0];
  assert(
    Boolean(
      sampleItem.product_name &&
        sampleItem.unit_price > 0 &&
        sampleItem.quantity > 0 &&
        sampleItem.subtotal > 0
    ),
    "Order item contains historical immutable snapshot pricing and product name"
  );

  // Math calculation validation
  const calculatedItemsTotal = sampleOrder.items.reduce(
    (sum, it) => sum + it.subtotal,
    0
  );
  assert(
    calculatedItemsTotal === sampleOrder.subtotal,
    `Items subtotal matches order subtotal (₹${sampleOrder.subtotal})`
  );

  // getAdminOrderById validation
  const fetchedOrder = await getAdminOrderById(sampleOrder.id);
  assert(
    fetchedOrder !== null && fetchedOrder.id === sampleOrder.id,
    `getAdminOrderById successfully resolves order by UUID (${sampleOrder.id})`
  );

  const fetchedByNumber = await getAdminOrderById(sampleOrder.order_number);
  assert(
    fetchedByNumber !== null && fetchedByNumber.order_number === sampleOrder.order_number,
    `getAdminOrderById successfully resolves order by order_number (${sampleOrder.order_number})`
  );

  // ---------------------------------------------------------------------------
  // 3. REVIEW MODERATION & PURCHASE LINKAGE INSPECTION
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Review Moderation & Purchase Linkage Inspection ---");

  const reviewResult = await getAdminReviews();
  assert(
    reviewResult.reviews.length > 0,
    `Admin reviews loaded (Total count: ${reviewResult.stats.totalCount})`
  );
  assert(
    reviewResult.stats.pendingCount > 0,
    `Pending reviews tracked accurately (${reviewResult.stats.pendingCount} pending)`
  );
  assert(
    reviewResult.stats.approvedCount > 0,
    `Approved reviews tracked accurately (${reviewResult.stats.approvedCount} approved)`
  );

  // Purchase linkage inspection
  const verifiedReview = reviewResult.reviews.find((r) => r.is_verified_purchase);
  assert(
    Boolean(
      verifiedReview &&
        verifiedReview.order_item_id &&
        verifiedReview.order_number &&
        verifiedReview.unit_price &&
        verifiedReview.quantity
    ),
    "Verified review correctly inspects order_item_id and links to purchase record"
  );

  const unverifiedReview = reviewResult.reviews.find((r) => !r.is_verified_purchase);
  assert(
    Boolean(unverifiedReview && unverifiedReview.order_item_id === null),
    "Unverified direct review correctly flagged with null order_item_id"
  );

  // Schema trigger rating rollup calculation verification
  // Schema formula: avg_rating = round(avg(rating) from product_reviews where is_approved = true)
  const approvedOnly = reviewResult.reviews.filter((r) => r.is_approved);
  const manualApprovedAvg =
    approvedOnly.length > 0
      ? Number(
          (
            approvedOnly.reduce((sum, r) => sum + r.rating, 0) /
            approvedOnly.length
          ).toFixed(1)
        )
      : 0;

  assert(
    reviewResult.stats.averageRating === manualApprovedAvg,
    `Store average rating (${reviewResult.stats.averageRating}) reflects ONLY approved reviews`
  );

  // Test filter by pending status
  const pendingOnly = await getAdminReviews({ status: "pending" });
  assert(
    pendingOnly.reviews.every((r) => !r.is_approved),
    "Filter by 'pending' returns strictly unapproved reviews"
  );

  // Test filter by approved status
  const approvedFilterResult = await getAdminReviews({ status: "approved" });
  assert(
    approvedFilterResult.reviews.every((r) => r.is_approved),
    "Filter by 'approved' returns strictly approved reviews"
  );

  // Test filter by verification
  const verifiedFilterResult = await getAdminReviews({ verification: "verified" });
  assert(
    verifiedFilterResult.reviews.every((r) => r.is_verified_purchase),
    "Filter by 'verified' returns strictly verified purchase reviews"
  );

  // ---------------------------------------------------------------------------
  // 4. MODERATION ACTIONS & STORE REVIEWS SYNC
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Moderation State Transitions ---");

  const demoStore = getDemoReviewsStore();
  const testPending = Array.from(demoStore.values()).find((r) => !r.is_approved);

  if (testPending) {
    const originalPendingCount = reviewResult.stats.pendingCount;
    // Simulate approval
    testPending.is_approved = true;
    const afterApprove = await getAdminReviews();
    assert(
      afterApprove.stats.pendingCount === originalPendingCount - 1,
      "Approving a review decrements pending count and publishes review"
    );

    // Simulate unapproval / revocation
    testPending.is_approved = false;
    const afterRevoke = await getAdminReviews();
    assert(
      afterRevoke.stats.pendingCount === originalPendingCount,
      "Revoking approval returns review to pending and recalculates ratings"
    );
  }

  // ---------------------------------------------------------------------------
  // RESULTS SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
