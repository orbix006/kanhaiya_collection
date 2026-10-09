import Image from "next/image";
import { Star, Heart, Quote, CheckCircle2 } from "lucide-react";
import type { Testimonial } from "@/lib/data/homepage";

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export function TestimonialsSection({
  testimonials,
}: TestimonialsSectionProps) {
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Customer Testimonials"
      className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-bold uppercase tracking-wider mb-2 border border-rose-200 dark:border-rose-900/50">
          <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
          <span>Wall of Love</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          What Our Patrons Say
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl">
          Discover why discerning connoisseurs of Indian handlooms and bespoke couture choose Kanhaiya Collection.
        </p>
      </div>

      {/* Testimonials Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {testimonials.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-6 shadow-xs hover:shadow-md transition-shadow relative"
          >
            <div>
              {/* Star Rating */}
              <div className="flex items-center gap-1 mb-3 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < (item.rating || 5)
                        ? "fill-amber-500 text-amber-500"
                        : "text-neutral-300 dark:text-neutral-700"
                    }`}
                  />
                ))}
              </div>

              {/* Quote icon */}
              <Quote className="h-6 w-6 text-muted-foreground/30 mb-2 rotate-180" />

              {/* Testimonial Content */}
              <p className="text-sm text-foreground/90 leading-relaxed italic">
                "{item.content}"
              </p>
            </div>

            {/* Author Profile Footer */}
            <div className="flex items-center gap-3 pt-6 mt-6 border-t border-border/40">
              {item.avatar_url ? (
                <div className="relative h-11 w-11 rounded-full overflow-hidden shrink-0 border border-border">
                  <Image
                    src={item.avatar_url}
                    alt={item.customer_name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {item.customer_name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm text-foreground truncate">
                    {item.customer_name}
                  </span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                </div>
                {item.designation && (
                  <span className="text-xs text-muted-foreground truncate">
                    {item.designation}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
