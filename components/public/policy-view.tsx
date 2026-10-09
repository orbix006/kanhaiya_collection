import Link from "next/link";
import { ArrowLeft, Calendar, ShieldCheck, FileText, ChevronRight, HelpCircle } from "lucide-react";
import type { SitePolicy, PolicyType } from "@/lib/data/cms";

interface PolicyViewProps {
  policy: SitePolicy;
}

const POLICY_NAV: { type: PolicyType; title: string; href: string }[] = [
  { type: "privacy", title: "Privacy Policy", href: "/privacy" },
  { type: "terms", title: "Terms of Service", href: "/terms" },
  { type: "shipping", title: "Shipping & Delivery", href: "/shipping" },
  { type: "return", title: "Returns & Refunds", href: "/return" },
];

/**
 * Parses bold markdown (**text**) into react elements
 */
function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function PolicyView({ policy }: PolicyViewProps) {
  const paragraphs = policy?.content ? policy.content.split("\n\n").filter(Boolean) : [];

  return (
    <main className="flex flex-col min-h-screen">
      {/* Header */}
      <section className="border-b border-border/60 bg-muted/20 py-12 sm:py-16">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4">
          <nav aria-label="Breadcrumb">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Return to Storefront</span>
            </Link>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-serif">
            {policy?.title || "Store Policy"}
          </h1>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 flex-wrap">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Official Kanhaiya Collection Policy</span>
            </span>
            {policy?.updated_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <time dateTime={policy.updated_at}>
                  Updated{" "}
                  {new Date(policy.updated_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Policy Content */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
          <article className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-xs space-y-6">
            {paragraphs.length === 0 ? (
              <div className="text-center py-12 p-6 rounded-2xl bg-muted/20 border border-border space-y-3">
                <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <h2 className="text-base font-bold text-foreground">Policy Notice Being Updated</h2>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  The terms for this policy are currently being revised by our legal and compliance team. Please contact customer support for specific inquiries.
                </p>
                <div className="pt-2">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
                  >
                    <span>Contact Concierge</span>
                  </Link>
                </div>
              </div>
            ) : (
              paragraphs.map((p, i) => {
                const trimmed = p.trim();

                // H2 / H3 Headings
                if (trimmed.startsWith("### ")) {
                  return (
                    <h3
                      key={i}
                      className="text-base sm:text-lg font-bold text-foreground font-serif pt-4 first:pt-0"
                    >
                      {trimmed.replace("### ", "")}
                    </h3>
                  );
                }
                if (trimmed.startsWith("## ")) {
                  return (
                    <h2
                      key={i}
                      className="text-lg sm:text-xl font-bold text-foreground font-serif pt-5 first:pt-0"
                    >
                      {trimmed.replace("## ", "")}
                    </h2>
                  );
                }

                // Bullet Lists
                if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                  const items = trimmed.split("\n").filter(Boolean);
                  return (
                    <ul
                      key={i}
                      className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-2"
                    >
                      {items.map((item, idx) => (
                        <li key={idx}>
                          {renderInlineFormatting(item.replace(/^[-*]\s+/, ""))}
                        </li>
                      ))}
                    </ul>
                  );
                }

                // Standard Paragraph
                return (
                  <p
                    key={i}
                    className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
                  >
                    {renderInlineFormatting(trimmed)}
                  </p>
                );
              })
            )}
          </article>

          {/* Quick Policy Switcher */}
          <nav aria-label="Related Policies" className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Other Store Policies & Customer Guidelines
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {POLICY_NAV.map((item) => {
                const isCurrent = item.type === policy?.type;
                return (
                  <Link
                    key={item.type}
                    href={item.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold transition-all group ${
                      isCurrent
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card text-foreground border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 opacity-70" />
                      <span>{item.title}</span>
                    </div>
                    {!isCurrent && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </section>
    </main>
  );
}
