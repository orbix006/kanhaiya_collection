import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { ContactForm } from "@/components/public/contact-form";
import { CONTACT_CONFIG } from "@/lib/constants";
import { getSiteSettings } from "@/lib/data/cms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Us | Kanhaiya Collection",
  description:
    "Get in touch with Kanhaiya Collection's royal concierge for bespoke brass murtis, temple decor, and spiritual orders.",
  alternates: {
    canonical: "/contact",
  },
};

export default async function ContactPage() {
  const footerSettings = await getSiteSettings("footer");

  const address =
    footerSettings.address ||
    "108 Heritage Boulevard, C-Scheme, Jaipur, Rajasthan 302001, India";
  const phone = footerSettings.phone || CONTACT_CONFIG.phoneDisplay;
  const email = footerSettings.email || CONTACT_CONFIG.email;
  const businessHours =
    footerSettings.business_hours || "Monday – Saturday: 10:00 AM – 8:00 PM IST";

  return (
    <main className="flex flex-col min-h-screen bg-[#FFFDF7]">
      {/* Top Breadcrumb & Hero */}
      <section className="border-b border-[#E8DCC8]/70 bg-gradient-to-b from-[#F8F1E3]/50 to-[#FFFDF7] py-12 sm:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <nav aria-label="Breadcrumb">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#806B57] hover:text-[#C8891A] transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Storefront</span>
            </Link>
          </nav>

          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8891A]/10 text-[#C8891A] text-xs font-bold tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Royal Artisan Concierge</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#3B2416]">
              We Are Here for Your Devotional Journey
            </h1>
            <p className="text-sm sm:text-base text-[#806B57] leading-relaxed">
              Whether inquiring about customized deity statues, bulk festival orders, or delivery timelines, our heritage concierge team is delighted to assist you.
            </p>
          </div>
        </div>
      </section>

      {/* Main Contact Grid */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left 5 Cols: Verified Contact Channels & Store Info */}
            <div className="lg:col-span-5 space-y-6">
              {/* Info Card */}
              <div className="rounded-3xl bg-[#F8F1E3]/70 border border-[#E8DCC8] p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="space-y-1">
                  <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#3B2416]">
                    Direct Contact Channels
                  </h2>
                  <p className="text-xs text-[#806B57]">
                    Reach our artisans and customer care through any of our verified avenues.
                  </p>
                </div>

                <div className="space-y-5 text-xs sm:text-sm">
                  {/* Address */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFFDF7] text-[#C8891A] border border-[#E8DCC8]">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-[#3B2416]">Artisan Studio & Gallery</p>
                      <p className="text-[#806B57] leading-relaxed">{address}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFFDF7] text-[#C8891A] border border-[#E8DCC8]">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-[#3B2416]">Telephone Support</p>
                      <a
                        href={CONTACT_CONFIG.phoneUrl}
                        className="text-[#C8891A] hover:underline font-medium inline-block"
                      >
                        {phone}
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFFDF7] text-[#C8891A] border border-[#E8DCC8]">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-[#3B2416]">Email Inquiries</p>
                      <a
                        href={`mailto:${email}`}
                        className="text-[#C8891A] hover:underline font-medium inline-block"
                      >
                        {email}
                      </a>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFFDF7] text-[#C8891A] border border-[#E8DCC8]">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-[#3B2416]">Concierge Desk Hours</p>
                      <p className="text-[#806B57]">{businessHours}</p>
                    </div>
                  </div>
                </div>

                {/* Instant WhatsApp CTA */}
                <div className="pt-2 border-t border-[#E8DCC8]/80">
                  <a
                    href={CONTACT_CONFIG.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Chat on WhatsApp Directly</span>
                  </a>
                </div>
              </div>

              {/* Devotional Commitments */}
              <div className="grid grid-cols-2 gap-3 text-xs text-[#806B57]">
                <div className="p-4 rounded-2xl bg-[#FFFDF7] border border-[#E8DCC8] space-y-1">
                  <ShieldCheck className="h-4 w-4 text-[#C8891A]" />
                  <p className="font-semibold text-[#3B2416]">24-Hour Reply</p>
                  <p className="text-[11px] leading-relaxed">Dedicated concierge response within one business day.</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FFFDF7] border border-[#E8DCC8] space-y-1">
                  <Sparkles className="h-4 w-4 text-[#C8891A]" />
                  <p className="font-semibold text-[#3B2416]">Master Artisans</p>
                  <p className="text-[11px] leading-relaxed">Direct consultation for temple & mandir customization.</p>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: The Functional Contact Form */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl bg-[#FFFDF7] border border-[#E8DCC8] p-6 sm:p-10 shadow-sm space-y-6">
                <div className="space-y-1">
                  <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#3B2416]">
                    Send a Message to Our Concierge
                  </h2>
                  <p className="text-xs sm:text-sm text-[#806B57]">
                    Fill in your details below. We take utmost care in personalizing your offerings.
                  </p>
                </div>

                {/* Render the full interactive contact form component */}
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
