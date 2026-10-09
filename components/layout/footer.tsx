import React from "react";
import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { CONTACT_CONFIG } from "@/lib/constants";

function LineInstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LineWhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="w-full bg-[#FFF8EC] border-t border-[rgba(200,137,26,0.15)] transition-colors text-[#3B2416] font-sans">
      <div className="container mx-auto max-w-[1280px] px-6 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24">
        {/* Main Two-Column Editorial Desktop Layout */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12 lg:gap-16">
          {/* LEFT COLUMN: Brand Logo, Description, Line Icons */}
          <div className="flex flex-col items-start max-w-md space-y-5">
            {/* Brand Logo & Name */}
            <Link href="/" className="group flex items-center gap-3" aria-label="Kanhaiya Collection Home">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFFDF7] ring-1 ring-[#C8891A]/30 text-[#C8891A] shadow-2xs transition-transform group-hover:scale-105">
                {/* Established Diya Symbol */}
                <svg
                  className="h-5 w-5 text-[#C8891A]"
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
                    fillOpacity="0.15"
                  />
                  <path d="M4 14h16" />
                </svg>
              </div>

              <span className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#3B2416] transition-colors group-hover:text-[#C8891A]">
                Kanhaiya Collection
              </span>
            </Link>

            {/* Short Brand Description */}
            <p className="font-sans text-sm sm:text-[15px] font-normal text-[#806B57] leading-relaxed">
              Kanhaiya Collection brings together devotion, tradition and timeless Indian craftsmanship.
            </p>

            {/* Clean Line-Style Icon Row */}
            <div className="flex items-center gap-4 pt-1 text-[#806B57]">
              {/* Instagram */}
              <a
                href={CONTACT_CONFIG.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
                className="p-1.5 rounded-full hover:text-[#C8891A] transition-colors"
              >
                <LineInstagramIcon className="h-4 w-4" />
              </a>

              {/* WhatsApp */}
              <a
                href={CONTACT_CONFIG.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="WhatsApp"
                className="p-1.5 rounded-full hover:text-[#C8891A] transition-colors"
              >
                <LineWhatsAppIcon className="h-4 w-4" />
              </a>

              {/* Google Maps */}
              <a
                href={CONTACT_CONFIG.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Google Maps"
                title="Google Maps"
                className="p-1.5 rounded-full hover:text-[#C8891A] transition-colors"
              >
                <MapPin className="h-4 w-4" />
              </a>

              {/* Phone */}
              <a
                href={CONTACT_CONFIG.phoneUrl}
                aria-label="Phone"
                title="Phone"
                className="p-1.5 rounded-full hover:text-[#C8891A] transition-colors"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: STORE & CONTACT US Navigation Groups */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-10 sm:gap-16 lg:gap-20">
            {/* STORE Group */}
            <div className="flex flex-col space-y-4">
              <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#C8891A]">
                Store
              </span>
              <ul className="flex flex-col space-y-3 text-sm font-normal text-[#806B57]">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-[#C8891A] transition-colors inline-block"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about#story"
                    className="hover:text-[#C8891A] transition-colors inline-block"
                  >
                    Our Story
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories"
                    className="hover:text-[#C8891A] transition-colors inline-block"
                  >
                    Categories
                  </Link>
                </li>
              </ul>
            </div>

            {/* CONTACT US Group */}
            <div className="flex flex-col space-y-4">
              <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#C8891A]">
                Contact Us
              </span>
              <ul className="flex flex-col space-y-3 text-sm font-normal text-[#806B57]">
                <li>
                  <a
                    href={CONTACT_CONFIG.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#C8891A] transition-colors inline-block"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href={CONTACT_CONFIG.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#C8891A] transition-colors inline-block"
                  >
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a
                    href={CONTACT_CONFIG.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#C8891A] transition-colors inline-block"
                  >
                    Google Maps
                  </a>
                </li>
                <li>
                  <a
                    href={CONTACT_CONFIG.phoneUrl}
                    className="hover:text-[#C8891A] transition-colors inline-block"
                  >
                    Phone
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FOOTER BOTTOM: Orbix Credit, Privacy/Terms, Copyright */}
        <div className="mt-16 sm:mt-20 pt-8 border-t border-[rgba(200,137,26,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-normal text-[#806B57]">
          {/* Left: Copyright */}
          <p className="order-3 sm:order-1 text-center sm:text-left">
            © 2026 Kanhaiya Collection. All rights reserved.
          </p>

          {/* Center: Exact Requested Orbix Credit */}
          <p className="order-1 sm:order-2 text-xs font-normal text-[#806B57] text-center">
            Made with 💜 by Orbix
          </p>

          {/* Right: Policy Links */}
          <div className="order-2 sm:order-3 flex items-center justify-center gap-5">
            <Link href="/privacy-policy" className="hover:text-[#C8891A] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-[#C8891A]/30">•</span>
            <Link href="/terms" className="hover:text-[#C8891A] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
