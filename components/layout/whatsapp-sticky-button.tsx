"use client";

import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { CONTACT_CONFIG } from "@/lib/constants";

export function WhatsAppStickyButton() {
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <aside
      aria-label="WhatsApp Support Assistance"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 print:hidden"
    >
      {/* Floating Prompt Pill (dismissible) */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-[#FFFDF7] text-[#3B2416] text-xs font-semibold px-3 py-2 rounded-2xl shadow-lg border border-[#E8DCC8] animate-in fade-in slide-in-from-right-3 duration-300">
          <span>Need help? Chat with us!</span>
          <button
            type="button"
            onClick={() => setShowTooltip(false)}
            aria-label="Dismiss chat prompt"
            className="text-[#806B57] hover:text-[#3B2416] p-0.5 rounded-full hover:bg-[#F8F1E3] transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Floating Circular WhatsApp Button */}
      <a
        href={CONTACT_CONFIG.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_25px_rgba(37,211,102,0.6)] hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <span className="sr-only">Open WhatsApp chat</span>
        <MessageCircle className="h-7 w-7 fill-white stroke-[#25D366] transition-transform duration-200 group-hover:scale-110" />

        {/* Online Indicator Pulse */}
        <span className="absolute top-1 right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-300" />
        </span>
      </a>
    </aside>
  );
}
