import { Phone, Mail, MapPin, Clock, Sparkles, MessageSquare } from "lucide-react";
import { getSiteSettings } from "@/lib/data/cms";
import { ContactForm } from "@/components/public/contact-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact Us & Atelier Inquiries | Kanhaiya Collection",
  description:
    "Get in touch with Kanhaiya Collection customer care for bridal consultations, bespoke handloom orders, and shopping assistance.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings("footer");

  return (
    <main className="flex flex-col min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-border/60 bg-linear-to-b from-muted/30 to-background py-16 sm:py-20">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Dedicated Concierge Service</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-serif">
            Contact Kanhaiya Collection
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Have a question about fabric styling, custom tailoring, or an existing order? Our royal concierge team is here to assist you.
          </p>
        </div>
      </section>

      {/* Main Grid: Details + Form */}
      <section aria-label="Contact information and inquiry form" className="py-12 sm:py-16">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
            {/* Left Contact Cards */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground font-serif">
                  Atelier & Customer Support
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  We look forward to hearing from you. Reach out via phone, email, or visit our atelier.
                </p>
              </div>

              <address className="not-italic space-y-4">
                <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-foreground block">Flagship Atelier</span>
                    <p className="text-muted-foreground leading-relaxed">{settings.address}</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-foreground block">Telephone Consultation</span>
                    <a
                      href={`tel:${settings.phone}`}
                      className="font-semibold text-primary hover:underline block"
                    >
                      {settings.phone}
                    </a>
                    <span className="text-[11px] text-muted-foreground">Direct concierge line</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-foreground block">Email Support</span>
                    <a
                      href={`mailto:${settings.email}`}
                      className="font-semibold text-primary hover:underline block"
                    >
                      {settings.email}
                    </a>
                    <span className="text-[11px] text-muted-foreground">
                      Response within 24 business hours
                    </span>
                  </div>
                </div>

                {settings.business_hours && (
                  <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="text-xs space-y-0.5">
                      <span className="font-bold text-foreground block">Opening Hours</span>
                      <p className="text-muted-foreground">{settings.business_hours}</p>
                    </div>
                  </div>
                )}
              </address>
            </div>

            {/* Right Contact Form */}
            <div className="lg:col-span-3">
              <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-md space-y-6">
                <div className="border-b border-border/60 pb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <h2 className="text-base font-bold text-foreground">
                      Send a Message to Our Concierge
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fill out the form below and our styling team will be in touch promptly.
                  </p>
                </div>

                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
