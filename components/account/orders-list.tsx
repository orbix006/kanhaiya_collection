"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Calendar,
  CreditCard,
  Banknote,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  ArrowRight,
  Loader2,
} from "lucide-react";
import type { OrderDetails } from "@/lib/data/order-types";
import { cancelOrderAction } from "@/app/(public)/account/orders/actions";

interface OrdersListProps {
  orders: OrderDetails[];
}

export function OrdersList({ orders: initialOrders }: OrdersListProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDetails[]>(initialOrders);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCancelOrder = (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to cancel Order #${orderNumber}?`)) {
      return;
    }

    setCancellingId(orderId);
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await cancelOrderAction(orderId);
      setCancellingId(null);

      if (res?.error) {
        setActionError(res.error);
      } else if (res?.success) {
        setActionSuccess(res.message);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: "cancelled", can_cancel: false } : o
          )
        );
        router.refresh();
      }
    });
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "pending") return o.status === "pending";
    if (filter === "confirmed") return ["confirmed", "processing", "shipped", "delivered"].includes(o.status);
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  const getStatusBadge = (status: OrderDetails["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>Confirmed</span>
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
            <Package className="h-3 w-3" />
            <span>Processing</span>
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
            <Truck className="h-3 w-3" />
            <span>Shipped</span>
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>Delivered</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground">
            <span>{status}</span>
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status: OrderDetails["payment_status"], method: string | null) => {
    const isCod = method === "cod";

    if (status === "paid") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          <span>Paid Online</span>
        </span>
      );
    }

    if (isCod) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          <Banknote className="h-3 w-3" />
          <span>Cash on Delivery (Pending)</span>
        </span>
      );
    }

    if (status === "failed") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive">
          <AlertCircle className="h-3 w-3" />
          <span>Payment Failed</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Pending</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <span>Order History</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Track, review, or manage your handcrafted wardrobe purchases.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl self-start sm:self-auto">
          {(["all", "pending", "confirmed", "cancelled"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                filter === tab
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "confirmed" ? "Active" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Action Messages */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-card border border-border">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No orders found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {filter === "all"
              ? "You haven't placed any orders yet. Discover our latest collections today!"
              : `No orders matching filter '${filter}'.`}
          </p>
          <div className="mt-6">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs"
            >
              <span>Explore Shop</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const formattedDate = new Date(order.placed_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            const isCancellingThis = cancellingId === order.id;

            return (
              <div
                key={order.id}
                className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xs hover:border-border transition-all space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm sm:text-base text-foreground tracking-tight">
                      #{order.order_number}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Placed on {formattedDate}</span>
                  </div>
                </div>

                {/* Items Summary & Delivery preview */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-foreground">
                      {order.items.length} {order.items.length === 1 ? "Product" : "Products"}
                    </p>
                    <div className="space-y-1">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground truncate max-w-md">
                          • {item.product_name}
                          {item.variant_name ? ` (${item.variant_name})` : ""} × {item.quantity}
                        </p>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-[11px] text-muted-foreground italic">
                          +{order.items.length - 3} more items
                        </p>
                      )}
                    </div>
                    <div className="pt-1">
                      {getPaymentStatusBadge(order.payment_status, order.payment_method)}
                    </div>
                  </div>

                  {/* Order Total & Actions */}
                  <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground block">Order Total</span>
                      <span className="text-lg font-black text-primary">
                        ₹{order.total.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.can_cancel && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order.id, order.order_number)}
                          disabled={isCancellingThis || isPending}
                          className="px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {isCancellingThis ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <span>Cancel Order</span>
                          )}
                        </button>
                      )}

                      <Link
                        href={`/account/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-2xs"
                      >
                        <span>View Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
