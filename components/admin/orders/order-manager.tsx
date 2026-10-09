"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  ArrowRight,
  Copy,
  Check,
  CreditCard,
  Banknote,
  AlertCircle,
  Eye,
  XCircle,
  RotateCcw,
} from "lucide-react";
import type {
  OrderDetails,
  OrderStatus,
  PaymentStatus,
  AdminOrderListResult,
} from "@/lib/data/order-types";

interface OrderManagerProps {
  initialOrders: OrderDetails[];
  stats: Omit<AdminOrderListResult, "orders">;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: "Pending Confirmation",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  processing: {
    label: "Processing / Packing",
    bg: "bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-500/20",
  },
  shipped: {
    label: "Shipped / In Transit",
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-500/20",
  },
  delivered: {
    label: "Delivered",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/20",
  },
  refunded: {
    label: "Refunded",
    bg: "bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-500/20",
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; bg: string; text: string }
> = {
  paid: {
    label: "Paid",
    bg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    text: "Paid",
  },
  pending: {
    label: "Payment Pending",
    bg: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    text: "Pending",
  },
  failed: {
    label: "Failed",
    bg: "bg-destructive/15 text-destructive",
    text: "Failed",
  },
  refunded: {
    label: "Refunded",
    bg: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
    text: "Refunded",
  },
};

export function OrderManager({ initialOrders, stats }: OrderManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      // 1. Status Filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      // 2. Payment Status Filter
      if (
        paymentStatusFilter !== "all" &&
        order.payment_status !== paymentStatusFilter
      ) {
        return false;
      }

      // 3. Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const orderNum = order.order_number.toLowerCase();
        const custName = (
          order.customer?.full_name ||
          order.shipping_address?.full_name ||
          ""
        ).toLowerCase();
        const phone = (order.shipping_address?.phone || "").toLowerCase();
        const city = (order.shipping_address?.city || "").toLowerCase();
        const itemNames = order.items
          .map((i) => i.product_name.toLowerCase())
          .join(" ");

        return (
          orderNum.includes(q) ||
          custName.includes(q) ||
          phone.includes(q) ||
          city.includes(q) ||
          itemNames.includes(q)
        );
      }

      return true;
    });
  }, [initialOrders, statusFilter, paymentStatusFilter, searchTerm]);

  return (
    <div className="space-y-8">
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Orders */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Orders
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Package className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.totalCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Across all customer accounts
            </p>
          </div>
        </div>

        {/* Pending Confirmation (Attention-Grabbing) */}
        <div
          onClick={() => setStatusFilter("pending")}
          className={`cursor-pointer rounded-2xl border ${
            stats.pendingCount > 0
              ? "border-amber-500/50 bg-amber-500/5"
              : "border-border/80 bg-card"
          } p-5 shadow-xs transition-colors hover:border-amber-500`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Pending Action
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400">
              {stats.pendingCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Awaiting admin confirmation
            </p>
          </div>
        </div>

        {/* Processing & In-Transit */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              In Fulfillment
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Truck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.processingCount + stats.shippedCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats.processingCount} packing · {stats.shippedCount} dispatched
            </p>
          </div>
        </div>

        {/* Delivered */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Delivered
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.deliveredCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Successfully fulfilled
            </p>
          </div>
        </div>

        {/* Total Sales */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Volume
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              ₹{stats.totalRevenue.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Excluding cancellations
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-card">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order #, customer, phone, city..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-muted/30 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary focus:bg-background transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Order Status */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-hidden focus:border-primary font-medium"
            >
              <option value="all">All Order Statuses</option>
              <option value="pending">Pending Confirmation</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Payment Status */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-hidden focus:border-primary font-medium"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {(searchTerm || statusFilter !== "all" || paymentStatusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPaymentStatusFilter("all");
              }}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1 underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Order Details</th>
                <th className="py-3.5 px-4">Customer & City</th>
                <th className="py-3.5 px-4">Purchased Items</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const statusConf = STATUS_CONFIG[order.status];
                  const paymentConf = PAYMENT_STATUS_CONFIG[order.payment_status];

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      {/* Order Number & Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="font-extrabold text-foreground hover:text-primary transition-colors tracking-tight font-mono text-xs"
                            >
                              {order.order_number}
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleCopy(order.id, order.order_number)}
                              title="Copy Order Number"
                              className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                            >
                              {copiedId === order.id ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(order.placed_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Customer & City */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {order.customer?.full_name ||
                              order.shipping_address?.full_name ||
                              "Guest Customer"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {order.shipping_address?.city},{" "}
                            {order.shipping_address?.state}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {order.shipping_address?.phone}
                          </span>
                        </div>
                      </td>

                      {/* Purchased Items */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground">
                            {order.items.length}{" "}
                            {order.items.length === 1 ? "item" : "items"}
                          </span>
                          <span className="text-[11px] text-muted-foreground line-clamp-1 truncate">
                            {order.items.map((i) => i.product_name).join(", ")}
                          </span>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        <div className="flex flex-col">
                          <span className="text-sm font-black">
                            ₹{order.total.toLocaleString("en-IN")}
                          </span>
                          {order.shipping_fee > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              incl. ₹{order.shipping_fee} shipping
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${paymentConf.bg}`}
                          >
                            {paymentConf.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-semibold">
                            {order.payment_method === "cod" ? (
                              <>
                                <Banknote className="h-3 w-3" /> COD
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-3 w-3" /> Razorpay
                              </>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs transition-colors shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-6 w-6 text-muted-foreground/60" />
                      <span className="font-semibold">No orders matched your filters</span>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Try clearing search keywords or resetting the status filter dropdown.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
