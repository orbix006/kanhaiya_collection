export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface AddressSnapshot {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  type?: "shipping" | "billing";
}

export interface OrderItemSnapshot {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  image_url?: string | null;
}

export interface OrderCustomerInfo {
  id: string;
  full_name: string | null;
  email?: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export interface OrderDetails {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  tax: number;
  total: number;
  shipping_address: AddressSnapshot;
  billing_address: AddressSnapshot | null;
  placed_at: string;
  updated_at: string;
  items: OrderItemSnapshot[];
  customer?: OrderCustomerInfo | null;
  can_cancel: boolean;
}

export interface AdminOrderFilterParams {
  searchQuery?: string;
  status?: OrderStatus | "all";
  paymentStatus?: PaymentStatus | "all";
  paymentMethod?: string | "all";
  page?: number;
  pageSize?: number;
}

export interface AdminOrderListResult {
  orders: OrderDetails[];
  totalCount: number;
  pendingCount: number;
  confirmedCount: number;
  processingCount: number;
  shippedCount: number;
  deliveredCount: number;
  cancelledCount: number;
  refundedCount: number;
  totalRevenue: number;
}

/**
 * Valid business state transition rules.
 * Strictly guarantees that 'confirmed' can ONLY be transitioned into from 'pending'.
 * Once an order leaves 'pending' and enters 'confirmed' (or beyond), it cannot return to 'confirmed'.
 * This prevents duplicate execution of schema trigger trg_order_confirmation.
 */
export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export function canTransitionOrderStatus(
  current: OrderStatus,
  next: OrderStatus
): boolean {
  if (current === next) return false;
  const allowed = VALID_ORDER_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

export const VALID_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ["paid", "failed"],
  failed: ["pending", "paid"],
  paid: ["refunded"],
  refunded: [],
};

export function canTransitionPaymentStatus(
  current: PaymentStatus,
  next: PaymentStatus
): boolean {
  if (current === next) return false;
  const allowed = VALID_PAYMENT_TRANSITIONS[current] || [];
  return allowed.includes(next);
}
