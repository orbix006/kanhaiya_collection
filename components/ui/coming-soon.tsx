"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Bell, ArrowRight, CheckCircle2 } from "lucide-react";

interface ComingSoonProps {
  pageTitle?: string;
  categoryName?: string;
  customDescription?: string;
  id?: string;
}

export function ComingSoon({
  pageTitle,
  categoryName,
  customDescription,
  id = "story",
}: ComingSoonProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div id={id} className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden bg-[#FFFDF7] px-4 py-16 sm:px-6 lg:px-8 font-sans font-normal">
      {/* Decorative Subtle Background Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-b from-[#F8F1E3] via-[#F4ECE0]/50 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-[#C8891A]/5 blur-3xl" />
        <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full bg-[#8B4513]/5 blur-3xl" />

        {/* Subtle Traditional Geometric/Mandala Motif Pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 12px 12px, #3B2416 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl text-center flex flex-col items-center">
        {/* Sacred Flame / Devotional Emblem */}
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F8F1E3] to-[#E8DCC8] shadow-md ring-1 ring-[#C8891A]/30">
          <svg
            className="h-8 w-8 text-[#C8891A]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M12 2c.5 2 2.5 3.5 2.5 5.5A2.5 2.5 0 0 1 12 10a2.5 2.5 0 0 1-2.5-2.5C9.5 5.5 11.5 4 12 2z"
              fill="#C8891A"
              fillOpacity="0.85"
            />
            <path
              d="M4 14c0 3.866 3.582 7 8 7s8-3.134 8-7H4z"
              fill="#8B4513"
              fillOpacity="0.2"
            />
            <path d="M4 14h16" />
          </svg>
        </div>

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F8F1E3] border border-[#E8DCC8] px-3.5 py-1 text-xs font-medium uppercase tracking-wider text-[#C8891A] shadow-2xs mb-4 font-sans">
          <Sparkles className="h-3 w-3" />
          <span>{categoryName ? `${categoryName} • Coming Soon` : "Kanhaiya Collection"}</span>
        </div>

        {/* Main Heading */}
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#3B2416] leading-tight">
          {pageTitle || "Coming Soon"}
        </h1>

        {/* Devotional Copy */}
        <div className="mt-6 space-y-3">
          <p className="font-serif text-lg sm:text-xl font-medium text-[#3B2416]">
            Kanhaiya Collection is preparing something special for you.
          </p>
          <p className="font-sans text-sm sm:text-base text-[#806B57] max-w-lg mx-auto leading-relaxed font-normal">
            {customDescription ||
              "Bringing devotion, tradition and timeless Indian craftsmanship together."}
          </p>
        </div>

        {/* Devotional Motif Divider */}
        <div className="my-8 flex items-center justify-center gap-3 w-full max-w-xs">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C8891A]/30" />
          <span className="text-[#C8891A] text-sm select-none">✦</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C8891A]/30" />
        </div>

        {/* Early Access Notification Form */}
        <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E8DCC8] rounded-2xl p-6 shadow-[0_4px_20px_rgba(59,36,22,0.06)] font-sans">
          {submitted ? (
            <div className="flex flex-col items-center py-2 text-center text-[#3B2416] space-y-2">
              <CheckCircle2 className="h-8 w-8 text-[#C8891A]" />
              <p className="font-serif font-medium text-base">You are on the blessing list!</p>
              <p className="text-xs text-[#806B57] font-normal">
                We will notify you the moment our doors open.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <label
                htmlFor="notify-email"
                className="block text-xs font-medium uppercase tracking-wider text-[#806B57] text-left"
              >
                Get notified on launch
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="notify-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 h-11 px-4 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] placeholder-[#806B57]/60 font-normal focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
                />
                <button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-[#C8891A] text-white font-medium text-sm hover:bg-[#B37814] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Bell className="h-4 w-4" />
                  <span>Notify Me</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-8 flex items-center gap-4 text-xs font-medium font-sans">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[#3B2416] hover:text-[#C8891A] transition-colors"
          >
            <span>Return to Home</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
