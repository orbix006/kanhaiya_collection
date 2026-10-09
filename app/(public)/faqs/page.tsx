import Link from "next/link";
import { Sparkles, MessageCircle } from "lucide-react";
import { getPublicFaqs } from "@/lib/data/cms";
import { FaqBrowser } from "@/components/public/faq-browser";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Help Center & FAQs | Kanhaiya Collection",
  description:
    "Find answers to frequently asked questions about shipping, delivery timelines, return policies, and pure silk care.",
};

export default async function FaqsPage() {
  const faqs = await getPublicFaqs();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <main className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-border/60 bg-linear-to-b from-muted/30 to-background py-16 sm:py-20">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Customer Care & Help Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-serif">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Everything you need to know about our handcrafted collections, tailoring measurements, shipping policies, and hassle-free returns.
          </p>
        </div>
      </section>

      {/* Main FAQ Browser */}
      <section aria-label="FAQ Accordion Section" className="py-12 sm:py-16">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FaqBrowser faqs={faqs} />

          {/* Need More Assistance Banner */}
          <div className="mt-16 text-center p-8 rounded-3xl bg-muted/30 border border-border/70 max-w-xl mx-auto space-y-3">
            <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-foreground">
              Still have questions or need bespoke advice?
            </h2>
            <p className="text-xs text-muted-foreground">
              Our styling consultants and customer concierge team are delighted to assist you.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors"
              >
                <span>Contact Concierge</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
