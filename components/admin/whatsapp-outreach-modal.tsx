"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  X,
  ExternalLink,
  Users,
  Send,
  Sparkles,
  Info,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import type { MockCustomer } from "@/lib/mock-data/admin-store";
import { SEED_COUPONS } from "@/lib/data/coupons";

interface WhatsAppOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomer: MockCustomer | null;
  allCustomers: MockCustomer[];
}

export function WhatsAppOutreachModal({
  isOpen,
  onClose,
  selectedCustomer,
  allCustomers,
}: WhatsAppOutreachModalProps) {
  const [selectedOffer, setSelectedOffer] = useState(SEED_COUPONS[0]?.code || "KRISHNA25");
  const [customDiscountText, setCustomDiscountText] = useState(
    "exclusive sacred offers on handcrafted brass murtis, puja thalis & festival items"
  );
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // Filter customers with usable phone numbers
  const customersWithPhone = allCustomers.filter((c) => {
    const raw = c.phone || c.addresses?.[0]?.phone || "";
    const clean = raw.replace(/[^0-9]/g, "");
    return clean.length >= 10;
  });

  const targetCustomerPhone =
    selectedCustomer?.phone || selectedCustomer?.addresses?.[0]?.phone || "";
  const cleanTargetPhone = targetCustomerPhone.replace(/[^0-9]/g, "");

  const recipientName = selectedCustomer?.full_name || "Valued Patron";

  const offerMessage = `Namaste ${recipientName}, sacred blessings from Kanhaiya Collection! ✨ Enjoy ${customDiscountText}. Use promo code *${selectedOffer}* during checkout for exclusive savings: https://kanhaiyacollection.com/shop`;

  const singleCustomerWhatsAppUrl = cleanTargetPhone
    ? `https://wa.me/${cleanTargetPhone.length === 10 ? `91${cleanTargetPhone}` : cleanTargetPhone}?text=${encodeURIComponent(
        offerMessage
      )}`
    : null;

  const handleCopyLink = () => {
    if (singleCustomerWhatsAppUrl) {
      navigator.clipboard.writeText(singleCustomerWhatsAppUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                WhatsApp Offer Outreach
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedCustomer
                  ? `Send direct offer to ${selectedCustomer.full_name || "customer"}`
                  : `Outreach to all customers (${customersWithPhone.length} reachable via mobile)`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Offer & Coupon Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Select Active Promo / Coupon</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              Applied automatically in message draft
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SEED_COUPONS.map((cpn) => (
              <button
                key={cpn.code}
                type="button"
                onClick={() => setSelectedOffer(cpn.code)}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  selectedOffer === cpn.code
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 font-bold"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <div className="font-mono">{cpn.code}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {cpn.discount_value}% OFF (Min ₹{cpn.min_order})
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-foreground">
              Offer Description Copy
            </label>
            <input
              type="text"
              value={customDiscountText}
              onChange={(e) => setCustomDiscountText(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Message Preview */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">
            WhatsApp Message Preview
          </label>
          <div className="p-3.5 rounded-xl bg-[#DCF8C6]/30 dark:bg-emerald-950/30 border border-emerald-500/30 text-xs font-sans text-foreground whitespace-pre-wrap leading-relaxed">
            {offerMessage}
          </div>
        </div>

        {/* Single Customer Mode */}
        {selectedCustomer && (
          <div className="space-y-3 pt-2 border-t border-border/60">
            {singleCustomerWhatsAppUrl ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/30 p-3.5 rounded-xl border border-border">
                <div className="text-xs min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {selectedCustomer.full_name || "Customer"}
                  </p>
                  <p className="text-muted-foreground font-mono text-[11px]">
                    Phone: {cleanTargetPhone}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <a
                    href={singleCustomerWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white hover:bg-[#20ba5a] text-xs font-bold shadow-xs transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send in WhatsApp</span>
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  This customer profile does not have a registered contact phone number.
                </span>
              </div>
            )}
          </div>
        )}

        {/* All Customers Mode */}
        {!selectedCustomer && (
          <div className="space-y-3 pt-2 border-t border-border/60">
            {/* Architectural Dependency Notice */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
              <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Automated 1-Click Broadcast Dependency</p>
                <p className="text-[11px] leading-relaxed text-blue-800/90 dark:text-blue-300">
                  Automated background bulk delivery to all customers at once requires
                  WhatsApp Business API credentials (<code>WHATSAPP_API_TOKEN</code>,{" "}
                  <code>WHATSAPP_PHONE_NUMBER_ID</code>) and a Meta-approved marketing
                  template. You can use the links below to dispatch personalized offers
                  individually, or export the campaign phone list.
                </p>
              </div>
            </div>

            {/* Customer List with Quick WhatsApp Launch */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Eligible Customers ({customersWithPhone.length})</span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Standard E.164 India Format (+91)
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-border/60 rounded-xl border border-border bg-card text-xs">
                {customersWithPhone.map((c) => {
                  const rawPhone = c.phone || c.addresses?.[0]?.phone || "";
                  const clean = rawPhone.replace(/[^0-9]/g, "");
                  const phoneFormatted = clean.length === 10 ? `91${clean}` : clean;
                  const chatUrl = `https://wa.me/${phoneFormatted}?text=${encodeURIComponent(
                    offerMessage
                  )}`;

                  return (
                    <div
                      key={c.id}
                      className="p-2.5 flex items-center justify-between gap-3 hover:bg-muted/30"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {c.full_name || "Customer"}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          +{phoneFormatted}
                        </p>
                      </div>

                      <a
                        href={chatUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#1b9e4b] dark:text-[#25D366] text-xs font-semibold transition-colors shrink-0"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Send Offer</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
