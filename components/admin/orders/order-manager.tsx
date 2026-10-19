"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
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
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  User,
  ShieldCheck,
  Sparkles,
  FileText,
  AlertTriangle,
  Send,
} from "lucide-react";
import type {
  OrderDetails,
  OrderStatus,
  PaymentStatus,
  AdminOrderListResult,
} from "@/lib/data/order-types";
import {
  loadMockOrders,
  updateMockOrderStatus,
  getOrderKPIs,
  saveMockOrderNote,
  MockOrder,
} from "@/lib/mock-data/admin-store";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";

interface OrderManagerProps {
  initialOrders: OrderDetails[];
  stats: Omit<AdminOrderListResult, "orders">;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: "Pending",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/20",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/20",
    icon: CheckCircle2,
  },
  processing: {
    label: "Processing",
    bg: "bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-500/20",
    icon: Package,
  },
  shipped: {
    label: "Shipped",
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-500/20",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/20",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    bg: "bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-500/20",
    icon: RotateCcw,
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
    label: "Pending",
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

export function OrderManager({ initialOrders }: OrderManagerProps) {
  // Orders State (initialized safely and hydrated from localStorage)
  const [orders, setOrders] = useState<OrderDetails[]>(initialOrders);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<"all" | "today" | "7d" | "30d">("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "order_asc">("date_desc");

  // Pagination: Default 50 orders per page (Phase 2 Requirement B)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Clipboard & Drawer States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDrawerOrder, setSelectedDrawerOrder] = useState<OrderDetails | null>(null);

  // Administrative Notes input state for drawer
  const [orderNoteInput, setOrderNoteInput] = useState<string>("");
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);

  // Feedback Banner & Confirmation Dialogs
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: "approve" | "cancel";
    order: OrderDetails | null;
  }>({
    isOpen: false,
    title: "",
    description: "",
    actionType: "approve",
    order: null,
  });

  // Client hydration from central MockStore
  const refreshFromStore = useCallback(() => {
    try {
      const stored = loadMockOrders();
      if (stored && stored.length > 0) {
        setOrders(stored);
        // If a drawer order is currently open, refresh its data
        setSelectedDrawerOrder((prev) => {
          if (!prev) return null;
          return stored.find((o) => o.id === prev.id) || prev;
        });
      }
    } catch (err) {
      console.warn("[OrderManager] Could not load orders from mock store:", err);
    }
  }, []);

  useEffect(() => {
    refreshFromStore();
  }, [refreshFromStore]);

  // Sync drawer notes when an order is opened
  useEffect(() => {
    if (selectedDrawerOrder) {
      setOrderNoteInput(selectedDrawerOrder.notes || "");
    }
  }, [selectedDrawerOrder]);

  // Four KPI Cards (Phase 2 Requirement A)
  const kpis = useMemo(() => {
    return getOrderKPIs(orders);
  }, [orders]);

  // Copy order ID helper
  const handleCopyOrderId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered and Sorted Orders
  const filteredOrders = useMemo(() => {
    let result = orders.filter((order) => {
      // Status filter
      if (statusFilter === "in_progress") {
        if (order.status !== "confirmed" && order.status !== "processing" && order.status !== "shipped") {
          return false;
        }
      } else if (statusFilter === "pending") {
        if (order.status !== "pending") return false;
      } else if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      // Payment Status filter
      if (paymentStatusFilter !== "all" && order.payment_status !== paymentStatusFilter) {
        return false;
      }

      // Date Range filter
      if (dateRangeFilter !== "all") {
        const orderDate = new Date(order.placed_at).getTime();
        const now = Date.now();
        if (dateRangeFilter === "today" && now - orderDate > 24 * 60 * 60 * 1000) {
          return false;
        }
        if (dateRangeFilter === "7d" && now - orderDate > 7 * 24 * 60 * 60 * 1000) {
          return false;
        }
        if (dateRangeFilter === "30d" && now - orderDate > 30 * 24 * 60 * 60 * 1000) {
          return false;
        }
      }

      // Search term filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const orderNum = order.order_number.toLowerCase();
        const custName = (order.customer?.full_name || order.shipping_address?.full_name || (order as MockOrder).customer_name || "").toLowerCase();
        const custEmail = (order.customer?.email || (order as MockOrder).customer_email || "").toLowerCase();
        const phone = (order.shipping_address?.phone || order.customer?.phone || "").toLowerCase();
        const city = (order.shipping_address?.city || "").toLowerCase();
        const itemNames = (order.items || []).map((i) => i.product_name.toLowerCase()).join(" ");

        return (
          orderNum.includes(q) ||
          custName.includes(q) ||
          custEmail.includes(q) ||
          phone.includes(q) ||
          city.includes(q) ||
          itemNames.includes(q)
        );
      }

      return true;
    });

    // Sort order
    result.sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime();
        case "amount_desc":
          return (b.total || 0) - (a.total || 0);
        case "amount_asc":
          return (a.total || 0) - (b.total || 0);
        case "order_asc":
          return a.order_number.localeCompare(b.order_number);
        case "date_desc":
        default:
          return new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime();
      }
    });

    return result;
  }, [orders, statusFilter, paymentStatusFilter, dateRangeFilter, searchTerm, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentStatusFilter, dateRangeFilter, sortBy]);

  // Pagination calculations (50 per page default)
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Action: Prompt Approve Order
  const handlePromptApprove = (order: OrderDetails, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: `Approve Order #${order.order_number}?`,
      description: `This will mark the order as Confirmed, validate available inventory, decrement product stock quantities, and increment sold counts per store business rules.`,
      actionType: "approve",
      order,
    });
  };

  // Action: Prompt Cancel Order
  const handlePromptCancel = (order: OrderDetails, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isAlreadyConfirmed = order.status === "confirmed" || order.status === "processing";
    setConfirmDialog({
      isOpen: true,
      title: `Cancel Order #${order.order_number}?`,
      description: isAlreadyConfirmed
        ? `Are you sure you want to cancel this order? Cancelling will reverse the inventory deduction and restore all items back to available stock.`
        : `Are you sure you want to cancel this order? This order will be marked as Cancelled.`,
      actionType: "cancel",
      order,
    });
  };

  // Execute Confirmed Decision Action
  const handleExecuteDecision = () => {
    if (!confirmDialog.order) return;
    const order = confirmDialog.order;
    const isApprove = confirmDialog.actionType === "approve";
    const nextStatus: OrderStatus = isApprove ? "confirmed" : "cancelled";

    try {
      const res = updateMockOrderStatus(order.id, nextStatus);
      if (res.success) {
        setActionFeedback({
          type: "success",
          message: isApprove
            ? `Order #${order.order_number} has been approved and confirmed. Product stock decremented.`
            : `Order #${order.order_number} has been cancelled.${order.status === "confirmed" ? " Inventory was restored." : ""}`,
        });
        refreshFromStore();
      } else {
        setActionFeedback({
          type: "error",
          message: res.error || `Failed to ${isApprove ? "approve" : "cancel"} order.`,
        });
      }
    } catch (err: unknown) {
      setActionFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "An unexpected error occurred while updating the order.",
      });
    } finally {
      setConfirmDialog({ isOpen: false, title: "", description: "", actionType: "approve", order: null });
      setTimeout(() => setActionFeedback(null), 6000);
    }
  };

  // Action: Save Order Note
  const handleSaveNote = () => {
    if (!selectedDrawerOrder) return;
    setIsSavingNote(true);
    try {
      const res = saveMockOrderNote(selectedDrawerOrder.id, orderNoteInput);
      if (res.success) {
        setActionFeedback({
          type: "success",
          message: `Note updated for order #${selectedDrawerOrder.order_number}.`,
        });
        refreshFromStore();
      }
    } catch {
      setActionFeedback({
        type: "error",
        message: "Failed to save note.",
      });
    } finally {
      setIsSavingNote(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Feedback Alert Banner */}
      {actionFeedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-semibold animate-in fade-in slide-in-from-top-2 ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs hover:underline cursor-pointer font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. FOUR KPI CARDS (Phase 2 Requirement A) */}
      <section aria-labelledby="order-kpis-heading">
        <h2 id="order-kpis-heading" className="sr-only">Order Management Key Performance Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Orders */}
          <div
            onClick={() => {
              setStatusFilter("all");
              setPaymentStatusFilter("all");
            }}
            className={`cursor-pointer rounded-2xl border ${
              statusFilter === "all"
                ? "border-primary/60 bg-primary/5 ring-1 ring-primary/40"
                : "border-border/80 bg-card hover:border-border"
            } p-5 shadow-xs transition-all`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Orders
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Package className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                {kpis.totalOrders}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                All records in store repository
              </p>
            </div>
          </div>

          {/* Card 2: New Orders */}
          <div
            onClick={() => setStatusFilter("pending")}
            className={`cursor-pointer rounded-2xl border ${
              statusFilter === "pending"
                ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40"
                : kpis.newOrders > 0
                ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
                : "border-border/80 bg-card hover:border-border"
            } p-5 shadow-xs transition-all`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                New Orders
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Clock className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 font-mono">
                {kpis.newOrders}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Pending initial admin decision
              </p>
            </div>
          </div>

          {/* Card 3: Delivered Orders */}
          <div
            onClick={() => setStatusFilter("delivered")}
            className={`cursor-pointer rounded-2xl border ${
              statusFilter === "delivered"
                ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40"
                : "border-border/80 bg-card hover:border-border"
            } p-5 shadow-xs transition-all`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Delivered Orders
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                {kpis.deliveredOrders}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Successfully fulfilled & received
              </p>
            </div>
          </div>

          {/* Card 4: In Progress Orders */}
          <div
            onClick={() => setStatusFilter("in_progress")}
            className={`cursor-pointer rounded-2xl border ${
              statusFilter === "in_progress"
                ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/40"
                : "border-border/80 bg-card hover:border-border"
            } p-5 shadow-xs transition-all`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                In Progress Orders
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Truck className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                {kpis.inProgressOrders}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Confirmed, packaging or in transit
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEARCH, FILTER & SORT CONTROLS BAR */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Order #, customer name, email, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by order status"
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none shadow-2xs"
            >
              <option value="all">All Order Statuses</option>
              <option value="pending">New Orders (Pending)</option>
              <option value="in_progress">In Progress (Active)</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Payment Filter Dropdown */}
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              aria-label="Filter by payment status"
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none shadow-2xs"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as any)}
              aria-label="Filter by date range"
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none shadow-2xs"
            >
              <option value="all">All Dates</option>
              <option value="today">Today (24h)</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort orders"
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none shadow-2xs"
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="amount_desc">Total: Highest First</option>
              <option value="amount_asc">Total: Lowest First</option>
              <option value="order_asc">Order #: A to Z</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Page Size Controls */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-foreground">{filteredOrders.length}</strong> of{" "}
              <strong className="text-foreground">{orders.length}</strong> total orders
            </span>
            {(statusFilter !== "all" || paymentStatusFilter !== "all" || dateRangeFilter !== "all" || searchTerm) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPaymentStatusFilter("all");
                  setDateRangeFilter("all");
                  setSortBy("date_desc");
                }}
                className="text-primary hover:underline font-semibold ml-2"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Rows per page"
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold text-foreground focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50 (Default)</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. ORDER TABLE (Phase 2 Requirement B - Fits at desktop width without horizontal scroll) */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        {/* Desktop Table View (visible on md screens and above, zero horizontal scrolling) */}
        <div className="hidden md:block w-full">
          {paginatedOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">No orders found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    No orders match your selected search criteria or filters. Try adjusting your search term or clearing active filters.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setPaymentStatusFilter("all");
                    setDateRangeFilter("all");
                  }}
                  className="mt-2 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-2xs"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-3 w-[15%]">Order Number</th>
                  <th className="py-3.5 px-3 w-[18%]">Customer</th>
                  <th className="py-3.5 px-3 w-[13%]">Date</th>
                  <th className="py-3.5 px-3 w-[14%]">Items</th>
                  <th className="py-3.5 px-3 w-[12%]">Total</th>
                  <th className="py-3.5 px-3 w-[10%]">Payment</th>
                  <th className="py-3.5 px-3 w-[9%]">Status</th>
                  <th className="py-3.5 px-3 w-[9%] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedOrders.map((order) => {
                  const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const paymentConf = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.pending;
                  const customerName =
                    order.customer?.full_name ||
                    order.shipping_address?.full_name ||
                    (order as MockOrder).customer_name ||
                    "Customer";

                  const itemsTitle =
                    order.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(", ") ||
                    `${order.items?.length || 0} items`;

                  const formattedDate = new Date(order.placed_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedDrawerOrder(order)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      {/* 1. Order Number */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-foreground text-xs group-hover:text-primary transition-colors truncate">
                            {order.order_number}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyOrderId(order.order_number, e)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            title="Copy order number"
                          >
                            {copiedId === order.order_number ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. Customer */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground truncate" title={customerName}>
                            {customerName}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate font-mono">
                            {order.shipping_address?.city
                              ? `${order.shipping_address.city}, ${order.shipping_address.state}`
                              : order.shipping_address?.phone || "Patron on file"}
                          </span>
                        </div>
                      </td>

                      {/* 3. Date */}
                      <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                        <span className="font-medium text-foreground">{formattedDate}</span>
                        <span className="block text-[10px] text-muted-foreground/80">
                          {new Date(order.placed_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      {/* 4. Items */}
                      <td className="py-3 px-3" title={itemsTitle}>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground">
                            {order.items?.length || 0} {(order.items?.length || 0) === 1 ? "item" : "items"}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">
                            {itemsTitle}
                          </span>
                        </div>
                      </td>

                      {/* 5. Total */}
                      <td className="py-3 px-3 font-mono font-bold text-foreground whitespace-nowrap">
                        <div className="text-xs font-black">
                          ₹{(order.total || 0).toLocaleString("en-IN")}
                        </div>
                      </td>

                      {/* 6. Payment Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${paymentConf.bg}`}
                        >
                          {paymentConf.label}
                        </span>
                      </td>

                      {/* 7. Order Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* 8. Compact Action Icons (Tooltips + Direct Action Affordances) */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Approve Action: Only for pending orders */}
                          {order.status === "pending" && (
                            <button
                              type="button"
                              onClick={(e) => handlePromptApprove(order, e)}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
                              title="Approve Order"
                              aria-label="Approve Order"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Cancel Action: Available for pending or confirmed orders */}
                          {(order.status === "pending" || order.status === "confirmed") && (
                            <button
                              type="button"
                              onClick={(e) => handlePromptCancel(order, e)}
                              className="p-1.5 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive/30 text-muted-foreground hover:text-destructive transition-colors shadow-2xs"
                              title="Cancel Order"
                              aria-label="Cancel Order"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Inspect Details Action */}
                          <button
                            type="button"
                            onClick={() => setSelectedDrawerOrder(order)}
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-2xs"
                            title="Inspect Order Details"
                            aria-label="Inspect Order Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
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

        {/* Mobile Responsive Cards View (rendered on screens < md, zero horizontal scroll) */}
        <div className="block md:hidden divide-y divide-border/60">
          {paginatedOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No orders matched your active filters.
            </div>
          ) : (
            paginatedOrders.map((order) => {
              const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const paymentConf = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.pending;
              const customerName =
                order.customer?.full_name ||
                order.shipping_address?.full_name ||
                (order as MockOrder).customer_name ||
                "Customer";

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedDrawerOrder(order)}
                  className="p-4 space-y-2.5 active:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-foreground text-xs">
                      {order.order_number}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                    >
                      {statusConf.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{customerName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {order.items?.length || 0} items • {new Date(order.placed_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-sm text-foreground">
                        ₹{(order.total || 0).toLocaleString("en-IN")}
                      </div>
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${paymentConf.bg}`}>
                        {paymentConf.label}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    {order.status === "pending" && (
                      <button
                        type="button"
                        onClick={(e) => handlePromptApprove(order, e)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                      >
                        Approve
                      </button>
                    )}
                    {(order.status === "pending" || order.status === "confirmed") && (
                      <button
                        type="button"
                        onClick={(e) => handlePromptCancel(order, e)}
                        className="px-2.5 py-1 rounded-lg border border-border text-destructive text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedDrawerOrder(order)}
                      className="px-2.5 py-1 rounded-lg border border-border text-foreground text-xs font-semibold"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. PAGINATION CONTROLS BAR (Phase 2 Requirement B - Clean page navigation) */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            Page <strong className="text-foreground">{currentPage}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong> ({filteredOrders.length} total orders)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card text-foreground font-semibold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1 px-2 font-mono font-bold text-xs">
              <span>{currentPage}</span>
              <span className="text-muted-foreground">/</span>
              <span>{totalPages}</span>
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card text-foreground font-semibold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. ORDER DETAIL DRAWER (Phase 2 Requirement C & D) */}
      {selectedDrawerOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedDrawerOrder(null)}
        >
          <div
            className="w-full max-w-xl h-full bg-card border-l border-border shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-border bg-muted/30 sticky top-0 z-10 backdrop-blur-md flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-lg text-foreground">
                    #{selectedDrawerOrder.order_number}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      STATUS_CONFIG[selectedDrawerOrder.status]?.bg || ""
                    } ${STATUS_CONFIG[selectedDrawerOrder.status]?.text || ""} ${
                      STATUS_CONFIG[selectedDrawerOrder.status]?.border || ""
                    }`}
                  >
                    {STATUS_CONFIG[selectedDrawerOrder.status]?.label || selectedDrawerOrder.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Placed on {new Date(selectedDrawerOrder.placed_at).toLocaleString("en-IN")}
                </p>
              </div>

              <button
                onClick={() => setSelectedDrawerOrder(null)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Close Drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-5 space-y-6 flex-1 text-xs">
              {/* Primary Decision Banner (if pending) */}
              {selectedDrawerOrder.status === "pending" && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span>Administrative Decision Required</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    This order is in &apos;pending&apos; status. Approving will validate inventory and decrement store stock. Cancelling will conclude the order.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handlePromptApprove(selectedDrawerOrder)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve Order</span>
                    </button>
                    <button
                      onClick={() => handlePromptCancel(selectedDrawerOrder)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-destructive/10 text-destructive font-semibold text-xs transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Cancel Order</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Customer & Contact Summary */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                <div className="font-bold text-foreground flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>Customer Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Full Name:</span>
                    <span className="font-semibold text-foreground">
                      {selectedDrawerOrder.customer?.full_name ||
                        selectedDrawerOrder.shipping_address?.full_name ||
                        (selectedDrawerOrder as MockOrder).customer_name ||
                        "Patron"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Contact Phone:</span>
                    <span className="font-mono text-foreground font-semibold">
                      {selectedDrawerOrder.shipping_address?.phone ||
                        selectedDrawerOrder.customer?.phone ||
                        "Not provided"}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground text-[11px] block">Email Address:</span>
                    <span className="text-foreground">
                      {selectedDrawerOrder.customer?.email ||
                        (selectedDrawerOrder as MockOrder).customer_email ||
                        "No email recorded"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Address Snapshot */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                <div className="font-bold text-foreground flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>Shipping Address Snapshot</span>
                </div>
                {selectedDrawerOrder.shipping_address ? (
                  <div className="text-foreground space-y-0.5 leading-relaxed">
                    <div className="font-semibold">{selectedDrawerOrder.shipping_address.full_name}</div>
                    <div className="text-muted-foreground">{selectedDrawerOrder.shipping_address.address_line1}</div>
                    {selectedDrawerOrder.shipping_address.address_line2 && (
                      <div className="text-muted-foreground">{selectedDrawerOrder.shipping_address.address_line2}</div>
                    )}
                    <div className="text-muted-foreground">
                      {selectedDrawerOrder.shipping_address.city}, {selectedDrawerOrder.shipping_address.state} —{" "}
                      {selectedDrawerOrder.shipping_address.postal_code}
                    </div>
                    <div className="text-muted-foreground font-medium">{selectedDrawerOrder.shipping_address.country}</div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No address snapshot recorded.</p>
                )}
              </div>

              {/* Purchased Items List */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Purchased Items ({selectedDrawerOrder.items?.length || 0})</span>
                </div>
                <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden bg-card">
                  {selectedDrawerOrder.items && selectedDrawerOrder.items.length > 0 ? (
                    selectedDrawerOrder.items.map((item) => (
                      <div key={item.id} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.image_url ? (
                            <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                              <Image
                                src={item.image_url}
                                alt={item.product_name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
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
                        <div className="text-right shrink-0 font-bold font-mono text-sm text-foreground">
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
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{(selectedDrawerOrder.subtotal || 0).toLocaleString("en-IN")}</span>
                </div>
                {selectedDrawerOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">-₹{selectedDrawerOrder.discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping Fee</span>
                  <span className="font-mono">
                    {selectedDrawerOrder.shipping_fee > 0 ? `₹${selectedDrawerOrder.shipping_fee}` : "FREE"}
                  </span>
                </div>
                {selectedDrawerOrder.tax > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST / Taxes</span>
                    <span className="font-mono">₹{selectedDrawerOrder.tax.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-foreground font-bold text-sm pt-2 border-t border-border/60">
                  <span>Total Amount</span>
                  <span className="font-mono text-primary font-black">
                    ₹{(selectedDrawerOrder.total || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Payment Information */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                <div className="font-bold text-foreground flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                  <span>Payment Information</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Payment Method:</span>
                    <span className="font-medium text-foreground">{selectedDrawerOrder.payment_method || "Online"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Payment Status:</span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        PAYMENT_STATUS_CONFIG[selectedDrawerOrder.payment_status]?.bg || ""
                      }`}
                    >
                      {PAYMENT_STATUS_CONFIG[selectedDrawerOrder.payment_status]?.label || selectedDrawerOrder.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Administrative Order Notes */}
              <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2">
                <div className="font-bold text-foreground flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>Administrative Notes</span>
                </div>
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={orderNoteInput}
                    onChange={(e) => setOrderNoteInput(e.target.value)}
                    placeholder="Add fulfillment notes, dispatch tracking instructions, or special requests..."
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isSavingNote}
                      onClick={handleSaveNote}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-2xs"
                    >
                      <Send className="h-3 w-3" />
                      <span>{isSavingNote ? "Saving..." : "Save Note"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-border bg-muted/30 sticky bottom-0 z-10 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                href={`/admin/orders/${selectedDrawerOrder.id}`}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <span>Full Page View</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Approve Button (when pending) */}
                {selectedDrawerOrder.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => handlePromptApprove(selectedDrawerOrder)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve Order</span>
                  </button>
                )}

                {/* Cancel Button (when pending or confirmed) */}
                {(selectedDrawerOrder.status === "pending" || selectedDrawerOrder.status === "confirmed") && (
                  <button
                    type="button"
                    onClick={() => handlePromptCancel(selectedDrawerOrder)}
                    className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-destructive/10 hover:border-destructive/30 text-destructive font-semibold text-xs transition-colors shadow-2xs"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. CONFIRMATION DIALOG (Phase 2 Requirement D) */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.actionType === "approve" ? "Yes, Approve Order" : "Yes, Cancel Order"}
        cancelText="Keep as is"
        variant={confirmDialog.actionType === "approve" ? "primary" : "danger"}
        onConfirm={handleExecuteDecision}
        onClose={() => setConfirmDialog({ isOpen: false, title: "", description: "", actionType: "approve", order: null })}
      />
    </div>
  );
}
