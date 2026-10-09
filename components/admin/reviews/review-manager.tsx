"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Search,
  Filter,
  AlertCircle,
  ExternalLink,
  Package,
  Loader2,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import type {
  AdminReviewItem,
  AdminReviewStats,
} from "@/lib/data/review-types";
import {
  approveReviewAction,
  unapproveReviewAction,
  deleteReviewAction,
} from "@/app/(admin)/admin/reviews/actions";

interface ReviewManagerProps {
  initialReviews: AdminReviewItem[];
  stats: AdminReviewStats;
}

export function ReviewManager({ initialReviews, stats }: ReviewManagerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Delete Confirmation Modal State
  const [reviewToDelete, setReviewToDelete] = useState<AdminReviewItem | null>(null);

  const filteredReviews = useMemo(() => {
    return initialReviews.filter((review) => {
      // 1. Status Filter
      if (statusFilter === "pending" && review.is_approved) return false;
      if (statusFilter === "approved" && !review.is_approved) return false;

      // 2. Verification Filter
      if (verificationFilter === "verified" && !review.is_verified_purchase) return false;
      if (verificationFilter === "unverified" && review.is_verified_purchase) return false;

      // 3. Rating Filter
      if (ratingFilter !== "all" && review.rating !== Number(ratingFilter)) {
        return false;
      }

      // 4. Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const prod = review.product_name.toLowerCase();
        const author = review.author_name.toLowerCase();
        const text = (review.review_text || "").toLowerCase();
        const orderNum = (review.order_number || "").toLowerCase();
        return (
          prod.includes(q) ||
          author.includes(q) ||
          text.includes(q) ||
          orderNum.includes(q)
        );
      }

      return true;
    });
  }, [initialReviews, statusFilter, verificationFilter, ratingFilter, searchTerm]);

  const handleApprove = async (reviewId: string) => {
    setActiveActionId(reviewId);
    setActionFeedback(null);
    try {
      const res = await approveReviewAction(reviewId);
      if (res.error) {
        setActionFeedback({ type: "error", text: res.error });
      } else {
        setActionFeedback({
          type: "success",
          text: res.message || "Review approved. Product rating updated via trigger.",
        });
        router.refresh();
      }
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        text: err.message || "Failed to approve review.",
      });
    } finally {
      setActiveActionId(null);
    }
  };

  const handleUnapprove = async (reviewId: string) => {
    setActiveActionId(reviewId);
    setActionFeedback(null);
    try {
      const res = await unapproveReviewAction(reviewId);
      if (res.error) {
        setActionFeedback({ type: "error", text: res.error });
      } else {
        setActionFeedback({
          type: "success",
          text: res.message || "Approval revoked. Excluded from product rating.",
        });
        router.refresh();
      }
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        text: err.message || "Failed to revoke approval.",
      });
    } finally {
      setActiveActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;
    setActiveActionId(reviewToDelete.id);
    setActionFeedback(null);
    try {
      const res = await deleteReviewAction(reviewToDelete.id);
      if (res.error) {
        setActionFeedback({ type: "error", text: res.error });
      } else {
        setActionFeedback({
          type: "success",
          text: res.message || "Review deleted. Ratings recalculated.",
        });
        setReviewToDelete(null);
        router.refresh();
      }
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        text: err.message || "Failed to delete review.",
      });
    } finally {
      setActiveActionId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Reviews */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Reviews
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Star className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.totalCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Customer submissions
            </p>
          </div>
        </div>

        {/* Pending Moderation */}
        <div
          onClick={() => setStatusFilter("pending")}
          className={`cursor-pointer rounded-2xl border ${
            stats.pendingCount > 0
              ? "border-amber-500/50 bg-amber-500/5"
              : "border-border/80 bg-card"
          } p-5 shadow-xs transition-colors hover:border-amber-500`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Pending Moderation
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400">
              {stats.pendingCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Awaiting admin approval
            </p>
          </div>
        </div>

        {/* Approved Reviews */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Approved & Live
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.approvedCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Publicly visible on storefront
            </p>
          </div>
        </div>

        {/* Store Average Rating */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Store Rating
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-1.5">
              <span>{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}</span>
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Calculated from approved only
            </p>
          </div>
        </div>

        {/* Verified Purchases */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Verified Purchases
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.verifiedCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Linked to confirmed orders
            </p>
          </div>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            actionFeedback.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/20 bg-destructive/10 text-destructive"
          }`}
        >
          {actionFeedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-card">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product, customer, text, order #..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-muted/30 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary focus:bg-background transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Moderation Status */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-hidden focus:border-primary font-medium"
            >
              <option value="all">All Moderation Status</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved & Published</option>
            </select>
          </div>

          {/* Verification */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-hidden focus:border-primary font-medium"
            >
              <option value="all">All Purchase Types</option>
              <option value="verified">Verified Purchase Only</option>
              <option value="unverified">Unverified Direct Reviews</option>
            </select>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-hidden focus:border-primary font-medium"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {(searchTerm ||
            statusFilter !== "all" ||
            verificationFilter !== "all" ||
            ratingFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setVerificationFilter("all");
                setRatingFilter("all");
              }}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1 underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => {
            const isActing = activeActionId === review.id;

            return (
              <div
                key={review.id}
                className={`p-6 rounded-3xl border transition-all ${
                  !review.is_approved
                    ? "border-amber-500/40 bg-amber-500/5 shadow-xs"
                    : "border-border/80 bg-card shadow-xs"
                }`}
              >
                {/* Header: Product, Reviewer & Rating */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-border/70">
                  {/* Left: Product & Author Info */}
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-center shrink-0 text-muted-foreground font-bold overflow-hidden">
                      {review.product_image ? (
                        <img
                          src={review.product_image}
                          alt={review.product_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="h-5 w-5" />
                      )}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/shop/product/${review.product_slug}`}
                          target="_blank"
                          className="font-extrabold text-foreground text-sm hover:text-primary transition-colors flex items-center gap-1 group"
                        >
                          <span>{review.product_name}</span>
                          <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                        </Link>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="font-semibold text-foreground">
                          {review.author_name}
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(review.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span>·</span>
                        {/* Status Pill */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            review.is_approved
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {review.is_approved ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Approved
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" /> Pending Moderation
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Star Rating & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Stars */}
                    <div className="flex items-center gap-1 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/60">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= review.rating
                              ? "fill-amber-500 text-amber-500"
                              : "fill-muted text-muted-foreground/30"
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-xs font-bold text-foreground">
                        {review.rating}.0
                      </span>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2">
                      {!review.is_approved ? (
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleApprove(review.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                        >
                          {isActing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          <span>Approve</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleUnapprove(review.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer"
                        >
                          {isActing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          <span>Unapprove</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => setReviewToDelete(review)}
                        className="p-1.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Review Body */}
                <div className="py-3">
                  {review.review_text ? (
                    <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                      &ldquo;{review.review_text}&rdquo;
                    </p>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      No written comment provided (Star rating only).
                    </span>
                  )}
                </div>

                {/* Purchase Linkage Inspector */}
                <div className="pt-3 border-t border-border/60">
                  {review.is_verified_purchase ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            Verified Purchase Linkage
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {review.variant_name && `Variant: ${review.variant_name} · `}
                            Unit: ₹{review.unit_price?.toLocaleString("en-IN")} · Qty:{" "}
                            {review.quantity}
                          </span>
                        </div>
                      </div>

                      {review.order_id && (
                        <Link
                          href={`/admin/orders/${review.order_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-card hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-colors self-start sm:self-center"
                        >
                          <Package className="h-3.5 w-3.5" />
                          <span>View Order #{review.order_number || review.order_id.slice(0, 8)}</span>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        Unverified Direct Review — No linked order item found for this customer.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center rounded-3xl border border-border/80 bg-card">
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Star className="h-8 w-8 text-muted-foreground/50" />
              <span className="font-bold text-foreground">No reviews matched criteria</span>
              <p className="text-xs max-w-sm">
                Try switching the status or rating filters to inspect all incoming reviews.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {reviewToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl border border-border/80 bg-card shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <div className="h-10 w-10 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-foreground">
                  Permanently Delete Review?
                </h3>
                <span className="text-xs text-muted-foreground">
                  By {reviewToDelete.author_name} for {reviewToDelete.product_name}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This action cannot be undone. The review will be permanently deleted from the database, and the schema trigger{" "}
              <code className="text-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                trg_refresh_rating
              </code>{" "}
              will automatically recalculate the product&apos;s average rating and review count.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => setReviewToDelete(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 cursor-pointer shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
