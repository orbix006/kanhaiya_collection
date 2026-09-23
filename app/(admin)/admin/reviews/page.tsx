import type { Metadata } from "next";
import { getAdminReviews } from "@/lib/data/reviews";
import { ReviewManager } from "@/components/admin/reviews/review-manager";
import { Star, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer Review Moderation | Admin Dashboard",
  description:
    "Moderate customer reviews, verify linked purchase history, and synchronize store ratings via database schema triggers.",
};

export default async function AdminReviewsPage() {
  const { reviews, stats } = await getAdminReviews();

  return (
    <div className="space-y-8">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Storefront Moderation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Customer Reviews & Ratings Moderation
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Audit customer feedback, inspect verified purchase linkage, approve or unapprove reviews, and trigger automatic rating recalculation.
          </p>
        </div>
      </div>

      {/* Main Review Manager */}
      <ReviewManager initialReviews={reviews} stats={stats} />
    </div>
  );
}
