"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  getProductBySlug,
  checkUserReviewEligibility,
  recordProductView,
} from "@/lib/data/products";
import { addToCartAction as baseAddToCartAction } from "@/app/(public)/cart/actions";
import type { AddToCartInput } from "@/lib/data/cart";

export async function addToCartAction(input: AddToCartInput) {
  return baseAddToCartAction(input);
}

export async function submitProductReviewAction(prevState: any, formData: FormData) {
  const productId = (formData.get("productId") as string)?.trim();
  const productSlug = (formData.get("productSlug") as string)?.trim();
  const rating = Number(formData.get("rating"));
  const reviewText = (formData.get("reviewText") as string)?.trim() || null;
  const rawImages = (formData.get("images") as string)?.trim();

  let images: string[] = [];
  if (rawImages) {
    try {
      images = JSON.parse(rawImages);
    } catch {
      images = [];
    }
  }

  if (!productId || isNaN(rating) || rating < 1 || rating > 5) {
    return { error: "Please provide a valid rating between 1 and 5 stars." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to submit a review." };
  }

  // Verify eligibility (one review per user/product, and qualifying order item)
  const eligibility = await checkUserReviewEligibility(productId, user.id);

  if (!eligibility.canReview) {
    return {
      error: eligibility.reason || "You are not eligible to review this product.",
    };
  }

  try {
    const { error: insertError } = await supabase.from("product_reviews").insert({
      product_id: productId,
      user_id: user.id,
      order_item_id: eligibility.qualifyingOrderItemId,
      rating: rating,
      review_text: reviewText,
      images: images,
      is_approved: false, // Strictly false: requires admin moderation
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return { error: "You have already submitted a review for this product." };
      }
      return { error: insertError.message };
    }

    if (productSlug) {
      revalidatePath(`/shop/product/${productSlug}`);
      revalidatePath(`/product/${productSlug}`);
    }
    revalidatePath("/shop");

    return {
      success:
        "Your review has been submitted for moderation and will appear publicly once approved. Thank you!",
    };
  } catch (err: any) {
    return { error: err.message || "Failed to submit review." };
  }
}

/**
 * Allows a regular customer to delete their own review.
 * Strictly checks user_id = caller.id. Recalculates product rating via trigger.
 */
export async function deleteOwnReviewAction(reviewId: string) {
  if (!reviewId) {
    return { error: "Review ID required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required to manage your review." };
  }

  try {
    // 1. Verify ownership before deletion
    const { data: review, error: fetchErr } = await supabase
      .from("product_reviews")
      .select("id, product_id, user_id, products(slug)")
      .eq("id", reviewId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchErr || !review) {
      return { error: "Review not found or unauthorized." };
    }

    // 2. Delete review strictly guarded by user_id
    const { error: deleteErr } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", user.id);

    if (deleteErr) {
      return { error: deleteErr.message };
    }

    const prodSlug = (review.products as any)?.slug;
    if (prodSlug) {
      revalidatePath(`/shop/product/${prodSlug}`);
      revalidatePath(`/product/${prodSlug}`);
    }
    revalidatePath("/shop");

    return { success: "Your review has been deleted successfully." };
  } catch (err: any) {
    return { error: err.message || "Failed to delete review." };
  }
}

export async function recordProductViewAction(productId: string) {
  if (!productId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await recordProductView(productId, user.id);
}
