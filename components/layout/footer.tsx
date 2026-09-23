import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Store,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  InstagramIcon,
  FacebookIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@/components/ui/social-icons";
import { getSiteSettings, getPublicPolicies } from "@/lib/data/cms";
import { NewsletterBox } from "@/components/layout/newsletter-box";

export async function Footer() {
  const [settings, policies] = await Promise.all([
    getSiteSettings("footer"),
    getPublicPolicies(),
  ]);

  return (
    <footer role="contentinfo" className="border-t border-border/60 bg-card/60 text-card-foreground">
      {/* Top Value Propositions */}
      <div className="border-b border-border/50 py-8 bg-muted/20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">100% Handloom Certified</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Authentic pure silk weaves</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Free Shipping Over ₹1,999</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Prompt nationwide dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">7-Day Easy Returns</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Hassle-free reverse pickup</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Secure Payments</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Cards, UPI & Netbanking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group" aria-label={`${settings.brand_name} Home`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs group-hover:scale-105 transition-transform">
                <Store className="h-4.5 w-4.5" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-foreground font-serif">
                {settings.brand_name}
              </span>
            </Link>

            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              {settings.tagline}
            </p>

            {/* Newsletter Subscription */}
            <div className="pt-2 space-y-2">
              <span className="text-xs font-bold text-foreground block">
                Join Our VIP Collector&apos;s Circle
              </span>
              <p className="text-[11px] text-muted-foreground">
                Receive private previews of new handloom drops and royal festive collections.
              </p>
              <NewsletterBox />
            </div>
          </div>

          {/* Catalog & Shop Navigation */}
          <nav aria-label="Collections Navigation" className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/shop" className="hover:text-foreground transition-colors">
                  All Collections
                </Link>
              </li>
              <li>
                <Link href="/shop?category=menswear" className="hover:text-foreground transition-colors">
                  Menswear Couture
                </Link>
              </li>
              <li>
                <Link href="/shop?category=womenswear" className="hover:text-foreground transition-colors">
                  Heritage Sarees & Ensembles
                </Link>
              </li>
              <li>
                <Link href="/shop?category=accessories" className="hover:text-foreground transition-colors">
                  Artisanal Accessories
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About Our Heritage
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal Policies & Customer Care Navigation */}
          <nav aria-label="Customer Care and Policies Navigation" className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Customer Support
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact Customer Concierge
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="hover:text-foreground transition-colors">
                  Help Center & FAQs
                </Link>
              </li>
              {policies.map((p) => (
                <li key={p.id}>
                  <Link href={`/${p.type}`} className="hover:text-foreground transition-colors">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact Details & Socials */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Atelier & Contact
            </h4>
            <address className="not-italic space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span className="leading-snug">{settings.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href={`tel:${settings.phone}`} className="hover:text-foreground transition-colors font-medium">
                  {settings.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href={`mailto:${settings.email}`} className="hover:text-foreground transition-colors font-medium">
                  {settings.email}
                </a>
              </div>
              {settings.business_hours && (
                <div className="flex items-start gap-2 pt-1 text-[11px]">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                  <span>{settings.business_hours}</span>
                </div>
              )}
            </address>

            {/* Social Media Links */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-foreground block mb-2">
                Connect With Us
              </span>
              <div className="flex items-center gap-2">
                {settings.social?.instagram && (
                  <a
                    href={settings.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/50 transition-colors"
                    aria-label="Follow Kanhaiya Collection on Instagram"
                  >
                    <InstagramIcon className="h-4 w-4" />
                  </a>
                )}
                {settings.social?.facebook && (
                  <a
                    href={settings.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/50 transition-colors"
                    aria-label="Follow Kanhaiya Collection on Facebook"
                  >
                    <FacebookIcon className="h-4 w-4" />
                  </a>
                )}
                {settings.social?.twitter && (
                  <a
                    href={settings.social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/50 transition-colors"
                    aria-label="Follow Kanhaiya Collection on Twitter"
                  >
                    <TwitterIcon className="h-4 w-4" />
                  </a>
                )}
                {settings.social?.youtube && (
                  <a
                    href={settings.social.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/50 transition-colors"
                    aria-label="Subscribe to Kanhaiya Collection on YouTube"
                  >
                    <YoutubeIcon className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-border/50 py-6 text-xs text-muted-foreground">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} {settings.brand_name}. All rights reserved.</p>
          <div className="flex items-center gap-3 text-[11px] flex-wrap">
            {policies.map((p) => (
              <span key={p.id} className="flex items-center gap-3">
                <Link href={`/${p.type}`} className="hover:underline">{p.title}</Link>
                <span aria-hidden="true">•</span>
              </span>
            ))}
            <Link href="/admin" className="hover:underline text-primary font-bold">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
