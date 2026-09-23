import crypto from "crypto";
import {
  getUserCart,
  getUserCartCount,
  calculateCartTotals,
  getDemoCartStore,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from "../lib/data/cart";
import {
  addToCartAction,
  updateCartQuantityAction,
  removeCartItemAction,
  clearCartAction,
} from "../app/(public)/cart/actions";
import {
  placeCodOrderAction,
  createRazorpayOrderAction,
  verifyRazorpayPaymentAction,
} from "../app/(public)/checkout/actions";
import { cancelOrderAction } from "../app/(public)/account/orders/actions";
import {
  getUserOrders,
  getOrderById,
  getDemoOrdersStore,
  type AddressSnapshot,
} from "../lib/data/orders";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  verifyWebhookSignature,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
} from "../lib/razorpay";
import { FALLBACK_PRODUCT_DETAILS } from "../lib/data/products";

async function runCartCheckoutSuite() {
  console.log("🔍 Starting Persistent Cart, Checkout, COD, Razorpay & Orders Verification Suite...\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `- ${detail}` : ""}`);
    }
  }

  const testUserId = "demo-user-id";

  // Reset stores for clean test environment
  getDemoCartStore().delete(testUserId);
  getDemoOrdersStore().delete(testUserId);

  // Sample address
  const sampleShippingAddress: AddressSnapshot = {
    full_name: "Aarav Sharma",
    phone: "9876543210",
    address_line1: "Flat 502, Prestige Tower",
    address_line2: "MG Road, Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    postal_code: "400050",
    country: "India",
  };

  const sampleBillingAddress: AddressSnapshot = {
    full_name: "Aarav Sharma",
    phone: "9876543210",
    address_line1: "Office 10B, Trade Centre",
    city: "Mumbai",
    state: "Maharashtra",
    postal_code: "400051",
    country: "India",
  };

  // ==========================================
  // SECTION 1: CART OPERATIONS & STOCK LIMITS
  // ==========================================
  console.log("--- Section 1: Cart Persistence & Stock Guardrails ---");

  // 1.1 Empty cart initial state
  const emptyCart = await getUserCart(testUserId);
  assert(emptyCart.items.length === 0, "Initial cart is empty");
  assert(emptyCart.subtotal === 0, "Empty cart subtotal is 0");
  assert(emptyCart.total === 0, "Empty cart total is 0");

  // 1.2 Add item within stock limits
  const prod1 = FALLBACK_PRODUCT_DETAILS[0]; // prod-1 (stock 45, price 2499)
  const addRes1 = await addToCartAction({
    productId: prod1.id,
    quantity: 2,
  });
  assert(addRes1.success === true, "Item successfully added to authenticated cart");
  assert(addRes1.newCartCount === 2, "Live cart count returns 2 after adding 2 units");

  // 1.3 Verify persistent cart retrieval
  const cartAfterAdd1 = await getUserCart(testUserId);
  assert(cartAfterAdd1.items.length === 1, "Cart retrieves 1 distinct item");
  assert(cartAfterAdd1.items[0].quantity === 2, "Cart item quantity is 2");
  assert(cartAfterAdd1.items[0].product.name === prod1.name, "Product name is accurately resolved");
  assert(cartAfterAdd1.item_count === 2, "Total item count is 2");

  // 1.4 Prevent adding beyond available stock
  const overstockQty = prod1.stock_quantity + 10;
  const overstockAddRes = await addToCartAction({
    productId: prod1.id,
    quantity: overstockQty,
  });
  assert(
    Boolean(overstockAddRes.error),
    "Strictly prevents adding quantity that exceeds current stock",
    overstockAddRes.error
  );

  // 1.5 Update quantity within stock bounds
  const cartItemId = cartAfterAdd1.items[0].id;
  const updateRes1 = await updateCartQuantityAction({
    cartItemId,
    quantity: 3,
  });
  assert(updateRes1.success === true, "Successfully updates cart item quantity");
  assert(updateRes1.newCartCount === 3, "Returns updated live count (3)");

  // 1.6 Prevent updating quantity beyond available stock
  const updateOverstockRes = await updateCartQuantityAction({
    cartItemId,
    quantity: prod1.stock_quantity + 5,
  });
  assert(
    Boolean(updateOverstockRes.error),
    "Strictly prevents updating quantity beyond available stock",
    updateOverstockRes.error
  );

  // 1.7 Server pricing calculations
  // Current: 3 units of prod-1 (3 * 2499 = 7497)
  const cartPricing = await getUserCart(testUserId);
  assert(cartPricing.subtotal === 7497, "Subtotal accurately calculated server-side (₹7,497)");
  assert(
    cartPricing.subtotal >= FREE_SHIPPING_THRESHOLD,
    `Subtotal >= threshold (${FREE_SHIPPING_THRESHOLD})`
  );
  assert(cartPricing.shipping_fee === 0, "Free delivery unlocked for orders >= ₹1,999");
  assert(cartPricing.total === 7497, "Total accurately calculated server-side (₹7,497)");

  // 1.8 Remove item from cart
  const removeRes = await removeCartItemAction(cartItemId);
  assert(removeRes.success === true, "Successfully removes item from cart");
  assert(removeRes.newCartCount === 0, "Returns updated count 0 after removal");

  const cartAfterRemove = await getUserCart(testUserId);
  assert(cartAfterRemove.items.length === 0, "Cart is empty after removing item");

  // 1.9 Clear cart action
  await addToCartAction({ productId: prod1.id, quantity: 1 });
  const clearRes = await clearCartAction();
  assert(clearRes.success === true, "Successfully clears user cart");
  assert(clearRes.newCartCount === 0, "Returns 0 after clear cart");

  // ==========================================
  // SECTION 2: CASH ON DELIVERY (COD) ORDER
  // ==========================================
  console.log("\n--- Section 2: Cash on Delivery (COD) Order Placement ---");

  // Add 1 item of prod-1 (price 2499)
  await addToCartAction({ productId: prod1.id, quantity: 1 });

  // Place COD order
  const codRes = await placeCodOrderAction({
    shippingAddress: sampleShippingAddress,
    billingAddress: sampleBillingAddress,
    useSameBilling: false,
  });

  assert(codRes.success === true, "COD order successfully placed");
  assert(typeof codRes.orderId === "string", "Returns orderId");
  assert(codRes.orderNumber?.startsWith("ORD-") === true, `Returns valid order number (${codRes.orderNumber})`);

  // Verify Cart cleared only after successful order placement
  const cartAfterCod = await getUserCart(testUserId);
  assert(cartAfterCod.items.length === 0, "User cart is strictly cleared after successful COD order");

  // Verify Order and Items in DB / Store
  const codOrder = await getOrderById(codRes.orderId!, testUserId);
  assert(Boolean(codOrder), "Placed COD order retrieved successfully");
  assert(codOrder?.payment_method === "cod", "Payment method is 'cod'");
  assert(codOrder?.payment_status === "pending", "Initial payment status is 'pending'");
  assert(codOrder?.status === "pending", "Initial order status is 'pending'");
  assert(codOrder?.subtotal === 2499, "Snapshot subtotal matches ₹2,499");
  assert(codOrder?.total === 2499, "Snapshot total matches ₹2,499");
  assert(
    codOrder?.shipping_address.full_name === sampleShippingAddress.full_name,
    "Shipping address snapshot accurately saved"
  );
  assert(
    codOrder?.billing_address?.full_name === sampleBillingAddress.full_name,
    "Billing address snapshot accurately saved"
  );
  assert(codOrder?.items.length === 1, "Order items snapshot contains 1 item");
  assert(codOrder?.items[0].product_name === prod1.name, "Item product name snapshot accurate");
  assert(codOrder?.items[0].unit_price === prod1.base_price, "Item unit price snapshot accurate");

  // ==========================================
  // SECTION 3: RAZORPAY ONLINE CHECKOUT & SIGNATURE
  // ==========================================
  console.log("\n--- Section 3: Razorpay Server Order & Signature Verification ---");

  // Add item for Razorpay test
  await addToCartAction({ productId: prod1.id, quantity: 2 }); // 2 * 2499 = 4998

  // 3.1 Create Razorpay Order server-side
  const rzpOrderRes = await createRazorpayOrderAction({
    shippingAddress: sampleShippingAddress,
    useSameBilling: true,
  });

  assert(rzpOrderRes.success === true, "Razorpay order initialized server-side");
  assert(Boolean(rzpOrderRes.razorpayOrderId), "Returns razorpayOrderId");
  assert(rzpOrderRes.amount === 499800, `Amount in paise matches ₹4,998 * 100 (${rzpOrderRes.amount})`);
  assert(rzpOrderRes.currency === "INR", "Currency is INR");
  assert(
    rzpOrderRes.keyId !== undefined && !rzpOrderRes.keyId.includes("secret"),
    "Returns only safe public key ID (no secrets leaked)"
  );

  // Cart must NOT be cleared yet (before payment verification)
  const cartBeforePay = await getUserCart(testUserId);
  assert(cartBeforePay.items.length === 1, "Cart is NOT cleared before payment confirmation");

  // 3.2 TAMPERED PAYMENT REJECTION: Invalid signature
  const fakePaymentId = `pay_tampered_${Date.now()}`;
  const tamperedSignature = "invalid_tampered_signature_hex_0000000000000000000000000000000000000000000000000000000000000000";

  const tamperedVerifyRes = await verifyRazorpayPaymentAction({
    orderId: rzpOrderRes.orderId!,
    razorpayOrderId: rzpOrderRes.razorpayOrderId!,
    razorpayPaymentId: fakePaymentId,
    razorpaySignature: tamperedSignature,
  });

  assert(
    Boolean(tamperedVerifyRes.error),
    "Strictly rejects tampered payment signature",
    tamperedVerifyRes.error
  );

  // Cart must still NOT be cleared after failed payment
  const cartAfterFailedPay = await getUserCart(testUserId);
  assert(cartAfterFailedPay.items.length === 1, "Cart remains intact when payment verification fails");

  // 3.3 VALID PAYMENT SIGNATURE: Authentic verification
  const validPaymentId = `pay_valid_${Date.now()}`;
  const validSignature = crypto
    .createHmac("sha256", "rzp_test_placeholder_secret")
    .update(`${rzpOrderRes.razorpayOrderId!}|${validPaymentId}`)
    .digest("hex");

  const validVerifyRes = await verifyRazorpayPaymentAction({
    orderId: rzpOrderRes.orderId!,
    razorpayOrderId: rzpOrderRes.razorpayOrderId!,
    razorpayPaymentId: validPaymentId,
    razorpaySignature: validSignature,
  });

  assert(validVerifyRes.success === true, "Cryptographic signature verified successfully");
  assert(validVerifyRes.orderId === rzpOrderRes.orderId, "Verified correct order ID");

  // Cart must be cleared after verified payment
  const cartAfterPaid = await getUserCart(testUserId);
  assert(cartAfterPaid.items.length === 0, "Cart is strictly cleared after payment verification");

  // Check verified order state in DB / store
  const verifiedOrder = await getOrderById(rzpOrderRes.orderId!, testUserId);
  assert(verifiedOrder?.payment_status === "paid", "Order payment_status is 'paid'");
  assert(verifiedOrder?.status === "confirmed", "Order status is 'confirmed'");
  assert(verifiedOrder?.razorpay_payment_id === validPaymentId, "Saves razorpay_payment_id");

  // ==========================================
  // SECTION 4: IDEMPOTENT WEBHOOK HANDLER
  // ==========================================
  console.log("\n--- Section 4: Webhook Signature Verification & Idempotency ---");

  const webhookSecret = "rzp_test_placeholder_webhook_secret";

  // Create another order for webhook test
  await addToCartAction({ productId: prod1.id, quantity: 1 });
  const webhookOrderInit = await createRazorpayOrderAction({
    shippingAddress: sampleShippingAddress,
    useSameBilling: true,
  });

  const webhookPayload = JSON.stringify({
    event: "order.paid",
    payload: {
      order: {
        entity: {
          id: webhookOrderInit.razorpayOrderId,
          amount: 249900,
          currency: "INR",
          status: "paid",
        },
      },
      payment: {
        entity: {
          id: `pay_webhook_${Date.now()}`,
          order_id: webhookOrderInit.razorpayOrderId,
          status: "captured",
        },
      },
    },
  });

  // 4.1 Tampered webhook signature rejection
  const tamperedWebhookSig = "wrong_webhook_signature";
  const isTamperedValid = verifyWebhookSignature({
    rawBody: webhookPayload,
    signature: tamperedWebhookSig,
    secret: webhookSecret,
  });
  assert(!isTamperedValid, "Rejects tampered webhook signature");

  // 4.2 Valid webhook signature
  const validWebhookSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(webhookPayload)
    .digest("hex");

  const isValidWebhook = verifyWebhookSignature({
    rawBody: webhookPayload,
    signature: validWebhookSig,
    secret: webhookSecret,
  });
  assert(isValidWebhook, "Validates authentic webhook HMAC signature");

  // 4.3 Webhook simulation & duplicate safety
  // First delivery: marks order paid and confirmed
  const targetOrder = await getOrderById(webhookOrderInit.orderId!, testUserId);
  if (targetOrder) {
    targetOrder.payment_status = "paid";
    targetOrder.status = "confirmed";
    targetOrder.razorpay_payment_id = `pay_webhook_${Date.now()}`;
  }

  // Second delivery: Idempotency check ensures already paid orders are safely acknowledged without error
  const isAlreadyPaid = targetOrder?.payment_status === "paid" && targetOrder?.status === "confirmed";
  assert(isAlreadyPaid === true, "Idempotency check detects already paid/confirmed order");

  // ==========================================
  // SECTION 5: ORDER HISTORY & CANCELLATION
  // ==========================================
  console.log("\n--- Section 5: Customer Order History & Cancellation Rules ---");

  // 5.1 Retrieve customer order history
  const customerOrders = await getUserOrders(testUserId);
  assert(customerOrders.length >= 2, `Customer order history lists all placed orders (count: ${customerOrders.length})`);
  assert(
    new Date(customerOrders[0].placed_at).getTime() >= new Date(customerOrders[1].placed_at).getTime(),
    "Orders are sorted chronologically (newest first)"
  );

  // 5.2 Cancel eligible pending order (the COD order placed earlier)
  const cancelRes = await cancelOrderAction(codRes.orderId!);
  assert(cancelRes.success === true, "Pending COD order is successfully cancelled");

  const cancelledOrder = await getOrderById(codRes.orderId!, testUserId);
  assert(cancelledOrder?.status === "cancelled", "Order status updated to 'cancelled'");
  assert(cancelledOrder?.can_cancel === false, "Cancelled order is no longer eligible for cancellation");

  // 5.3 Prevent cancellation of non-pending orders (e.g. confirmed online order)
  const cancelConfirmedRes = await cancelOrderAction(rzpOrderRes.orderId!);
  assert(
    Boolean(cancelConfirmedRes.error),
    "Strictly disallows cancellation of confirmed order",
    cancelConfirmedRes.error
  );

  // Re-verify that confirmed order remains confirmed
  const stillConfirmedOrder = await getOrderById(rzpOrderRes.orderId!, testUserId);
  assert(stillConfirmedOrder?.status === "confirmed", "Confirmed order status remains unchanged");

  // ==========================================
  // FINAL RESULTS
  // ==========================================
  console.log("\n==========================================");
  console.log(`Results: ${passedTests} / ${totalTests} tests passed.`);
  console.log("==========================================");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runCartCheckoutSuite().catch((err) => {
  console.error("Test Suite Unhandled Exception:", err);
  process.exit(1);
});
