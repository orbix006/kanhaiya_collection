"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Clock,
  CheckCircle2,
  Eye,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Check,
  MapPin,
  Mail,
  X,
} from "lucide-react";
import type { MockOrder } from "@/lib/mock-data/admin-store";
import { updateMockOrderStatus } from "@/lib/mock-data/admin-store";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";

interface NewOrdersQueueProps {
  orders: MockOrder[];
  onOrderUpdated: () => void;
}

export function NewOrdersQueue({ orders, onOrderUpdated }: NewOrdersQueueProps) {
  // Filter exclusively for pending, unactioned orders
  const pendingOrders = orders.filter((o) => o.status === "pending");

  // Selected order for detailed modal view
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null);

  // Processing indicator
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Quick Action: Confirm Order
  const handleConfirmOrder = async (order: MockOrder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionInProgressId(order.id);

    try {
      const res = updateMockOrderStatus(order.id, "confirmed");
      if (res.success) {
        setFeedbackBanner({
          type: "success",
          message: `Order #${order.order_number} confirmed successfully! Inventory decremented and order moved to Fulfillment.`,
        });
        if (selectedOrder?.id === order.id) {
          setSelectedOrder(null);
        }
        onOrderUpdated();
      } else {
        setFeedbackBanner({
          type: "error",
          message: res.error || "Failed to confirm order.",
        });
      }
    } catch (err: unknown) {
      setFeedbackBanner({
        type: "error",
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setActionInProgressId(null);
      setTimeout(() => setFeedbackBanner(null), 5000);
    }
  };

  // Quick Action: Cancel Order
  const handleCancelOrder = async (order: MockOrder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionInProgressId(order.id);

    try {
      const res = updateMockOrderStatus(order.id, "cancelled");
      if (res.success) {
        setFeedbackBanner({
          type: "success",
          message: `Order #${order.order_number} has been cancelled.`,
        });
        if (selectedOrder?.id === order.id) {
          setSelectedOrder(null);
        }
        onOrderUpdated();
      } else {
        setFeedbackBanner({
          type: "error",
          message: res.error || "Failed to cancel order.",
        });
      }
    } catch (err: unknown) {
      setFeedbackBanner({
        type: "error",
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setActionInProgressId(null);
      setTimeout(() => setFeedbackBanner(null), 5000);
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
      {/* 1. Header with Title, Count Pill & Link to Full Orders */}
      <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>New Orders Requiring Action</span>
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                    pendingOrders.length > 0
                      ? "bg-amber-500 text-white dark:bg-amber-600"
                      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {pendingOrders.length} {pendingOrders.length === 1 ? "Order" : "Orders"}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Orders with &apos;pending&apos; status awaiting first administrative confirmation. Actioning an order immediately advances it to fulfillment.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline self-start sm:self-auto"
        >
          <span>View All Orders ({orders.length})</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Action Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`px-5 py-3 border-b text-xs font-semibold flex items-center justify-between ${
            feedbackBanner.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-muted-foreground hover:text-foreground text-xs font-bold"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 2. Orders Table or Empty State */}
      <div className="overflow-x-auto">
        {pendingOrders.length === 0 ? (
          <div className="p-8 sm:p-12">
            <EmptyState
              icon={CheckCircle2}
              title="All Caught Up! No Pending Orders"
              description="Every incoming customer order has been reviewed and actioned by the administration team. New customer orders will automatically appear in this queue."
              action={{
                label: "Inspect All Orders & Fulfillment",
                href: "/admin/orders",
              }}
            />
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {pendingOrders.map((order) => {
                const isActioning = actionInProgressId === order.id;
                const itemsSummary =
                  order.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(", ") ||
                  `${order.items_count} items`;

                const formattedTime = new Date(order.placed_at).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    {/* Order Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="text-primary group-hover:underline">
                          {order.order_number}
                        </span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground">
                        {order.customer_name || order.shipping_address?.full_name || "Customer"}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[170px]">
                        {order.shipping_address?.city
                          ? `${order.shipping_address.city}, ${order.shipping_address.state}`
                          : order.customer_email || "Address on file"}
                      </div>
                    </td>

                    {/* Order Date */}
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <div className="font-medium text-foreground">{formattedTime}</div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        Awaiting review
                      </div>
                    </td>

                    {/* Item Count */}
                    <td className="py-3.5 px-4" title={itemsSummary}>
                      <div className="font-semibold text-foreground">
                        {order.items_count} {order.items_count === 1 ? "item" : "items"}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                        {itemsSummary}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 font-mono font-black text-foreground text-sm">
                      ₹{(order.total_amount ?? order.total ?? 0).toLocaleString("en-IN")}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5 items-start">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            order.payment_status === "paid"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {order.payment_status === "paid" ? "Paid" : "Payment Pending"}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                          {order.payment_method || "Online UPI"}
                        </span>
                      </div>
                    </td>

                    {/* Current Order Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} />
                    </td>

                    {/* Compact Action Affordances */}
                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Confirm / Accept Action */}
                        <button
                          type="button"
                          disabled={isActioning}
                          onClick={(e) => handleConfirmOrder(order, e)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                          title="Confirm order & advance to fulfillment"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Confirm</span>
                        </button>

                        {/* 2. Cancel Action */}
                        <button
                          type="button"
                          disabled={isActioning}
                          onClick={(e) => handleCancelOrder(order, e)}
                          className="inline-flex items-center gap-1 p-1.5 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive/30 text-muted-foreground hover:text-destructive transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                          title="Cancel order"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        {/* 3. Inspect Details */}
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                          title="View order snapshot details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Details</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 3. Detailed Order Modal Dialog */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground font-mono flex items-center gap-2">
                    <span>Order #{selectedOrder.order_number}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-sans font-bold">
                      Awaiting Action
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Placed on {new Date(selectedOrder.placed_at).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Customer & Shipping Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1.5">
                  <div className="font-bold text-foreground flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span>Customer Information</span>
                  </div>
                  <div className="font-semibold text-sm text-foreground">
                    {selectedOrder.customer_name || selectedOrder.shipping_address?.full_name}
                  </div>
                  <div className="text-muted-foreground font-mono">
                    {selectedOrder.shipping_address?.phone || selectedOrder.customer?.phone || "No phone"}
                  </div>
                  <div className="text-muted-foreground">
                    {selectedOrder.customer_email || "No email recorded"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1.5">
                  <div className="font-bold text-foreground flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>Shipping Address</span>
                  </div>
                  {selectedOrder.shipping_address ? (
                    <div className="text-muted-foreground space-y-0.5">
                      <div className="font-medium text-foreground">
                        {selectedOrder.shipping_address.address_line1}
                      </div>
                      {selectedOrder.shipping_address.address_line2 && (
                        <div>{selectedOrder.shipping_address.address_line2}</div>
                      )}
                      <div>
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} —{" "}
                        {selectedOrder.shipping_address.postal_code}
                      </div>
                      <div>{selectedOrder.shipping_address.country}</div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic">No address snapshot recorded</div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Purchased Items ({selectedOrder.items?.length || 0})
                </div>
                <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden bg-card">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.image_url ? (
                            <div className="relative h-11 w-11 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                              <Image
                                src={item.image_url}
                                alt={item.product_name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{item.product_name}</p>
                            {item.variant_name && (
                              <p className="text-[11px] text-muted-foreground truncate">{item.variant_name}</p>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                              Qty: {item.quantity} × ₹{item.unit_price.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 font-bold font-mono text-foreground text-sm">
                          ₹{item.subtotal.toLocaleString("en-IN")}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">No item snapshots recorded.</div>
                  )}
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{(selectedOrder.subtotal || 0).toLocaleString("en-IN")}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">-₹{selectedOrder.discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping Fee</span>
                  <span className="font-mono">
                    {selectedOrder.shipping_fee > 0 ? `₹${selectedOrder.shipping_fee}` : "FREE"}
                  </span>
                </div>
                <div className="flex justify-between text-foreground font-bold text-sm pt-2 border-t border-border/60">
                  <span>Total Amount</span>
                  <span className="font-mono text-primary font-black">
                    ₹{(selectedOrder.total_amount ?? selectedOrder.total ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-4 border-t border-border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                href={`/admin/orders/${selectedOrder.id}`}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
              >
                <span>Open Full Order Management Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={actionInProgressId === selectedOrder.id}
                  onClick={(e) => handleCancelOrder(selectedOrder, e)}
                  className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-destructive/10 hover:border-destructive/30 text-destructive text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel Order
                </button>

                <button
                  type="button"
                  disabled={actionInProgressId === selectedOrder.id}
                  onClick={(e) => handleConfirmOrder(selectedOrder, e)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>Confirm Order & Send to Fulfillment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
