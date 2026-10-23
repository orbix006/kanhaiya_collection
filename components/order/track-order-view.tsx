"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Calendar,
  MessageCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { OrderDetails, OrderStatus } from "@/lib/data/order-types";
import { CONTACT_CONFIG } from "@/lib/constants";

interface TrackOrderViewProps {
  initialOrder?: OrderDetails | null;
  initialOrderNumber?: string;
  initialContact?: string;
  onTrackLookupAction: (
    orderNumber: string,
    contact: string
  ) => Promise<{ success?: boolean; order?: OrderDetails | null; error?: string }>;
}

const MILESTONES: { status: OrderStatus; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { status: "pending", label: "Order Placed", desc: "Received & under review", icon: Clock },
  { status: "confirmed", label: "Confirmed", desc: "Stock allocated", icon: CheckCircle2 },
  { status: "processing", label: "Packed", desc: "Crafted & packed for dispatch", icon: Package },
  { status: "shipped", label: "Shipped", desc: "In transit with courier partner", icon: Truck },
  { status: "delivered", label: "Delivered", desc: "Fulfilled at destination", icon: Sparkles },
];

function getMilestoneIndex(status: OrderStatus): number {
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
}

export function TrackOrderView({
  initialOrder = null,
  initialOrderNumber = "",
  initialContact = "",
  onTrackLookupAction,
}: TrackOrderViewProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [contact, setContact] = useState(initialContact);
  const [order, setOrder] = useState<OrderDetails | null>(initialOrder);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = orderNumber.trim();
    const cleanContact = contact.trim();

    if (!cleanNum) {
      setError("Please enter your Order Number (e.g. ORD-20261023-XXXXX).");
      return;
    }
    if (!cleanContact) {
      setError("Please provide your registered phone number or email address.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await onTrackLookupAction(cleanNum, cleanContact);
        if (res.error) {
          setError(res.error);
          setOrder(null);
        } else if (res.order) {
          setOrder(res.order);
          setError(null);
        } else {
          setError("No matching order was found. Please verify your order number and contact details.");
          setOrder(null);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to search order. Please try again.");
      }
    });
  };

  const currentStep = order ? getMilestoneIndex(order.status) : -1;
  const isCancelled = order?.status === "cancelled";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8 space-y-8 font-sans">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
          <Truck className="h-3.5 w-3.5" />
          <span>Live Consignment Tracking</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Track Your Sacred Order
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
          Enter your order reference and registered contact number or email to check real-time packaging, dispatch, and delivery milestones.
        </p>
      </div>

      {/* Lookup Form Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-md">
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="track-order-num" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Order Number *
              </label>
              <input
                id="track-order-num"
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. ORD-20261023-99470"
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm font-mono placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase"
              />
            </div>

            <div>
              <label htmlFor="track-contact" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Phone Number or Email *
              </label>
              <input
                id="track-contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. 9829012345 or patron@email.com"
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Contact verification strictly protects your shipment privacy.</span>
            </p>

            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching Order...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Track Status</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{error}</p>
              <p className="text-xs opacity-90 mt-0.5">
                Ensure you enter the exact order number received in your confirmation message or email.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Result Order Details */}
      {order && (
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-lg space-y-8 animate-in fade-in slide-in-from-bottom-2">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-xl sm:text-2xl text-foreground">
                  #{order.order_number}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    isCancelled
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : order.status === "delivered"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Placed on {new Date(order.placed_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`${CONTACT_CONFIG.whatsappUrl}&text=${encodeURIComponent(
                  `Namaste Kanhaiya Collection, I am tracking Order #${order.order_number} and would like an update.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Support</span>
              </a>
            </div>
          </div>

          {/* Fulfillment Milestone Bar */}
          {isCancelled ? (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
              <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">This consignment was cancelled.</p>
                <p className="text-xs opacity-90 mt-0.5">
                  No inventory is reserved and any pre-authorizations have been safely released.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Fulfillment Timeline
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {MILESTONES.map((step, idx) => {
                  const isPassed = currentStep >= idx;
                  const isCurrent = currentStep === idx;
                  const StepIcon = step.icon;

                  return (
                    <div
                      key={step.status}
                      className={`p-4 rounded-2xl border text-center transition-all ${
                        isCurrent
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                          : isPassed
                          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300"
                          : "border-border/60 bg-muted/20 opacity-50"
                      }`}
                    >
                      <div className="flex items-center justify-center mb-2">
                        {isPassed ? (
                          <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                            <StepIcon className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground">{step.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Destination & Order Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">
            {/* Delivery Destination */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Shipping Destination</span>
              </h3>
              <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-1 text-xs">
                <p className="font-bold text-foreground">{order.shipping_address?.full_name}</p>
                <p className="text-muted-foreground">
                  {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postal_code}
                </p>
                <p className="text-muted-foreground">{order.shipping_address?.country || "India"}</p>
              </div>
            </div>

            {/* Consignment Items */}
            <div className="md:col-span-2 space-y-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-primary" />
                <span>Consignment Items ({order.items.length})</span>
              </h3>
              <div className="divide-y divide-border/60 border border-border/80 rounded-2xl overflow-hidden bg-card">
                {order.items.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.product_name}</p>
                      {item.variant_name && (
                        <p className="text-[11px] text-muted-foreground">{item.variant_name}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Qty: {item.quantity} × ₹{item.unit_price.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right font-mono font-bold text-foreground">
                      ₹{item.subtotal.toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
                <div className="p-3.5 bg-muted/30 flex items-center justify-between text-xs font-bold">
                  <span>Order Total ({order.payment_method ? order.payment_method.toUpperCase() : "COD"})</span>
                  <span className="font-mono text-primary text-sm">
                    ₹{order.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
