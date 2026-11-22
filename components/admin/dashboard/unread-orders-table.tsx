"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Inbox,
  CheckCircle2,
  ExternalLink,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Banknote,
  AlertCircle,
  Loader2,
  Eye,
  Check,
} from "lucide-react";
import type { UnreadOrderRow } from "@/lib/data/admin-dashboard";
import { markOrderAsReadAction } from "@/app/(admin)/admin/orders/actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { createClient } from "@/lib/supabase/client";

interface UnreadOrdersTableProps {
  initialOrders: UnreadOrderRow[];
}

export function UnreadOrdersTable({ initialOrders }: UnreadOrdersTableProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<UnreadOrderRow[]>(initialOrders);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Keep state synchronized with server props
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Real-time subscription to public.orders for instant appearance of new orders
  useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel("admin_unread_orders_sync")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          (payload) => {
            // When order changes or is inserted, revalidate
            startTransition(() => {
              router.refresh();
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Fallback: router.refresh() handles manual transitions
    }
  }, [router]);

  const handleMarkAsRead = async (order: UnreadOrderRow) => {
    setMarkingId(order.id);
    setFeedback(null);

    // Optimistically remove order from unread table for instant feedback
    setOrders((prev) => prev.filter((o) => o.id !== order.id));

    startTransition(async () => {
      const res = await markOrderAsReadAction(order.id);
      setMarkingId(null);

      if (res.success) {
        setFeedback({
          type: "success",
          message: `Order #${order.order_number} marked as read. Customer status remains unchanged.`,
        });
        router.refresh();
      } else {
        // Rollback on error
        setOrders((prev) => [order, ...prev]);
        setFeedback({
          type: "error",
          message: res.error || "Failed to mark order as read.",
        });
      }

      setTimeout(() => setFeedback(null), 4000);
    });
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
      {/* Table Header */}
      <div className="p-5 sm:p-6 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              New Orders Requiring Action
            </h3>
            {orders.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                {orders.length} Unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Orders that have not yet been acknowledged by an administrator. Marking as read leaves customer order status intact.
          </p>
        </div>

        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors self-start sm:self-auto"
        >
          <span>View All Orders</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`px-5 py-3 text-xs font-medium flex items-center justify-between border-b ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[11px] font-bold underline hover:opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty State */}
      {orders.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
            <Check className="h-6 w-6 text-emerald-600" />
          </div>
          <h4 className="text-sm font-bold text-foreground">All Orders Acknowledged</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            There are currently no unread customer orders. Newly placed orders will appear here automatically in real time.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors text-foreground"
            >
              <span>Explore Orders Management</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      ) : (
        /* Orders Table */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="py-3 px-4 w-12">#</th>
                <th scope="col" className="py-3 px-4">Order ID</th>
                <th scope="col" className="py-3 px-4">Customer</th>
                <th scope="col" className="py-3 px-4">Date</th>
                <th scope="col" className="py-3 px-4 text-right">Amount</th>
                <th scope="col" className="py-3 px-4">Payment</th>
                <th scope="col" className="py-3 px-4">Payment Status</th>
                <th scope="col" className="py-3 px-4">Order Status</th>
                <th scope="col" className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {orders.map((order, index) => {
                const isMarking = markingId === order.id;
                const formattedDate = new Date(order.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const formattedTime = new Date(order.created_at).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    {/* Serial number */}
                    <td className="py-3.5 px-4 font-mono text-muted-foreground text-[11px]">
                      {index + 1}
                    </td>

                    {/* Order ID */}
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-primary hover:underline hover:text-primary/90"
                        >
                          {order.order_number}
                        </Link>
                      </div>
                    </td>

                    {/* Customer Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground">{order.customer_name}</div>
                      <div className="text-[11px] text-muted-foreground">{order.customer_email}</div>
                    </td>

                    {/* Order Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
                      <div>{formattedDate}</div>
                      <div className="text-[10px] text-muted-foreground/80">{formattedTime}</div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right font-bold text-foreground font-mono">
                      ₹{order.total.toLocaleString("en-IN")}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary text-secondary-foreground border border-border/50 uppercase">
                        {order.payment_method === "cod" ? (
                          <>
                            <Banknote className="h-3 w-3 text-emerald-600" />
                            <span>COD</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-3 w-3 text-blue-600" />
                            <span>Online</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          order.payment_status === "paid"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            : order.payment_status === "failed"
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </td>

                    {/* Order Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} />
                    </td>

                    {/* Actions: View Order & Mark Read */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleMarkAsRead(order)}
                          disabled={isMarking}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer disabled:opacity-50"
                          title="Mark order as acknowledged (removes from unread queue without modifying order status)"
                        >
                          {isMarking ? (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          ) : (
                            <Check className="h-3 w-3 text-emerald-600" />
                          )}
                          <span>Acknowledge</span>
                        </button>

                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-all shadow-2xs"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View Order</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
