"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  Loader2,
  Lock,
  Trash2,
} from "lucide-react";
import type {
  ProductReviewItem,
  ProductRatingSummary,
} from "@/lib/data/products";
import {
  submitProductReviewAction,
  deleteOwnReviewAction,
} from "@/app/(public)/shop/actions";

interface ProductReviewsSectionProps {
  productId: string;
  productSlug: string;
  reviews: ProductReviewItem[];
  userPendingReview: ProductReviewItem | null;
  summary: ProductRatingSummary;
  canReview: boolean;
  alreadyReviewed: boolean;
  reviewIneligibilityReason?: string;
  isAuthenticated: boolean;
  currentUserId?: string | null;
}

export function ProductReviewsSection({
  productId,
  productSlug,
  reviews,
  userPendingReview,
  summary,
  canReview,
  alreadyReviewed,
  reviewIneligibilityReason,
  isAuthenticated,
  currentUserId,
}: ProductReviewsSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>("");

  const [isPending, setIsPending] = useState(false);
  const [isDeletingOwn, setIsDeletingOwn] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleDeleteOwnReview = async (reviewId: string) => {
    setIsDeletingOwn(reviewId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await deleteOwnReviewAction(reviewId);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage("Your review has been successfully deleted.");
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch {
      setErrorMessage("Failed to delete review. Please try again.");
    } finally {
      setIsDeletingOwn(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setErrorMessage("Please select a rating between 1 and 5 stars.");
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("productSlug", productSlug);
    formData.append("rating", String(rating));
    formData.append("reviewText", reviewText);

    try {
      const res = await submitProductReviewAction(null, formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(
          res.success ||
            "Your review has been submitted for moderation and will appear publicly once approved."
        );
        setIsFormOpen(false);
        setReviewText("");
      }
    } catch {
      setErrorMessage("Failed to submit review. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const totalReviews = summary.reviewCount;
  const avgRating = summary.avgRating;

  return (
    <section aria-label="Customer Reviews" className="flex flex-col gap-8 pt-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Customer Feedback</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Ratings & Verified Reviews
          </h2>
        </div>

        {/* Action Button: Write Review or Status */}
        {canReview && !alreadyReviewed && !userPendingReview && (
          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="self-start sm:self-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {isFormOpen ? "Cancel Review" : "Write a Verified Review"}
          </button>
        )}

        {!isAuthenticated && (
          <Link
            href={`/login?redirect=/shop/product/${productSlug}`}
            className="self-start sm:self-center px-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Log in to Review
          </Link>
        )}
      </div>

      {/* Rating Breakdown Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-3xl border border-border/70 bg-card/60 backdrop-blur-xs">
        {/* Left: Big Score */}
        <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-border/70">
          <span className="text-5xl font-black text-foreground">
            {avgRating > 0 ? avgRating.toFixed(1) : "—"}
          </span>
          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(avgRating)
                    ? "fill-amber-500 text-amber-500"
                    : "fill-muted text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Based on {totalReviews} {totalReviews === 1 ? "review" : "approved reviews"}
          </span>
        </div>

        {/* Center: Star Percentage Bars */}
        <div className="md:col-span-2 flex flex-col justify-center gap-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.breakdown[star as 1 | 2 | 3 | 4 | 5] || 0;
            const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 w-10 font-bold text-foreground shrink-0">
                  {star} <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                </span>

                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-8 text-right font-medium text-muted-foreground shrink-0">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Eligibility / Ineligibility Notice */}
      {isAuthenticated && !canReview && !userPendingReview && !alreadyReviewed && (
        <div className="p-4 rounded-2xl border border-border/80 bg-muted/30 flex items-center gap-3 text-xs text-muted-foreground">
          <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>
            {reviewIneligibilityReason ||
              "Only customers with a confirmed purchase of this product can write a review."}
          </span>
        </div>
      )}

      {/* Author's Pending Review Card (Shown ONLY to the author) */}
      {userPendingReview && (
        <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex flex-col gap-3 animate-in fade-in">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                <Clock className="h-3 w-3" />
                <span>Pending Moderation</span>
              </span>
              <span className="text-xs text-muted-foreground">
                (Visible only to you until approved by store administrator)
              </span>
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-3.5 w-3.5 ${
                    s <= userPendingReview.rating
                      ? "fill-amber-500 text-amber-500"
                      : "fill-muted text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {userPendingReview.review_text && (
            <p className="text-sm text-foreground italic">
              &ldquo;{userPendingReview.review_text}&rdquo;
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-[11px] text-muted-foreground">
            <span>
              Submitted on{" "}
              {new Date(userPendingReview.created_at).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>

            <button
              type="button"
              disabled={Boolean(isDeletingOwn)}
              onClick={() => handleDeleteOwnReview(userPendingReview.id)}
              className="inline-flex items-center gap-1 font-semibold text-destructive hover:underline cursor-pointer"
            >
              {isDeletingOwn === userPendingReview.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              <span>Delete Pending Review</span>
            </button>
          </div>
        </div>
      )}

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl border border-destructive/20 bg-destructive/10 text-xs font-semibold text-destructive flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Interactive Review Form */}
      {isFormOpen && canReview && !userPendingReview && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-3xl border border-primary/30 bg-card shadow-sm flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <span className="font-bold text-sm text-foreground">
              Share Your Verified Feedback
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Verified Purchase</span>
            </span>
          </div>

          {/* Star Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Your Rating:
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-500 text-amber-500"
                        : "fill-muted text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-bold text-amber-600">
                {rating} out of 5 stars
              </span>
            </div>
          </div>

          {/* Review Textarea */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="review-text"
              className="text-xs font-semibold text-foreground"
            >
              Your Review (Optional):
            </label>
            <textarea
              id="review-text"
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="How was the fabric quality, stitching, and fit? Would you recommend this to other buyers?"
              className="w-full p-3.5 rounded-2xl border border-border/80 bg-muted/40 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-hidden"
            />
          </div>

          {/* Notice & Submit Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-muted-foreground">
              Reviews are moderated to uphold authentic customer standards.
            </span>

            <div className="flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Submit for Approval</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Public Approved Reviews List */}
      <div className="flex flex-col gap-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div
              key={review.id}
              className="p-5 rounded-2xl border border-border/70 bg-card flex flex-col gap-3"
            >
              {/* Review Author & Stars */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {(review.author_name || "V").charAt(0).toUpperCase()}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">
                        {review.author_name || "Verified Customer"}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Verified Purchase</span>
                      </span>
                    </div>

                    <span className="text-[10px] text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 ${
                        s <= review.rating
                          ? "fill-amber-500 text-amber-500"
                          : "fill-muted text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Review Text */}
              {review.review_text && (
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  {review.review_text}
                </p>
              )}

              {/* Author self-delete */}
              {currentUserId && review.user_id === currentUserId && (
                <div className="flex justify-end pt-2 border-t border-border/60">
                  <button
                    type="button"
                    disabled={Boolean(isDeletingOwn)}
                    onClick={() => handleDeleteOwnReview(review.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive hover:underline cursor-pointer"
                  >
                    {isDeletingOwn === review.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    <span>Delete My Review</span>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-12 text-center rounded-2xl border border-dashed border-border text-muted-foreground text-xs">
            No approved customer reviews yet. Be the first verified buyer to share your feedback!
          </div>
        )}
      </div>
    </section>
  );
}
