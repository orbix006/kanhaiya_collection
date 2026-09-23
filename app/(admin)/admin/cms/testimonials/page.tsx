import { getTestimonialsAdmin } from "@/lib/data/cms";
import { TestimonialsManager } from "@/components/admin/cms/testimonials-manager";
import { Sparkles, MessageSquareHeart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const testimonials = await getTestimonialsAdmin();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Social Proof & Trust</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Wall of Love (Testimonials)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Curate authentic customer reviews, star ratings, and verified buyer profiles featured on the homepage.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border">
          <MessageSquareHeart className="h-4 w-4 text-primary" />
          <span>{testimonials.length} total testimonials</span>
        </div>
      </div>

      <TestimonialsManager initialTestimonials={testimonials} />
    </div>
  );
}
