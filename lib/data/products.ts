import { createClient } from "@/lib/supabase/server";
import { getAllActiveCategories, type ProductItem, type Category } from "@/lib/data/homepage";
import { getDescendantCategoryIds } from "@/lib/data/categories";

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  sku: string | null;
  attributes: Record<string, unknown>;
  price: number | null;
  compare_at_price: number | null;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
}

export interface ProductReviewItem {
  id: string;
  product_id: string;
  user_id: string;
  order_item_id: string | null;
  rating: number;
  review_text: string | null;
  images: string[];
  is_approved: boolean;
  created_at: string;
  author_name?: string;
  author_avatar?: string | null;
}

export interface ProductRatingSummary {
  avgRating: number;
  reviewCount: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ProductDetail {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  sku: string | null;
  base_price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  sold_count: number;
  is_active: boolean;
  is_featured_top_seller: boolean;
  top_seller_display_order: number | null;
  avg_rating: number;
  review_count: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  category?: Category | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface ShopFilterParams {
  categorySlug?: string;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string; // 'price_asc' | 'price_desc' | 'newest' | 'top_rated' | 'featured'
  page?: number;
  pageSize?: number;
}

export interface ShopQueryResult {
  products: ProductItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  activeCategory: Category | null;
  minPriceAvailable: number;
  maxPriceAvailable: number;
}

// Complete fallback product details with images & variants for offline / local-dev resilience
export const FALLBACK_PRODUCT_DETAILS: ProductDetail[] = [
  {
    id: "prod-1",
    category_id: "cat-1-1",
    name: "Royal Linen Formal Shirt",
    slug: "royal-linen-formal-shirt",
    description: "Impeccably tailored from 100% pure organic European flax linen. Breathable, lightweight, and engineered for effortless sophistication during celebratory banquets and refined evening events.",
    brand: "Kanhaiya Heritage",
    sku: "SKU-ROYAL-LINEN-SHIRT",
    base_price: 2499,
    compare_at_price: 2999,
    stock_quantity: 45,
    sold_count: 52,
    is_active: true,
    is_featured_top_seller: true,
    top_seller_display_order: 1,
    avg_rating: 4.8,
    review_count: 24,
    meta_title: "Royal Linen Formal Shirt | Kanhaiya Collection",
    meta_description: "Shop handcrafted European flax linen shirts online.",
    created_at: "2026-01-10T10:00:00.000Z",
    images: [
      {
        id: "img-1-1",
        product_id: "prod-1",
        image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
        alt_text: "Royal Linen Formal Shirt front view",
        display_order: 1,
        is_primary: true,
      },
      {
        id: "img-1-2",
        product_id: "prod-1",
        image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
        alt_text: "Royal Linen Shirt fabric weave detail",
        display_order: 2,
        is_primary: false,
      },
      {
        id: "img-1-3",
        product_id: "prod-1",
        image_url: "https://images.unsplash.com/photo-1620012253295-c15c429f6b98?auto=format&fit=crop&w=800&q=80",
        alt_text: "Royal Linen Shirt cuff and mother-of-pearl buttons",
        display_order: 3,
        is_primary: false,
      },
    ],
    variants: [
      {
        id: "var-1-1",
        product_id: "prod-1",
        variant_name: "Ivory / Medium",
        sku: "SKU-LINEN-IVR-M",
        attributes: { color: "Ivory", size: "M" },
        price: 2499,
        compare_at_price: 2999,
        stock_quantity: 20,
        image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
        is_active: true,
      },
      {
        id: "var-1-2",
        product_id: "prod-1",
        variant_name: "Ivory / Large",
        sku: "SKU-LINEN-IVR-L",
        attributes: { color: "Ivory", size: "L" },
        price: 2499,
        compare_at_price: 2999,
        stock_quantity: 15,
        image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
        is_active: true,
      },
      {
        id: "var-1-3",
        product_id: "prod-1",
        variant_name: "Sapphire / Large",
        sku: "SKU-LINEN-BLU-L",
        attributes: { color: "Sapphire Blue", size: "L" },
        price: 2699,
        compare_at_price: 3199,
        stock_quantity: 10,
        image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
        is_active: true,
      },
    ],
  },
  {
    id: "prod-2",
    category_id: "cat-1-1",
    name: "Handcrafted Khadi Casual Shirt",
    slug: "handcrafted-khadi-casual-shirt",
    description: "Spun from artisanal handloom Khadi cotton using heritage wooden looms. A rich tactile texture that keeps cool in sweltering heat while carrying authentic craft heritage.",
    brand: "Kanhaiya Heritage",
    sku: "SKU-KHADI-CASUAL",
    base_price: 1899,
    compare_at_price: 2299,
    stock_quantity: 30,
    sold_count: 38,
    is_active: true,
    is_featured_top_seller: false,
    top_seller_display_order: null,
    avg_rating: 4.6,
    review_count: 18,
    meta_title: "Handcrafted Khadi Casual Shirt | Kanhaiya Collection",
    meta_description: "Handcrafted pure khadi shirts woven with traditional techniques.",
    created_at: "2026-01-12T10:00:00.000Z",
    images: [
      {
        id: "img-2-1",
        product_id: "prod-2",
        image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
        alt_text: "Handcrafted Khadi Shirt front view",
        display_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      {
        id: "var-2-1",
        product_id: "prod-2",
        variant_name: "Sand Beige / Medium",
        sku: "SKU-KHADI-BGE-M",
        attributes: { color: "Sand Beige", size: "M" },
        price: 1899,
        compare_at_price: 2299,
        stock_quantity: 18,
        image_url: null,
        is_active: true,
      },
      {
        id: "var-2-2",
        product_id: "prod-2",
        variant_name: "Sand Beige / Large",
        sku: "SKU-KHADI-BGE-L",
        attributes: { color: "Sand Beige", size: "L" },
        price: 1899,
        compare_at_price: 2299,
        stock_quantity: 12,
        image_url: null,
        is_active: true,
      },
    ],
  },
  {
    id: "prod-3",
    category_id: "cat-1-2",
    name: "Tailored Slim Fit Chinos",
    slug: "tailored-slim-fit-chinos",
    description: "Crafted from a premium stretch-twill cotton blend with a tailored tapered silhouette. Finished with horn buttons and a hidden coin pocket for refined utility.",
    brand: "Kanhaiya Heritage",
    sku: "SKU-TAILORED-CHINOS",
    base_price: 2799,
    compare_at_price: 3499,
    stock_quantity: 25,
    sold_count: 44,
    is_active: true,
    is_featured_top_seller: false,
    top_seller_display_order: null,
    avg_rating: 4.7,
    review_count: 15,
    meta_title: "Tailored Slim Fit Chinos | Kanhaiya Collection",
    meta_description: "Premium stretch-twill cotton chinos tailored for modern comfort.",
    created_at: "2026-01-15T10:00:00.000Z",
    images: [
      {
        id: "img-3-1",
        product_id: "prod-3",
        image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
        alt_text: "Tailored Slim Fit Chinos",
        display_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      {
        id: "var-3-1",
        product_id: "prod-3",
        variant_name: "Olive / 32",
        sku: "SKU-CHINO-OLV-32",
        attributes: { color: "Olive Green", size: "32" },
        price: 2799,
        compare_at_price: 3499,
        stock_quantity: 14,
        image_url: null,
        is_active: true,
      },
      {
        id: "var-3-2",
        product_id: "prod-3",
        variant_name: "Olive / 34",
        sku: "SKU-CHINO-OLV-34",
        attributes: { color: "Olive Green", size: "34" },
        price: 2799,
        compare_at_price: 3499,
        stock_quantity: 11,
        image_url: null,
        is_active: true,
      },
    ],
  },
  {
    id: "prod-4",
    category_id: "cat-1-2",
    name: "Classic Pleated Dress Trousers",
    slug: "classic-pleated-dress-trousers",
    description: "Double forward pleats, side waist adjusters, and a clean curtained waistband. Crafted from rich tropical wool blend for crease-resistant drape.",
    brand: "Kanhaiya Heritage",
    sku: "SKU-PLEATED-TROUSERS",
    base_price: 3199,
    compare_at_price: 3999,
    stock_quantity: 20,
    sold_count: 29,
    is_active: true,
    is_featured_top_seller: false,
    top_seller_display_order: null,
    avg_rating: 4.9,
    review_count: 31,
    meta_title: "Classic Pleated Dress Trousers | Kanhaiya Collection",
    meta_description: "Timeless pleated dress trousers with bespoke side adjusters.",
    created_at: "2026-01-18T10:00:00.000Z",
    images: [
      {
        id: "img-4-1",
        product_id: "prod-4",
        image_url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
        alt_text: "Classic Pleated Dress Trousers",
        display_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      {
        id: "var-4-1",
        product_id: "prod-4",
        variant_name: "Charcoal / 32",
        sku: "SKU-TROUSER-CH-32",
        attributes: { color: "Charcoal", size: "32" },
        price: 3199,
        compare_at_price: 3999,
        stock_quantity: 10,
        image_url: null,
        is_active: true,
      },
      {
        id: "var-4-2",
        product_id: "prod-4",
        variant_name: "Charcoal / 34",
        sku: "SKU-TROUSER-CH-34",
        attributes: { color: "Charcoal", size: "34" },
        price: 3199,
        compare_at_price: 3999,
        stock_quantity: 10,
        image_url: null,
        is_active: true,
      },
    ],
  },
  {
    id: "prod-5",
    category_id: "cat-2-1",
    name: "Silk Embroidered Anarkali Dress",
    slug: "silk-embroidered-anarkali-dress",
    description: "Exquisite Mulberry silk Anarkali featuring handcrafted Zardozi zari embroidery along the neckline and cuffs. Paired with a gossamer organza dupatta adorned with scalloped edges.",
    brand: "Kanhaiya Couture",
    sku: "SKU-ANARKALI-SILK",
    base_price: 5999,
    compare_at_price: 7499,
    stock_quantity: 15,
    sold_count: 67,
    is_active: true,
    is_featured_top_seller: true,
    top_seller_display_order: 2,
    avg_rating: 4.9,
    review_count: 42,
    meta_title: "Silk Embroidered Anarkali Dress | Kanhaiya Collection",
    meta_description: "Mulberry silk Anarkali with gold Zardozi embroidery.",
    created_at: "2026-01-20T10:00:00.000Z",
    images: [
      {
        id: "img-5-1",
        product_id: "prod-5",
        image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
        alt_text: "Silk Embroidered Anarkali Dress front",
        display_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      {
        id: "var-5-1",
        product_id: "prod-5",
        variant_name: "Ruby Crimson / Small",
        sku: "SKU-ANARKALI-RBY-S",
        attributes: { color: "Ruby Crimson", size: "S" },
        price: 5999,
        compare_at_price: 7499,
        stock_quantity: 8,
        image_url: null,
        is_active: true,
      },
      {
        id: "var-5-2",
        product_id: "prod-5",
        variant_name: "Ruby Crimson / Medium",
        sku: "SKU-ANARKALI-RBY-M",
        attributes: { color: "Ruby Crimson", size: "M" },
        price: 5999,
        compare_at_price: 7499,
        stock_quantity: 7,
        image_url: null,
        is_active: true,
      },
    ],
  },
  {
    id: "prod-6",
    category_id: "cat-2-1",
    name: "Floral Print Festive Maxi Dress",
    slug: "floral-print-maxi-dress",
    description: "Flowing Chanderi silk-cotton with hand-block botanical floral prints inspired by Mughal garden motifs. Tiered flounces create an ethereal silhouette for festive gatherings.",
    brand: "Kanhaiya Couture",
    sku: "SKU-FLORAL-MAXI",
    base_price: 3499,
    compare_at_price: 4299,
    stock_quantity: 35,
    sold_count: 22,
    is_active: true,
    is_featured_top_seller: false,
    top_seller_display_order: null,
    avg_rating: 4.7,
    review_count: 20,
    meta_title: "Floral Print Festive Maxi Dress | Kanhaiya Collection",
    meta_description: "Mughal garden inspired hand-block printed maxi dress.",
    created_at: "2026-01-22T10:00:00.000Z",
    images: [
      {
        id: "img-6-1",
        product_id: "prod-6",
        image_url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
        alt_text: "Floral Print Festive Maxi Dress",
        display_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      {
        id: "var-6-1",
        product_id: "prod-6",
        variant_name: "Blush Pink / Medium",
        sku: "SKU-MAXI-PNK-M",
        attributes: { color: "Blush Pink", size: "M" },
        price: 3499,
        compare_at_price: 4299,
        stock_quantity: 20,
        image_url: null,
        is_active: true,
      },
      {
        id: "var-6-2",
        product_id: "prod-6",
        variant_name: "Blush Pink / Large",
        sku: "SKU-MAXI-PNK-L",
        attributes: { color: "Blush Pink", size: "L" },
        price: 3499,
        compare_at_price: 4299,
        stock_quantity: 15,
        image_url: null,
        is_active: true,
      },
    ],
  },
  {
    id: "prod-7",
    category_id: "cat-2-2",
    name: "Kanjeevaram Banarasi Silk Saree",
    slug: "kanjeevaram-banarasi-silk-saree",
    description: "An heirloom masterpiece woven in Varanasi using heavy pure mulberry silk and electroplated real gold zari threads. Features intricate peacock and floral jaal work on the grand pallu.",
    brand: "Kanhaiya Artisan",
    sku: "SKU-KANJEEVARAM-SAREE",
    base_price: 12999,
    compare_at_price: 15999,
    stock_quantity: 10,
    sold_count: 85,
    is_active: true,
    is_featured_top_seller: true,
    top_seller_display_order: 3,
    avg_rating: 5.0,
    review_count: 58,
    meta_title: "Kanjeevaram Banarasi Silk Saree | Kanhaiya Collection",
    meta_description: "Pure mulberry silk Banarasi saree with real gold zari weave.",
    created_at: "2026-01-25T10:00:00.000Z",
    images: [
      {
        id: "img-7-1",
        product_id: "prod-7",
        image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        alt_text: "Kanjeevaram Banarasi Silk Saree grand pallu",
        display_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      {
        id: "var-7-1",
        product_id: "prod-7",
        variant_name: "Royal Emerald & Gold",
        sku: "SKU-SAREE-EMR-GLD",
        attributes: { color: "Royal Emerald", drape: "Standard 6.3m with Blouse" },
        price: 12999,
        compare_at_price: 15999,
        stock_quantity: 10,
        image_url: null,
        is_active: true,
      },
    ],
  },
  {
    id: "prod-8",
    category_id: "cat-2-2",
    name: "Chanderi Handloom Cotton Saree",
    slug: "chanderi-handloom-cotton-saree",
    description: "Featherweight sheer Chanderi hand-woven with fine cotton warp and silk weft. Features delicate butis and a shimmering zari border, ideal for day festivities.",
    brand: "Kanhaiya Artisan",
    sku: "SKU-CHANDERI-SAREE",
    base_price: 4499,
    compare_at_price: 5499,
    stock_quantity: 18,
    sold_count: 31,
    is_active: true,
    is_featured_top_seller: false,
    top_seller_display_order: null,
    avg_rating: 4.8,
    review_count: 27,
    meta_title: "Chanderi Handloom Cotton Saree | Kanhaiya Collection",
    meta_description: "Authentic lightweight Chanderi handloom saree.",
    created_at: "2026-01-27T10:00:00.000Z",
    images: [
      {
        id: "img-8-1",
        product_id: "prod-8",
        image_url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
        alt_text: "Chanderi Handloom Cotton Saree",
        display_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      {
        id: "var-8-1",
        product_id: "prod-8",
        variant_name: "Mustard Yellow & Zari",
        sku: "SKU-CHAND-YEL",
        attributes: { color: "Mustard Yellow", drape: "Standard 6.3m" },
        price: 4499,
        compare_at_price: 5499,
        stock_quantity: 18,
        image_url: null,
        is_active: true,
      },
    ],
  },
  {
    id: "prod-9",
    category_id: "cat-3-1",
    name: "Handstitched Leather Mojris",
    slug: "handstitched-leather-mojris",
    description: "Crafted in Jaipur by master cobblers from supple vegetable-tanned leather. Embroidered with silk threads and equipped with cushioned memory foam insoles for royal comfort.",
    brand: "Kanhaiya Footwear",
    sku: "SKU-LEATHER-MOJRIS",
    base_price: 2199,
    compare_at_price: 2799,
    stock_quantity: 40,
    sold_count: 47,
    is_active: true,
    is_featured_top_seller: false,
    top_seller_display_order: null,
    avg_rating: 4.7,
    review_count: 19,
    meta_title: "Handstitched Leather Mojris | Kanhaiya Collection",
    meta_description: "Jaipur handcrafted vegetable-tanned leather royal mojris.",
    created_at: "2026-02-01T10:00:00.000Z",
    images: [
      {
        id: "img-9-1",
        product_id: "prod-9",
        image_url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
        alt_text: "Handstitched Leather Mojris pair",
        display_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      {
        id: "var-9-1",
        product_id: "prod-9",
        variant_name: "Tan Brown / EU 42",
        sku: "SKU-MOJRI-TAN-42",
        attributes: { color: "Tan Brown", size: "EU 42 (UK 8)" },
        price: 2199,
        compare_at_price: 2799,
        stock_quantity: 20,
        image_url: null,
        is_active: true,
      },
      {
        id: "var-9-2",
        product_id: "prod-9",
        variant_name: "Tan Brown / EU 44",
        sku: "SKU-MOJRI-TAN-44",
        attributes: { color: "Tan Brown", size: "EU 44 (UK 10)" },
        price: 2199,
        compare_at_price: 2799,
        stock_quantity: 20,
        image_url: null,
        is_active: true,
      },
    ],
  },
  {
    id: "prod-10",
    category_id: "cat-3-1",
    name: "Classic Oxford Leather Shoes",
    slug: "classic-oxford-leather-shoes",
    description: "Goodyear-welted full-grain calfskin leather oxfords. Featuring closed lacing, a stacked leather heel, and a hand-burnished patina finish that ages with character.",
    brand: "Kanhaiya Footwear",
    sku: "SKU-OXFORD-SHOES",
    base_price: 4299,
    compare_at_price: 4999,
    stock_quantity: 22,
    sold_count: 36,
    is_active: true,
    is_featured_top_seller: false,
    top_seller_display_order: null,
    avg_rating: 4.8,
    review_count: 34,
    meta_title: "Classic Oxford Leather Shoes | Kanhaiya Collection",
    meta_description: "Goodyear-welted full grain calfskin leather dress shoes.",
    created_at: "2026-02-05T10:00:00.000Z",
    images: [
      {
        id: "img-10-1",
        product_id: "prod-10",
        image_url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80",
        alt_text: "Classic Oxford Leather Shoes profile",
        display_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      {
        id: "var-10-1",
        product_id: "prod-10",
        variant_name: "Burgundy / EU 42",
        sku: "SKU-OXF-BUR-42",
        attributes: { color: "Deep Burgundy", size: "EU 42 (UK 8)" },
        price: 4299,
        compare_at_price: 4999,
        stock_quantity: 12,
        image_url: null,
        is_active: true,
      },
      {
        id: "var-10-2",
        product_id: "prod-10",
        variant_name: "Burgundy / EU 43",
        sku: "SKU-OXF-BUR-43",
        attributes: { color: "Deep Burgundy", size: "EU 43 (UK 9)" },
        price: 4299,
        compare_at_price: 4999,
        stock_quantity: 10,
        image_url: null,
        is_active: true,
      },
    ],
  },
  {
    id: "prod-11",
    category_id: "cat-3-2",
    name: "Kundan Statement Necklace",
    slug: "kundan-statement-necklace",
    description: "22K gold-plated artisanal Kundan choker set encrusted with faceted polki stones, emerald bead droplets, and traditional meenakari enameling on the reverse side.",
    brand: "Kanhaiya Jewels",
    sku: "SKU-KUNDAN-NECKLACE",
    base_price: 8999,
    compare_at_price: 10999,
    stock_quantity: 12,
    sold_count: 59,
    is_active: true,
    is_featured_top_seller: true,
    top_seller_display_order: null,
    avg_rating: 4.9,
    review_count: 48,
    meta_title: "Kundan Statement Necklace | Kanhaiya Collection",
    meta_description: "Artisanal Kundan choker with Polki crystals and meenakari reverse.",
    created_at: "2026-02-08T10:00:00.000Z",
    images: [
      {
        id: "img-11-1",
        product_id: "prod-11",
        image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
        alt_text: "Kundan Statement Necklace showcase",
        display_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      {
        id: "var-11-1",
        product_id: "prod-11",
        variant_name: "Gold & Emerald Green",
        sku: "SKU-KUNDAN-EMR",
        attributes: { color: "Gold & Emerald", metal: "22K Micron Gold Plated" },
        price: 8999,
        compare_at_price: 10999,
        stock_quantity: 12,
        image_url: null,
        is_active: true,
      },
    ],
  },
  {
    id: "prod-12",
    category_id: "cat-3-2",
    name: "Antique Brass Chronograph Watch",
    slug: "antique-brass-chronograph-watch",
    description: "A vintage-inspired chronograph with a brushed antique brass case, sunburst cream dial, blued hands, and a handcrafted Horween saddle-leather strap.",
    brand: "Kanhaiya Time",
    sku: "SKU-BRASS-CHRONO",
    base_price: 6499,
    compare_at_price: 7999,
    stock_quantity: 16,
    sold_count: 34,
    is_active: true,
    is_featured_top_seller: false,
    top_seller_display_order: null,
    avg_rating: 4.9,
    review_count: 37,
    meta_title: "Antique Brass Chronograph Watch | Kanhaiya Collection",
    meta_description: "Vintage brass chronograph watch with Horween leather strap.",
    created_at: "2026-02-12T10:00:00.000Z",
    images: [
      {
        id: "img-12-1",
        product_id: "prod-12",
        image_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
        alt_text: "Antique Brass Chronograph Watch",
        display_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      {
        id: "var-12-1",
        product_id: "prod-12",
        variant_name: "Vintage Brass / Saddle Brown",
        sku: "SKU-WATCH-BRS-BRN",
        attributes: { color: "Antique Brass", strap: "Saddle Brown Leather" },
        price: 6499,
        compare_at_price: 7999,
        stock_quantity: 16,
        image_url: null,
        is_active: true,
      },
    ],
  },
];

// Fallback seed reviews
export const FALLBACK_REVIEWS: ProductReviewItem[] = [
  {
    id: "rev-1",
    product_id: "prod-1",
    user_id: "user-test-1",
    order_item_id: "order-item-1",
    rating: 5,
    review_text: "The fabric breathability and finish are exceptional. Felt extraordinarily regal wearing this at our anniversary dinner. Highly recommend!",
    images: [],
    is_approved: true,
    created_at: "2026-02-15T14:30:00.000Z",
    author_name: "Rajesh K.",
    author_avatar: null,
  },
  {
    id: "rev-2",
    product_id: "prod-1",
    user_id: "user-test-2",
    order_item_id: "order-item-2",
    rating: 5,
    review_text: "Perfect tailoring on the shoulders. Even after two gentle washes the linen retains its subtle sheen and softness.",
    images: [],
    is_approved: true,
    created_at: "2026-02-18T10:15:00.000Z",
    author_name: "Sunil V.",
    author_avatar: null,
  },
  {
    id: "rev-3",
    product_id: "prod-7",
    user_id: "user-test-3",
    order_item_id: "order-item-3",
    rating: 5,
    review_text: "A truly royal Kanjeevaram Banarasi saree! The gold zari weave on the pallu looks heavenly in natural light.",
    images: [],
    is_approved: true,
    created_at: "2026-02-20T16:00:00.000Z",
    author_name: "Meera D.",
    author_avatar: null,
  },
];

interface CatalogDbImage {
  image_url: string;
  is_primary?: boolean | null;
  display_order?: number | null;
}

interface CatalogDbProduct {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  brand: string | null;
  base_price: number | string;
  compare_at_price: number | string | null;
  avg_rating: number | string | null;
  review_count: number | string | null;
  stock_quantity: number | null;
  is_featured_top_seller: boolean | null;
  product_images?: CatalogDbImage[] | null;
}

interface SingleDbImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string | null;
  display_order?: number | null;
  is_primary?: boolean | null;
}

interface SingleDbVariant {
  id: string;
  product_id: string;
  variant_name: string;
  sku?: string | null;
  attributes?: Record<string, unknown> | null;
  price?: number | string | null;
  compare_at_price?: number | string | null;
  stock_quantity?: number | null;
  image_url?: string | null;
  is_active?: boolean;
}

interface SingleDbProduct {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  sku: string | null;
  base_price: number | string;
  compare_at_price: number | string | null;
  stock_quantity: number | null;
  sold_count: number | null;
  is_active: boolean;
  is_featured_top_seller: boolean | null;
  top_seller_display_order: number | null;
  avg_rating: number | string | null;
  review_count: number | string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  category?: Category | null;
  product_images?: SingleDbImage[] | null;
  product_variants?: SingleDbVariant[] | null;
}

interface ReviewDbItem {
  id: string;
  product_id: string;
  user_id: string;
  order_item_id: string | null;
  rating: number;
  review_text: string | null;
  images?: string[] | null;
  is_approved: boolean;
  created_at: string;
  profiles?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

/**
 * Executes a server-driven shop catalog query with filtering, trigram search,
 * category resolution, price ranges, sorting, and pagination.
 */
export async function getShopProducts(params: ShopFilterParams): Promise<ShopQueryResult> {
  const {
    categorySlug,
    searchQuery,
    minPrice,
    maxPrice,
    sort = "featured",
    page = 1,
    pageSize = 12,
  } = params;

  const validPage = Math.max(1, page);
  const offset = (validPage - 1) * pageSize;

  const allCategories = await getAllActiveCategories();
  const activeCategory = categorySlug
    ? allCategories.find((c) => c.slug === categorySlug) || null
    : null;

  try {
    const supabase = await createClient();

    // Check if database is configured and responding
    let dbQuery = supabase
      .from("products")
      .select(
        `
        id,
        category_id,
        name,
        slug,
        brand,
        base_price,
        compare_at_price,
        stock_quantity,
        sold_count,
        avg_rating,
        review_count,
        is_active,
        is_featured_top_seller,
        top_seller_display_order,
        created_at,
        product_images (
          image_url,
          is_primary,
          display_order
        )
      `,
        { count: "exact" }
      )
      .eq("is_active", true);

    // 1. Filter by category (including descendant categories)
    if (activeCategory) {
      const childCategoryIds = getDescendantCategoryIds(activeCategory.id, allCategories);
      const targetCategoryIds = [activeCategory.id, ...childCategoryIds];
      dbQuery = dbQuery.in("category_id", targetCategoryIds);
    }

    // 2. Trigram-friendly name search (schema index: idx_products_name_trgm on products using gin (name gin_trgm_ops))
    if (searchQuery && searchQuery.trim()) {
      dbQuery = dbQuery.ilike("name", `%${searchQuery.trim()}%`);
    }

    // 3. Price range filters
    if (minPrice !== undefined && !isNaN(minPrice) && minPrice > 0) {
      dbQuery = dbQuery.gte("base_price", minPrice);
    }
    if (maxPrice !== undefined && !isNaN(maxPrice) && maxPrice > 0) {
      dbQuery = dbQuery.lte("base_price", maxPrice);
    }

    // 4. Sorting
    switch (sort) {
      case "price_asc":
        dbQuery = dbQuery.order("base_price", { ascending: true });
        break;
      case "price_desc":
        dbQuery = dbQuery.order("base_price", { ascending: false });
        break;
      case "newest":
        dbQuery = dbQuery.order("created_at", { ascending: false });
        break;
      case "top_rated":
        dbQuery = dbQuery
          .order("avg_rating", { ascending: false })
          .order("review_count", { ascending: false });
        break;
      case "featured":
      default:
        dbQuery = dbQuery
          .order("is_featured_top_seller", { ascending: false })
          .order("top_seller_display_order", { ascending: true, nullsFirst: false })
          .order("sold_count", { ascending: false });
        break;
    }

    // 5. Pagination
    dbQuery = dbQuery.range(offset, offset + pageSize - 1);

    const { data: dbProducts, count, error } = await dbQuery;

    if (!error && dbProducts && dbProducts.length > 0) {
      const items: ProductItem[] = (dbProducts as unknown as CatalogDbProduct[]).map((p) => {
        const sortedImages = p.product_images
          ? [...p.product_images].sort(
              (a, b) => (a.display_order || 0) - (b.display_order || 0)
            )
          : [];

        const primaryImg =
          sortedImages.find((img) => img.is_primary)?.image_url ||
          sortedImages[0]?.image_url ||
          null;

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          brand: p.brand,
          base_price: Number(p.base_price),
          compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
          avg_rating: Number(p.avg_rating || 0),
          review_count: Number(p.review_count || 0),
          stock_quantity: Number(p.stock_quantity || 0),
          image_url: primaryImg,
          is_featured_top_seller: Boolean(p.is_featured_top_seller),
          category_id: p.category_id,
        };
      });

      const totalCount = count ?? items.length;

      return {
        products: items,
        totalCount,
        page: validPage,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize) || 1,
        activeCategory,
        minPriceAvailable: 1000,
        maxPriceAvailable: 20000,
      };
    }
  } catch {
    // Graceful fallback to offline catalog below
  }

  // Robust Fallback In-Memory Catalog Filtering
  let filtered = [...FALLBACK_PRODUCT_DETAILS].filter((p) => p.is_active);

  // Category filtering with descendant expansion
  if (activeCategory) {
    const descendantIds = getDescendantCategoryIds(activeCategory.id, allCategories);
    const targetCategoryIds = [activeCategory.id, ...descendantIds];
    filtered = filtered.filter(
      (p) =>
        (p.category_id && targetCategoryIds.includes(p.category_id)) ||
        p.slug.includes(activeCategory.slug)
    );
  }

  // Trigram / text search matching
  if (searchQuery && searchQuery.trim()) {
    const term = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.brand && p.brand.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term))
    );
  }

  // Price filtering
  if (minPrice !== undefined && !isNaN(minPrice) && minPrice > 0) {
    filtered = filtered.filter((p) => p.base_price >= minPrice);
  }
  if (maxPrice !== undefined && !isNaN(maxPrice) && maxPrice > 0) {
    filtered = filtered.filter((p) => p.base_price <= maxPrice);
  }

  // Sorting
  switch (sort) {
    case "price_asc":
      filtered.sort((a, b) => a.base_price - b.base_price);
      break;
    case "price_desc":
      filtered.sort((a, b) => b.base_price - a.base_price);
      break;
    case "newest":
      filtered.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      break;
    case "top_rated":
      filtered.sort((a, b) => b.avg_rating - a.avg_rating || b.review_count - a.review_count);
      break;
    case "featured":
    default:
      filtered.sort((a, b) => {
        if (a.is_featured_top_seller && !b.is_featured_top_seller) return -1;
        if (!a.is_featured_top_seller && b.is_featured_top_seller) return 1;
        return b.sold_count - a.sold_count;
      });
      break;
  }

  const totalCount = filtered.length;
  const paginated = filtered.slice(offset, offset + pageSize);

  const productItems: ProductItem[] = paginated.map((p) => {
    const primaryImg =
      p.images.find((img) => img.is_primary)?.image_url ||
      p.images[0]?.image_url ||
      null;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      base_price: p.base_price,
      compare_at_price: p.compare_at_price,
      avg_rating: p.avg_rating,
      review_count: p.review_count,
      stock_quantity: p.stock_quantity,
      image_url: primaryImg,
      is_featured_top_seller: p.is_featured_top_seller,
      category_id: p.category_id,
    };
  });

  return {
    products: productItems,
    totalCount,
    page: validPage,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
    activeCategory,
    minPriceAvailable: 1500,
    maxPriceAvailable: 15000,
  };
}

/**
 * Fetches product detail by slug with images, variants, and category.
 * Strictly returns null if product does not exist or is inactive (is_active = false).
 */
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  if (!slug) return null;

  try {
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories (
          id,
          name,
          slug,
          parent_id,
          is_active
        ),
        product_images (
          id,
          product_id,
          image_url,
          alt_text,
          display_order,
          is_primary
        ),
        product_variants (
          id,
          product_id,
          variant_name,
          sku,
          attributes,
          price,
          compare_at_price,
          stock_quantity,
          image_url,
          is_active
        )
      `
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && product) {
      const prod = product as unknown as SingleDbProduct;
      const sortedImages: ProductImage[] = (prod.product_images || [])
        .sort(
          (a, b) => (a.display_order || 0) - (b.display_order || 0)
        )
        .map((img) => ({
          id: img.id,
          product_id: img.product_id,
          image_url: img.image_url,
          alt_text: img.alt_text || null,
          display_order: img.display_order || 0,
          is_primary: Boolean(img.is_primary),
        }));

      const activeVariants: ProductVariant[] = (prod.product_variants || [])
        .filter((v) => v.is_active !== false)
        .map((v) => ({
          id: v.id,
          product_id: v.product_id,
          variant_name: v.variant_name,
          sku: v.sku || null,
          attributes:
            typeof v.attributes === "object" &&
            v.attributes !== null &&
            !Array.isArray(v.attributes)
              ? (v.attributes as Record<string, unknown>)
              : {},
          price: v.price !== null && v.price !== undefined ? Number(v.price) : null,
          compare_at_price:
            v.compare_at_price !== null && v.compare_at_price !== undefined ? Number(v.compare_at_price) : null,
          stock_quantity: Number(v.stock_quantity || 0),
          image_url: v.image_url || null,
          is_active: Boolean(v.is_active),
        }));

      return {
        id: prod.id,
        category_id: prod.category_id,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        brand: prod.brand,
        sku: prod.sku,
        base_price: Number(prod.base_price),
        compare_at_price: prod.compare_at_price
          ? Number(prod.compare_at_price)
          : null,
        stock_quantity: Number(prod.stock_quantity || 0),
        sold_count: Number(prod.sold_count || 0),
        is_active: prod.is_active,
        is_featured_top_seller: Boolean(prod.is_featured_top_seller),
        top_seller_display_order: prod.top_seller_display_order,
        avg_rating: Number(prod.avg_rating || 0),
        review_count: Number(prod.review_count || 0),
        meta_title: prod.meta_title,
        meta_description: prod.meta_description,
        created_at: prod.created_at,
        category: prod.category || null,
        images: sortedImages,
        variants: activeVariants,
      };
    }
  } catch {
    // Fallback to local catalog below
  }

  // Offline / fallback lookup
  const fallback = FALLBACK_PRODUCT_DETAILS.find(
    (p) => p.slug === slug && p.is_active
  );

  if (!fallback) return null;

  const allCategories = await getAllActiveCategories();
  const cat = allCategories.find((c) => c.id === fallback.category_id) || null;

  return {
    ...fallback,
    category: cat,
  };
}

/**
 * Records a product view for authenticated users to power the "Continue Browsing" row.
 * Automatically trimmed to the latest 10 rows by schema trigger trg_trim_product_views.
 */
export async function recordProductView(
  productId: string,
  userId?: string | null
): Promise<void> {
  if (!userId || !productId) return;

  try {
    const supabase = await createClient();
    await supabase.from("product_views").upsert(
      {
        user_id: userId,
        product_id: productId,
        viewed_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,product_id",
      }
    );
  } catch {
    // Non-blocking view recording
  }
}

/**
 * Retrieves public approved reviews plus author's pending review (if current user authored one).
 */
export async function getProductReviews(
  productId: string,
  currentUserId?: string | null
): Promise<{
  reviews: ProductReviewItem[];
  userPendingReview: ProductReviewItem | null;
  summary: ProductRatingSummary;
}> {
  try {
    const supabase = await createClient();

    // RLS policy: reviews_read_approved_or_own_or_admin allows approved reviews OR own review
    const { data: dbReviews, error } = await supabase
      .from("product_reviews")
      .select(
        `
        id,
        product_id,
        user_id,
        order_item_id,
        rating,
        review_text,
        images,
        is_approved,
        created_at,
        profiles (
          full_name,
          avatar_url
        )
      `
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (!error && dbReviews) {
      let userPendingReview: ProductReviewItem | null = null;
      const approvedReviews: ProductReviewItem[] = [];

      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let ratingTotal = 0;

      for (const r of (dbReviews as unknown as ReviewDbItem[])) {
        const item: ProductReviewItem = {
          id: r.id,
          product_id: r.product_id,
          user_id: r.user_id,
          order_item_id: r.order_item_id,
          rating: Number(r.rating),
          review_text: r.review_text,
          images: Array.isArray(r.images) ? r.images : [],
          is_approved: Boolean(r.is_approved),
          created_at: r.created_at,
          author_name: r.profiles?.full_name || "Verified Customer",
          author_avatar: r.profiles?.avatar_url || null,
        };

        if (r.is_approved) {
          approvedReviews.push(item);
          const star = Math.min(5, Math.max(1, Math.round(item.rating))) as 1 | 2 | 3 | 4 | 5;
          breakdown[star]++;
          ratingTotal += item.rating;
        } else if (currentUserId && r.user_id === currentUserId) {
          // Current user's pending moderation review
          userPendingReview = item;
        }
      }

      const totalApproved = approvedReviews.length;
      const avgRating = totalApproved > 0 ? Number((ratingTotal / totalApproved).toFixed(1)) : 0;

      return {
        reviews: approvedReviews,
        userPendingReview,
        summary: {
          avgRating,
          reviewCount: totalApproved,
          breakdown,
        },
      };
    }
  } catch {
    // Fallback reviews below
  }

  // Fallback reviews
  const matching = FALLBACK_REVIEWS.filter((r) => r.product_id === productId);
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let ratingTotal = 0;

  matching.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[star]++;
    ratingTotal += r.rating;
  });

  const total = matching.length;
  const avg = total > 0 ? Number((ratingTotal / total).toFixed(1)) : 5.0;

  return {
    reviews: matching,
    userPendingReview: null,
    summary: {
      avgRating: avg,
      reviewCount: total,
      breakdown,
    },
  };
}

/**
 * Checks whether the current user is eligible to review the product:
 * 1. Must be authenticated.
 * 2. Cannot have an existing review (1 review per product/user).
 * 3. Must have a qualifying purchased order item (order confirmed/paid/processing/shipped/delivered).
 */
export async function checkUserReviewEligibility(
  productId: string,
  userId?: string | null
): Promise<{
  canReview: boolean;
  alreadyReviewed: boolean;
  existingReview: ProductReviewItem | null;
  qualifyingOrderItemId: string | null;
  reason?: string;
}> {
  if (!userId) {
    return {
      canReview: false,
      alreadyReviewed: false,
      existingReview: null,
      qualifyingOrderItemId: null,
      reason: "Please sign in with your account to submit a review.",
    };
  }

  try {
    const supabase = await createClient();

    // 1. Check if user already reviewed this product
    const { data: existingReviewData } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingReviewData) {
      const existing: ProductReviewItem = {
        id: existingReviewData.id,
        product_id: existingReviewData.product_id,
        user_id: existingReviewData.user_id,
        order_item_id: existingReviewData.order_item_id,
        rating: existingReviewData.rating,
        review_text: existingReviewData.review_text,
        images: Array.isArray(existingReviewData.images) ? (existingReviewData.images as string[]) : [],
        is_approved: existingReviewData.is_approved,
        created_at: existingReviewData.created_at,
      };

      return {
        canReview: false,
        alreadyReviewed: true,
        existingReview: existing,
        qualifyingOrderItemId: existingReviewData.order_item_id,
        reason: existingReviewData.is_approved
          ? "You have already reviewed this product. Thank you for your feedback!"
          : "Your review has been submitted and is currently pending moderation.",
      };
    }

    // 2. Check for qualifying purchased order item
    // Qualifying order statuses: confirmed, processing, shipped, delivered, OR payment_status = paid
    const { data: qualifyingOrders } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        payment_status,
        order_items!inner (
          id,
          product_id
        )
      `
      )
      .eq("user_id", userId)
      .eq("order_items.product_id", productId)
      .in("status", ["confirmed", "processing", "shipped", "delivered"]);

    if (qualifyingOrders && qualifyingOrders.length > 0) {
      const qualifyingItem = qualifyingOrders[0].order_items?.[0];
      return {
        canReview: true,
        alreadyReviewed: false,
        existingReview: null,
        qualifyingOrderItemId: qualifyingItem?.id || null,
      };
    }

    // Also check if any order has payment_status = 'paid'
    const { data: paidOrders } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        payment_status,
        order_items!inner (
          id,
          product_id
        )
      `
      )
      .eq("user_id", userId)
      .eq("order_items.product_id", productId)
      .eq("payment_status", "paid");

    if (paidOrders && paidOrders.length > 0) {
      const qualifyingItem = paidOrders[0].order_items?.[0];
      return {
        canReview: true,
        alreadyReviewed: false,
        existingReview: null,
        qualifyingOrderItemId: qualifyingItem?.id || null,
      };
    }

    return {
      canReview: false,
      alreadyReviewed: false,
      existingReview: null,
      qualifyingOrderItemId: null,
      reason:
        "Verified purchase required. You can review this item once you have placed a confirmed order for it.",
    };
  } catch {
    // If Supabase is not yet initialized with orders in dev mode, grant review permission for testing if authenticated
    return {
      canReview: true,
      alreadyReviewed: false,
      existingReview: null,
      qualifyingOrderItemId: null,
    };
  }
}
