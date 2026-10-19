"use client";

import { useState, useMemo, useEffect } from "react";
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
  Eye,
  X,
  User,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
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
import { loadMockReviews } from "@/lib/mock-data/admin-store";

interface ReviewManagerProps {
  initialReviews: AdminReviewItem[];
  stats: AdminReviewStats;
}

export function ReviewManager({ initialReviews, stats: initialStats }: ReviewManagerProps) {
  const router = useRouter();

  // State
  const [reviews, setReviews] = useState<AdminReviewItem[]>(initialReviews);
  const [stats, setStats] = useState<AdminReviewStats>(initialStats);
  const [isHydrated, setIsHydrated] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");

  // Interaction State
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Review Detail Drawer & Modal States
  const [selectedReview, setSelectedReview] = useState<AdminReviewItem | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<AdminReviewItem | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // Hydrate from mock store in browser
  const refreshFromStore = () => {
    try {
      const res = loadMockReviews();
      if (res && res.reviews) {
        setReviews(res.reviews as AdminReviewItem[]);
        setStats(res.stats);
        // If drawer open, update selectedReview snapshot
        if (selectedReview) {
          const updated = res.reviews.find((r) => r.id === selectedReview.id);
          if (updated) setSelectedReview(updated as AdminReviewItem);
        }
      }
    } catch {
      // Fallback to current state
    }
  };

  useEffect(() => {
    refreshFromStore();
    setIsHydrated(true);
  }, []);

  // Unique products for filter dropdown
  const uniqueProducts = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of reviews) {
      if (r.product_id && r.product_name) {
        map.set(r.product_id, r.product_name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
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

      // 4. Product Filter
      if (productFilter !== "all" && review.product_id !== productFilter) {
        return false;
      }

      // 5. Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const prod = (review.product_name || "").toLowerCase();
        const author = (review.author_name || "").toLowerCase();
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
  }, [reviews, statusFilter, verificationFilter, ratingFilter, productFilter, searchTerm]);

  // Actions
  const handleApprove = async (reviewId: string) => {
    setActiveActionId(reviewId);
    setActionFeedback(null);
    try {
      const res = await approveReviewAction(reviewId);
      if (res.error) {
        setActionFeedback({ type: "error", text: res.error });
      } else {
        refreshFromStore();
        setActionFeedback({
          type: "success",
          text: res.message || "Review approved. Product rating rollup updated via schema trigger.",
        });
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
        refreshFromStore();
        setActionFeedback({
          type: "success",
          text: res.message || "Approval revoked. Excluded from product rating rollups.",
        });
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
    const targetId = reviewToDelete.id;
    setActiveActionId(targetId);
    setActionFeedback(null);
    try {
      const res = await deleteReviewAction(targetId);
      if (res.error) {
        setActionFeedback({ type: "error", text: res.error });
      } else {
        if (selectedReview?.id === targetId) {
          setSelectedReview(null);
        }
        setReviewToDelete(null);
        refreshFromStore();
        setActionFeedback({
          type: "success",
          text: res.message || "Review deleted. Product rating rollups recalculated.",
        });
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
          className={`cursor-pointer rounded-2xl border transition-colors ${
            stats.pendingCount > 0
              ? "border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10"
              : "border-border/80 bg-card hover:bg-muted/40"
          } p-5 shadow-xs`}
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
        <div
          onClick={() => setStatusFilter("approved")}
          className="cursor-pointer rounded-2xl border border-border/80 bg-card p-5 shadow-xs hover:bg-muted/40 transition-colors"
        >
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.verifiedCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Linked to genuine order items
            </p>
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-semibold transition-all ${
            actionFeedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionFeedback.type === "success" ? (
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl border border-border/80 bg-card shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by product, author, review text, or order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Approval Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-hidden"
            >
              <option value="all">All Moderation Status</option>
              <option value="pending">Pending Moderation</option>
              <option value="approved">Approved & Live</option>
            </select>
          </div>

          {/* Product Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-hidden max-w-[200px] truncate"
            >
              <option value="all">All Products</option>
              {uniqueProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Verified Purchase Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-hidden"
            >
              <option value="all">All Purchase Types</option>
              <option value="verified">Verified Purchase</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-hidden"
            >
              <option value="all">All Ratings (1–5)</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm ||
            statusFilter !== "all" ||
            verificationFilter !== "all" ||
            ratingFilter !== "all" ||
            productFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setVerificationFilter("all");
                setRatingFilter("all");
                setProductFilter("all");
              }}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1 underline cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
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
                    <div className="h-14 w-14 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-center shrink-0 text-muted-foreground font-bold overflow-hidden">
                      {review.product_image ? (
                        <img
                          src={review.product_image}
                          alt={review.product_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="h-6 w-6" />
                      )}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/shop/product/${review.product_slug}`}
                          target="_blank"
                          className="font-extrabold text-foreground text-sm sm:text-base hover:text-primary transition-colors flex items-center gap-1 group"
                        >
                          <span>{review.product_name}</span>
                          <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                        </Link>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1.5">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
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
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            review.is_approved
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {review.is_approved ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Approved & Live
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" /> Pending Moderation
                            </>
                          )}
                        </span>

                        {/* Verified Purchase Badge */}
                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                            <ShieldCheck className="h-3 w-3" /> Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Star Rating & Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Stars */}
                    <div className="flex items-center gap-1 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/60">
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

                    {/* View Details Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedReview(review)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground cursor-pointer shadow-xs transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </button>

                    {/* Quick Approve / Reject Button */}
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-bold disabled:opacity-50 cursor-pointer"
                      >
                        {isActing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        <span>Revoke</span>
                      </button>
                    )}

                    {/* Quick Delete Button */}
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => setReviewToDelete(review)}
                      className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Delete Review"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Review Body */}
                <div className="pt-4 space-y-3">
                  <p className="text-sm text-foreground/90 leading-relaxed font-normal">
                    {review.review_text ? (
                      `"${review.review_text}"`
                    ) : (
                      <span className="italic text-muted-foreground">
                        No review commentary provided. Star rating only.
                      </span>
                    )}
                  </p>

                  {/* Customer Image Attachments */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block w-full">
                        Attached Devotee Photos ({review.images.length})
                      </span>
                      {review.images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setEnlargedImage(imgUrl)}
                          className="h-16 w-16 rounded-xl border border-border/80 overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={imgUrl}
                            alt={`Review photo ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Verified Purchase Order Linkage Box */}
                  {review.is_verified_purchase && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-semibold text-emerald-950 dark:text-emerald-200">
                          Verified Purchase Linkage
                        </span>
                        {review.variant_name && (
                          <span className="text-muted-foreground">
                            · {review.variant_name}
                          </span>
                        )}
                        {review.unit_price && (
                          <span className="font-bold text-foreground">
                            · ₹{review.unit_price.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      {review.order_id && (
                        <Link
                          href={`/admin/orders/${review.order_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-emerald-500/30 bg-card hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-colors self-start sm:self-center"
                        >
                          <Package className="h-3.5 w-3.5" />
                          <span>Order #{review.order_number || review.order_id}</span>
                        </Link>
                      )}
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
              <span className="font-bold text-foreground">No customer reviews matched criteria</span>
              <p className="text-xs max-w-sm">
                Try switching the status, rating, or product filters to inspect all customer feedback.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Review Detail View Slide-Over Drawer */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl h-full bg-card border-l border-border/80 shadow-2xl p-6 sm:p-8 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-muted-foreground uppercase">
                    Review #{selectedReview.id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedReview.is_approved
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {selectedReview.is_approved ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Approved & Live
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" /> Pending Moderation
                      </>
                    )}
                  </span>
                </div>
                <h2 className="text-lg font-black text-foreground mt-1">
                  Customer Review Detail & Audit
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="py-6 space-y-6 flex-1">
              {/* Product Snapshot & System Derived Rollup Card */}
              <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Associated Product & System Rating
                </span>
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 rounded-xl border border-border/80 overflow-hidden bg-muted shrink-0">
                    {selectedReview.product_image ? (
                      <img
                        src={selectedReview.product_image}
                        alt={selectedReview.product_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="h-6 w-6 text-muted-foreground m-auto" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-extrabold text-foreground text-sm">
                      {selectedReview.product_name}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      Slug: {selectedReview.product_slug}
                    </p>

                    {/* Derived System Values */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 p-2.5 rounded-xl bg-background border border-border/70 text-xs">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold text-muted-foreground">Product Rollup:</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-foreground">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        <span>
                          {selectedReview.product_avg_rating !== undefined
                            ? selectedReview.product_avg_rating.toFixed(1)
                            : "—"}
                        </span>
                        <span className="text-muted-foreground font-normal">
                          ({selectedReview.product_review_count || 0} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed">
                  <strong>System Rule:</strong> <code>avg_rating</code> and <code>review_count</code> are derived
                  dynamically from approved reviews via schema trigger <code>refresh_product_rating</code>. Direct editing is disabled.
                </div>
              </div>

              {/* Devotee Reviewer Profile */}
              <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Reviewer Profile
                </span>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {selectedReview.author_name ? selectedReview.author_name.charAt(0) : "D"}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      {selectedReview.author_name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{selectedReview.author_email || "No email on record"}</span>
                      {selectedReview.author_phone && (
                        <>
                          <span>·</span>
                          <span>{selectedReview.author_phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Verification Linkage */}
              <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Verified Purchase Linkage
                </span>
                {selectedReview.is_verified_purchase ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Order Item Verified in Database</span>
                    </div>
                    {selectedReview.order_number && (
                      <p className="text-muted-foreground">
                        Order Number: <strong className="text-foreground">{selectedReview.order_number}</strong>
                      </p>
                    )}
                    {selectedReview.variant_name && (
                      <p className="text-muted-foreground">
                        Variant: <strong className="text-foreground">{selectedReview.variant_name}</strong>
                      </p>
                    )}
                    {selectedReview.unit_price && (
                      <p className="text-muted-foreground">
                        Unit Price: <strong className="text-foreground">₹{selectedReview.unit_price}</strong>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-xs text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Unverified Direct Review — Customer submitted without an order item ID.</span>
                  </div>
                )}
              </div>

              {/* Review Content & Attached Images */}
              <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Review Text & Photos
                </span>
                <div className="flex items-center gap-1 bg-muted/60 px-3 py-1.5 rounded-xl w-fit">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4.5 w-4.5 ${
                        s <= selectedReview.rating
                          ? "fill-amber-500 text-amber-500"
                          : "fill-muted text-muted-foreground/30"
                      }`}
                    />
                  ))}
                  <span className="ml-1.5 font-bold text-sm text-foreground">
                    {selectedReview.rating}.0 / 5.0
                  </span>
                </div>

                <p className="text-sm text-foreground leading-relaxed p-3.5 rounded-xl bg-background border border-border/70">
                  {selectedReview.review_text || (
                    <span className="italic text-muted-foreground">No commentary written.</span>
                  )}
                </p>

                {selectedReview.images && selectedReview.images.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Attached Photos:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedReview.images.map((imgUrl, i) => (
                        <img
                          key={i}
                          src={imgUrl}
                          alt="Attached review photo"
                          onClick={() => setEnlargedImage(imgUrl)}
                          className="h-20 w-20 rounded-xl object-cover border border-border cursor-pointer hover:opacity-80"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-border/70 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setReviewToDelete(selectedReview)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-destructive hover:bg-destructive/10 text-xs font-bold cursor-pointer transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Review</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
                >
                  Close
                </button>

                {!selectedReview.is_approved ? (
                  <button
                    type="button"
                    disabled={activeActionId === selectedReview.id}
                    onClick={() => handleApprove(selectedReview.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                  >
                    {activeActionId === selectedReview.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>Approve & Publish</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={activeActionId === selectedReview.id}
                    onClick={() => handleUnapprove(selectedReview.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    {activeActionId === selectedReview.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    <span>Revoke Approval</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
              will automatically recalculate the product&apos;s average rating and review count from remaining approved reviews.
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

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={enlargedImage}
              alt="Enlarged photo"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            />
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
