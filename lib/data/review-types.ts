export interface AdminReviewItem {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  user_id: string;
  author_name: string;
  author_email?: string | null;
  author_phone?: string | null;
  author_avatar?: string | null;
  rating: number;
  review_text: string | null;
  images: string[];
  is_approved: boolean;
  created_at: string;
  // Purchase Linkage Inspection
  order_item_id: string | null;
  is_verified_purchase: boolean;
  order_id?: string | null;
  order_number?: string | null;
  order_status?: string | null;
  order_placed_at?: string | null;
  variant_name?: string | null;
  unit_price?: number | null;
  quantity?: number | null;
}

export interface AdminReviewFilterParams {
  status?: "all" | "pending" | "approved";
  verification?: "all" | "verified" | "unverified";
  rating?: "all" | number;
  searchQuery?: string;
}

export interface AdminReviewStats {
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  averageRating: number;
  verifiedCount: number;
}
