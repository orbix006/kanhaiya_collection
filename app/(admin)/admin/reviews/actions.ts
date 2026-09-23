"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDemoReviewsStore } from "@/lib/data/reviews";

function safeRevalidate(path: string, type?: "layout" | "page") {
  try {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  } catch {
    // Standalone or script fallback
  }
}

/**
 * Approves a customer review.
 * Database trigger `trg_refresh_rating` automatically recalculates products.avg_rating and products.review_count.
 */
export async function approveReviewAction(
  reviewId: string
): Promise<{ success?: boolean; message?: string; error?: string }> {
  if (!reviewId) {
    return { error: "Review ID is required." };
  }

  const supabase = await createClient();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    const store = getDemoReviewsStore();
    const review = store.get(reviewId);
    if (!review) {
      return { error: `Review '${reviewId}' not found.` };
    }
    review.is_approved = true;

    safeRevalidate("/admin/reviews");
    safeRevalidate("/admin");
    safeRevalidate("/shop");
    safeRevalidate(`/product/${review.product_slug}`);
    safeRevalidate(`/shop/product/${review.product_slug}`);

    return {
      success: true,
      message: `[Demo Mode] Review for '${review.product_name}' has been approved and published.`,
    };
  }

  // 1. Verify acting user is admin
  const {
    data: { user: caller },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !caller) {
    return { error: "Unauthorized: Please log in to moderate reviews." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Forbidden: Administrator permissions required." };
  }

  // 2. Fetch review to get product slug for revalidation
  const { data: review, error: fetchErr } = await supabase
    .from("product_reviews")
    .select("id, product_id, is_approved, products(slug)")
    .eq("id", reviewId)
    .single();

  if (fetchErr || !review) {
    return { error: "Review not found in database." };
  }

  // 3. Update is_approved to true
  // Trigger `trg_refresh_rating` will automatically recalculate products.avg_rating and products.review_count
  const { error: updateErr } = await supabase
    .from("product_reviews")
    .update({ is_approved: true })
    .eq("id", reviewId);

  if (updateErr) {
    return { error: `Failed to approve review: ${updateErr.message}` };
  }

  const prodSlug = (review.products as any)?.slug;
  safeRevalidate("/admin/reviews");
  safeRevalidate("/admin");
  safeRevalidate("/shop");
  if (prodSlug) {
    safeRevalidate(`/product/${prodSlug}`);
    safeRevalidate(`/shop/product/${prodSlug}`);
  }

  return {
    success: true,
    message: "Review approved successfully. Product rating and review count have been updated.",
  };
}

/**
 * Revokes approval (unapproves) an existing customer review.
 * Database trigger `trg_refresh_rating` automatically updates product ratings excluding this review.
 */
export async function unapproveReviewAction(
  reviewId: string
): Promise<{ success?: boolean; message?: string; error?: string }> {
  if (!reviewId) {
    return { error: "Review ID is required." };
  }

  const supabase = await createClient();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    const store = getDemoReviewsStore();
    const review = store.get(reviewId);
    if (!review) {
      return { error: `Review '${reviewId}' not found.` };
    }
    review.is_approved = false;

    safeRevalidate("/admin/reviews");
    safeRevalidate("/admin");
    safeRevalidate("/shop");
    safeRevalidate(`/product/${review.product_slug}`);
    safeRevalidate(`/shop/product/${review.product_slug}`);

    return {
      success: true,
      message: `[Demo Mode] Approval revoked for '${review.product_name}' review.`,
    };
  }

  // 1. Verify acting user is admin
  const {
    data: { user: caller },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !caller) {
    return { error: "Unauthorized: Please log in to moderate reviews." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Forbidden: Administrator permissions required." };
  }

  // 2. Fetch review to get product slug for revalidation
  const { data: review, error: fetchErr } = await supabase
    .from("product_reviews")
    .select("id, product_id, is_approved, products(slug)")
    .eq("id", reviewId)
    .single();

  if (fetchErr || !review) {
    return { error: "Review not found in database." };
  }

  // 3. Update is_approved to false
  // Trigger `trg_refresh_rating` will automatically recalculate products.avg_rating and products.review_count
  const { error: updateErr } = await supabase
    .from("product_reviews")
    .update({ is_approved: false })
    .eq("id", reviewId);

  if (updateErr) {
    return { error: `Failed to unapprove review: ${updateErr.message}` };
  }

  const prodSlug = (review.products as any)?.slug;
  safeRevalidate("/admin/reviews");
  safeRevalidate("/admin");
  safeRevalidate("/shop");
  if (prodSlug) {
    safeRevalidate(`/product/${prodSlug}`);
    safeRevalidate(`/shop/product/${prodSlug}`);
  }

  return {
    success: true,
    message: "Approval revoked. Review is now pending and excluded from product rating.",
  };
}

/**
 * Permanently deletes a customer review as an administrator.
 * Database trigger `trg_refresh_rating` automatically updates product ratings.
 */
export async function deleteReviewAction(
  reviewId: string
): Promise<{ success?: boolean; message?: string; error?: string }> {
  if (!reviewId) {
    return { error: "Review ID is required." };
  }

  const supabase = await createClient();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    const store = getDemoReviewsStore();
    const review = store.get(reviewId);
    store.delete(reviewId);

    safeRevalidate("/admin/reviews");
    safeRevalidate("/admin");
    safeRevalidate("/shop");
    if (review) {
      safeRevalidate(`/product/${review.product_slug}`);
      safeRevalidate(`/shop/product/${review.product_slug}`);
    }

    return {
      success: true,
      message: "[Demo Mode] Review has been deleted.",
    };
  }

  // 1. Verify acting user is admin
  const {
    data: { user: caller },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !caller) {
    return { error: "Unauthorized: Please log in to delete reviews." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Forbidden: Administrator permissions required." };
  }

  // 2. Fetch review to get product slug for revalidation
  const { data: review } = await supabase
    .from("product_reviews")
    .select("id, product_id, products(slug)")
    .eq("id", reviewId)
    .single();

  // 3. Delete review from database
  // Trigger `trg_refresh_rating` fires on DELETE and updates products.avg_rating and products.review_count
  const { error: deleteErr } = await supabase
    .from("product_reviews")
    .delete()
    .eq("id", reviewId);

  if (deleteErr) {
    return { error: `Failed to delete review: ${deleteErr.message}` };
  }

  const prodSlug = (review?.products as any)?.slug;
  safeRevalidate("/admin/reviews");
  safeRevalidate("/admin");
  safeRevalidate("/shop");
  if (prodSlug) {
    safeRevalidate(`/product/${prodSlug}`);
    safeRevalidate(`/shop/product/${prodSlug}`);
  }

  return {
    success: true,
    message: "Review permanently deleted. Product rating has been recalculated.",
  };
}
