"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Copy,
  Check,
  ShieldCheck,
  CreditCard,
  Banknote,
  MapPin,
  User,
  AlertTriangle,
  Lock,
  Loader2,
  FileText,
} from "lucide-react";
import type {
  OrderDetails,
  OrderStatus,
  PaymentStatus,
} from "@/lib/data/order-types";
import {
  VALID_ORDER_TRANSITIONS,
  canTransitionOrderStatus,
} from "@/lib/data/order-types";
import {
  updateOrderStatusAction,
  updateOrderPaymentStatusAction,
} from "@/app/(admin)/admin/orders/actions";

interface OrderDetailViewProps {
  order: OrderDetails;
}

const STATUS_DETAILS: Record<
  OrderStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    description: string;
    icon: any;
  }
> = {
  pending: {
    label: "Pending Confirmation",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/30",
    description: "Customer placed the order. Stock has not yet been deducted.",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/30",
    description: "Order confirmed. Stock decremented & sold count incremented via database trigger.",
    icon: CheckCircle2,
  },
  processing: {
    label: "Processing / Packaging",
    bg: "bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-500/30",
    description: "Warehouse is packaging and quality-checking products.",
    icon: Package,
  },
  shipped: {
    label: "Shipped / In Transit",
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-500/30",
    description: "Dispatched with courier logistics. In transit to customer.",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/30",
    description: "Order successfully delivered to customer.",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/30",
    description: "Order cancelled. Terminal state.",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    bg: "bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-500/30",
    description: "Return processed and funds refunded. Terminal state.",
    icon: RotateCcw,
  },
};

const ACTION_LABELS: Record<OrderStatus, { title: string; hint: string }> = {
  confirmed: {
    title: "Confirm Order",
    hint: "Fires DB trigger to adjust stock & sold counts exactly once.",
  },
  processing: {
    title: "Begin Processing",
    hint: "Mark order as being prepared in warehouse.",
  },
  shipped: {
    title: "Mark as Shipped",
    hint: "Courier dispatched package to recipient.",
  },
  delivered: {
    title: "Mark as Delivered",
    hint: "Package received by recipient.",
  },
  cancelled: {
    title: "Cancel Order",
    hint: "Order cancelled before fulfillment.",
  },
  refunded: {
    title: "Mark as Refunded",
    hint: "Return inspected and payment refunded to buyer.",
  },
  pending: {
    title: "Return to Pending",
    hint: "Not permitted from active states.",
  },
};

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Status Change State
  const [selectedNextStatus, setSelectedNextStatus] = useState<OrderStatus | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusActionMessage, setStatusActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Payment Status State
  const [isChangingPayment, setIsChangingPayment] = useState(false);

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const allowedTransitions = VALID_ORDER_TRANSITIONS[order.status] || [];
  const statusInfo = STATUS_DETAILS[order.status];
  const StatusIcon = statusInfo.icon;

  const handleStatusChange = async (targetStatus: OrderStatus) => {
    setIsChangingStatus(true);
    setStatusActionMessage(null);

    try {
      const res = await updateOrderStatusAction(order.id, targetStatus);
      if (res.error) {
        setStatusActionMessage({ type: "error", text: res.error });
      } else {
        setStatusActionMessage({
          type: "success",
          text: res.message || `Order successfully updated to '${targetStatus}'.`,
        });
        setSelectedNextStatus(null);
        router.refresh();
      }
    } catch (err: any) {
      setStatusActionMessage({
        type: "error",
        text: err.message || "Failed to update order status.",
      });
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handlePaymentStatusChange = async (newPayment: PaymentStatus) => {
    setIsChangingPayment(true);
    setStatusActionMessage(null);

    try {
      const res = await updateOrderPaymentStatusAction(order.id, newPayment);
      if (res.error) {
        setStatusActionMessage({ type: "error", text: res.error });
      } else {
        setStatusActionMessage({
          type: "success",
          text: res.message || `Payment status updated to '${newPayment}'.`,
        });
        router.refresh();
      }
    } catch (err: any) {
      setStatusActionMessage({
        type: "error",
        text: err.message || "Failed to update payment status.",
      });
    } finally {
      setIsChangingPayment(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            ID: {order.id}
          </span>
          <button
            type="button"
            onClick={() => copyToClipboard("order_id", order.id)}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Copy internal UUID"
          >
            {copiedField === "order_id" ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Order Header Banner */}
      <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight font-mono">
              {order.order_number}
            </h1>
            <button
              type="button"
              onClick={() => copyToClipboard("order_number", order.order_number)}
              className="p-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Copy Order Number"
            >
              {copiedField === "order_number" ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-3">
            <span>
              Placed:{" "}
              <strong className="text-foreground">
                {new Date(order.placed_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </strong>
            </span>
            <span>·</span>
            <span>
              Updated:{" "}
              <strong className="text-foreground">
                {new Date(order.updated_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </strong>
            </span>
          </p>
        </div>

        {/* Current Status Pill */}
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
          >
            <StatusIcon className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                Order Status
              </span>
              <span className="text-xs font-black">{statusInfo.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Action Feedback Banner */}
      {statusActionMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            statusActionMessage.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/20 bg-destructive/10 text-destructive"
          }`}
        >
          {statusActionMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>{statusActionMessage.text}</span>
        </div>
      )}

      {/* Controlled Status Change Module */}
      <div className="p-6 rounded-3xl border border-primary/20 bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div>
            <h3 className="font-bold text-sm text-foreground">
              Controlled Business Status Workflow
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {statusInfo.description}
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Schema Trigger Enforced</span>
          </div>
        </div>

        {/* Allowed Next Transitions */}
        {allowedTransitions.length > 0 ? (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Permitted Next Transitions:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allowedTransitions.map((nextStatus) => {
                const actionConf = ACTION_LABELS[nextStatus];
                const targetConf = STATUS_DETAILS[nextStatus];
                const isSelected = selectedNextStatus === nextStatus;
                const isConfirmingOrder = nextStatus === "confirmed";

                return (
                  <div
                    key={nextStatus}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border/80 bg-muted/20 hover:border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                          {actionConf.title}
                          {isConfirmingOrder && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300">
                              Stock Commit
                            </span>
                          )}
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {actionConf.hint}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isChangingStatus}
                        onClick={() => setSelectedNextStatus(isSelected ? null : nextStatus)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-card hover:bg-muted text-foreground"
                        }`}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </button>
                    </div>

                    {/* Confirmation Panel inside selected item */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Confirm transition to{" "}
                          <strong className="text-foreground">{targetConf.label}</strong>?
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedNextStatus(null)}
                            className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-medium text-muted-foreground hover:bg-muted"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isChangingStatus}
                            onClick={() => handleStatusChange(nextStatus)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold shadow-xs hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                          >
                            {isChangingStatus && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                            <span>Apply Status</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Terminal State Banner */
          <div className="p-4 rounded-2xl border border-muted-foreground/20 bg-muted/30 text-xs text-muted-foreground flex items-center gap-3">
            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              This order has reached a terminal status (<strong>{order.status}</strong>). No further status transitions are offered to safeguard financial and inventory integrity.
            </span>
          </div>
        )}
      </div>

      {/* Grid: 2 Columns for Address, Customer & Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Immutable Address Snapshots */}
        <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">
                Immutable Address Snapshots
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              Frozen at Checkout
            </span>
          </div>

          {/* Shipping Address Snapshot */}
          <div className="space-y-1 text-xs">
            <span className="font-bold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
              Delivery Address:
            </span>
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 flex flex-col gap-0.5">
              <span className="font-bold text-foreground text-sm">
                {order.shipping_address.full_name}
              </span>
              <span className="text-muted-foreground font-medium">
                {order.shipping_address.phone}
              </span>
              <span className="text-foreground mt-1">
                {order.shipping_address.address_line1}
              </span>
              {order.shipping_address.address_line2 && (
                <span className="text-muted-foreground">
                  {order.shipping_address.address_line2}
                </span>
              )}
              <span className="text-foreground font-semibold">
                {order.shipping_address.city}, {order.shipping_address.state} —{" "}
                {order.shipping_address.postal_code}
              </span>
              <span className="text-muted-foreground">
                {order.shipping_address.country}
              </span>
            </div>
          </div>

          {/* Billing Address Snapshot */}
          <div className="space-y-1 text-xs pt-1">
            <span className="font-bold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
              Billing Address:
            </span>
            {order.billing_address ? (
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 flex flex-col gap-0.5">
                <span className="font-bold text-foreground text-sm">
                  {order.billing_address.full_name}
                </span>
                <span className="text-muted-foreground font-medium">
                  {order.billing_address.phone}
                </span>
                <span className="text-foreground mt-1">
                  {order.billing_address.address_line1}
                </span>
                {order.billing_address.address_line2 && (
                  <span className="text-muted-foreground">
                    {order.billing_address.address_line2}
                  </span>
                )}
                <span className="text-foreground font-semibold">
                  {order.billing_address.city}, {order.billing_address.state} —{" "}
                  {order.billing_address.postal_code}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic px-1">
                Same as delivery address.
              </p>
            )}
          </div>
        </div>

        {/* Customer & Payment Information */}
        <div className="space-y-6">
          {/* Customer Account */}
          <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">
                  Customer Profile
                </h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                UID: {order.user_id.slice(0, 8)}...
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {(order.customer?.full_name || order.shipping_address.full_name || "C")[0]}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-foreground text-sm">
                  {order.customer?.full_name || order.shipping_address.full_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {order.customer?.email || "No email on record"}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {order.customer?.phone || order.shipping_address.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Gateway Card */}
          <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">
                  Payment Information
                </h3>
              </div>

              {/* Payment Status Dropdown for Admin */}
              <div className="flex items-center gap-2">
                <select
                  value={order.payment_status}
                  disabled={isChangingPayment}
                  onChange={(e) => handlePaymentStatusChange(e.target.value as PaymentStatus)}
                  className="text-xs font-bold px-2 py-1 rounded-lg border border-border bg-card text-foreground cursor-pointer focus:outline-hidden focus:border-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
                {isChangingPayment && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Payment Method:</span>
                <span className="font-bold text-foreground uppercase flex items-center gap-1">
                  {order.payment_method === "cod" ? (
                    <>
                      <Banknote className="h-3.5 w-3.5" /> Cash on Delivery (COD)
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-3.5 w-3.5" /> Razorpay Online Gateway
                    </>
                  )}
                </span>
              </div>

              {order.razorpay_order_id && (
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Razorpay Order ID:</span>
                  <div className="flex items-center gap-1 font-mono text-foreground font-semibold">
                    <span>{order.razorpay_order_id}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("rzp_order", order.razorpay_order_id!)}
                      className="p-1 hover:bg-muted text-muted-foreground"
                    >
                      {copiedField === "rzp_order" ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {order.razorpay_payment_id && (
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Payment Transaction ID:</span>
                  <div className="flex items-center gap-1 font-mono text-foreground font-semibold">
                    <span>{order.razorpay_payment_id}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("rzp_pay", order.razorpay_payment_id!)}
                      className="p-1 hover:bg-muted text-muted-foreground"
                    >
                      {copiedField === "rzp_pay" ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {order.razorpay_signature && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground font-medium">Signature Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> Cryptographically Verified
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Immutable Item Snapshots Table */}
      <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              Immutable Order Items Snapshot
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            {order.items.length} {order.items.length === 1 ? "Line Item" : "Line Items"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Item & Variant Snapshot</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground text-sm">
                        {item.product_name}
                      </span>
                      {item.variant_name && (
                        <span className="text-[11px] text-muted-foreground">
                          Variant: {item.variant_name}
                        </span>
                      )}
                      {item.product_id && (
                        <Link
                          href={`/admin/products`}
                          className="text-[10px] text-primary hover:underline mt-0.5 font-mono"
                        >
                          Catalog PID: {item.product_id.slice(0, 8)}...
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-muted-foreground">
                    ₹{item.unit_price.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-foreground">
                    {item.quantity}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-foreground">
                    ₹{item.subtotal.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Math Summary */}
        <div className="border-t border-border/70 pt-4 flex justify-end">
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Items Subtotal:</span>
              <span className="font-medium text-foreground">
                ₹{order.subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount Applied:</span>
                <span>-₹{order.discount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="flex justify-between text-muted-foreground">
              <span>Shipping Fee:</span>
              <span className="font-medium text-foreground">
                {order.shipping_fee === 0 ? "Free" : `₹${order.shipping_fee}`}
              </span>
            </div>

            {order.tax > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Estimated Tax:</span>
                <span className="font-medium text-foreground">
                  ₹{order.tax.toLocaleString("en-IN")}
                </span>
              </div>
            )}

            <div className="border-t border-border/80 pt-2 flex justify-between text-sm font-black text-foreground">
              <span>Grand Total:</span>
              <span className="text-base text-primary">
                ₹{order.total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
