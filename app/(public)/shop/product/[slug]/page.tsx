import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getProductBySlug,
  getProductReviews,
  checkUserReviewEligibility,
  recordProductView,
} from "@/lib/data/products";
import { ProductDetailView } from "@/components/product/product-detail-view";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.is_active) {
    return {
      title: "Product Not Found | Kanhaiya Collection",
    };
  }

  const primaryImage =
    product.images.find((img) => img.is_primary)?.image_url ||
    product.images[0]?.image_url;

  return {
    title: product.meta_title || `${product.name} | Kanhaiya Collection`,
    description:
      product.meta_description ||
      product.description ||
      `Buy authentic ${product.name} online at Kanhaiya Collection.`,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: primaryImage ? [primaryImage] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  // 1. Fetch product detail by slug
  const product = await getProductBySlug(slug);

  // 2. Strictly guard: invalid or hidden products are unavailable (404)
  if (!product || !product.is_active) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. For signed-in users, record product view to power "Continue Browsing"
  if (user) {
    await recordProductView(product.id, user.id);
  }

  // 4. Fetch reviews & eligibility in parallel
  const [reviewsData, eligibility] = await Promise.all([
    getProductReviews(product.id, user?.id),
    checkUserReviewEligibility(product.id, user?.id),
  ]);

  return (
    <ProductDetailView
      product={product}
      reviews={reviewsData.reviews}
      userPendingReview={reviewsData.userPendingReview}
      reviewSummary={reviewsData.summary}
      canReview={eligibility.canReview}
      alreadyReviewed={eligibility.alreadyReviewed}
      reviewIneligibilityReason={eligibility.reason}
      isAuthenticated={Boolean(user)}
      currentUserId={user?.id || null}
    />
  );
}
