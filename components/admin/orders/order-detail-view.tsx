"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  Printer,
  Sparkles,
  Info,
} from "lucide-react";
import type {
  OrderDetails,
  OrderStatus,
  PaymentStatus,
} from "@/lib/data/order-types";
import {
  VALID_ORDER_TRANSITIONS,
  canTransitionOrderStatus,
  canTransitionPaymentStatus,
} from "@/lib/data/order-types";
import {
  updateOrderStatusAction,
  updateOrderPaymentStatusAction,
} from "@/app/(admin)/admin/orders/actions";
import {
  updateMockOrderStatus,
  updateMockOrderPaymentStatus,
  getMockOrderById,
} from "@/lib/mock-data/admin-store";

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
    description: "Customer placed the order. Stock has not yet been deducted from store inventory.",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/30",
    description: "Order confirmed. Stock decremented & sold count incremented via schema business trigger.",
    icon: CheckCircle2,
  },
  processing: {
    label: "Processing / Packaging",
    bg: "bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-500/30",
    description: "Warehouse is packaging, consecrating, and quality-checking products.",
    icon: Package,
  },
  shipped: {
    label: "Shipped / In Transit",
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-500/30",
    description: "Dispatched with courier logistics. In transit to destination address.",
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
    description: "Order cancelled. Inventory has been returned to stock. Terminal state.",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    bg: "bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-500/30",
    description: "Return inspected and payment refunded to original payment method. Terminal state.",
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
    hint: "Order cancelled. Restores product inventory.",
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

export function OrderDetailView({ order: initialOrder }: OrderDetailViewProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails>(initialOrder);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Status Change State
  const [selectedNextStatus, setSelectedNextStatus] = useState<OrderStatus | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusActionMessage, setStatusActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    targetStatus: OrderStatus | null;
    title: string;
    description: string;
  }>({
    isOpen: false,
    targetStatus: null,
    title: "",
    description: "",
  });

  // Payment Status State
  const [isChangingPayment, setIsChangingPayment] = useState(false);

  // Hydrate order from local mock store on mount
  useEffect(() => {
    try {
      const stored = getMockOrderById(initialOrder.id);
      if (stored) {
        setOrder(stored);
      }
    } catch {
      // Fallback
    }
  }, [initialOrder.id]);

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const allowedTransitions = VALID_ORDER_TRANSITIONS[order.status] || [];
  const statusInfo = STATUS_DETAILS[order.status] || {
    label: order.status,
    bg: "bg-muted",
    text: "text-foreground",
    border: "border-border",
    description: "",
    icon: Package,
  };
  const StatusIcon = statusInfo.icon;

  // Trigger confirmation dialog for sensitive transitions
  const initiateStatusChange = (targetStatus: OrderStatus) => {
    if (targetStatus === "cancelled") {
      setConfirmDialog({
        isOpen: true,
        targetStatus,
        title: "Cancel this Order?",
        description:
          "Are you sure you want to cancel this order? This is a terminal state. Any reserved inventory will be automatically restored to store stock according to business rules.",
      });
      return;
    }

    if (targetStatus === "refunded") {
      setConfirmDialog({
        isOpen: true,
        targetStatus,
        title: "Process Order Refund?",
        description:
          "Are you sure you want to mark this order as refunded? This indicates all return items have been inspected and monetary refund recorded.",
      });
      return;
    }

    if (targetStatus === "confirmed" && order.status === "pending") {
      setConfirmDialog({
        isOpen: true,
        targetStatus,
        title: "Confirm Order & Deduct Inventory?",
        description:
          "Confirming this order will execute the database trigger 'apply_order_confirmation', reducing product stock and incrementing sold counts. Proceed?",
      });
      return;
    }

    // Normal non-sensitive transitions
    executeStatusChange(targetStatus);
  };

  const executeStatusChange = async (targetStatus: OrderStatus) => {
    setConfirmDialog({ isOpen: false, targetStatus: null, title: "", description: "" });
    setIsChangingStatus(true);
    setStatusActionMessage(null);

    try {
      // 1. Update in local mock store (survives browser refresh and handles triggers)
      const mockResult = updateMockOrderStatus(order.id, targetStatus);
      if (!mockResult.success) {
        setStatusActionMessage({ type: "error", text: mockResult.error || "Status transition rejected." });
        setIsChangingStatus(false);
        return;
      }

      // 2. Update state immediately
      if (mockResult.order) {
        setOrder(mockResult.order);
      }

      // 3. Sync with server action
      await updateOrderStatusAction(order.id, targetStatus);

      setStatusActionMessage({
        type: "success",
        text: `Order status successfully transitioned from '${order.status}' to '${targetStatus}'. Inventory stock updated.`,
      });
      setSelectedNextStatus(null);
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
    if (newPayment === order.payment_status) return;

    if (!canTransitionPaymentStatus(order.payment_status, newPayment)) {
      setStatusActionMessage({
        type: "error",
        text: `Invalid payment transition from '${order.payment_status}' to '${newPayment}'.`,
      });
      return;
    }

    setIsChangingPayment(true);
    setStatusActionMessage(null);

    try {
      // 1. Update in local mock store
      const mockResult = updateMockOrderPaymentStatus(order.id, newPayment);
      if (!mockResult.success) {
        setStatusActionMessage({ type: "error", text: mockResult.error || "Payment update rejected." });
        setIsChangingPayment(false);
        return;
      }

      if (mockResult.order) {
        setOrder(mockResult.order);
      }

      // 2. Sync with server action
      await updateOrderPaymentStatusAction(order.id, newPayment);

      setStatusActionMessage({
        type: "success",
        text: `Payment status successfully updated to '${newPayment}'.`,
      });
    } catch (err: any) {
      setStatusActionMessage({
        type: "error",
        text: err.message || "Failed to update payment status.",
      });
    } finally {
      setIsChangingPayment(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const items = order.items || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Breadcrumb & Actions (Hidden on Print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-2xs"
            title="Print Official Order Invoice / Receipt"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            <span>Print Invoice</span>
          </button>

          <span className="text-xs text-muted-foreground font-mono">
            ID: {order.id}
          </span>
          <button
            type="button"
            onClick={() => copyToClipboard("order_id", order.id)}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Copy internal ID"
          >
            {copiedField === "order_id" ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* PRINT-ONLY INVOICE HEADER (Visible only during window.print()) */}
      <div className="hidden print:block mb-8 pb-6 border-b-2 border-black space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-black">
              KANHAIYA COLLECTION
            </h1>
            <p className="text-xs text-gray-700">
              Handcrafted Sacred Brass Murtis, Pooja Thalis & Spiritual Artifacts
            </p>
            <p className="text-xs text-gray-600">
              12 Kanhaiya Bhavan, Godowlia Chowk, Varanasi, UP 221001 · care@kanhaiyacollection.com
            </p>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">
              GSTIN: 09AAAFK1234F1Z5 · State Code: 09 (Uttar Pradesh)
            </p>
          </div>
          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-black text-white text-xs font-black uppercase tracking-wider mb-1">
              Retail Tax Invoice
            </div>
            <p className="text-sm font-bold font-mono text-black">
              Invoice #{order.order_number}
            </p>
            <p className="text-xs text-gray-700">
              Date: {new Date(order.placed_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-gray-700">
              Status: <span className="font-bold uppercase">{order.status}</span> · Payment:{" "}
              <span className="font-bold uppercase">{order.payment_status}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Screen Order Header Banner (Hidden on Print) */}
      <div className="print:hidden p-6 rounded-3xl border border-border/80 bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
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

        {/* Current Status Pill & Print Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all shadow-2xs"
          >
            <Printer className="h-4 w-4 text-primary" />
            <span>Print Invoice</span>
          </button>

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
          className={`print:hidden p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
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

      {/* Controlled Status Change Module (Hidden on Print) */}
      <div className="print:hidden p-6 rounded-3xl border border-primary/20 bg-card shadow-xs space-y-4">
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
              Permitted Status Transitions from &apos;{order.status}&apos;:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allowedTransitions.map((nextStatus) => {
                const conf = STATUS_DETAILS[nextStatus];
                const actionMeta = ACTION_LABELS[nextStatus];
                const isSelected = selectedNextStatus === nextStatus;
                const isDestructive = nextStatus === "cancelled" || nextStatus === "refunded";

                return (
                  <button
                    key={nextStatus}
                    type="button"
                    disabled={isChangingStatus}
                    onClick={() => initiateStatusChange(nextStatus)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : isDestructive
                        ? "border-destructive/30 bg-destructive/5 hover:border-destructive hover:bg-destructive/10"
                        : "border-border hover:border-primary/50 hover:bg-muted/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">
                          {actionMeta.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${conf.bg} ${conf.text}`}
                        >
                          → {conf.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {actionMeta.hint}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
                      {isChangingStatus ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <span>Click to execute status change</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center gap-3 text-xs text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            <span>
              This order has reached terminal status &apos;<strong>{order.status}</strong>&apos;. Under database schema rules, orders in terminal status cannot transition further.
            </span>
          </div>
        )}
      </div>

      {/* Main Order Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Delivery & Addresses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address Snapshot Card */}
          <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-4 print:border-black print:shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-border/70 print:border-black">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary print:text-black" />
                <h3 className="font-bold text-sm text-foreground print:text-black">
                  Shipping Address Snapshot
                </h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground print:hidden bg-muted px-2 py-0.5 rounded-md">
                Immutable Order Record
              </span>
            </div>

            {order.shipping_address ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col space-y-1">
                  <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider">
                    Recipient Information
                  </span>
                  <span className="font-bold text-foreground text-sm print:text-black">
                    {order.shipping_address.full_name}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    Phone: {order.shipping_address.phone}
                  </span>
                  {order.shipping_address.type && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-primary capitalize">
                      Address Type: {order.shipping_address.type}
                    </span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider">
                    Destination Location
                  </span>
                  <span className="text-foreground font-medium print:text-black">
                    {order.shipping_address.address_line1}
                  </span>
                  {order.shipping_address.address_line2 && (
                    <span className="text-muted-foreground">
                      {order.shipping_address.address_line2}
                    </span>
                  )}
                  <span className="text-foreground font-bold print:text-black">
                    {order.shipping_address.city}, {order.shipping_address.state} —{" "}
                    {order.shipping_address.postal_code}
                  </span>
                  <span className="text-muted-foreground">
                    {order.shipping_address.country || "India"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No shipping address recorded</p>
            )}
          </div>

          {/* Billing Address Card */}
          <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-3 print:border-black print:shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-border/70 print:border-black">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground print:text-black" />
                <h3 className="font-bold text-sm text-foreground print:text-black">
                  Billing Address Snapshot
                </h3>
              </div>
            </div>

            {order.billing_address ? (
              <div className="text-xs flex flex-col space-y-1">
                <span className="font-bold text-foreground text-sm print:text-black">
                  {order.billing_address.full_name}
                </span>
                <span className="text-muted-foreground font-mono">
                  Phone: {order.billing_address.phone}
                </span>
                <span className="text-foreground mt-1 print:text-black">
                  {order.billing_address.address_line1}
                </span>
                {order.billing_address.address_line2 && (
                  <span className="text-muted-foreground">
                    {order.billing_address.address_line2}
                  </span>
                )}
                <span className="text-foreground font-semibold print:text-black">
                  {order.billing_address.city}, {order.billing_address.state} —{" "}
                  {order.billing_address.postal_code}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic px-1">
                Same as delivery / shipping address.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Customer & Payment Information */}
        <div className="space-y-6">
          {/* Customer Account */}
          <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-4 print:border-black print:shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-border/70 print:border-black">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary print:text-black" />
                <h3 className="font-bold text-sm text-foreground print:text-black">
                  Customer Profile
                </h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground print:hidden">
                UID: {order.user_id ? `${order.user_id.slice(0, 8)}...` : "N/A"}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {(order.customer?.full_name || order.shipping_address?.full_name || "C")[0]}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-foreground text-sm truncate print:text-black">
                  {order.customer?.full_name || order.shipping_address?.full_name || "Guest Customer"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {order.customer?.email || "No email on record"}
                </span>
                <span className="text-xs text-muted-foreground font-medium font-mono">
                  {order.customer?.phone || order.shipping_address?.phone || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Gateway Card */}
          <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-4 print:border-black print:shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-border/70 print:border-black">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary print:text-black" />
                <h3 className="font-bold text-sm text-foreground print:text-black">
                  Payment Details
                </h3>
              </div>

              {/* Payment Status Dropdown for Admin */}
              <div className="flex items-center gap-2 print:hidden">
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
              <div className="flex items-center justify-between py-1 border-b border-border/50 print:border-gray-300">
                <span className="text-muted-foreground font-medium">Payment Status:</span>
                <span className="font-bold uppercase text-foreground print:text-black">
                  {order.payment_status}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/50 print:border-gray-300">
                <span className="text-muted-foreground font-medium">Payment Method:</span>
                <span className="font-bold text-foreground print:text-black flex items-center gap-1">
                  {order.payment_method || "Online"}
                </span>
              </div>

              {order.razorpay_order_id && (
                <div className="flex items-center justify-between py-1 border-b border-border/50 print:border-gray-300">
                  <span className="text-muted-foreground font-medium">Gateway Order ID:</span>
                  <span className="font-mono text-foreground font-semibold print:text-black">
                    {order.razorpay_order_id}
                  </span>
                </div>
              )}

              {order.razorpay_payment_id && (
                <div className="flex items-center justify-between py-1 border-b border-border/50 print:border-gray-300">
                  <span className="text-muted-foreground font-medium">Transaction ID:</span>
                  <span className="font-mono text-foreground font-semibold print:text-black">
                    {order.razorpay_payment_id}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Immutable Item Snapshots Table */}
      <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-4 print:border-black print:shadow-none">
        <div className="flex items-center justify-between pb-3 border-b border-border/70 print:border-black">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary print:text-black" />
            <h3 className="font-bold text-sm text-foreground print:text-black">
              Immutable Order Items Snapshot
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md print:bg-transparent print:text-black">
            {items.length} {items.length === 1 ? "Line Item" : "Line Items"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground font-bold uppercase tracking-wider text-[10px] print:bg-gray-100 print:text-black print:border-black">
              <tr>
                <th className="py-3 px-4">Item & Variant Snapshot</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 print:divide-gray-300">
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {item.image_url && (
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-border shrink-0 print:hidden">
                            <Image
                              src={item.image_url}
                              alt={item.product_name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-foreground text-sm print:text-black">
                            {item.product_name}
                          </span>
                          {item.variant_name && (
                            <span className="text-[11px] text-muted-foreground print:text-gray-700">
                              Variant: {item.variant_name}
                            </span>
                          )}
                          {item.product_id && (
                            <span className="text-[10px] text-muted-foreground font-mono print:hidden">
                              PID: {item.product_id.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-muted-foreground print:text-black">
                      ₹{item.unit_price.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-foreground print:text-black">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-foreground print:text-black">
                      ₹{item.subtotal.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground italic">
                    No items found in this order snapshot.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pricing Math Summary */}
        <div className="border-t border-border/70 pt-4 flex justify-end print:border-black">
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground print:text-black">
              <span>Items Subtotal:</span>
              <span className="font-medium text-foreground print:text-black">
                ₹{(order.subtotal || 0).toLocaleString("en-IN")}
              </span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount Applied:</span>
                <span>-₹{order.discount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="flex justify-between text-muted-foreground print:text-black">
              <span>Shipping Fee:</span>
              <span className="font-medium text-foreground print:text-black">
                {order.shipping_fee === 0 ? "Free" : `₹${order.shipping_fee}`}
              </span>
            </div>

            {order.tax > 0 && (
              <div className="flex justify-between text-muted-foreground print:text-black">
                <span>Estimated Taxes / GST:</span>
                <span className="font-medium text-foreground print:text-black">
                  ₹{order.tax.toLocaleString("en-IN")}
                </span>
              </div>
            )}

            <div className="border-t border-border/80 pt-2 flex justify-between text-sm font-black text-foreground print:text-black print:border-black">
              <span>Grand Total:</span>
              <span className="text-base text-primary print:text-black">
                ₹{(order.total || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Print Invoice Signatory Footer (Visible only during printing) */}
        <div className="hidden print:block pt-12 mt-12 border-t border-gray-300">
          <div className="flex justify-between items-end text-xs text-gray-700">
            <div>
              <p className="font-bold">Terms & Conditions:</p>
              <p className="text-[10px] text-gray-600">
                1. All handcrafted items are inspected for ritual purity before dispatch.
              </p>
              <p className="text-[10px] text-gray-600">
                2. Sacred items damaged during logistics must be reported within 48 hours.
              </p>
              <p className="text-[10px] text-gray-600 mt-2 font-semibold">
                Thank you for choosing Kanhaiya Collection Varanasi!
              </p>
            </div>
            <div className="text-right">
              <div className="w-48 border-b border-black mb-1"></div>
              <p className="font-bold text-black">Authorized Signatory</p>
              <p className="text-[10px] text-gray-500">For Kanhaiya Collection</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG MODAL FOR SENSITIVE TRANSITIONS */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold text-foreground">
                {confirmDialog.title}
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {confirmDialog.description}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, targetStatus: null, title: "", description: "" })}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDialog.targetStatus && executeStatusChange(confirmDialog.targetStatus)}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm ${
                  confirmDialog.targetStatus === "cancelled" || confirmDialog.targetStatus === "refunded"
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                Confirm Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
