"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Percent,
  Sparkles,
  Tag,
  CheckCircle2,
  XCircle,
  Save,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Flame,
  Calendar,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import type { FestiveOffer, Product } from "@/lib/store";
import {
  updateFestiveOfferAction,
  toggleFestiveOfferAction,
} from "@/lib/actions/admin";

interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrder: number;
  maxDiscount?: number;
  isActive: boolean;
  expiresAt: string;
}

interface OffersManagerProps {
  initialFestiveOffer: FestiveOffer;
  products: Product[];
}

export function OffersManager({
  initialFestiveOffer,
  products,
}: OffersManagerProps) {
  const [offer, setOffer] = useState<FestiveOffer>(initialFestiveOffer);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Local demo coupons
  const [coupons, setCoupons] = useState<Coupon[]>([
    {
      id: "cpn-1",
      code: "FESTIVE25",
      discountType: "percentage",
      discountValue: 25,
      minOrder: 1999,
      maxDiscount: 2500,
      isActive: true,
      expiresAt: "2026-11-30",
    },
    {
      id: "cpn-2",
      code: "WELCOME500",
      discountType: "fixed",
      discountValue: 500,
      minOrder: 2499,
      isActive: true,
      expiresAt: "2026-12-31",
    },
    {
      id: "cpn-3",
      code: "SILK10",
      discountType: "percentage",
      discountValue: 10,
      minOrder: 999,
      maxDiscount: 1000,
      isActive: false,
      expiresAt: "2026-10-31",
    },
  ]);

  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponValue, setNewCouponValue] = useState(15);
  const [newCouponMin, setNewCouponMin] = useState(1499);

  const showToast = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleToggleOffer = async () => {
    const nextState = !offer.enabled;
    setOffer((prev) => ({ ...prev, enabled: nextState }));
    const res = await toggleFestiveOfferAction(nextState);
    if (res.success) {
      showToast("success", `Festive Offer ${nextState ? "activated" : "deactivated"}`);
    } else {
      showToast("error", res.error || "Failed to update offer status");
    }
  };

  const handleSaveFestiveOffer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    formData.set("enabled", offer.enabled ? "true" : "false");
    formData.set("product_ids", JSON.stringify(offer.product_ids));

    try {
      const res = await updateFestiveOfferAction(formData);
      if (res.success) {
        showToast("success", "Festive banner & offer details saved successfully");
      } else {
        showToast("error", res.error || "Failed to save festive offer");
      }
    } catch {
      showToast("error", "Error persisting to local store");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProductToggle = (productId: string) => {
    setOffer((prev) => {
      const exists = prev.product_ids.includes(productId);
      const nextIds = exists
        ? prev.product_ids.filter((id) => id !== productId)
        : [...prev.product_ids, productId];
      return { ...prev, product_ids: nextIds };
    });
  };

  const handleToggleCoupon = (id: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
    showToast("success", "Coupon status updated");
  };

  const handleDeleteCoupon = (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    showToast("success", "Coupon code removed");
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    const newCpn: Coupon = {
      id: `cpn-${Date.now()}`,
      code: newCouponCode.trim().toUpperCase(),
      discountType: "percentage",
      discountValue: newCouponValue,
      minOrder: newCouponMin,
      isActive: true,
      expiresAt: "2026-12-31",
    };

    setCoupons((prev) => [newCpn, ...prev]);
    setNewCouponCode("");
    setIsAddingCoupon(false);
    showToast("success", `Promo code ${newCpn.code} created`);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 1. Festive Campaign Hero Manager */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/20">
                <Flame className="h-3.5 w-3.5" /> Seasonal Store Promotion
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  offer.enabled
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-stone-200 text-stone-700"
                }`}
              >
                {offer.enabled ? "Visible on Storefront" : "Hidden"}
              </span>
            </div>
            <h2 className="text-lg font-bold text-foreground mt-1">
              Festive Offer Banner & Discount Bar
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Controls the prominent promotional ribbon and featured showcase on the homepage.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleOffer}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              offer.enabled
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{offer.enabled ? "Offer Enabled" : "Offer Disabled"}</span>
          </button>
        </div>

        <form onSubmit={handleSaveFestiveOffer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-foreground">
                Campaign Headline
              </label>
              <input
                name="title"
                type="text"
                required
                defaultValue={offer.title}
                placeholder="e.g. Festive Grand Sale"
                className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-foreground">
                Offer Subtitle & Promo Copy
              </label>
              <input
                name="subtitle"
                type="text"
                defaultValue={offer.subtitle}
                placeholder="e.g. Flat 25% Off on Wedding Silk Sarees"
                className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Product Tagging */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Included Festive Products ({offer.product_ids.length} selected)</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Click any product to toggle offer inclusion
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-2 rounded-xl border border-border bg-muted/20">
              {products.map((p) => {
                const isSelected = offer.product_ids.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProductToggle(p.id)}
                    className={`p-2 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-rose-400 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 ring-1 ring-rose-400/50"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="truncate font-semibold text-[11px]">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-between">
                      <span>₹{Number(p.base_price).toLocaleString("en-IN")}</span>
                      {isSelected && (
                        <span className="text-[9px] font-bold text-rose-600">INCLUDED</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Save Campaign Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Promo Coupons & Discount Codes Management */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                <Tag className="h-3.5 w-3.5" /> Checkout Coupons
              </span>
            </div>
            <h2 className="text-lg font-bold text-foreground mt-1">
              Store Promo Codes & Coupons
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create and manage discount codes applicable at checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingCoupon(!isAddingCoupon)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Create Promo Code</span>
          </button>
        </div>

        {/* New Coupon Creation Form */}
        {isAddingCoupon && (
          <form
            onSubmit={handleAddCoupon}
            className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4 animate-in fade-in duration-200"
          >
            <div className="text-xs font-bold text-foreground">New Discount Code</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DIWALI30"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs uppercase font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  required
                  value={newCouponValue}
                  onChange={(e) => setNewCouponValue(parseInt(e.target.value || "0", 10))}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Min Order Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newCouponMin}
                  onChange={(e) => setNewCouponMin(parseInt(e.target.value || "0", 10))}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingCoupon(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                Create Code
              </button>
            </div>
          </form>
        )}

        {/* Coupons Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Min Order</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {coupons.map((cpn) => (
                <tr key={cpn.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-extrabold text-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                      {cpn.code}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-foreground">
                    {cpn.discountType === "percentage"
                      ? `${cpn.discountValue}% OFF`
                      : `₹${cpn.discountValue} FLAT OFF`}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    ₹{cpn.minOrder.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleCoupon(cpn.id)}
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold transition-opacity hover:opacity-80 ${
                        cpn.isActive
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {cpn.isActive ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                    {cpn.expiresAt}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(cpn.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete coupon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
