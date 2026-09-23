"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Calendar,
  MapPin,
  CreditCard,
  Banknote,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  XCircle,
  ShieldCheck,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { OrderDetails } from "@/lib/data/order-types";
import { cancelOrderAction } from "@/app/(public)/account/orders/actions";

interface OrderDetailViewProps {
  order: OrderDetails;
  isJustConfirmed?: boolean;
}

export function OrderDetailView({
  order: initialOrder,
  isJustConfirmed = false,
}: OrderDetailViewProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails>(initialOrder);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const formattedDate = new Date(order.placed_at).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCancelOrder = () => {
    if (!confirm(`Are you sure you want to cancel Order #${order.order_number}? This action cannot be reversed.`)) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await cancelOrderAction(order.id);
      if (res?.error) {
        setActionError(res.error);
      } else if (res?.success) {
        setActionSuccess(res.message);
        setOrder((prev) => ({
          ...prev,
          status: "cancelled",
          can_cancel: false,
        }));
        router.refresh();
      }
    });
  };

  const getStatusStepIndex = (status: OrderDetails["status"]) => {
    switch (status) {
      case "pending":
        return 0;
      case "confirmed":
        return 1;
      case "processing":
        return 2;
      case "shipped":
        return 3;
      case "delivered":
        return 4;
      default:
        return -1;
    }
  };

  const currentStep = getStatusStepIndex(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors p-2 -ml-2 rounded-lg hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Orders</span>
        </Link>

        <span className="text-xs text-muted-foreground">Order ID: {order.id}</span>
      </div>

      {/* Just Confirmed Success Banner */}
      {isJustConfirmed && (
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xs shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Thank You for Your Order!</h2>
              <p className="text-xs sm:text-sm opacity-90 mt-0.5">
                Your order #{order.order_number} has been received and verified. Your bag has been cleared.
              </p>
            </div>
          </div>
          <Link
            href="/shop"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0 shadow-xs"
          >
            Continue Shopping
          </Link>
        </div>
      )}

      {/* Action Feedback Messages */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Order Header Summary Card */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Order #{order.order_number}
              </h1>
              {order.status === "pending" && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  Pending
                </span>
              )}
              {order.status === "confirmed" && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Confirmed
                </span>
              )}
              {order.status === "cancelled" && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                  Cancelled
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Placed on {formattedDate}</span>
            </p>
          </div>

          {/* Cancellation Control */}
          <div className="flex items-center gap-3">
            {order.can_cancel && (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isPending}
                className="px-4 py-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>Cancel This Order</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Status Tracker */}
        {isCancelled ? (
          <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-start gap-3">
            <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">This order has been cancelled.</p>
              <p className="text-xs opacity-90 mt-0.5">
                No charges were processed or inventory held for this order.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
              Order Fulfillment Status
            </h3>

            {/* Step Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: "Order Placed", desc: "Pending" },
                { label: "Confirmed", desc: "Stock Allocated" },
                { label: "Processing", desc: "Handcrafted" },
                { label: "Shipped", desc: "In Transit" },
                { label: "Delivered", desc: "Fulfilled" },
              ].map((step, idx) => {
                const isPassed = currentStep >= idx;
                const isCurrent = currentStep === idx;

                return (
                  <div
                    key={step.label}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isCurrent
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : isPassed
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                        : "border-border/60 bg-muted/20 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      {isPassed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-muted-foreground flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-bold text-foreground">{step.label}</p>
                    <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Middle Grid: Items Snapshot & Delivery Snapshots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Ordered Items Snapshot Table */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <h2 className="text-base font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span>Items in this Order ({order.items.length})</span>
          </h2>

          <div className="divide-y divide-border/60">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">{item.product_name}</p>
                  {item.variant_name && (
                    <p className="text-xs text-muted-foreground font-medium">
                      Variant: {item.variant_name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Quantity: {item.quantity} × ₹{item.unit_price.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-foreground">
                    ₹{item.subtotal.toLocaleString("en-IN")}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">Snapshot Price</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing & Payment Snapshot */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <h2 className="text-base font-bold text-foreground border-b border-border pb-3">
              Payment Summary
            </h2>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span className="font-semibold text-foreground">
                  ₹{order.subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Shipping Fee</span>
                <span className="font-semibold text-foreground">
                  {order.shipping_fee === 0 ? "FREE" : `₹${order.shipping_fee}`}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Taxes & GST</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Inclusive (18%)
                </span>
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <span className="text-sm font-bold text-foreground">Order Total</span>
                <span className="text-xl font-black text-primary">
                  ₹{order.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Payment Gateway Snapshot */}
            <div className="pt-4 border-t border-border/60 space-y-2 text-xs">
              <p className="font-bold text-foreground">Payment Details</p>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Method:</span>
                <span className="font-semibold text-foreground capitalize">
                  {order.payment_method === "cod" ? "Cash on Delivery" : "Razorpay Online"}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Status:</span>
                <span className="font-bold capitalize text-foreground">
                  {order.payment_status}
                </span>
              </div>
              {order.razorpay_payment_id && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Transaction ID:</span>
                  <span className="font-mono text-[11px] text-foreground">
                    {order.razorpay_payment_id}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address Snapshot Card */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2.5">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Shipping Address Snapshot</span>
            </h3>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-bold text-foreground">{order.shipping_address?.full_name}</p>
              <p>{order.shipping_address?.address_line1}</p>
              {order.shipping_address?.address_line2 && (
                <p>{order.shipping_address.address_line2}</p>
              )}
              <p>
                {order.shipping_address?.city}, {order.shipping_address?.state} -{" "}
                {order.shipping_address?.postal_code}
              </p>
              <p className="font-medium text-foreground pt-1">
                Phone: {order.shipping_address?.phone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
