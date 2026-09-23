import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, HeartHandshake, Compass } from "lucide-react";
import { getPublicAboutSections } from "@/lib/data/cms";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Our Heritage | Kanhaiya Collection",
  description:
    "Discover the legacy, master craftsmanship, and sustainable weaving cooperatives behind Kanhaiya Collection.",
};

export default async function AboutPage() {
  const sections = await getPublicAboutSections();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-border/60 bg-linear-to-b from-muted/30 to-background py-16 sm:py-24">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Timeless Craftsmanship Since 1998</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground font-serif">
            A Legacy of Indian Weaving & Regal Couture
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Preserving centuries of authentic handloom heritage, intricate zari embroidery, and bespoke tailoring for modern connoisseurs across the globe.
          </p>
        </div>
      </section>

      {/* Narrative Sections (Alternating) */}
      <section aria-labelledby="heritage-stories" className="py-16 sm:py-24">
        <h2 id="heritage-stories" className="sr-only">Our Heritage Stories and Artisan Chapters</h2>
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-20 sm:space-y-28">
          {sections.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-3xl bg-card border border-border/80 max-w-xl mx-auto space-y-3">
              <Sparkles className="h-10 w-10 mx-auto text-primary/60" />
              <h3 className="text-lg font-bold text-foreground font-serif">Stories in Preparation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our heritage stories and master weaver chronicles are currently being curated. In the meantime, explore our bespoke handloom creations.
              </p>
              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors"
                >
                  <span>Browse Store Catalog</span>
                </Link>
              </div>
            </div>
          ) : (
            sections.map((section, index) => {
              const isEven = index % 2 === 1;
              const headingId = `about-section-${section.id}`;

              return (
                <article
                  key={section.id}
                  aria-labelledby={headingId}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                    isEven ? "lg:grid-flow-dense" : ""
                  }`}
                >
                  {/* Visual Image */}
                  <div
                    className={`relative aspect-4/3 rounded-3xl overflow-hidden border border-border/80 shadow-md bg-muted/40 ${
                      isEven ? "lg:col-start-2" : ""
                    }`}
                  >
                    {section.image_url ? (
                      <Image
                        src={section.image_url}
                        alt={section.heading || "About Kanhaiya Collection"}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                        <Sparkles className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Narrative Text */}
                  <div className="space-y-4">
                    {section.subheading && (
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        {section.subheading}
                      </span>
                    )}
                    <h3 id={headingId} className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-serif">
                      {section.heading}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {section.body}
                    </p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* Brand Values */}
      <section className="border-t border-border/60 bg-muted/20 py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-serif">
              Our Core Principles
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              The ethical commitments that guide every thread we weave.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Certified Handloom Authenticity</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Zero synthetic adulteration. Every pure silk saree and linen kurta is woven with certified natural yarns.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Direct Fair-Wage Artisan Alliances</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Empowering over 400 traditional master weaver families across Varanasi, Chanderi, and Rajasthan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Compass className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Conscious Heritage Stewardship</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Utilizing non-toxic organic vegetable dyes, plastic-free sustainable packaging, and low-waste production.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all group"
            >
              <span>Explore Our Handloom Catalog</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
