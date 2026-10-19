/**
 * Central Mock Data Service for Kanhaiya Collection Admin Suite
 * Implements schema ecomm.txt exactly for Categories, Products, Product Images, and Product Variants.
 * Provides realistic offline development records, client-side localStorage persistence,
 * dynamic date-range calculations, and reset-to-demo-data functionality.
 */

// -----------------------------------------------------------------------------
// SCHEMA-ALIGNED INTERFACES (Matching schema ecomm.txt)
// -----------------------------------------------------------------------------

export interface MockCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  show_on_homepage: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface MockProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  sku: string | null;
  attributes: Record<string, string>;
  price: number | null;
  compare_at_price: number | null;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockProductDetail {
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
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  category?: MockCategory | null;
  images: MockProductImage[];
  variants: MockProductVariant[];
  /**
   * Development model batch identifier.
   * NOTE: Clearly separate from PostgreSQL database schema (which has no batch_number column).
   * Flagged for persistent database migration approval.
   */
  batch_number?: string | null;
}

// Backward-compatible alias
export type MockProduct = MockProductDetail;

import type {
  OrderStatus,
  PaymentStatus,
  AddressSnapshot,
  OrderItemSnapshot,
  OrderCustomerInfo,
  OrderDetails,
} from "@/lib/data/order-types";
import {
  canTransitionOrderStatus,
  canTransitionPaymentStatus,
  VALID_ORDER_TRANSITIONS,
  VALID_PAYMENT_TRANSITIONS,
} from "@/lib/data/order-types";
import type {
  AdminReviewFilterParams,
  AdminReviewStats,
} from "@/lib/data/review-types";

export interface MockAddress {
  id: string;
  user_id: string;
  type: "shipping" | "billing";
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
}

export interface MockOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  image_url?: string | null;
}

export interface MockOrder extends OrderDetails {
  customer_name?: string;
  customer_email?: string;
  total_amount: number;
  items_count: number;
}

export interface MockCustomer {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  orders_count: number;
  total_spent: number;
  joined_at: string;
  created_at: string;
  updated_at?: string;
  status: "active" | "inactive";
  addresses: MockAddress[];
}

export interface MockContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: "new" | "in_progress" | "resolved";
  created_at: string;
  updated_at: string;
}

export interface MockLead {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  source: string | null;
  message: string | null;
  status: "new" | "contacted" | "converted" | "closed";
  created_at: string;
  updated_at: string;
}

export interface MockResponseNote {
  id: string;
  inquiry_id: string;
  entity_type: "contact_submission" | "lead";
  note: string;
  responder: string;
  created_at: string;
}

export interface MockAboutSection {
  id: string;
  heading: string | null;
  subheading: string | null;
  body: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockFaq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockSitePolicy {
  id: string;
  type: "privacy" | "terms" | "cancellation" | "refund" | "shipping" | "return";
  title: string;
  content: string;
  draft_content?: string;
  is_published?: boolean;
  updated_at: string;
}

export interface MockSiteSettings {
  key: string;
  value: Record<string, any>;
  updated_at: string;
}

export interface MockActivity {
  id: string;
  title: string;
  description: string;
  type: "order" | "customer" | "stock" | "inquiry" | "review";
  timestamp: string;
}

export interface MockNotification {
  id: string;
  title: string;
  message: string;
  type: "order" | "stock" | "inquiry" | "system";
  is_read: boolean;
  created_at: string;
  link?: string;
}

export interface MockReview {
  id: string; // uuid PK
  product_id: string; // uuid FK -> products(id)
  user_id: string; // uuid FK -> profiles(id)
  order_item_id: string | null; // uuid FK -> order_items(id), optional
  rating: number; // smallint NOT NULL, CHECK 1-5
  review_text: string | null;
  images: string[]; // jsonb default '[]'
  is_approved: boolean; // default false
  created_at: string;
}

export interface EnrichedMockReview extends MockReview {
  product_name: string;
  product_slug: string;
  product_image: string | null;
  product_base_price?: number;
  product_stock?: number;
  product_avg_rating?: number;
  product_review_count?: number;
  author_name: string;
  author_email?: string | null;
  author_phone?: string | null;
  author_avatar?: string | null;
  is_verified_purchase: boolean;
  order_id?: string | null;
  order_number?: string | null;
  order_status?: string | null;
  order_placed_at?: string | null;
  variant_name?: string | null;
  unit_price?: number | null;
  quantity?: number | null;
}

export interface MockHomepageSection {
  key: string; // 'banner' | 'shop_by_category' | 'continue_browsing' | 'top_sellers' | 'category_products' | 'wall_of_love'
  is_enabled: boolean;
  display_order: number;
  updated_at: string;
}

export interface MockBanner {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Text-only announcement model for the top ribbon above the website header.
 * NOTE: Stored in development mock store; persistent database schema extension
 * requires later approved migration.
 */
export interface MockAnnouncement {
  id: string;
  text: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Festive campaign model supporting multiple active campaigns, slideshow rotation,
 * custom admin offer descriptions, optional banner images, and selected products.
 * NOTE: Stored in development mock store; persistent database schema extension
 * requires later approved migration.
 */
export interface MockFestiveCampaign {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  product_ids: string[];
  discount_tag?: string | null;
  discount_percent?: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MockTestimonial {
  id: string;
  customer_name: string;
  designation: string | null;
  avatar_url: string | null;
  content: string;
  rating: number | null; // 1-5
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockAdminStore {
  categories: MockCategory[];
  products: MockProductDetail[];
  orders: MockOrder[];
  customers: MockCustomer[];
  contactSubmissions: MockContactSubmission[];
  leads: MockLead[];
  responseNotes: MockResponseNote[];
  activities: MockActivity[];
  notifications: MockNotification[];
  reviews: MockReview[];
  homepageSections: MockHomepageSection[];
  banners: MockBanner[];
  announcements: MockAnnouncement[];
  festiveCampaigns: MockFestiveCampaign[];
  testimonials: MockTestimonial[];
  aboutUsSections: MockAboutSection[];
  faqs: MockFaq[];
  sitePolicies: MockSitePolicy[];
  siteSettings: Record<string, any>;
}

export const STORAGE_KEY = "kanhaiya_admin_mock_store_v7";
export const ADMIN_STORE_STORAGE_KEY = STORAGE_KEY;

// -----------------------------------------------------------------------------
// BASELINE CANONICAL SEED CATEGORIES (3+ Levels of Hierarchy)
// -----------------------------------------------------------------------------

export const SEED_CATEGORIES: MockCategory[] = [
  // Level 1: Root Categories
  {
    id: "cat-idols",
    parent_id: null,
    name: "Idols & Murtis",
    slug: "idols",
    description: "Handcrafted sacred Radha Krishna, Bal Gopal and Ganesha brass idols",
    image_url: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80",
    display_order: 1,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-09-28T10:00:00.000Z",
    updated_at: "2026-09-28T10:00:00.000Z",
  },
  {
    id: "cat-pooja",
    parent_id: null,
    name: "Pooja Essentials",
    slug: "pooja-essentials",
    description: "Pure brass engraved thalis, akhand diyas, ghanti bells and aarti vessels",
    image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80",
    display_order: 2,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-09-29T10:00:00.000Z",
    updated_at: "2026-09-29T10:00:00.000Z",
  },
  {
    id: "cat-aromas",
    parent_id: null,
    name: "Sacred Aromas & Dhoop",
    slug: "sacred-aromas",
    description: "Natural temple chandan, pure cow dung dhoop, sambrani and incense cones",
    image_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
    display_order: 3,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-09-30T10:00:00.000Z",
    updated_at: "2026-09-30T10:00:00.000Z",
  },
  {
    id: "cat-temple-brass",
    parent_id: null,
    name: "Temple Brassware",
    slug: "temple-brassware",
    description: "Heavy cast brass mandir bells, shankh stands and ceremonial kalashes",
    image_url: "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=800&q=80",
    display_order: 4,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-10-01T10:00:00.000Z",
    updated_at: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "cat-decor",
    parent_id: null,
    name: "Mandir Aasans & Textiles",
    slug: "mandir-aasans",
    description: "Pure silk deity robes, handwoven mandir prayer rugs and altar textiles",
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    display_order: 5,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-10-02T10:00:00.000Z",
    updated_at: "2026-10-02T10:00:00.000Z",
  },

  // Level 2: Subcategories
  {
    id: "cat-brass-idols",
    parent_id: "cat-idols",
    name: "Pure Brass Idols",
    slug: "pure-brass-idols",
    description: "Solid cast pure brass deity murtis polished with golden luster",
    image_url: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=600&q=80",
    display_order: 1,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-10-02T11:00:00.000Z",
    updated_at: "2026-10-02T11:00:00.000Z",
  },
  {
    id: "cat-silver-idols",
    parent_id: "cat-idols",
    name: "Silver Plated Idols",
    slug: "silver-plated-idols",
    description: "Electroplated pure silver deity idols for festive gifts and home shrines",
    image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
    display_order: 2,
    is_active: true,
    show_on_homepage: false,
    created_at: "2026-10-02T11:30:00.000Z",
    updated_at: "2026-10-02T11:30:00.000Z",
  },
  {
    id: "cat-diyas",
    parent_id: "cat-pooja",
    name: "Akhand Diyas & Deepams",
    slug: "akhand-diyas",
    description: "Traditional continuous flame lamps with brass bases",
    image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=600&q=80",
    display_order: 1,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-10-02T12:00:00.000Z",
    updated_at: "2026-10-02T12:00:00.000Z",
  },
  {
    id: "cat-thalis",
    parent_id: "cat-pooja",
    name: "Puja Thali Sets",
    slug: "puja-thali-sets",
    description: "Complete ceremonial puja sets with engraved brass accessories",
    image_url: "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=600&q=80",
    display_order: 2,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-10-02T12:30:00.000Z",
    updated_at: "2026-10-02T12:30:00.000Z",
  },
  {
    id: "cat-organic-dhoop",
    parent_id: "cat-aromas",
    name: "Organic Cow Dung Dhoop",
    slug: "organic-dhoop",
    description: "Desi Gir cow dung and Ayurvedic botanical dhoop cones",
    image_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80",
    display_order: 1,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-10-02T13:00:00.000Z",
    updated_at: "2026-10-02T13:00:00.000Z",
  },

  // Level 3: Sub-subcategories (Demonstrates 3+ Level Nesting)
  {
    id: "cat-radha-krishna",
    parent_id: "cat-brass-idols",
    name: "Radha Krishna Murti",
    slug: "radha-krishna-murti",
    description: "Divine Radha Krishna brass statues with flute and crown",
    image_url: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=400&q=80",
    display_order: 1,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-10-03T10:00:00.000Z",
    updated_at: "2026-10-03T10:00:00.000Z",
  },
  {
    id: "cat-laddu-gopal",
    parent_id: "cat-brass-idols",
    name: "Laddu Gopal & Bal Gopal",
    slug: "laddu-gopal-murti",
    description: "Intricately detailed Bal Gopal crawling and blessing idols",
    image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=400&q=80",
    display_order: 2,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-10-03T10:30:00.000Z",
    updated_at: "2026-10-03T10:30:00.000Z",
  },
  {
    id: "cat-glass-diya",
    parent_id: "cat-diyas",
    name: "Glass Chimney Akhand Diya",
    slug: "glass-chimney-diya",
    description: "Windproof borosilicate glass chimney akhand deepam",
    image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=400&q=80",
    display_order: 1,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-10-03T11:00:00.000Z",
    updated_at: "2026-10-03T11:00:00.000Z",
  },
  {
    id: "cat-hanging-diya",
    parent_id: "cat-diyas",
    name: "Mandir Hanging Bell Diya",
    slug: "hanging-bell-diya",
    description: "Ceiling suspension brass chain diyas with ghungroo bells",
    image_url: "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=400&q=80",
    display_order: 2,
    is_active: true,
    show_on_homepage: false,
    created_at: "2026-10-03T11:30:00.000Z",
    updated_at: "2026-10-03T11:30:00.000Z",
  },
  {
    id: "cat-sambrani-cups",
    parent_id: "cat-organic-dhoop",
    name: "Havan Sambrani Cups",
    slug: "sambrani-cups",
    description: "Natural herbal loban and sambrani burning cups for temple sanctity",
    image_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=400&q=80",
    display_order: 1,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-10-03T12:00:00.000Z",
    updated_at: "2026-10-03T12:00:00.000Z",
  },
];

// -----------------------------------------------------------------------------
// BASELINE CANONICAL SEED PRODUCTS WITH IMAGES AND VARIANTS
// -----------------------------------------------------------------------------

export const SEED_PRODUCTS: MockProductDetail[] = [
  {
    id: "prod-1",
    category_id: "cat-radha-krishna",
    name: "Pure Brass Radha Krishna Murti (9 Inch)",
    slug: "pure-brass-radha-krishna-murti-9-inch",
    description:
      "Handcrafted sacred Radha Krishna idol sculpted in pure heavy brass. Adorned with sacred flute, intricate mukut, and sanctified posture.",
    brand: "Kanhaiya Collection",
    sku: "KC-RKM-09",
    batch_number: "BATCH-202609-0001",
    base_price: 4999,
    compare_at_price: 5999,
    stock_quantity: 4, // Low stock warning (< 15)
    sold_count: 38,
    is_active: true,
    is_featured_top_seller: true,
    top_seller_display_order: 1,
    avg_rating: 4.9,
    review_count: 24,
    meta_title: "Pure Brass Radha Krishna Murti (9 Inch) | Kanhaiya Collection",
    meta_description: "Order authentic handcrafted brass Radha Krishna murti for your mandir shrine.",
    created_at: "2026-09-28T12:00:00.000Z",
    updated_at: "2026-10-01T12:00:00.000Z",
    images: [
      {
        id: "img-1-1",
        product_id: "prod-1",
        image_url: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80",
        alt_text: "Front view of pure brass Radha Krishna murti",
        display_order: 1,
        is_primary: true,
        created_at: "2026-09-28T12:00:00.000Z",
      },
      {
        id: "img-1-2",
        product_id: "prod-1",
        image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80",
        alt_text: "Detail of sacred flute and ornamentation",
        display_order: 2,
        is_primary: false,
        created_at: "2026-09-28T12:05:00.000Z",
      },
    ],
    variants: [
      {
        id: "var-1-1",
        product_id: "prod-1",
        variant_name: "Antique Gold / 9 Inch",
        sku: "KC-RKM-09-AG",
        attributes: { size: "9 Inch", finish: "Antique Gold" },
        price: 4999,
        compare_at_price: 5999,
        stock_quantity: 4,
        image_url: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80",
        is_active: true,
        created_at: "2026-09-28T12:00:00.000Z",
        updated_at: "2026-09-28T12:00:00.000Z",
      },
      {
        id: "var-1-2",
        product_id: "prod-1",
        variant_name: "Polished Brass / 12 Inch",
        sku: "KC-RKM-12-PB",
        attributes: { size: "12 Inch", finish: "Polished Brass" },
        price: 7499,
        compare_at_price: 8999,
        stock_quantity: 2,
        image_url: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80",
        is_active: true,
        created_at: "2026-09-28T12:00:00.000Z",
        updated_at: "2026-09-28T12:00:00.000Z",
      },
    ],
  },
  {
    id: "prod-2",
    category_id: "cat-glass-diya",
    name: "Akhand Brass Diya with Borosilicate Glass Chimney",
    slug: "akhand-brass-diya-glass-chimney",
    description:
      "Engineered for steady 24-hour burning. Thermal shock resistant borosilicate glass chimney keeps the holy flame safe from air currents.",
    brand: "Kanhaiya Collection",
    sku: "KC-AKD-01",
    batch_number: "BATCH-202609-0002",
    base_price: 1299,
    compare_at_price: 1599,
    stock_quantity: 8, // Low stock warning (< 15)
    sold_count: 85,
    is_active: true,
    is_featured_top_seller: true,
    top_seller_display_order: 2,
    avg_rating: 4.8,
    review_count: 42,
    meta_title: "Akhand Brass Diya with Borosilicate Glass Chimney | Kanhaiya Collection",
    meta_description: "Order heavy brass akhand diya with steady flame glass chimney.",
    created_at: "2026-09-29T11:00:00.000Z",
    updated_at: "2026-10-02T11:00:00.000Z",
    images: [
      {
        id: "img-2-1",
        product_id: "prod-2",
        image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80",
        alt_text: "Akhand brass diya burning steadily with glass chimney",
        display_order: 1,
        is_primary: true,
        created_at: "2026-09-29T11:00:00.000Z",
      },
    ],
    variants: [
      {
        id: "var-2-1",
        product_id: "prod-2",
        variant_name: "Medium (5.5 Inch)",
        sku: "KC-AKD-01-M",
        attributes: { size: "Medium 5.5 Inch" },
        price: 1299,
        compare_at_price: 1599,
        stock_quantity: 8,
        image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80",
        is_active: true,
        created_at: "2026-09-29T11:00:00.000Z",
        updated_at: "2026-09-29T11:00:00.000Z",
      },
      {
        id: "var-2-2",
        product_id: "prod-2",
        variant_name: "Large (7.5 Inch)",
        sku: "KC-AKD-01-L",
        attributes: { size: "Large 7.5 Inch" },
        price: 1799,
        compare_at_price: 2199,
        stock_quantity: 6,
        image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80",
        is_active: true,
        created_at: "2026-09-29T11:00:00.000Z",
        updated_at: "2026-09-29T11:00:00.000Z",
      },
    ],
  },
  {
    id: "prod-3",
    category_id: "cat-thalis",
    name: "Pure Brass Asthamangala Puja Thali Set (11 Pieces)",
    slug: "brass-asthamangala-puja-thali-set",
    description:
      "Complete ceremonial brass puja thali with embossed Om and Gayatri mantra. Includes ghanti bell, panchamrit loti, aarti diya, and katoris.",
    brand: "Kanhaiya Collection",
    sku: "KC-PTH-11",
    batch_number: "BATCH-202609-0003",
    base_price: 3499,
    compare_at_price: 4299,
    stock_quantity: 12,
    sold_count: 42,
    is_active: true,
    is_featured_top_seller: false,
    top_seller_display_order: null,
    avg_rating: 4.9,
    review_count: 18,
    meta_title: "Pure Brass Asthamangala Puja Thali Set (11 Pieces)",
    meta_description: "11-piece consecrated puja thali set in solid polished brass.",
    created_at: "2026-09-30T10:00:00.000Z",
    updated_at: "2026-10-02T10:00:00.000Z",
    images: [
      {
        id: "img-3-1",
        product_id: "prod-3",
        image_url: "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=800&q=80",
        alt_text: "11 piece brass asthamangala puja thali set arranged for aarti",
        display_order: 1,
        is_primary: true,
        created_at: "2026-09-30T10:00:00.000Z",
      },
    ],
    variants: [
      {
        id: "var-3-1",
        product_id: "prod-3",
        variant_name: "Standard 11-Piece",
        sku: "KC-PTH-11-STD",
        attributes: { configuration: "11 Pieces Standard" },
        price: 3499,
        compare_at_price: 4299,
        stock_quantity: 12,
        image_url: "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=800&q=80",
        is_active: true,
        created_at: "2026-09-30T10:00:00.000Z",
        updated_at: "2026-09-30T10:00:00.000Z",
      },
    ],
  },
  {
    id: "prod-4",
    category_id: "cat-sambrani-cups",
    name: "Natural Loban & Guggal Organic Cow Dung Dhoop Cups",
    slug: "natural-loban-guggal-dhoop-cups",
    description:
      "Handcrafted using indigenous Gir cow dung, camphor, loban resin, and sambrani. Sanctifies temple aura and purifies indoor air.",
    brand: "Kanhaiya Collection",
    sku: "KC-DHP-24",
    batch_number: "BATCH-202609-0004",
    base_price: 349,
    compare_at_price: 449,
    stock_quantity: 120,
    sold_count: 210,
    is_active: true,
    is_featured_top_seller: true,
    top_seller_display_order: 3,
    avg_rating: 4.9,
    review_count: 85,
    meta_title: "Natural Loban & Guggal Organic Cow Dung Dhoop Cups",
    meta_description: "Pure cow dung sambrani dhoop cups for havan and daily mandir aarti.",
    created_at: "2026-10-01T09:00:00.000Z",
    updated_at: "2026-10-03T09:00:00.000Z",
    images: [
      {
        id: "img-4-1",
        product_id: "prod-4",
        image_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
        alt_text: "Organic dhoop cups filled with pure loban resin",
        display_order: 1,
        is_primary: true,
        created_at: "2026-10-01T09:00:00.000Z",
      },
    ],
    variants: [
      {
        id: "var-4-1",
        product_id: "prod-4",
        variant_name: "Pack of 24 Cups",
        sku: "KC-DHP-24-BOX",
        attributes: { quantity: "24 Cups" },
        price: 349,
        compare_at_price: 449,
        stock_quantity: 80,
        image_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
        is_active: true,
        created_at: "2026-10-01T09:00:00.000Z",
        updated_at: "2026-10-01T09:00:00.000Z",
      },
      {
        id: "var-4-2",
        product_id: "prod-4",
        variant_name: "Family Pack of 48 Cups",
        sku: "KC-DHP-48-BOX",
        attributes: { quantity: "48 Cups" },
        price: 649,
        compare_at_price: 799,
        stock_quantity: 40,
        image_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
        is_active: true,
        created_at: "2026-10-01T09:00:00.000Z",
        updated_at: "2026-10-01T09:00:00.000Z",
      },
    ],
  },
  {
    id: "prod-5",
    category_id: "cat-temple-brass",
    name: "Heavy Temple Brass Hanging Bell with Garuda Finial",
    slug: "heavy-temple-brass-hanging-bell",
    description:
      "Deeply resonant cast bronze and brass temple bell. High pitch frequency tuned to 432Hz for spiritual meditation and aarti.",
    brand: "Kanhaiya Collection",
    sku: "KC-BEL-05",
    batch_number: "BATCH-202609-0005",
    base_price: 2899,
    compare_at_price: 3499,
    stock_quantity: 7, // Low stock warning (< 15)
    sold_count: 53,
    is_active: true,
    is_featured_top_seller: false,
    top_seller_display_order: null,
    avg_rating: 4.7,
    review_count: 14,
    meta_title: "Heavy Temple Brass Hanging Bell with Garuda Finial",
    meta_description: "Heavy acoustic resonance brass temple bell for home mandir ceiling mount.",
    created_at: "2026-10-02T08:00:00.000Z",
    updated_at: "2026-10-04T08:00:00.000Z",
    images: [
      {
        id: "img-5-1",
        product_id: "prod-5",
        image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
        alt_text: "Solid brass hanging bell with heavy brass suspension link",
        display_order: 1,
        is_primary: true,
        created_at: "2026-10-02T08:00:00.000Z",
      },
    ],
    variants: [
      {
        id: "var-5-1",
        product_id: "prod-5",
        variant_name: "4 Inch / 1.2 Kg",
        sku: "KC-BEL-04-12",
        attributes: { weight: "1.2 Kg", size: "4 Inch" },
        price: 2899,
        compare_at_price: 3499,
        stock_quantity: 7,
        image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
        is_active: true,
        created_at: "2026-10-02T08:00:00.000Z",
        updated_at: "2026-10-02T08:00:00.000Z",
      },
    ],
  },
  {
    id: "prod-6",
    category_id: "cat-decor",
    name: "Handcrafted Zari Embroidered Silk Mandir Aasan (Pack of 2)",
    slug: "zari-embroidered-silk-mandir-aasan",
    description:
      "Pure Banarasi silk altar cloth featuring golden zari border and peacock feather motifs. Ideal seat for Laddu Gopal and deity idols.",
    brand: "Kanhaiya Collection",
    sku: "KC-ASN-02",
    batch_number: "BATCH-202609-0006",
    base_price: 899,
    compare_at_price: 1199,
    stock_quantity: 35,
    sold_count: 94,
    is_active: true,
    is_featured_top_seller: false,
    top_seller_display_order: null,
    avg_rating: 4.8,
    review_count: 29,
    meta_title: "Handcrafted Zari Embroidered Silk Mandir Aasan",
    meta_description: "Rich Banarasi silk aasan for temple shrine and deity seats.",
    created_at: "2026-10-03T07:00:00.000Z",
    updated_at: "2026-10-04T07:00:00.000Z",
    images: [
      {
        id: "img-6-1",
        product_id: "prod-6",
        image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        alt_text: "Golden yellow and crimson Banarasi silk deity aasans",
        display_order: 1,
        is_primary: true,
        created_at: "2026-10-03T07:00:00.000Z",
      },
    ],
    variants: [
      {
        id: "var-6-1",
        product_id: "prod-6",
        variant_name: "Pitambari Yellow / 12x12 Inch",
        sku: "KC-ASN-02-YL",
        attributes: { color: "Pitambari Yellow", dimensions: "12x12 Inch" },
        price: 899,
        compare_at_price: 1199,
        stock_quantity: 20,
        image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        is_active: true,
        created_at: "2026-10-03T07:00:00.000Z",
        updated_at: "2026-10-03T07:00:00.000Z",
      },
      {
        id: "var-6-2",
        product_id: "prod-6",
        variant_name: "Sinduri Red / 12x12 Inch",
        sku: "KC-ASN-02-RD",
        attributes: { color: "Sinduri Red", dimensions: "12x12 Inch" },
        price: 899,
        compare_at_price: 1199,
        stock_quantity: 15,
        image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        is_active: true,
        created_at: "2026-10-03T07:00:00.000Z",
        updated_at: "2026-10-03T07:00:00.000Z",
      },
    ],
  },
];

// Baseline Orders (Covering all 7 order statuses & 4 payment statuses with line items and address snapshots)
export const SEED_ORDERS: MockOrder[] = [
  {
    id: "ord-1",
    user_id: "cust-1",
    order_number: "KC-ORD-2026-8812",
    status: "pending",
    payment_status: "pending",
    payment_method: "UPI (Google Pay)",
    razorpay_order_id: null,
    razorpay_payment_id: null,
    razorpay_signature: null,
    subtotal: 6097,
    discount: 200,
    shipping_fee: 0,
    tax: 0,
    total: 5897,
    total_amount: 5897,
    items_count: 2,
    customer_name: "Rajeshwar Sharma",
    customer_email: "rajeshwar.sharma@example.com",
    placed_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    can_cancel: true,
    shipping_address: {
      full_name: "Rajeshwar Sharma",
      phone: "+91 98765 43210",
      address_line1: "B-14, Shivalik Enclave, Malviya Nagar",
      address_line2: "Near Gaurav Tower",
      city: "Jaipur",
      state: "Rajasthan",
      postal_code: "302017",
      country: "India",
      type: "shipping",
    },
    billing_address: {
      full_name: "Rajeshwar Sharma",
      phone: "+91 98765 43210",
      address_line1: "B-14, Shivalik Enclave, Malviya Nagar",
      address_line2: "Near Gaurav Tower",
      city: "Jaipur",
      state: "Rajasthan",
      postal_code: "302017",
      country: "India",
      type: "billing",
    },
    customer: {
      id: "cust-1",
      full_name: "Rajeshwar Sharma",
      email: "rajeshwar.sharma@example.com",
      phone: "+91 98765 43210",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    items: [
      {
        id: "item-1-1",
        order_id: "ord-1",
        product_id: "prod-3",
        variant_id: "var-3-1",
        product_name: "Akhand Jyoti Brass Diya (Heavy Quality)",
        variant_name: "Medium 7 Inch / Brass",
        unit_price: 1299,
        quantity: 2,
        subtotal: 2598,
        image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "item-1-2",
        order_id: "ord-1",
        product_id: "prod-4",
        variant_id: "var-4-1",
        product_name: "Royal Engraved Brass Pooja Thali Set (11 Pieces)",
        variant_name: "Standard 12 Inch / 11 Pieces",
        unit_price: 3499,
        quantity: 1,
        subtotal: 3499,
        image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "ord-pending-2",
    user_id: "cust-3",
    order_number: "KC-ORD-2026-8815",
    status: "pending",
    payment_status: "paid",
    payment_method: "UPI (PhonePe)",
    razorpay_order_id: "order_KnhYp991001",
    razorpay_payment_id: "pay_KnzLm110022",
    razorpay_signature: "c4b3a210fedcba987654321a98f7e6d5",
    subtotal: 4250,
    discount: 351,
    shipping_fee: 0,
    tax: 0,
    total: 3899,
    total_amount: 3899,
    items_count: 1,
    customer_name: "Meera Iyer",
    customer_email: "meera.iyer@example.com",
    placed_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    can_cancel: true,
    shipping_address: {
      full_name: "Meera Iyer",
      phone: "+91 94481 29480",
      address_line1: "42/3, 8th Cross, Temple Road, Malleshwaram",
      address_line2: "Near Venugopal Temple",
      city: "Bangalore",
      state: "Karnataka",
      postal_code: "560003",
      country: "India",
      type: "shipping",
    },
    billing_address: null,
    customer: {
      id: "cust-3",
      full_name: "Meera Iyer",
      email: "meera.iyer@example.com",
      phone: "+91 94481 29480",
      avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    },
    items: [
      {
        id: "item-pend-2-1",
        order_id: "ord-pending-2",
        product_id: "prod-2",
        variant_id: "var-2-1",
        product_name: "Handcrafted Brass Laddu Gopal Murti (Gold Finish)",
        variant_name: "Size 4 (4.5 Inch) / 850 grams",
        unit_price: 3899,
        quantity: 1,
        subtotal: 3899,
        image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "ord-pending-3",
    user_id: "cust-4",
    order_number: "KC-ORD-2026-8818",
    status: "pending",
    payment_status: "pending",
    payment_method: "Net Banking (SBI)",
    razorpay_order_id: null,
    razorpay_payment_id: null,
    razorpay_signature: null,
    subtotal: 1996,
    discount: 0,
    shipping_fee: 50,
    tax: 0,
    total: 2046,
    total_amount: 2046,
    items_count: 4,
    customer_name: "Amitabh Singhania",
    customer_email: "amitabh.singhania@example.com",
    placed_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    can_cancel: true,
    shipping_address: {
      full_name: "Amitabh Singhania",
      phone: "+91 91234 56789",
      address_line1: "K-18, Assi Ghat Road, Shivala",
      address_line2: "Opposite Anandmayee Ashram",
      city: "Varanasi",
      state: "Uttar Pradesh",
      postal_code: "221005",
      country: "India",
      type: "shipping",
    },
    billing_address: null,
    customer: {
      id: "cust-4",
      full_name: "Amitabh Singhania",
      email: "amitabh.singhania@example.com",
      phone: "+91 91234 56789",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    },
    items: [
      {
        id: "item-pend-3-1",
        order_id: "ord-pending-3",
        product_id: "prod-5",
        variant_id: "var-5-1",
        product_name: "Pure Gir Cow Dung Organic Dhoop Cones (Pack of 50)",
        variant_name: "Pack of 50 Cones / Hawan Herbs",
        unit_price: 499,
        quantity: 4,
        subtotal: 1996,
        image_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "ord-2",
    user_id: "cust-2",
    order_number: "KC-ORD-2026-8809",
    status: "confirmed",
    payment_status: "paid",
    payment_method: "Credit Card (HDFC Visa)",
    razorpay_order_id: "order_KnhYp982341",
    razorpay_payment_id: "pay_KnzLm091823",
    razorpay_signature: "a98f7e6d5c4b3a210fedcba987654321",
    subtotal: 1899,
    discount: 600,
    shipping_fee: 0,
    tax: 0,
    total: 1299,
    total_amount: 1299,
    items_count: 1,
    customer_name: "Pooja Varma",
    customer_email: "pooja.varma@example.com",
    placed_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    can_cancel: false,
    shipping_address: {
      full_name: "Pooja Varma",
      phone: "+91 98112 23344",
      address_line1: "Flat 402, Lotus Grandeur, Gomti Nagar",
      address_line2: "Opposite Wave Mall",
      city: "Lucknow",
      state: "Uttar Pradesh",
      postal_code: "226010",
      country: "India",
      type: "shipping",
    },
    billing_address: null,
    customer: {
      id: "cust-2",
      full_name: "Pooja Varma",
      email: "pooja.varma@example.com",
      phone: "+91 98112 23344",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    items: [
      {
        id: "item-2-1",
        order_id: "ord-2",
        product_id: "prod-3",
        variant_id: "var-3-2",
        product_name: "Akhand Jyoti Brass Diya (Heavy Quality)",
        variant_name: "Large 9.5 Inch / Brass",
        unit_price: 1899,
        quantity: 1,
        subtotal: 1899,
        image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "ord-3",
    user_id: "cust-5",
    order_number: "KC-ORD-2026-8795",
    status: "processing",
    payment_status: "paid",
    payment_method: "Net Banking (SBI)",
    razorpay_order_id: "order_KnhYp774411",
    razorpay_payment_id: "pay_KnzLm552233",
    razorpay_signature: "e5d4c3b2a10fedcba987654321098765",
    subtotal: 3499,
    discount: 0,
    shipping_fee: 0,
    tax: 0,
    total: 3499,
    total_amount: 3499,
    items_count: 1,
    customer_name: "Amitabh Sen",
    customer_email: "amitabh.sen@example.com",
    placed_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    can_cancel: false,
    shipping_address: {
      full_name: "Amitabh Sen",
      phone: "+91 98301 44556",
      address_line1: "45/2 Southern Avenue, Lake Market",
      address_line2: "Flat 3A, Heritage Heights",
      city: "Kolkata",
      state: "West Bengal",
      postal_code: "700029",
      country: "India",
      type: "shipping",
    },
    billing_address: null,
    customer: {
      id: "cust-5",
      full_name: "Amitabh Sen",
      email: "amitabh.sen@example.com",
      phone: "+91 98301 44556",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    },
    items: [
      {
        id: "item-3-1",
        order_id: "ord-3",
        product_id: "prod-4",
        variant_id: "var-4-1",
        product_name: "Royal Engraved Brass Pooja Thali Set (11 Pieces)",
        variant_name: "Standard 12 Inch / 11 Pieces",
        unit_price: 3499,
        quantity: 1,
        subtotal: 3499,
        image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "ord-4",
    user_id: "cust-4",
    order_number: "KC-ORD-2026-8761",
    status: "shipped",
    payment_status: "paid",
    payment_method: "UPI (PhonePe)",
    razorpay_order_id: "order_KnhYp332211",
    razorpay_payment_id: "pay_KnzLm114477",
    razorpay_signature: "f1e2d3c4b5a60987654321fedcba9876",
    subtotal: 8397,
    discount: 507,
    shipping_fee: 0,
    tax: 0,
    total: 7890,
    total_amount: 7890,
    items_count: 3,
    customer_name: "Kavita Rao",
    customer_email: "kavita.rao@example.com",
    placed_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    can_cancel: false,
    shipping_address: {
      full_name: "Kavita Rao",
      phone: "+91 97654 32109",
      address_line1: "Villa 8, Green Meadows, Banjara Hills",
      address_line2: "Road No. 12",
      city: "Hyderabad",
      state: "Telangana",
      postal_code: "500034",
      country: "India",
      type: "shipping",
    },
    billing_address: null,
    customer: {
      id: "cust-4",
      full_name: "Kavita Rao",
      email: "kavita.rao@example.com",
      phone: "+91 97654 32109",
      avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    },
    items: [
      {
        id: "item-4-1",
        order_id: "ord-4",
        product_id: "prod-2",
        variant_id: "var-2-1",
        product_name: "Bal Gopal Laddu Gopal Brass Murti (Size 5)",
        variant_name: "Ashtadhatu Finish / Size 5",
        unit_price: 2499,
        quantity: 1,
        subtotal: 2499,
        image_url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "item-4-2",
        order_id: "ord-4",
        product_id: "prod-5",
        variant_id: "var-5-1",
        product_name: "Pure Brass Ganesha Idol with Prabhavali",
        variant_name: "Antique Bronze / 10 Inch",
        unit_price: 4999,
        quantity: 1,
        subtotal: 4999,
        image_url: "https://images.unsplash.com/photo-1567591414240-e29124430f9a?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "item-4-3",
        order_id: "ord-4",
        product_id: "prod-6",
        variant_id: "var-6-1",
        product_name: "Embroidered Velvet Pooja Asan Cloth (Set of 2)",
        variant_name: "Pitambari Yellow / 12x12 Inch",
        unit_price: 899,
        quantity: 1,
        subtotal: 899,
        image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "ord-5",
    user_id: "cust-7",
    order_number: "KC-ORD-2026-8720",
    status: "delivered",
    payment_status: "paid",
    payment_method: "UPI (Paytm)",
    razorpay_order_id: "order_KnhYp998877",
    razorpay_payment_id: "pay_KnzLm443322",
    razorpay_signature: "1234567890abcdef1234567890abcdef",
    subtotal: 4999,
    discount: 0,
    shipping_fee: 0,
    tax: 0,
    total: 4999,
    total_amount: 4999,
    items_count: 1,
    customer_name: "Deepak Agarwal",
    customer_email: "deepak.ag@example.com",
    placed_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    can_cancel: false,
    shipping_address: {
      full_name: "Deepak Agarwal",
      phone: "+91 98105 66778",
      address_line1: "D-82, Defence Colony, Third Floor",
      address_line2: "Near Flyover Market",
      city: "New Delhi",
      state: "Delhi",
      postal_code: "110024",
      country: "India",
      type: "shipping",
    },
    billing_address: null,
    customer: {
      id: "cust-7",
      full_name: "Deepak Agarwal",
      email: "deepak.ag@example.com",
      phone: "+91 98105 66778",
      avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
    },
    items: [
      {
        id: "item-5-1",
        order_id: "ord-5",
        product_id: "prod-5",
        variant_id: "var-5-1",
        product_name: "Pure Brass Ganesha Idol with Prabhavali",
        variant_name: "Antique Bronze / 10 Inch",
        unit_price: 4999,
        quantity: 1,
        subtotal: 4999,
        image_url: "https://images.unsplash.com/photo-1567591414240-e29124430f9a?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "ord-6",
    user_id: "cust-6",
    order_number: "KC-ORD-2026-8680",
    status: "delivered",
    payment_status: "paid",
    payment_method: "Debit Card (ICICI)",
    razorpay_order_id: "order_KnhYp556677",
    razorpay_payment_id: "pay_KnzLm998811",
    razorpay_signature: "9876543210fedcba9876543210fedcba",
    subtotal: 3098,
    discount: 0,
    shipping_fee: 50,
    tax: 0,
    total: 3148,
    total_amount: 3148,
    items_count: 2,
    customer_name: "Meenakshi Sundaram",
    customer_email: "meenakshi.s@example.com",
    placed_at: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    can_cancel: false,
    shipping_address: {
      full_name: "Meenakshi Sundaram",
      phone: "+91 98402 77889",
      address_line1: "18 Temple Ring Road, Kapaleeshwarar Nagar",
      address_line2: "Mylapore",
      city: "Chennai",
      state: "Tamil Nadu",
      postal_code: "600004",
      country: "India",
      type: "shipping",
    },
    billing_address: null,
    customer: {
      id: "cust-6",
      full_name: "Meenakshi Sundaram",
      email: "meenakshi.s@example.com",
      phone: "+91 98402 77889",
      avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    },
    items: [
      {
        id: "item-6-1",
        order_id: "ord-6",
        product_id: "prod-2",
        variant_id: "var-2-2",
        product_name: "Bal Gopal Laddu Gopal Brass Murti (Size 5)",
        variant_name: "Bright Brass / Size 5",
        unit_price: 2199,
        quantity: 1,
        subtotal: 2199,
        image_url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "item-6-2",
        order_id: "ord-6",
        product_id: "prod-6",
        variant_id: "var-6-2",
        product_name: "Embroidered Velvet Pooja Asan Cloth (Set of 2)",
        variant_name: "Sinduri Red / 12x12 Inch",
        unit_price: 899,
        quantity: 1,
        subtotal: 899,
        image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "ord-7",
    user_id: "cust-1",
    order_number: "KC-ORD-2026-8610",
    status: "cancelled",
    payment_status: "failed",
    payment_method: "UPI (Failed Attempt)",
    razorpay_order_id: "order_KnhYp000111",
    razorpay_payment_id: null,
    razorpay_signature: null,
    subtotal: 14999,
    discount: 0,
    shipping_fee: 0,
    tax: 0,
    total: 14999,
    total_amount: 14999,
    items_count: 1,
    customer_name: "Rajeshwar Sharma",
    customer_email: "rajeshwar.sharma@example.com",
    placed_at: new Date(Date.now() - 168 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 167 * 3600 * 1000).toISOString(),
    can_cancel: false,
    shipping_address: {
      full_name: "Rajeshwar Sharma",
      phone: "+91 98765 43210",
      address_line1: "B-14, Shivalik Enclave, Malviya Nagar",
      address_line2: "Near Gaurav Tower",
      city: "Jaipur",
      state: "Rajasthan",
      postal_code: "302017",
      country: "India",
      type: "shipping",
    },
    billing_address: null,
    customer: {
      id: "cust-1",
      full_name: "Rajeshwar Sharma",
      email: "rajeshwar.sharma@example.com",
      phone: "+91 98765 43210",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    items: [
      {
        id: "item-7-1",
        order_id: "ord-7",
        product_id: "prod-1",
        variant_id: "var-1-1",
        product_name: "Radha Krishna Brass Murti (18 Inch)",
        variant_name: "Antique Brass / 18 Inch",
        unit_price: 14999,
        quantity: 1,
        subtotal: 14999,
        image_url: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "ord-8",
    user_id: "cust-4",
    order_number: "KC-ORD-2026-8550",
    status: "refunded",
    payment_status: "refunded",
    payment_method: "Credit Card (Refunded)",
    razorpay_order_id: "order_KnhYp882233",
    razorpay_payment_id: "pay_KnzLm773344",
    razorpay_signature: "fedcba9876543210fedcba9876543210",
    subtotal: 4499,
    discount: 0,
    shipping_fee: 0,
    tax: 0,
    total: 4499,
    total_amount: 4499,
    items_count: 1,
    customer_name: "Kavita Rao",
    customer_email: "kavita.rao@example.com",
    placed_at: new Date(Date.now() - 280 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 240 * 3600 * 1000).toISOString(),
    can_cancel: false,
    shipping_address: {
      full_name: "Kavita Rao",
      phone: "+91 97654 32109",
      address_line1: "Villa 8, Green Meadows, Banjara Hills",
      address_line2: "Road No. 12",
      city: "Hyderabad",
      state: "Telangana",
      postal_code: "500034",
      country: "India",
      type: "shipping",
    },
    billing_address: null,
    customer: {
      id: "cust-4",
      full_name: "Kavita Rao",
      email: "kavita.rao@example.com",
      phone: "+91 97654 32109",
      avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    },
    items: [
      {
        id: "item-8-1",
        order_id: "ord-8",
        product_id: "prod-4",
        variant_id: "var-4-2",
        product_name: "Royal Engraved Brass Pooja Thali Set (11 Pieces)",
        variant_name: "Deluxe 14 Inch / 11 Pieces",
        unit_price: 4499,
        quantity: 1,
        subtotal: 4499,
        image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
];

// Baseline Customers (Profiles and Addresses from Schema)
export const SEED_CUSTOMERS: MockCustomer[] = [
  {
    id: "cust-1",
    full_name: "Rajeshwar Sharma",
    email: "rajeshwar.sharma@example.com",
    phone: "+91 98765 43210",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    role: "user",
    orders_count: 2,
    total_spent: 20896,
    joined_at: "2026-08-15T10:00:00.000Z",
    created_at: "2026-08-15T10:00:00.000Z",
    updated_at: "2026-10-12T14:20:00.000Z",
    status: "active",
    addresses: [
      {
        id: "addr-1-1",
        user_id: "cust-1",
        type: "shipping",
        full_name: "Rajeshwar Sharma",
        phone: "+91 98765 43210",
        address_line1: "B-14, Shivalik Enclave, Malviya Nagar",
        address_line2: "Near Gaurav Tower",
        city: "Jaipur",
        state: "Rajasthan",
        postal_code: "302017",
        country: "India",
        is_default: true,
        created_at: "2026-08-15T10:05:00.000Z",
        updated_at: "2026-08-15T10:05:00.000Z",
      },
      {
        id: "addr-1-2",
        user_id: "cust-1",
        type: "billing",
        full_name: "Rajeshwar Sharma",
        phone: "+91 98765 43210",
        address_line1: "Office 204, Fortune Plaza, Tonk Road",
        address_line2: null,
        city: "Jaipur",
        state: "Rajasthan",
        postal_code: "302015",
        country: "India",
        is_default: true,
        created_at: "2026-08-20T11:00:00.000Z",
        updated_at: "2026-08-20T11:00:00.000Z",
      },
    ],
  },
  {
    id: "cust-2",
    full_name: "Pooja Varma",
    email: "pooja.varma@example.com",
    phone: "+91 98112 23344",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    role: "user",
    orders_count: 1,
    total_spent: 1299,
    joined_at: "2026-08-28T14:30:00.000Z",
    created_at: "2026-08-28T14:30:00.000Z",
    updated_at: "2026-10-10T09:15:00.000Z",
    status: "active",
    addresses: [
      {
        id: "addr-2-1",
        user_id: "cust-2",
        type: "shipping",
        full_name: "Pooja Varma",
        phone: "+91 98112 23344",
        address_line1: "Flat 402, Lotus Grandeur, Gomti Nagar",
        address_line2: "Opposite Wave Mall",
        city: "Lucknow",
        state: "Uttar Pradesh",
        postal_code: "226010",
        country: "India",
        is_default: true,
        created_at: "2026-08-28T14:35:00.000Z",
        updated_at: "2026-08-28T14:35:00.000Z",
      },
    ],
  },
  {
    id: "cust-3",
    full_name: "Amber Kanhaiya (Admin Dev)",
    email: "amber.admin@kanhaiyacollection.com",
    phone: "+91 99999 88888",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
    role: "admin",
    orders_count: 0,
    total_spent: 0,
    joined_at: "2026-07-01T09:00:00.000Z",
    created_at: "2026-07-01T09:00:00.000Z",
    updated_at: "2026-10-15T00:00:00.000Z",
    status: "active",
    addresses: [
      {
        id: "addr-3-1",
        user_id: "cust-3",
        type: "shipping",
        full_name: "Amber Kanhaiya",
        phone: "+91 99999 88888",
        address_line1: "12 Kanhaiya Bhavan, Godowlia Chowk",
        address_line2: "Near Vishwanath Temple corridor",
        city: "Varanasi",
        state: "Uttar Pradesh",
        postal_code: "221001",
        country: "India",
        is_default: true,
        created_at: "2026-07-01T09:05:00.000Z",
        updated_at: "2026-07-01T09:05:00.000Z",
      },
    ],
  },
  {
    id: "cust-4",
    full_name: "Kavita Rao",
    email: "kavita.rao@example.com",
    phone: "+91 97654 32109",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    role: "user",
    orders_count: 2,
    total_spent: 12389,
    joined_at: "2026-09-12T16:45:00.000Z",
    created_at: "2026-09-12T16:45:00.000Z",
    updated_at: "2026-10-14T11:00:00.000Z",
    status: "active",
    addresses: [
      {
        id: "addr-4-1",
        user_id: "cust-4",
        type: "shipping",
        full_name: "Kavita Rao",
        phone: "+91 97654 32109",
        address_line1: "Villa 8, Green Meadows, Banjara Hills",
        address_line2: "Road No. 12",
        city: "Hyderabad",
        state: "Telangana",
        postal_code: "500034",
        country: "India",
        is_default: true,
        created_at: "2026-09-12T16:50:00.000Z",
        updated_at: "2026-09-12T16:50:00.000Z",
      },
    ],
  },
  {
    id: "cust-5",
    full_name: "Amitabh Sen",
    email: "amitabh.sen@example.com",
    phone: "+91 98301 44556",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    role: "user",
    orders_count: 1,
    total_spent: 3499,
    joined_at: "2026-09-18T11:20:00.000Z",
    created_at: "2026-09-18T11:20:00.000Z",
    updated_at: "2026-10-14T18:30:00.000Z",
    status: "active",
    addresses: [
      {
        id: "addr-5-1",
        user_id: "cust-5",
        type: "shipping",
        full_name: "Amitabh Sen",
        phone: "+91 98301 44556",
        address_line1: "45/2 Southern Avenue, Lake Market",
        address_line2: "Flat 3A, Heritage Heights",
        city: "Kolkata",
        state: "West Bengal",
        postal_code: "700029",
        country: "India",
        is_default: true,
        created_at: "2026-09-18T11:25:00.000Z",
        updated_at: "2026-09-18T11:25:00.000Z",
      },
    ],
  },
  {
    id: "cust-6",
    full_name: "Meenakshi Sundaram",
    email: "meenakshi.s@example.com",
    phone: "+91 98402 77889",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    role: "user",
    orders_count: 1,
    total_spent: 3148,
    joined_at: "2026-09-22T08:40:00.000Z",
    created_at: "2026-09-22T08:40:00.000Z",
    updated_at: "2026-10-11T12:00:00.000Z",
    status: "active",
    addresses: [
      {
        id: "addr-6-1",
        user_id: "cust-6",
        type: "shipping",
        full_name: "Meenakshi Sundaram",
        phone: "+91 98402 77889",
        address_line1: "18 Temple Ring Road, Kapaleeshwarar Nagar",
        address_line2: "Mylapore",
        city: "Chennai",
        state: "Tamil Nadu",
        postal_code: "600004",
        country: "India",
        is_default: true,
        created_at: "2026-09-22T08:45:00.000Z",
        updated_at: "2026-09-22T08:45:00.000Z",
      },
    ],
  },
  {
    id: "cust-7",
    full_name: "Deepak Agarwal",
    email: "deepak.ag@example.com",
    phone: "+91 98105 66778",
    avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
    role: "user",
    orders_count: 1,
    total_spent: 4999,
    joined_at: "2026-09-25T15:10:00.000Z",
    created_at: "2026-09-25T15:10:00.000Z",
    updated_at: "2026-10-13T16:00:00.000Z",
    status: "active",
    addresses: [
      {
        id: "addr-7-1",
        user_id: "cust-7",
        type: "shipping",
        full_name: "Deepak Agarwal",
        phone: "+91 98105 66778",
        address_line1: "D-82, Defence Colony, Third Floor",
        address_line2: "Near Flyover Market",
        city: "New Delhi",
        state: "Delhi",
        postal_code: "110024",
        country: "India",
        is_default: true,
        created_at: "2026-09-25T15:15:00.000Z",
        updated_at: "2026-09-25T15:15:00.000Z",
      },
    ],
  },
];

// Baseline Submissions (contact_submissions in schema ecomm.txt)
export const SEED_CONTACT_SUBMISSIONS: MockContactSubmission[] = [
  {
    id: "sub-1",
    name: "Sunil Narang",
    email: "sunil.narang@example.com",
    phone: "+91 98220 11223",
    message: "Seeking custom 24-inch brass Radha Krishna murti consecrated for new temple consecration in Varanasi.",
    status: "new",
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: "sub-2",
    name: "Ananya Deshmukh",
    email: "ananya.d@example.com",
    phone: "+91 97110 33445",
    message: "Would like to inquire about wholesale Akhand Diya gift packaging for Diwali corporate gifting.",
    status: "in_progress",
    created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: "sub-3",
    name: "Rajendra Prasad Goel",
    email: "rp.goel@heritagefoundation.org",
    phone: "+91 98334 55667",
    message: "Requesting certified chemical test report and brass purity guarantee certificate for temple bell installation.",
    status: "resolved",
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  },
  {
    id: "sub-4",
    name: "Dr. Malini Iyer",
    email: "malini.iyer@aims.edu.in",
    phone: "+91 94450 67890",
    message: "Can the Ashtalakshmi puja thali set be engraved with custom family kuladevata shlokas on the outer rim?",
    status: "new",
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

// Baseline Leads (leads in schema ecomm.txt)
export const SEED_LEADS: MockLead[] = [
  {
    id: "lead-1",
    name: "Sri Vrindavan Dham Trust",
    email: "trust@vrindavandham.org",
    phone: "+91 98100 44321",
    source: "Temple Bulk Order Inquiry",
    message: "Requested catalog and pricing schedule for 50+ brass murtis and 200 akhand deepams.",
    status: "new",
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: "lead-2",
    name: "Omkar Spiritual Boutique",
    email: "orders@omkarboutique.in",
    phone: "+91 98200 99887",
    source: "Wholesale Partner Portal",
    message: "Commercial retail inquiries for stocking Kanhaiya certified sambrani dhoop cones in Mumbai outlets.",
    status: "contacted",
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
  },
  {
    id: "lead-3",
    name: "Aditi Mathur",
    email: "aditi.mathur@gmail.com",
    phone: "+91 91670 12345",
    source: "newsletter",
    message: "Subscribed to auspicious muhurat alerts and festival restock drops.",
    status: "converted",
    created_at: new Date(Date.now() - 80 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "lead-4",
    name: "Gaurav Khandelwal",
    email: "gaurav.k@exports.com",
    phone: "+91 99880 76543",
    source: "popup",
    message: "Inquired about international air express shipping rates for Germany delivery.",
    status: "closed",
    created_at: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
];

// Baseline Response History / Notes (Local-only development model for Phase 6)
export const SEED_RESPONSE_NOTES: MockResponseNote[] = [
  {
    id: "note-1",
    inquiry_id: "sub-2",
    entity_type: "contact_submission",
    note: "Discussed bulk packaging options for Akhand Diya gift boxes over phone with Ananya. Sent digital catalog sample via mock note.",
    responder: "Admin (Amber)",
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: "note-2",
    inquiry_id: "sub-3",
    entity_type: "contact_submission",
    note: "Emailed metallurgical brass certification doc and purity report. Client acknowledged receipt.",
    responder: "Admin (Amber)",
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  },
  {
    id: "note-3",
    inquiry_id: "lead-2",
    entity_type: "lead",
    note: "Followed up with Omkar Spiritual Boutique buyer regarding sambrani cones consignment terms.",
    responder: "Admin (Amber)",
    created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
  },
];

// Baseline Activities
export const SEED_ACTIVITIES: MockActivity[] = [
  {
    id: "act-1",
    title: "New Order Placed",
    description: "Order KC-ORD-2026-8812 (₹5,898) by Rajeshwar Sharma",
    type: "order",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "act-2",
    title: "Temple Bulk Lead Inbound",
    description: "Sri Vrindavan Dham Trust submitted bulk idol inquiry",
    type: "inquiry",
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: "act-3",
    title: "Stock Depletion Alert",
    description: "Pure Brass Radha Krishna Murti (9 Inch) reached critical threshold (4 left)",
    type: "stock",
    timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
  },
  {
    id: "act-4",
    title: "Order Delivered",
    description: "Order KC-ORD-2026-8720 delivered successfully to Deepak Agarwal",
    type: "order",
    timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
  },
];

// Baseline Notifications
export const SEED_NOTIFICATIONS: MockNotification[] = [
  {
    id: "notif-1",
    title: "Urgent Stock Replenishment Required",
    message: "Pure Brass Radha Krishna Murti (9 Inch) has only 4 units remaining.",
    type: "stock",
    is_read: false,
    created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    link: "/admin/inventory",
  },
  {
    id: "notif-2",
    title: "New Customer Order #8812",
    message: "Rajeshwar Sharma placed an order for ₹5,898 via UPI.",
    type: "order",
    is_read: false,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    link: "/admin/orders",
  },
  {
    id: "notif-3",
    title: "Temple Wholesale Lead Received",
    message: "Sri Vrindavan Dham Trust registered interest for bulk idols.",
    type: "inquiry",
    is_read: true,
    created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    link: "/admin/inbox/leads",
  },
];

// -----------------------------------------------------------------------------
// BASELINE CANONICAL SEED HOMEPAGE SECTIONS
// -----------------------------------------------------------------------------
export const SEED_HOMEPAGE_SECTIONS: MockHomepageSection[] = [
  { key: "banner", is_enabled: true, display_order: 1, updated_at: "2026-10-15T12:00:00.000Z" },
  { key: "shop_by_category", is_enabled: true, display_order: 2, updated_at: "2026-10-15T12:00:00.000Z" },
  { key: "continue_browsing", is_enabled: true, display_order: 3, updated_at: "2026-10-15T12:00:00.000Z" },
  { key: "top_sellers", is_enabled: true, display_order: 4, updated_at: "2026-10-15T12:00:00.000Z" },
  { key: "category_products", is_enabled: true, display_order: 5, updated_at: "2026-10-15T12:00:00.000Z" },
  { key: "wall_of_love", is_enabled: true, display_order: 6, updated_at: "2026-10-15T12:00:00.000Z" },
];

// -----------------------------------------------------------------------------
// BASELINE CANONICAL SEED BANNERS
// -----------------------------------------------------------------------------
export const SEED_BANNERS: MockBanner[] = [
  {
    id: "ban-rk-collection",
    image_url: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=1600&q=80",
    title: "Divine Brass Radha Krishna Murtis — Handcrafted in Varanasi",
    link_url: "/shop?category=idols",
    display_order: 1,
    is_active: true,
    created_at: "2026-10-01T10:00:00.000Z",
    updated_at: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "ban-akhand-diya",
    image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=1600&q=80",
    title: "Sacred Akhand Diyas & Artisan Pooja Thalis for Home Mandir",
    link_url: "/shop?category=pooja-essentials",
    display_order: 2,
    is_active: true,
    created_at: "2026-10-02T10:00:00.000Z",
    updated_at: "2026-10-02T10:00:00.000Z",
  },
  {
    id: "ban-sacred-aromas",
    image_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1600&q=80",
    title: "Pure Temple Chandan & Handcrafted Cow-Dung Sambrani Dhoop",
    link_url: "/shop?category=sacred-aromas",
    display_order: 3,
    is_active: true,
    created_at: "2026-10-03T10:00:00.000Z",
    updated_at: "2026-10-03T10:00:00.000Z",
  },
  {
    id: "ban-temple-brass",
    image_url: "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=1600&q=80",
    title: "Heavy Cast Mandir Ghanti Bells & Consecrated Kalashes",
    link_url: "/shop?category=temple-brassware",
    display_order: 4,
    is_active: true,
    created_at: "2026-10-04T10:00:00.000Z",
    updated_at: "2026-10-04T10:00:00.000Z",
  },
];

// -----------------------------------------------------------------------------
// BASELINE CANONICAL SEED ANNOUNCEMENTS (Text-Only Ribbon Above Header)
// -----------------------------------------------------------------------------
export const SEED_ANNOUNCEMENTS: MockAnnouncement[] = [
  {
    id: "ann-1",
    text: "Shubh Deepavali Special: Complimentary Brass Diya Set with sacred orders above ₹2,499. Use code DIWALI108.",
    is_active: true,
    display_order: 1,
    created_at: "2026-10-01T10:00:00.000Z",
    updated_at: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "ann-2",
    text: "Free Nationwide Sacred Dispatch across India on all consecrated Puja Thalis, Akhand Diyas & Murtis.",
    is_active: true,
    display_order: 2,
    created_at: "2026-10-02T10:00:00.000Z",
    updated_at: "2026-10-02T10:00:00.000Z",
  },
  {
    id: "ann-3",
    text: "Authentic Shilpa Shastra Brass Idols hand-sculpted by master sthapatis and artisans in Varanasi.",
    is_active: true,
    display_order: 3,
    created_at: "2026-10-03T10:00:00.000Z",
    updated_at: "2026-10-03T10:00:00.000Z",
  },
];

// -----------------------------------------------------------------------------
// BASELINE CANONICAL SEED FESTIVE CAMPAIGNS
// -----------------------------------------------------------------------------
export const SEED_FESTIVE_CAMPAIGNS: MockFestiveCampaign[] = [
  {
    id: "camp-deepotsav",
    name: "Deepotsav & Sacred Diwali Offerings",
    description: "Bless your home mandir this season with consecrated brassware and auspicious puja essentials. Enjoy complimentary brass diya with select festival items.",
    image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=1200&q=80",
    product_ids: ["prod-1", "prod-2", "prod-3", "prod-8"],
    discount_tag: "Festive Grace",
    discount_percent: 15,
    is_active: true,
    display_order: 1,
    created_at: "2026-10-01T10:00:00.000Z",
    updated_at: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "camp-janmashtami",
    name: "Janmashtami Bal Gopal Shringar Mahotsav",
    description: "Special celebration collection featuring handcrafted brass Bal Gopal murtis, designer jhulas, and natural Vrindavan chandan.",
    image_url: null, // Clean rendering test without banner image
    product_ids: ["prod-1", "prod-4", "prod-5"],
    discount_tag: "Devotional Joy",
    discount_percent: null,
    is_active: true,
    display_order: 2,
    created_at: "2026-10-05T10:00:00.000Z",
    updated_at: "2026-10-05T10:00:00.000Z",
  },
  {
    id: "camp-navratri",
    name: "Navratri Temple Brassware Specials",
    description: "Authentic Ashtadhatu aarti thalis, heavy resonant ghanti bells, and temple kalashes for nine auspicious nights of divine worship.",
    image_url: "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=1200&q=80",
    product_ids: ["prod-2", "prod-3", "prod-6"],
    discount_tag: "Shakti Mahotsav",
    discount_percent: 10,
    is_active: false,
    display_order: 3,
    created_at: "2026-10-08T10:00:00.000Z",
    updated_at: "2026-10-08T10:00:00.000Z",
  },
];

// -----------------------------------------------------------------------------
// BASELINE CANONICAL SEED TESTIMONIALS (Wall of Love)
// -----------------------------------------------------------------------------
export const SEED_TESTIMONIALS: MockTestimonial[] = [
  {
    id: "test-001",
    customer_name: "Pandit Radhe Shyam Shastri",
    designation: "Head Priest, Vrindavan Dham",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    content: "The 12-inch Radha Krishna murti has an unearthly serenity. The facial features, the lotus eyes, and the antique brass finish are sculpted according to authentic Shilpa Shastra proportions.",
    rating: 5,
    display_order: 1,
    is_active: true,
    created_at: "2026-09-15T09:00:00.000Z",
    updated_at: "2026-09-15T09:00:00.000Z",
  },
  {
    id: "test-002",
    customer_name: "Dr. Ananya Deshmukh",
    designation: "Sanskrit Scholar & Devotee, Pune",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    content: "The Akhand Diya burns uninterrupted for 36 hours. The Borosilicate glass cylinder shields the flame perfectly during morning drafts. Pure craftsmanship and devotion.",
    rating: 5,
    display_order: 2,
    is_active: true,
    created_at: "2026-09-18T14:30:00.000Z",
    updated_at: "2026-09-18T14:30:00.000Z",
  },
  {
    id: "test-003",
    customer_name: "Rajeshwar Sharma",
    designation: "Verified Devotee, New Delhi",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    content: "The brass aarti thali with Ashtalakshmi engraving is remarkably heavy and radiant. Ordering online was seamless and the packaging with bubble wraps and velvet lining was top notch.",
    rating: 5,
    display_order: 3,
    is_active: true,
    created_at: "2026-09-22T11:15:00.000Z",
    updated_at: "2026-09-22T11:15:00.000Z",
  },
  {
    id: "test-004",
    customer_name: "Meenakshi Sundaram",
    designation: "Temple Arts Connoisseur, Chennai",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    content: "The temple chandan bar releases such a pure, divine fragrance when rubbed on the stone slab. No artificial chemicals. Our daily puja has transformed completely.",
    rating: 5,
    display_order: 4,
    is_active: true,
    created_at: "2026-09-25T16:45:00.000Z",
    updated_at: "2026-09-25T16:45:00.000Z",
  },
];

// -----------------------------------------------------------------------------
// BASELINE CANONICAL SEED REVIEWS (product_reviews table in schema ecomm.txt)
// -----------------------------------------------------------------------------
export const SEED_REVIEWS: MockReview[] = [
  {
    id: "rev-001",
    product_id: "prod-1",
    user_id: "cust-1",
    order_item_id: "item-1-1",
    rating: 5,
    review_text: "The craftsmanship of this Radha Krishna brass murti is breathtaking. The detailed carving on the mukut and flute is flawless. Arrived securely packed in velvet cloth.",
    images: [
      "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80",
    ],
    is_approved: true,
    created_at: "2026-10-10T12:00:00.000Z",
  },
  {
    id: "rev-002",
    product_id: "prod-2",
    user_id: "cust-1",
    order_item_id: "item-1-2",
    rating: 5,
    review_text: "Borosilicate glass protects the flame through entire night. Heavy brass base prevents any tipping. Excellent quality for daily home mandir rituals.",
    images: [
      "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80",
    ],
    is_approved: true,
    created_at: "2026-10-11T14:30:00.000Z",
  },
  {
    id: "rev-003",
    product_id: "prod-3",
    user_id: "cust-2",
    order_item_id: "item-2-1",
    rating: 4,
    review_text: "Beautiful Ashtalakshmi embossing with radiant brass glow. Good weight. One small corner had a slight tarnish spot that cleaned off easily with pitambari powder.",
    images: [],
    is_approved: true,
    created_at: "2026-10-12T09:15:00.000Z",
  },
  {
    id: "rev-004",
    product_id: "prod-1",
    user_id: "cust-4",
    order_item_id: null,
    rating: 5,
    review_text: "Saw this at my sister's mandir and had to inquire. Supreme divinity and polished gold luster. Highly recommend this masterwork.",
    images: [],
    is_approved: false, // Pending moderation
    created_at: "2026-10-14T16:20:00.000Z",
  },
  {
    id: "rev-005",
    product_id: "prod-4",
    user_id: "cust-4",
    order_item_id: null,
    rating: 5,
    review_text: "Original Mysore/Varanasi sandalwood scent, pure and soothing. Very happy with the authenticity seal and fast delivery.",
    images: [
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
    ],
    is_approved: false, // Pending moderation
    created_at: "2026-10-14T19:40:00.000Z",
  },
  {
    id: "rev-006",
    product_id: "prod-6",
    user_id: "cust-6",
    order_item_id: null,
    rating: 5,
    review_text: "Resonant tone lingers for seconds after ringing. Garuda finial is intricately cast and comfortable to hold during morning aarti.",
    images: [],
    is_approved: true,
    created_at: "2026-10-08T08:30:00.000Z",
  },
];

// -----------------------------------------------------------------------------
// BASELINE CANONICAL SEED ABOUT US SECTIONS (about_us_sections in schema ecomm.txt)
// -----------------------------------------------------------------------------
export const SEED_ABOUT_SECTIONS: MockAboutSection[] = [
  {
    id: "about-1",
    heading: "Sacred Heritage & Varanasi Traditions",
    subheading: "Consecrated Devotion Handcrafted Since 1998",
    body: "Founded along the sacred ghats of Varanasi, Kanhaiya Collection was born out of a lifelong reverence for Sanatana Dharma. For over two decades, our master sthapatis and brass artisans have sculpted sacred murtis, pure akhand diyas, and authentic pooja essentials that bring temple sanctity directly into family homes across India and the diaspora.",
    image_url: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=1000&q=80",
    display_order: 1,
    is_active: true,
    created_at: "2026-09-15T10:00:00.000Z",
    updated_at: "2026-09-15T10:00:00.000Z",
  },
  {
    id: "about-2",
    heading: "Vedic Purity & Ashtadhatu Casting",
    subheading: "Uncompromising Attention to Sacred Iconography & Metal Weight",
    body: "Every Kanhaiya idol is hand-cast using high-density virgin brass and authentic Ashtadhatu metallurgical ratios prescribed in Shilpa Shastra scriptures. From the gentle smile on Radha Krishna's countenance to the fine peacock feather carvings on the mukut, each sculpture embodies celestial balance and timeless luster.",
    image_url: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=1000&q=80",
    display_order: 2,
    is_active: true,
    created_at: "2026-09-18T11:00:00.000Z",
    updated_at: "2026-09-18T11:00:00.000Z",
  },
  {
    id: "about-3",
    heading: "Empowering Generational Artisan Guilds",
    subheading: "Sustaining Over 120 Master Metal Artisans and Bell Casters",
    body: "We partner directly with family lineages in Moradabad, Varanasi, and Swamimalai, guaranteeing fair trade compensation, dignified workshop environments, and pension security for elderly craftsmen. By bringing heirlooms directly to modern devotees, we ensure sacred metallurgical heritage continues to thrive.",
    image_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1000&q=80",
    display_order: 3,
    is_active: true,
    created_at: "2026-09-20T12:00:00.000Z",
    updated_at: "2026-09-20T12:00:00.000Z",
  },
];

// -----------------------------------------------------------------------------
// BASELINE CANONICAL SEED FAQS (faqs in schema ecomm.txt)
// -----------------------------------------------------------------------------
export const SEED_FAQS: MockFaq[] = [
  {
    id: "faq-1",
    question: "How are brass murtis and heavy temple articles packed for safe transit?",
    answer: "Every murti is wrapped in consecrated velvet cloth, followed by multiple layers of shock-absorbent high-density bubble wrap, corner edge protectors, and double-walled corrugated shipping crates. We guarantee 100% damage-free delivery or an instant complimentary replacement.",
    category: "Shipping",
    display_order: 1,
    is_active: true,
    created_at: "2026-09-22T09:00:00.000Z",
    updated_at: "2026-09-22T09:00:00.000Z",
  },
  {
    id: "faq-2",
    question: "Do you ship worldwide to overseas temples and international devotees?",
    answer: "Yes, we ship globally to over 45 countries including USA, UK, Canada, Australia, Singapore, and UAE via express air couriers (DHL / FedEx). International orders typically arrive within 4 to 7 business days with online tracking.",
    category: "Shipping",
    display_order: 2,
    is_active: true,
    created_at: "2026-09-22T09:30:00.000Z",
    updated_at: "2026-09-22T09:30:00.000Z",
  },
  {
    id: "faq-3",
    question: "Are your murtis and pooja thalis made of pure virgin brass?",
    answer: "Yes, all Kanhaiya Collection brassware is cast from certified pure grade brass with no scrap fillers. Each item includes a Certificate of Metal Authenticity confirming heavy density and mirror-buffed finish that will not tarnish when cared for with natural Pitambari or lemon.",
    category: "Products",
    display_order: 3,
    is_active: true,
    created_at: "2026-09-24T14:00:00.000Z",
    updated_at: "2026-09-24T14:00:00.000Z",
  },
  {
    id: "faq-4",
    question: "What is your return and exchange policy if an idol does not fit my mandir altar?",
    answer: "We offer a 7-day hassle-free exchange and return guarantee from the date of delivery. If the dimensions or posture do not suit your home temple, you can initiate an exchange through your account or contact our customer care team.",
    category: "Returns",
    display_order: 4,
    is_active: true,
    created_at: "2026-09-25T11:00:00.000Z",
    updated_at: "2026-09-25T11:00:00.000Z",
  },
  {
    id: "faq-5",
    question: "How can I track the live dispatch status of my order?",
    answer: "Once your parcel is dispatched from our Varanasi fulfillment center, you will receive real-time SMS and WhatsApp notifications with tracking links. You can also view live delivery milestones directly in your Admin or Customer orders portal.",
    category: "Orders",
    display_order: 5,
    is_active: true,
    created_at: "2026-09-26T16:00:00.000Z",
    updated_at: "2026-09-26T16:00:00.000Z",
  },
  {
    id: "faq-6",
    question: "What payment options and Cash on Delivery terms are available?",
    answer: "We support UPI (PhonePe, Google Pay, Paytm), all domestic and international Credit/Debit cards, Net Banking, and Cash on Delivery (COD) for eligible pincodes across India on orders up to ₹15,000.",
    category: "Payments",
    display_order: 6,
    is_active: true,
    created_at: "2026-09-27T10:00:00.000Z",
    updated_at: "2026-09-27T10:00:00.000Z",
  },
];

// -----------------------------------------------------------------------------
// BASELINE CANONICAL SEED POLICIES (site_policies in schema ecomm.txt)
// -----------------------------------------------------------------------------
export const SEED_POLICIES: MockSitePolicy[] = [
  {
    id: "pol-privacy",
    type: "privacy",
    title: "Privacy Policy",
    content: `### 1. Introduction & Devotional Commitment
At Kanhaiya Collection, protecting your privacy and spiritual sanctity is fundamental to our core values. This policy explains how we collect, store, and safeguard your personal details when you browse our sacred catalog or place orders.

### 2. Information We Collect
- **Personal Details**: Your full name, delivery address, contact telephone, and email address for order fulfillment.
- **Payment Security**: Payment card and UPI transactions are encrypted and processed by RBI-authorized payment gateways. We never store credit/debit card numbers or CVVs on our servers.
- **Account Preferences**: Saved addresses, wishlist items, and order history for smooth repeat worship preparations.

### 3. Data Protection Standards
We do not sell, rent, or trade your contact information to external advertisers. All stored data is protected using industrial 256-bit SSL encryption.

### 4. Your Rights
You may request an export of your stored personal details or request deletion of your account at any time by writing to care@kanhaiyacollection.com.`,
    updated_at: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "pol-terms",
    type: "terms",
    title: "Terms of Service",
    content: `### 1. Agreement to Spiritual Terms
By visiting Kanhaiya Collection or placing orders for brass murtis, akhand deepams, and puja accessories, you agree to comply with all applicable terms, conditions, and Indian commercial laws.

### 2. Handcrafted Artisan Uniqueness
Because our brass statues, thalis, and bells are individually hand-cast and buffed by traditional artisans, minor variations in tone, weight, and polish are natural hallmarks of genuine handcrafting rather than defects.

### 3. Pricing & Sacred Catalog Accuracy
All prices are displayed in Indian Rupees (INR) and are inclusive of GST. While we strive for extreme catalog accuracy, errors in stock or pricing will be promptly corrected upon discovery with immediate notification to the customer.

### 4. Intellectual Property
All photographs, sacred descriptions, 3D idol scans, and logo emblems are proprietary intellectual property of Kanhaiya Collection and may not be copied or repurposed without written authorization.`,
    updated_at: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "pol-shipping",
    type: "shipping",
    title: "Shipping & Delivery Policy",
    content: `### 1. Dispatch & Transit Timelines
All standard orders are dispatched from our Varanasi artisan center within **24 to 48 business hours** following order confirmation.
- **Metro Cities (Delhi, Mumbai, Bengaluru, Kolkata, Chennai)**: 2 to 4 business days.
- **Rest of India**: 4 to 6 business days.
- **International Deliveries**: 4 to 7 business days via air express courier.

### 2. Free Shipping Threshold
We offer complimentary shipping across India on all prepaid orders exceeding **₹1,999**. For smaller orders under ₹1,999, a nominal flat rate of ₹99 is charged.

### 3. Consecrated Fragile Packing
Brass idols and borosilicate glass chimneys receive multi-layer bubble cushioning, styrofoam bracing, and rigid corrugated boxing to ensure unbroken arrival.`,
    updated_at: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "pol-return",
    type: "return",
    title: "Return & Refund Policy",
    content: `### 1. 7-Day Hassle-Free Returns
We desire that your sacred murti brings complete serenity to your home mandir. If you wish to return or exchange an item, you may request a return within **7 days of delivery**.

### 2. Return Eligibility
- The item must be in its original, undamaged condition with authentic brass tag seals, pooja boxes, and protective packaging intact.
- Custom-engraved temple thalis or bespoke sanctum murtis cannot be returned unless damaged during transit.

### 3. Refund Process
- Reverse courier pickups are scheduled within 48 hours of return acceptance.
- Refunds are credited to the original payment source (UPI/Bank/Card) within 3–5 working days following inspection at our fulfillment warehouse.`,
    updated_at: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "pol-cancellation",
    type: "cancellation",
    title: "Cancellation Policy",
    content: `### 1. Order Cancellation Window
You may cancel your sacred order free of charge at any time before the consignment is dispatched from our fulfillment center (typically within **24 hours** of order placement).

### 2. How to Request Cancellation
- Navigate to your account order history and click **Cancel Order**, or
- Email **care@kanhaiyacollection.com** or call **+91 98290 12345** with your order number.

### 3. Post-Dispatch Cancellations
Once an order has been handed over to our courier partner and a tracking AWB has been issued, it cannot be canceled in transit. You may instead refuse delivery upon arrival or initiate a return within 7 days.

### 4. Refund on Cancellation
For prepaid orders canceled prior to dispatch, an immediate 100% refund is initiated back to your original payment mode (UPI, card, or net banking) and typically reflects within 24–48 banking hours.`,
    updated_at: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "pol-refund",
    type: "refund",
    title: "Refund Policy",
    content: `### 1. 7-Day Refund Commitment
We want you to have complete peace of mind when acquiring sacred brass idols, thalis, and temple textiles from Kanhaiya Collection. If you are not entirely satisfied, you may request a full refund within **7 days of delivery**.

### 2. Refund Verification & Quality Inspection
- All returned sacred items undergo inspection at our artisan center within 48 business hours of receipt.
- Returned goods must be unblemished, in original brass tag seals, pooja boxes, and protective packaging.

### 3. Refund Timelines & Payment Channels
- **Prepaid Orders (UPI, Net Banking, Credit/Debit Cards)**: Credited to the original payment source within **3 to 5 business days**.
- **Cash on Delivery (COD) Orders**: Refunded securely via instant UPI transfer or direct NEFT bank transfer upon receiving your verified bank details.

### 4. Damaged or In-Transit Defect Protection
In the rare event of transit damage to brass idols or glass chimneys, report within 48 hours of delivery with photos to **care@kanhaiyacollection.com** for an instant priority replacement or full refund.`,
    updated_at: "2026-10-01T10:00:00.000Z",
  },
];

// -----------------------------------------------------------------------------
// BASELINE CANONICAL SEED SETTINGS (site_settings in schema ecomm.txt)
// -----------------------------------------------------------------------------
export const SEED_SETTINGS: Record<string, any> = {
  footer: {
    brand_name: "Kanhaiya Collection",
    tagline: "Sacred Devotion & Spiritual Living — Authentic Temple Craftsmanship",
    logo_url: "/logo.svg",
    phone: "+91 98290 12345",
    email: "care@kanhaiyacollection.com",
    address: "108 Heritage Boulevard, Godowlia Ghat Road, Varanasi, Uttar Pradesh 221001, India",
    business_hours: "Monday – Saturday: 9:00 AM – 8:00 PM IST",
    social: {
      instagram: "https://instagram.com/kanhaiya_collection",
      facebook: "https://facebook.com/kanhaiyacollection",
      twitter: "https://twitter.com/kanhaiyacoll",
      youtube: "https://youtube.com/@kanhaiyacollection",
    },
  },
};

// -----------------------------------------------------------------------------
// CENTRAL STORE ACCESSORS (Safe for SSR and Client LocalStorage)
// -----------------------------------------------------------------------------

export function getInitialMockStore(): MockAdminStore {
  const store: MockAdminStore = {
    categories: SEED_CATEGORIES,
    products: SEED_PRODUCTS,
    orders: SEED_ORDERS,
    customers: SEED_CUSTOMERS,
    contactSubmissions: SEED_CONTACT_SUBMISSIONS,
    leads: SEED_LEADS,
    responseNotes: SEED_RESPONSE_NOTES,
    activities: SEED_ACTIVITIES,
    notifications: SEED_NOTIFICATIONS,
    reviews: SEED_REVIEWS,
    homepageSections: SEED_HOMEPAGE_SECTIONS,
    banners: SEED_BANNERS,
    announcements: SEED_ANNOUNCEMENTS,
    festiveCampaigns: SEED_FESTIVE_CAMPAIGNS,
    testimonials: SEED_TESTIMONIALS,
    aboutUsSections: SEED_ABOUT_SECTIONS,
    faqs: SEED_FAQS,
    sitePolicies: SEED_POLICIES,
    siteSettings: SEED_SETTINGS,
  };

  // Run schema trigger refresh_product_rating rollup across products on initialization
  for (const product of store.products) {
    const approved = store.reviews.filter(
      (r) => r.product_id === product.id && r.is_approved === true
    );
    if (approved.length === 0) {
      product.avg_rating = 0;
      product.review_count = 0;
    } else {
      const sum = approved.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
      product.avg_rating = Number((sum / approved.length).toFixed(1));
      product.review_count = approved.length;
    }
  }

  return store;
}

export function loadMockStore(): MockAdminStore {
  if (typeof window === "undefined") {
    try {
      const fs = eval("require('fs')");
      const path = eval("require('path')");
      const filePath = path.join(process.cwd(), "data", "ecomm_store.json");
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const store = getInitialMockStore();
          if (Array.isArray(parsed.products) && parsed.products.length > 0) {
            store.products = parsed.products;
          }
          if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
            store.categories = parsed.categories;
          }
          if (Array.isArray(parsed.banners) && parsed.banners.length > 0) {
            store.banners = parsed.banners;
          }
          if (Array.isArray(parsed.announcements) && parsed.announcements.length > 0) {
            store.announcements = parsed.announcements;
          }
          if (Array.isArray(parsed.festive_campaigns) && parsed.festive_campaigns.length > 0) {
            store.festiveCampaigns = parsed.festive_campaigns;
          } else if (Array.isArray(parsed.festiveCampaigns) && parsed.festiveCampaigns.length > 0) {
            store.festiveCampaigns = parsed.festiveCampaigns;
          }
          if (Array.isArray(parsed.contactSubmissions) && parsed.contactSubmissions.length > 0) {
            store.contactSubmissions = parsed.contactSubmissions;
          }
          if (Array.isArray(parsed.leads) && parsed.leads.length > 0) {
            store.leads = parsed.leads;
          }
          if (Array.isArray(parsed.responseNotes) && parsed.responseNotes.length > 0) {
            store.responseNotes = parsed.responseNotes;
          }
          if (Array.isArray(parsed.sitePolicies) && parsed.sitePolicies.length > 0) {
            store.sitePolicies = parsed.sitePolicies;
          }
          return store;
        }
      }
    } catch {
      // Fallback
    }
    return getInitialMockStore();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialMockStore();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      !Array.isArray(parsed.categories) ||
      !Array.isArray(parsed.products) ||
      !Array.isArray(parsed.orders)
    ) {
      const initial = getInitialMockStore();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    // Ensure all products have batch_number
    let updatedBatch = false;
    parsed.products = parsed.products.map((p: any, idx: number) => {
      if (!p.batch_number) {
        updatedBatch = true;
        return {
          ...p,
          batch_number: `BATCH-202609-${String(idx + 1).padStart(4, "0")}`,
        };
      }
      return p;
    });
    if (updatedBatch) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch {}
    }

    // Ensure newly introduced phase-5 and phase-6 arrays are always populated
    if (!Array.isArray(parsed.reviews)) parsed.reviews = SEED_REVIEWS;
    if (!Array.isArray(parsed.homepageSections)) parsed.homepageSections = SEED_HOMEPAGE_SECTIONS;
    if (!Array.isArray(parsed.banners)) parsed.banners = SEED_BANNERS;
    if (!Array.isArray(parsed.announcements)) parsed.announcements = SEED_ANNOUNCEMENTS;
    if (!Array.isArray(parsed.festiveCampaigns)) parsed.festiveCampaigns = SEED_FESTIVE_CAMPAIGNS;
    if (!Array.isArray(parsed.testimonials)) parsed.testimonials = SEED_TESTIMONIALS;
    if (!Array.isArray(parsed.aboutUsSections)) parsed.aboutUsSections = SEED_ABOUT_SECTIONS;
    if (!Array.isArray(parsed.faqs)) parsed.faqs = SEED_FAQS;
    if (!Array.isArray(parsed.sitePolicies)) parsed.sitePolicies = SEED_POLICIES;
    if (!parsed.siteSettings || typeof parsed.siteSettings !== "object") parsed.siteSettings = SEED_SETTINGS;
    if (!Array.isArray(parsed.contactSubmissions)) parsed.contactSubmissions = SEED_CONTACT_SUBMISSIONS;
    if (!Array.isArray(parsed.leads)) parsed.leads = SEED_LEADS;
    if (!Array.isArray(parsed.responseNotes)) parsed.responseNotes = SEED_RESPONSE_NOTES;

    return parsed;
  } catch (err) {
    console.warn("Failed to read mock store from localStorage, using initial seed:", err);
    return getInitialMockStore();
  }
}

export function saveMockStore(store: MockAdminStore): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      window.dispatchEvent(
        new CustomEvent("catalog_updated", { detail: { timestamp: Date.now() } })
      );
    } catch (err) {
      console.error("Failed to write to mock store in localStorage:", err);
    }
  } else {
    try {
      const fs = eval("require('fs')");
      const path = eval("require('path')");
      const filePath = path.join(process.cwd(), "data", "ecomm_store.json");
      let existing: any = {};
      if (fs.existsSync(filePath)) {
        try {
          existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        } catch {}
      }
      existing.products = store.products;
      existing.categories = store.categories;
      existing.banners = store.banners;
      existing.announcements = store.announcements;
      existing.festive_campaigns = store.festiveCampaigns;
      existing.contactSubmissions = store.contactSubmissions;
      existing.leads = store.leads;
      existing.responseNotes = store.responseNotes;
      existing.sitePolicies = store.sitePolicies;
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write to server file store:", err);
    }
  }
}

export function resetMockStore(): MockAdminStore {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  const initial = getInitialMockStore();
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  }
  return initial;
}

// -----------------------------------------------------------------------------
// CATEGORY CRUD OPERATIONS WITH SCHEMA VALIDATION & CASCADE
// -----------------------------------------------------------------------------

export function loadMockCategories(): MockCategory[] {
  return loadMockStore().categories;
}

export function upsertCategoryInStore(cat: Partial<MockCategory> & { name: string }): {
  success: boolean;
  error?: string;
  category?: MockCategory;
} {
  const store = loadMockStore();
  const name = cat.name.trim();
  if (!name) return { success: false, error: "Category name is required." };

  const slug = (cat.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/^-|-$/g, "");
  if (!slug) return { success: false, error: "A valid URL slug is required." };

  // 1. Duplicate slug check (case-insensitive)
  const duplicate = store.categories.find(
    (c) => c.slug.toLowerCase() === slug.toLowerCase() && c.id !== cat.id
  );
  if (duplicate) {
    return {
      success: false,
      error: `A category with the slug "${slug}" already exists (matching "${duplicate.name}"). Please choose a unique slug.`,
    };
  }

  const existingIdx = cat.id ? store.categories.findIndex((c) => c.id === cat.id) : -1;
  const existing = existingIdx !== -1 ? store.categories[existingIdx] : null;
  if (cat.id && !existing) {
    return { success: false, error: "Category not found." };
  }

  // 2. Parent cycle check
  const parentId =
    cat.parent_id !== undefined
      ? (cat.parent_id || null)
      : existing
      ? existing.parent_id
      : null;

  if (cat.id && parentId) {
    if (parentId === cat.id) {
      return { success: false, error: "A category cannot be its own parent." };
    }
    // Check if parentId is a descendant
    const descendants: string[] = [];
    const findDescendants = (id: string) => {
      const children = store.categories.filter((c) => c.parent_id === id);
      for (const child of children) {
        descendants.push(child.id);
        findDescendants(child.id);
      }
    };
    findDescendants(cat.id);
    if (descendants.includes(parentId)) {
      const parentName = store.categories.find((c) => c.id === parentId)?.name || "a descendant";
      return {
        success: false,
        error: `Cannot select '${parentName}' as parent because it is a descendant of this category. Doing so would create a circular hierarchy loop.`,
      };
    }
  }

  const now = new Date().toISOString();
  let savedCategory: MockCategory;

  if (existing && existingIdx !== -1) {
    // Update existing category while preserving unpassed fields
    savedCategory = {
      ...existing,
      ...cat,
      name,
      slug,
      parent_id: parentId,
      description:
        cat.description !== undefined
          ? cat.description?.trim() || null
          : existing.description,
      image_url:
        cat.image_url !== undefined
          ? cat.image_url?.trim() || null
          : existing.image_url,
      display_order:
        cat.display_order !== undefined
          ? Number(cat.display_order)
          : existing.display_order,
      is_active:
        cat.is_active !== undefined ? cat.is_active : existing.is_active,
      show_on_homepage:
        cat.show_on_homepage !== undefined
          ? cat.show_on_homepage
          : existing.show_on_homepage,
      updated_at: now,
    };
    store.categories[existingIdx] = savedCategory;
  } else {
    // Create new
    savedCategory = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      parent_id: parentId,
      name,
      slug,
      description: cat.description?.trim() || null,
      image_url: cat.image_url?.trim() || null,
      display_order: Number(cat.display_order) || store.categories.length + 1,
      is_active: cat.is_active ?? true,
      show_on_homepage: cat.show_on_homepage ?? true,
      created_at: now,
      updated_at: now,
    };
    store.categories.push(savedCategory);
  }

  saveMockStore(store);
  return { success: true, category: savedCategory };
}

export function deleteCategoryFromStore(categoryId: string): {
  success: boolean;
  cascadeCount: number;
  error?: string;
} {
  const store = loadMockStore();
  const target = store.categories.find((c) => c.id === categoryId);
  if (!target) return { success: false, cascadeCount: 0, error: "Category not found." };

  // Calculate all descendants
  const descendantIds: string[] = [];
  const findDescendants = (id: string) => {
    const children = store.categories.filter((c) => c.parent_id === id);
    for (const child of children) {
      descendantIds.push(child.id);
      findDescendants(child.id);
    }
  };
  findDescendants(categoryId);

  const allRemovedIds = new Set([categoryId, ...descendantIds]);

  // Remove categories
  store.categories = store.categories.filter((c) => !allRemovedIds.has(c.id));

  // Set category_id to null for products assigned to deleted categories (Schema ON DELETE SET NULL)
  store.products = store.products.map((p) => {
    if (p.category_id && allRemovedIds.has(p.category_id)) {
      return { ...p, category_id: null, category: null };
    }
    return p;
  });

  saveMockStore(store);
  return { success: true, cascadeCount: descendantIds.length };
}

/**
 * Moves a category to a new parent and/or reorders it among siblings.
 * Supports drag-and-drop operations:
 * - position === 'inside': nests category under targetSiblingId as a child
 * - position === 'before' | 'after': reorders category relative to targetSiblingId
 * Prevents circular loops (self-parenting and nesting inside descendants).
 */
export function moveCategoryInStore(
  categoryId: string,
  targetParentId?: string | null,
  position?: "before" | "after" | "inside",
  targetSiblingId?: string
): {
  success: boolean;
  error?: string;
  category?: MockCategory;
  categories?: MockCategory[];
} {
  const store = loadMockStore();
  const category = store.categories.find((c) => c.id === categoryId);
  if (!category) return { success: false, error: "Category not found." };

  // Helper to get all descendant IDs of a category
  const getDescendants = (id: string): string[] => {
    const res: string[] = [];
    const recurse = (pid: string) => {
      const children = store.categories.filter((c) => c.parent_id === pid);
      for (const child of children) {
        res.push(child.id);
        recurse(child.id);
      }
    };
    recurse(id);
    return res;
  };

  const descendantIds = getDescendants(categoryId);

  // Case 1: Nest inside target category
  if (position === "inside") {
    if (!targetSiblingId) {
      return { success: false, error: "Target parent category is required for nesting." };
    }
    if (targetSiblingId === categoryId) {
      return { success: false, error: "A category cannot be nested inside itself." };
    }
    if (descendantIds.includes(targetSiblingId)) {
      const parentName = store.categories.find((c) => c.id === targetSiblingId)?.name || "a descendant";
      return {
        success: false,
        error: `Cannot nest inside '${parentName}' because it is a descendant of this category. Doing so would create a circular loop.`,
      };
    }

    category.parent_id = targetSiblingId;
    const targetChildren = store.categories.filter((c) => c.parent_id === targetSiblingId && c.id !== categoryId);
    category.display_order = targetChildren.length > 0 ? Math.max(...targetChildren.map((c) => c.display_order)) + 1 : 1;
    category.updated_at = new Date().toISOString();

    saveMockStore(store);
    return { success: true, category, categories: store.categories };
  }

  // Case 2: Drop before or after a target sibling
  if (position === "before" || position === "after") {
    if (!targetSiblingId) {
      return { success: false, error: "Target reference category is required for reordering." };
    }
    if (targetSiblingId === categoryId) {
      return { success: true, category, categories: store.categories };
    }

    const targetCategory = store.categories.find((c) => c.id === targetSiblingId);
    if (!targetCategory) return { success: false, error: "Target category not found." };

    const newParentId = targetCategory.parent_id;

    // Check circular loop if parent is changing
    if (newParentId !== category.parent_id) {
      if (newParentId === categoryId) {
        return { success: false, error: "A category cannot be its own parent." };
      }
      if (newParentId && descendantIds.includes(newParentId)) {
        return {
          success: false,
          error: "Cannot move category under its own descendant. Doing so would create a circular loop.",
        };
      }
    }

    category.parent_id = newParentId;

    // Get all siblings with newParentId excluding moving category, sorted by display_order
    const siblings = store.categories
      .filter((c) => c.parent_id === newParentId && c.id !== categoryId)
      .sort((a, b) => a.display_order - b.display_order);

    const targetIndex = siblings.findIndex((c) => c.id === targetSiblingId);
    const insertIndex = position === "before" ? targetIndex : targetIndex + 1;

    siblings.splice(insertIndex < 0 ? siblings.length : insertIndex, 0, category);

    // Renumber display orders sequentially starting from 1
    siblings.forEach((c, idx) => {
      c.display_order = idx + 1;
    });

    category.updated_at = new Date().toISOString();
    saveMockStore(store);
    return { success: true, category, categories: store.categories };
  }

  // Case 3: Set parent_id directly (from parent selector or drop on root)
  const newParentId = targetParentId !== undefined ? targetParentId : category.parent_id;
  if (newParentId !== category.parent_id) {
    if (newParentId === categoryId) {
      return { success: false, error: "A category cannot be its own parent." };
    }
    if (newParentId && descendantIds.includes(newParentId)) {
      const parentName = store.categories.find((c) => c.id === newParentId)?.name || "a descendant";
      return {
        success: false,
        error: `Cannot set parent to '${parentName}' because it is a descendant of this category. Doing so would create a circular loop.`,
      };
    }
    category.parent_id = newParentId;
  }

  // Renumber siblings under newParentId
  const siblings = store.categories
    .filter((c) => c.parent_id === category.parent_id && c.id !== categoryId)
    .sort((a, b) => a.display_order - b.display_order);

  category.display_order = siblings.length > 0 ? Math.max(...siblings.map((c) => c.display_order)) + 1 : 1;
  category.updated_at = new Date().toISOString();

  saveMockStore(store);
  return { success: true, category, categories: store.categories };
}

/**
 * Swaps order with immediate sibling above or below (keyboard-accessible alternative)
 */
export function swapCategoryOrderInStore(
  categoryId: string,
  direction: "up" | "down"
): {
  success: boolean;
  error?: string;
  categories?: MockCategory[];
} {
  const store = loadMockStore();
  const category = store.categories.find((c) => c.id === categoryId);
  if (!category) return { success: false, error: "Category not found." };

  const siblings = store.categories
    .filter((c) => c.parent_id === category.parent_id)
    .sort((a, b) => a.display_order - b.display_order);

  const idx = siblings.findIndex((c) => c.id === categoryId);
  if (idx === -1) return { success: false, error: "Category sibling index not found." };

  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= siblings.length) {
    return { success: false, error: `Already at the ${direction === "up" ? "top" : "bottom"} of this level.` };
  }

  // Swap elements in sibling list
  const temp = siblings[idx];
  siblings[idx] = siblings[targetIdx];
  siblings[targetIdx] = temp;

  // Renumber display_order
  siblings.forEach((c, i) => {
    c.display_order = i + 1;
    c.updated_at = new Date().toISOString();
  });

  saveMockStore(store);
  return { success: true, categories: store.categories };
}

/**
 * Changes hierarchy level via keyboard-accessible button:
 * - 'indent': nests category under its preceding sibling
 * - 'outdent': moves category up one level to its parent's parent (or root)
 */
export function changeCategoryHierarchyLevelInStore(
  categoryId: string,
  action: "indent" | "outdent"
): {
  success: boolean;
  error?: string;
  categories?: MockCategory[];
} {
  const store = loadMockStore();
  const category = store.categories.find((c) => c.id === categoryId);
  if (!category) return { success: false, error: "Category not found." };

  if (action === "indent") {
    // Find previous sibling
    const siblings = store.categories
      .filter((c) => c.parent_id === category.parent_id)
      .sort((a, b) => a.display_order - b.display_order);

    const idx = siblings.findIndex((c) => c.id === categoryId);
    if (idx <= 0) {
      return { success: false, error: "Cannot indent: No preceding sibling category to nest under." };
    }

    const prevSibling = siblings[idx - 1];
    return moveCategoryInStore(categoryId, prevSibling.id, "inside", prevSibling.id);
  }

  if (action === "outdent") {
    if (!category.parent_id) {
      return { success: false, error: "Category is already at the top level (Root)." };
    }

    const parentCategory = store.categories.find((c) => c.id === category.parent_id);
    const grandparentParentId = parentCategory ? parentCategory.parent_id : null;

    // Move after parentCategory in grandparentId list
    return moveCategoryInStore(categoryId, grandparentParentId, "after", parentCategory?.id);
  }

  return { success: false, error: "Invalid action." };
}

/**
 * Batch update category display orders and parent relationships
 */
export function reorderCategoriesInStore(
  updates: Array<{ id: string; parent_id: string | null; display_order: number }>
): {
  success: boolean;
  error?: string;
  categories?: MockCategory[];
} {
  const store = loadMockStore();

  for (const u of updates) {
    const cat = store.categories.find((c) => c.id === u.id);
    if (cat) {
      cat.parent_id = u.parent_id;
      cat.display_order = u.display_order;
      cat.updated_at = new Date().toISOString();
    }
  }

  saveMockStore(store);
  return { success: true, categories: store.categories };
}

// -----------------------------------------------------------------------------
// PRODUCT CRUD OPERATIONS WITH SCHEMA VALIDATION & PERSISTENCE
// -----------------------------------------------------------------------------

export function loadMockProducts(): MockProductDetail[] {
  return loadMockStore().products;
}

/**
 * Automatically generates a standardized, unique SKU following Kanhaiya Collection conventions.
 * Format: KC-{CAT_CODE}-{SEQ} (e.g. KC-IDL-007, KC-PJA-008, KC-ARM-009)
 * Unique across all products and variants.
 */
export function generateProductSku(categorySlugOrName?: string | null): string {
  const store = loadMockStore();
  const existingSkus = new Set<string>();

  for (const p of store.products) {
    if (p.sku) existingSkus.add(p.sku.toUpperCase().trim());
    if (Array.isArray(p.variants)) {
      for (const v of p.variants) {
        if (v.sku) existingSkus.add(v.sku.toUpperCase().trim());
      }
    }
  }

  let catPrefix = "PRD";
  if (categorySlugOrName) {
    const clean = categorySlugOrName.toUpperCase().replace(/[^A-Z]/g, "");
    if (clean.includes("IDOL") || clean.includes("MURTI") || clean.includes("KRISHNA") || clean.includes("GOPAL")) {
      catPrefix = "IDL";
    } else if (clean.includes("POOJA") || clean.includes("THALI") || clean.includes("DIYA") || clean.includes("BELL")) {
      catPrefix = "PJA";
    } else if (clean.includes("AROMA") || clean.includes("DHOOP") || clean.includes("CHANDAN") || clean.includes("SAMBRANI")) {
      catPrefix = "ARM";
    } else if (clean.includes("BRASS") || clean.includes("TEMPLE") || clean.includes("KALASH")) {
      catPrefix = "BRS";
    } else if (clean.includes("DECOR") || clean.includes("AASAN") || clean.includes("TEXTILE") || clean.includes("POSHAK")) {
      catPrefix = "DCR";
    } else if (clean.length >= 3) {
      catPrefix = clean.substring(0, 3);
    }
  }

  let seq = store.products.length + 1;
  let candidate = `KC-${catPrefix}-${String(seq).padStart(3, "0")}`;
  while (existingSkus.has(candidate)) {
    seq++;
    candidate = `KC-${catPrefix}-${String(seq).padStart(3, "0")}`;
  }

  return candidate;
}

/**
 * Automatically generates a stable, unique batch identifier in the development model.
 * NOTE: 'batch_number' is a development identifier clearly separate from the uploaded database schema.
 * Flagged for persistent database migration approval.
 * Format: BATCH-{YYYYMM}-{SEQ} (e.g. BATCH-202610-0042)
 */
export function generateProductBatchNumber(): string {
  const store = loadMockStore();
  const existingBatches = new Set<string>();

  for (const p of store.products) {
    if (p.batch_number) existingBatches.add(p.batch_number.toUpperCase().trim());
  }

  const date = new Date();
  const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;

  let seq = store.products.length + 1;
  let candidate = `BATCH-${yyyymm}-${String(seq).padStart(4, "0")}`;
  while (existingBatches.has(candidate)) {
    seq++;
    candidate = `BATCH-${yyyymm}-${String(seq).padStart(4, "0")}`;
  }

  return candidate;
}

export function upsertProductInStore(prod: Partial<MockProductDetail> & { name: string; base_price: number }): {
  success: boolean;
  error?: string;
  product?: MockProductDetail;
} {
  const store = loadMockStore();

  // 1. Required fields validation
  const name = prod.name?.trim();
  if (!name) return { success: false, error: "Product name is required." };

  const description =
    prod.description !== undefined && prod.description !== null
      ? prod.description.trim()
      : `${name} - Handcrafted authentic piece from Kanhaiya Collection.`;

  const brand = prod.brand?.trim() || "Kanhaiya Collection";

  const categoryId =
    prod.category_id && prod.category_id.trim()
      ? prod.category_id.trim()
      : store.categories[0]?.id || null;

  if (prod.base_price === undefined || isNaN(prod.base_price) || prod.base_price < 0) {
    return { success: false, error: "Base price must be a valid number greater than or equal to 0." };
  }

  if (
    prod.compare_at_price !== undefined &&
    prod.compare_at_price !== null &&
    (isNaN(prod.compare_at_price) || prod.compare_at_price < 0)
  ) {
    return { success: false, error: "Compare-at price must be greater than or equal to 0." };
  }

  if (prod.stock_quantity === undefined || isNaN(prod.stock_quantity) || prod.stock_quantity < 0) {
    return { success: false, error: "Stock quantity must be a non-negative number." };
  }

  const slug = (prod.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/^-|-$/g, "");
  if (!slug) return { success: false, error: "A valid URL slug is required." };

  // 2. Slug uniqueness check
  const duplicateSlug = store.products.find(
    (p) => p.slug.toLowerCase() === slug.toLowerCase() && p.id !== prod.id
  );
  if (duplicateSlug) {
    return {
      success: false,
      error: `A product with slug "${slug}" already exists ("${duplicateSlug.name}"). Please choose a unique slug.`,
    };
  }

  // 3. Resolve category snapshot
  const categorySnapshot = store.categories.find((c) => c.id === categoryId) || null;

  // 4. SKU and Batch Rules (auto-generated, read-only, never regenerated on edit)
  let sku = prod.sku?.trim() || null;
  let batchNumber = prod.batch_number?.trim() || null;

  if (prod.id) {
    // Existing product: preserve existing SKU and batch number
    const existing = store.products.find((p) => p.id === prod.id);
    if (!existing) {
      return { success: false, error: "Product not found." };
    }
    sku = existing.sku || sku || generateProductSku(categorySnapshot?.name || categorySnapshot?.slug);
    batchNumber = existing.batch_number || batchNumber || generateProductBatchNumber();
  } else {
    // New product: auto-generate SKU and Batch Number if not passed
    if (!sku) {
      sku = generateProductSku(categorySnapshot?.name || categorySnapshot?.slug);
    }
    if (!batchNumber) {
      batchNumber = generateProductBatchNumber();
    }
  }

  // Check SKU uniqueness across other products
  if (sku) {
    const duplicateSku = store.products.find(
      (p) => p.sku && p.sku.toLowerCase() === sku.toLowerCase() && p.id !== prod.id
    );
    if (duplicateSku) {
      return {
        success: false,
        error: `A product with SKU "${sku}" already exists ("${duplicateSku.name}"). Please ensure SKU is unique.`,
      };
    }
  }

  // 5. Image validation & Primary image rule
  const rawImages = prod.images || [];
  const sanitizedImages: MockProductImage[] = rawImages
    .filter((img) => Boolean(img.image_url?.trim()))
    .map((img, idx) => ({
      id: img.id || `img-${Date.now()}-${idx}`,
      product_id: prod.id || "temp",
      image_url: img.image_url.trim(),
      alt_text: img.alt_text?.trim() || null,
      display_order: typeof img.display_order === "number" ? img.display_order : idx + 1,
      is_primary: Boolean(img.is_primary),
      created_at: img.created_at || new Date().toISOString(),
    }));

  if (prod.is_active && sanitizedImages.length === 0) {
    return {
      success: false,
      error: "An active product must have at least one product image before publishing.",
    };
  }

  if (sanitizedImages.length > 0) {
    const primaryCount = sanitizedImages.filter((img) => img.is_primary).length;
    if (primaryCount === 0) {
      sanitizedImages[0].is_primary = true;
    } else if (primaryCount > 1) {
      // Keep only first as primary
      let foundFirst = false;
      for (const img of sanitizedImages) {
        if (img.is_primary) {
          if (!foundFirst) {
            foundFirst = true;
          } else {
            img.is_primary = false;
          }
        }
      }
    }
  }

  // 6. Variant normalization & SKU validation
  const rawVariants = prod.variants || [];
  const variantSkus = new Set<string>();
  const sanitizedVariants: MockProductVariant[] = [];

  for (let idx = 0; idx < rawVariants.length; idx++) {
    const v = rawVariants[idx];
    const vName = v.variant_name?.trim() || `Option ${idx + 1}`;
    const vSku = v.sku?.trim() || null;

    if (vSku) {
      if (variantSkus.has(vSku.toLowerCase())) {
        return { success: false, error: `Duplicate variant SKU "${vSku}". Each variant SKU must be unique.` };
      }
      variantSkus.add(vSku.toLowerCase());
    }

    if (v.price !== null && v.price !== undefined && (isNaN(v.price) || v.price < 0)) {
      return { success: false, error: `Variant "${vName}" price cannot be negative.` };
    }

    if (v.stock_quantity !== undefined && (isNaN(v.stock_quantity) || v.stock_quantity < 0)) {
      return { success: false, error: `Variant "${vName}" stock cannot be negative.` };
    }

    sanitizedVariants.push({
      id: v.id || `var-${Date.now()}-${idx}`,
      product_id: prod.id || "temp",
      variant_name: vName,
      sku: vSku,
      attributes: typeof v.attributes === "object" && v.attributes !== null ? v.attributes : {},
      price: v.price !== null && v.price !== undefined && !isNaN(v.price) ? Number(v.price) : null,
      compare_at_price:
        v.compare_at_price !== null && v.compare_at_price !== undefined && !isNaN(v.compare_at_price)
          ? Number(v.compare_at_price)
          : null,
      stock_quantity: Math.max(0, Number(v.stock_quantity) || 0),
      image_url: v.image_url?.trim() || null,
      is_active: v.is_active ?? true,
      created_at: v.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const now = new Date().toISOString();
  let savedProduct: MockProductDetail;

  if (prod.id) {
    const existingIdx = store.products.findIndex((p) => p.id === prod.id);
    if (existingIdx === -1) {
      return { success: false, error: "Product not found." };
    }
    const existing = store.products[existingIdx];
    savedProduct = {
      ...existing,
      ...prod,
      name,
      slug,
      description,
      brand,
      sku,
      batch_number: batchNumber,
      category_id: categoryId || existing.category_id || null,
      base_price: Number(prod.base_price),
      compare_at_price: prod.compare_at_price ? Number(prod.compare_at_price) : null,
      stock_quantity: Number(prod.stock_quantity) || 0,
      is_active: prod.is_active ?? true,
      is_featured_top_seller: Boolean(prod.is_featured_top_seller),
      top_seller_display_order: prod.top_seller_display_order ? Number(prod.top_seller_display_order) : null,
      meta_title: prod.meta_title?.trim() || null,
      meta_description: prod.meta_description?.trim() || null,
      updated_at: now,
      category: categorySnapshot,
      images: sanitizedImages.map((img) => ({ ...img, product_id: existing.id })),
      variants: sanitizedVariants.map((v) => ({ ...v, product_id: existing.id })),
    };
    store.products[existingIdx] = savedProduct;
  } else {
    const newId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    savedProduct = {
      id: newId,
      category_id: categoryId || null,
      name,
      slug,
      description,
      brand,
      sku,
      batch_number: batchNumber,
      base_price: Number(prod.base_price),
      compare_at_price: prod.compare_at_price ? Number(prod.compare_at_price) : null,
      stock_quantity: Number(prod.stock_quantity) || 0,
      sold_count: 0,
      is_active: prod.is_active ?? true,
      is_featured_top_seller: Boolean(prod.is_featured_top_seller),
      top_seller_display_order: prod.top_seller_display_order ? Number(prod.top_seller_display_order) : null,
      avg_rating: 0,
      review_count: 0,
      meta_title: prod.meta_title?.trim() || null,
      meta_description: prod.meta_description?.trim() || null,
      created_at: now,
      updated_at: now,
      category: categorySnapshot,
      images: sanitizedImages.map((img) => ({ ...img, product_id: newId })),
      variants: sanitizedVariants.map((v) => ({ ...v, product_id: newId })),
    };
    store.products.unshift(savedProduct);
  }

  saveMockStore(store);
  return { success: true, product: savedProduct };
}

export function deleteProductFromStore(productId: string): { success: boolean; error?: string } {
  const store = loadMockStore();
  const initialLength = store.products.length;
  store.products = store.products.filter((p) => p.id !== productId);
  if (store.products.length === initialLength) {
    return { success: false, error: "Product not found." };
  }

  // Nullify product_id in historical order items per schema ON DELETE SET NULL, preserving snapshots
  if (Array.isArray(store.orders)) {
    for (const order of store.orders) {
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.product_id === productId) {
            item.product_id = null;
          }
        }
      }
    }
  }

  // Remove from cart items if any
  if (Array.isArray((store as any).cartItems)) {
    (store as any).cartItems = (store as any).cartItems.filter(
      (c: any) => c.product_id !== productId
    );
  }

  saveMockStore(store);
  return { success: true };
}

export function archiveProductInStore(productId: string, shouldArchive: boolean): {
  success: boolean;
  error?: string;
} {
  const store = loadMockStore();
  const prod = store.products.find((p) => p.id === productId);
  if (!prod) return { success: false, error: "Product not found." };

  if (!shouldArchive) {
    // Verifying primary image before re-activating
    const hasPrimary = prod.images && prod.images.some((img) => img.is_primary && Boolean(img.image_url));
    if (!hasPrimary) {
      return {
        success: false,
        error: "Cannot activate product: No primary image is assigned. Please edit the product and select a primary image first.",
      };
    }
  }

  prod.is_active = !shouldArchive;
  prod.updated_at = new Date().toISOString();
  saveMockStore(store);
  return { success: true };
}

// -----------------------------------------------------------------------------
// DATE-RANGE FILTERING CALCULATION UTILITY
// -----------------------------------------------------------------------------

export type DateRangeOption = "today" | "7d" | "30d" | "quarter" | "all";

export interface FilteredDashboardStats {
  totalRevenue: number;
  settledRevenue: number;
  pendingRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalCategories: number; // Top-level categories where parent_id === null and is_active === true
  totalSubcategories: number; // Subcategories where parent_id !== null
  totalCustomers: number;
  newInquiries: number;
  newLeads: number;
  lowStockCount: number;
}

export function computeFilteredStats(
  store: MockAdminStore,
  range: DateRangeOption
): { stats: FilteredDashboardStats; filteredOrders: MockOrder[] } {
  const now = Date.now();
  let cutoffMs = 0;

  switch (range) {
    case "today":
      cutoffMs = now - 24 * 3600 * 1000;
      break;
    case "7d":
      cutoffMs = now - 7 * 24 * 3600 * 1000;
      break;
    case "30d":
      cutoffMs = now - 30 * 24 * 3600 * 1000;
      break;
    case "quarter":
      cutoffMs = now - 90 * 24 * 3600 * 1000;
      break;
    case "all":
    default:
      cutoffMs = 0;
      break;
  }

  // Filter orders by date range
  const filteredOrders = store.orders.filter((ord) => {
    if (cutoffMs === 0) return true;
    const time = new Date(ord.placed_at).getTime();
    return time >= cutoffMs;
  });

  // Calculate revenue from active non-cancelled, non-refunded orders
  const nonCancelledOrders = filteredOrders.filter(
    (o) => o.status !== "cancelled" && o.status !== "refunded"
  );
  const totalRevenue = nonCancelledOrders.reduce(
    (sum, o) => sum + (o.total_amount ?? o.total ?? 0),
    0
  );
  const settledRevenue = nonCancelledOrders
    .filter((o) => o.status !== "pending")
    .reduce((sum, o) => sum + (o.total_amount ?? o.total ?? 0), 0);
  const pendingRevenue = nonCancelledOrders
    .filter((o) => o.status === "pending")
    .reduce((sum, o) => sum + (o.total_amount ?? o.total ?? 0), 0);

  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter((o) => o.status === "pending").length;
  const confirmedOrders = filteredOrders.filter((o) => o.status === "confirmed").length;
  const shippedOrders = filteredOrders.filter((o) => o.status === "shipped").length;
  const deliveredOrders = filteredOrders.filter((o) => o.status === "delivered").length;
  const cancelledOrders = filteredOrders.filter((o) => o.status === "cancelled").length;
  const refundedOrders = filteredOrders.filter((o) => o.status === "refunded").length;

  const totalProducts = store.products.length;
  const activeProducts = store.products.filter((p) => p.is_active).length;
  const inactiveProducts = totalProducts - activeProducts;

  // Primary Category KPI: active top-level categories, subcategories excluded
  const totalCategories = store.categories.filter((c) => c.parent_id === null && c.is_active).length;
  const totalSubcategories = store.categories.filter((c) => c.parent_id !== null).length;

  const lowStockCount = store.products.filter((p) => p.stock_quantity <= 15).length;
  const totalCustomers = store.customers.length;

  // Filter inquiries & leads by date range
  const newInquiries = store.contactSubmissions.filter((s) => {
    if (cutoffMs === 0) return true;
    return new Date(s.created_at).getTime() >= cutoffMs;
  }).length;

  const newLeads = store.leads.filter((l) => {
    if (cutoffMs === 0) return true;
    return new Date(l.created_at).getTime() >= cutoffMs;
  }).length;

  return {
    stats: {
      totalRevenue,
      settledRevenue,
      pendingRevenue,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      refundedOrders,
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalCategories,
      totalSubcategories,
      totalCustomers,
      newInquiries,
      newLeads,
      lowStockCount,
    },
    filteredOrders,
  };
}

/**
 * Calculates primary KPI metrics directly from mock store records
 */
export function getDashboardKPIs(store: MockAdminStore) {
  const nonCancelledOrders = store.orders.filter(
    (o) => o.status !== "cancelled" && o.status !== "refunded"
  );
  const totalRevenue = nonCancelledOrders.reduce(
    (sum, o) => sum + (o.total_amount ?? o.total ?? 0),
    0
  );
  const settledRevenue = nonCancelledOrders
    .filter((o) => o.status !== "pending")
    .reduce((sum, o) => sum + (o.total_amount ?? o.total ?? 0), 0);
  const pendingRevenue = nonCancelledOrders
    .filter((o) => o.status === "pending")
    .reduce((sum, o) => sum + (o.total_amount ?? o.total ?? 0), 0);

  const totalOrders = store.orders.length;
  const pendingCount = store.orders.filter((o) => o.status === "pending").length;
  const confirmedCount = store.orders.filter((o) => o.status === "confirmed").length;
  const deliveredCount = store.orders.filter((o) => o.status === "delivered").length;

  const activeProducts = store.products.filter((p) => p.is_active).length;
  const totalProducts = store.products.length;
  const inactiveProducts = totalProducts - activeProducts;

  // Total Categories: active top-level categories, subcategories excluded
  const totalCategories = store.categories.filter((c) => c.parent_id === null && c.is_active).length;
  const totalSubcategories = store.categories.filter((c) => c.parent_id !== null).length;

  return {
    totalRevenue,
    settledRevenue,
    pendingRevenue,
    totalOrders,
    pendingCount,
    confirmedCount,
    deliveredCount,
    activeProducts,
    totalProducts,
    inactiveProducts,
    totalCategories,
    totalSubcategories,
  };
}

// -----------------------------------------------------------------------------
// ORDER AND CUSTOMER PERSISTENCE HELPERS (PHASE 4)
// -----------------------------------------------------------------------------

export function loadMockOrders(): MockOrder[] {
  const store = loadMockStore();
  return store.orders;
}

export function getMockOrderById(orderId: string): MockOrder | null {
  const store = loadMockStore();
  return store.orders.find((o) => o.id === orderId || o.order_number === orderId) || null;
}

/**
 * Transitions order status respecting business rules and schema triggers.
 * - Confirmed orders decrement stock and increment sold_count
 * - Cancelling confirmed/processing orders restocks product inventory
 */
export function updateMockOrderStatus(
  orderId: string,
  nextStatus: OrderStatus
): { success: boolean; order?: MockOrder; error?: string } {
  const store = loadMockStore();
  const order = store.orders.find((o) => o.id === orderId || o.order_number === orderId);

  if (!order) {
    return { success: false, error: `Order #${orderId} not found.` };
  }

  const currentStatus = order.status;

  if (currentStatus === nextStatus) {
    return { success: true, order };
  }

  if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
    return {
      success: false,
      error: `Invalid status transition from '${currentStatus}' to '${nextStatus}'. Orders cannot skip required fulfillment steps or re-enter confirmed status once processed.`,
    };
  }

  // 1. Stock Validation before Approval: Verify adequate inventory before confirming
  if (currentStatus === "pending" && nextStatus === "confirmed") {
    for (const item of order.items) {
      if (item.product_id) {
        const product = store.products.find((p) => p.id === item.product_id);
        if (!product) {
          return { success: false, error: `Product '${item.product_name}' no longer exists in catalog.` };
        }
        if (item.variant_id && product.variants) {
          const variant = product.variants.find((v) => v.id === item.variant_id);
          if (variant && variant.stock_quantity < item.quantity) {
            return {
              success: false,
              error: `Insufficient stock for variant '${variant.variant_name}' (${product.name}). Required: ${item.quantity}, Available: ${variant.stock_quantity}.`,
            };
          }
        }
        if (product.stock_quantity < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for '${product.name}'. Required: ${item.quantity}, Available: ${product.stock_quantity}.`,
          };
        }
      }
    }
  }

  // 2. Schema Trigger Simulation: trg_order_confirmation
  // When flipping from 'pending' to 'confirmed', decrement stock and increment sold_count
  // Confirming an order must not decrement stock twice.
  if (currentStatus === "pending" && nextStatus === "confirmed" && !order.stock_decremented) {
    for (const item of order.items) {
      if (item.product_id) {
        const product = store.products.find((p) => p.id === item.product_id);
        if (product) {
          product.stock_quantity = Math.max(0, product.stock_quantity - item.quantity);
          product.sold_count = (product.sold_count || 0) + item.quantity;
          if (item.variant_id && product.variants) {
            const variant = product.variants.find((v) => v.id === item.variant_id);
            if (variant) {
              variant.stock_quantity = Math.max(0, variant.stock_quantity - item.quantity);
            }
          }
        }
      }
    }
    order.stock_decremented = true;
  }

  // 3. Schema Rollback Simulation: When cancelling an order that was previously confirmed/processing
  // Cancelling an already confirmed order must not silently restore stock unless an explicit, tested reversal rule is implemented.
  if (
    (currentStatus === "confirmed" || currentStatus === "processing") &&
    nextStatus === "cancelled" &&
    order.stock_decremented
  ) {
    for (const item of order.items) {
      if (item.product_id) {
        const product = store.products.find((p) => p.id === item.product_id);
        if (product) {
          product.stock_quantity = product.stock_quantity + item.quantity;
          product.sold_count = Math.max(0, (product.sold_count || 0) - item.quantity);
          if (item.variant_id && product.variants) {
            const variant = product.variants.find((v) => v.id === item.variant_id);
            if (variant) {
              variant.stock_quantity = variant.stock_quantity + item.quantity;
            }
          }
        }
      }
    }
    order.stock_decremented = false;
  }

  order.status = nextStatus;
  order.updated_at = new Date().toISOString();
  order.can_cancel = nextStatus === "pending" || nextStatus === "confirmed";
  order.admin_action_taken = true;

  if (!order.action_history) {
    order.action_history = [];
  }
  order.action_history.push({
    action: nextStatus === "confirmed" ? "Approve Order" : nextStatus === "cancelled" ? "Cancel Order" : `Transition to ${nextStatus}`,
    status: nextStatus,
    timestamp: new Date().toISOString(),
  });

  saveMockStore(store);
  return { success: true, order };
}

/**
 * Computes Phase 2 Orders KPI Cards directly from mock store records:
 * 1. Total Orders: all orders in repository
 * 2. New Orders: status pending with no recorded admin action
 * 3. Delivered Orders: status delivered
 * 4. In Progress Orders: confirmed, processing, or shipped
 */
export function getOrderKPIs(orders: (MockOrder | OrderDetails)[]) {
  const totalOrders = orders.length;
  const newOrders = orders.filter(
    (o) => o.status === "pending" && !o.admin_action_taken
  ).length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const inProgressOrders = orders.filter(
    (o) => o.status === "confirmed" || o.status === "processing" || o.status === "shipped"
  ).length;

  return {
    totalOrders,
    newOrders,
    deliveredOrders,
    inProgressOrders,
  };
}

/**
 * Saves administrative order notes to the mock order record
 */
export function saveMockOrderNote(
  orderId: string,
  note: string
): { success: boolean; order?: MockOrder; error?: string } {
  const store = loadMockStore();
  const order = store.orders.find((o) => o.id === orderId || o.order_number === orderId);
  if (!order) {
    return { success: false, error: `Order #${orderId} not found.` };
  }
  order.notes = note;
  order.updated_at = new Date().toISOString();
  saveMockStore(store);
  return { success: true, order };
}

export function updateMockOrderPaymentStatus(
  orderId: string,
  nextPaymentStatus: PaymentStatus
): { success: boolean; order?: MockOrder; error?: string } {
  const store = loadMockStore();
  const order = store.orders.find((o) => o.id === orderId || o.order_number === orderId);

  if (!order) {
    return { success: false, error: `Order #${orderId} not found.` };
  }

  const currentPaymentStatus = order.payment_status;

  if (currentPaymentStatus === nextPaymentStatus) {
    return { success: true, order };
  }

  if (!canTransitionPaymentStatus(currentPaymentStatus, nextPaymentStatus)) {
    return {
      success: false,
      error: `Invalid payment transition from '${currentPaymentStatus}' to '${nextPaymentStatus}'.`,
    };
  }

  order.payment_status = nextPaymentStatus;
  order.updated_at = new Date().toISOString();

  saveMockStore(store);
  return { success: true, order };
}

export const updateMockPaymentStatus = updateMockOrderPaymentStatus;

export function loadMockCustomers(): MockCustomer[] {
  const store = loadMockStore();
  return store.customers;
}

export function getMockCustomerById(customerId: string): MockCustomer | null {
  const store = loadMockStore();
  return (
    store.customers.find((c) => c.id === customerId || c.email === customerId) || null
  );
}

export function updateMockUserRole(
  userId: string,
  newRole: "admin" | "user"
): { success: boolean; customer?: MockCustomer; error?: string } {
  if (newRole !== "admin" && newRole !== "user") {
    return { success: false, error: `Invalid role '${newRole}'. Only 'admin' and 'user' roles are permitted by schema.` };
  }

  const store = loadMockStore();
  const customer = store.customers.find((c) => c.id === userId);

  if (!customer) {
    return { success: false, error: `Customer profile '${userId}' was not found.` };
  }

  customer.role = newRole;
  customer.updated_at = new Date().toISOString();

  saveMockStore(store);
  return { success: true, customer };
}

export function getMockCustomerOrders(userId: string): MockOrder[] {
  const store = loadMockStore();
  return store.orders
    .filter((o) => o.user_id === userId || o.customer?.id === userId)
    .sort((a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime());
}

// -----------------------------------------------------------------------------
// PHASE 5: SCHEMA-ALIGNED REVIEWS & SYSTEM RATING ROLLUP
// Matches schema trigger refresh_product_rating in schema ecomm.txt:
// Recalculates products.avg_rating = round(avg(rating), 1) and products.review_count = count(*)
// from approved reviews only.
// -----------------------------------------------------------------------------

export function refreshProductRatingRollup(
  productId: string,
  store: MockAdminStore
): void {
  const product = store.products.find((p) => p.id === productId);
  if (!product) return;

  const approvedReviews = (store.reviews || []).filter(
    (r) => r.product_id === productId && r.is_approved === true
  );

  if (approvedReviews.length === 0) {
    product.avg_rating = 0;
    product.review_count = 0;
  } else {
    const sum = approvedReviews.reduce(
      (acc, r) => acc + (Number(r.rating) || 0),
      0
    );
    product.avg_rating = Number((sum / approvedReviews.length).toFixed(1));
    product.review_count = approvedReviews.length;
  }
}

export function loadMockReviews(filterParams?: AdminReviewFilterParams): {
  reviews: EnrichedMockReview[];
  stats: AdminReviewStats;
} {
  const store = loadMockStore();
  const allReviews = store.reviews || [];

  const enriched: EnrichedMockReview[] = allReviews.map((r) => {
    const product = store.products.find((p) => p.id === r.product_id);
    const customer = store.customers.find((c) => c.id === r.user_id);

    let orderItem: MockOrderItem | undefined;
    let order: MockOrder | undefined;

    if (r.order_item_id) {
      for (const o of store.orders) {
        const item = (o.items as MockOrderItem[])?.find((it) => it.id === r.order_item_id);
        if (item) {
          orderItem = item;
          order = o;
          break;
        }
      }
    }

    const isVerified = Boolean(r.order_item_id || orderItem);

    return {
      ...r,
      product_name: product?.name || "Sacred Temple Item",
      product_slug: product?.slug || "sacred-item",
      product_image: product?.images?.[0]?.image_url || null,
      product_base_price: product?.base_price,
      product_stock: product?.stock_quantity,
      product_avg_rating: product?.avg_rating,
      product_review_count: product?.review_count,
      author_name: customer?.full_name || "Devotee Customer",
      author_email: customer?.email || null,
      author_phone: customer?.phone || null,
      author_avatar: customer?.avatar_url || null,
      is_verified_purchase: isVerified,
      order_id: order?.id || null,
      order_number: order?.order_number || null,
      order_status: order?.status || null,
      order_placed_at: order?.placed_at || null,
      variant_name: orderItem?.variant_name || null,
      unit_price: orderItem?.unit_price ?? null,
      quantity: orderItem?.quantity ?? null,
    };
  });

  let filtered = [...enriched];

  if (filterParams?.status === "pending") {
    filtered = filtered.filter((r) => !r.is_approved);
  } else if (filterParams?.status === "approved") {
    filtered = filtered.filter((r) => r.is_approved);
  }

  if (filterParams?.verification === "verified") {
    filtered = filtered.filter((r) => r.is_verified_purchase);
  } else if (filterParams?.verification === "unverified") {
    filtered = filtered.filter((r) => !r.is_verified_purchase);
  }

  if (filterParams?.rating && filterParams.rating !== "all") {
    filtered = filtered.filter((r) => r.rating === Number(filterParams.rating));
  }

  if (filterParams?.searchQuery?.trim()) {
    const q = filterParams.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.product_name.toLowerCase().includes(q) ||
        r.author_name.toLowerCase().includes(q) ||
        (r.review_text && r.review_text.toLowerCase().includes(q)) ||
        (r.order_number && r.order_number.toLowerCase().includes(q))
    );
  }

  filtered.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const approvedReviews = allReviews.filter((r) => r.is_approved);
  const avgRating =
    approvedReviews.length > 0
      ? Number(
          (
            approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
            approvedReviews.length
          ).toFixed(1)
        )
      : 0;

  const stats: AdminReviewStats = {
    totalCount: allReviews.length,
    pendingCount: allReviews.filter((r) => !r.is_approved).length,
    approvedCount: approvedReviews.length,
    averageRating: avgRating,
    verifiedCount: enriched.filter((r) => r.is_verified_purchase).length,
  };

  return { reviews: filtered, stats };
}

export function getMockReviewById(reviewId: string): EnrichedMockReview | null {
  const { reviews } = loadMockReviews();
  return reviews.find((r) => r.id === reviewId) || null;
}

export function approveMockReview(reviewId: string): {
  success: boolean;
  review?: MockReview;
  error?: string;
} {
  const store = loadMockStore();
  const review = (store.reviews || []).find((r) => r.id === reviewId);
  if (!review) {
    return { success: false, error: `Review '${reviewId}' was not found.` };
  }

  review.is_approved = true;
  refreshProductRatingRollup(review.product_id, store);

  const product = store.products.find((p) => p.id === review.product_id);
  store.activities.unshift({
    id: `act-${Date.now()}`,
    title: "Review Approved",
    description: `Approved review for '${product?.name || "Product"}'. Rating updated via schema trigger.`,
    type: "review",
    timestamp: new Date().toISOString(),
  });

  saveMockStore(store);
  return { success: true, review };
}

export function unapproveMockReview(reviewId: string): {
  success: boolean;
  review?: MockReview;
  error?: string;
} {
  const store = loadMockStore();
  const review = (store.reviews || []).find((r) => r.id === reviewId);
  if (!review) {
    return { success: false, error: `Review '${reviewId}' was not found.` };
  }

  review.is_approved = false;
  refreshProductRatingRollup(review.product_id, store);

  const product = store.products.find((p) => p.id === review.product_id);
  store.activities.unshift({
    id: `act-${Date.now()}`,
    title: "Review Moderation: Rejected/Unapproved",
    description: `Revoked approval for '${product?.name || "Product"}'. Excluded from product rating rollups.`,
    type: "review",
    timestamp: new Date().toISOString(),
  });

  saveMockStore(store);
  return { success: true, review };
}

export function deleteMockReview(reviewId: string): {
  success: boolean;
  error?: string;
} {
  const store = loadMockStore();
  const index = (store.reviews || []).findIndex((r) => r.id === reviewId);
  if (index === -1) {
    return { success: false, error: `Review '${reviewId}' was not found.` };
  }

  const [deleted] = store.reviews.splice(index, 1);
  refreshProductRatingRollup(deleted.product_id, store);

  const product = store.products.find((p) => p.id === deleted.product_id);
  store.activities.unshift({
    id: `act-${Date.now()}`,
    title: "Review Deleted",
    description: `Deleted customer review for '${product?.name || "Product"}'. Rating rollups refreshed.`,
    type: "review",
    timestamp: new Date().toISOString(),
  });

  saveMockStore(store);
  return { success: true };
}

export function createMockReview(
  reviewInput: Omit<MockReview, "id" | "created_at"> & { id?: string }
): { success: boolean; review?: MockReview; error?: string } {
  const rating = Number(reviewInput.rating);
  if (!rating || rating < 1 || rating > 5) {
    return { success: false, error: "Rating must be a whole number between 1 and 5." };
  }

  const store = loadMockStore();
  if (!store.reviews) store.reviews = [];

  // Enforce schema UNIQUE (product_id, user_id) constraint
  const existing = store.reviews.find(
    (r) => r.product_id === reviewInput.product_id && r.user_id === reviewInput.user_id
  );
  if (existing) {
    return {
      success: false,
      error: "A devotee customer may only submit one review per product per schema constraints.",
    };
  }

  const newReview: MockReview = {
    id: reviewInput.id || `rev-${Date.now()}`,
    product_id: reviewInput.product_id,
    user_id: reviewInput.user_id,
    order_item_id: reviewInput.order_item_id || null,
    rating: Math.round(rating),
    review_text: reviewInput.review_text?.trim() || null,
    images: Array.isArray(reviewInput.images) ? reviewInput.images : [],
    is_approved: Boolean(reviewInput.is_approved),
    created_at: new Date().toISOString(),
  };

  store.reviews.push(newReview);
  refreshProductRatingRollup(newReview.product_id, store);
  saveMockStore(store);
  return { success: true, review: newReview };
}

// -----------------------------------------------------------------------------
// PHASE 5: HOMEPAGE SECTIONS MANAGEMENT
// Controls: 'banner' | 'shop_by_category' | 'continue_browsing' | 'top_sellers' | 'category_products' | 'wall_of_love'
// -----------------------------------------------------------------------------

export function loadMockHomepageSections(): MockHomepageSection[] {
  const store = loadMockStore();
  const sections = store.homepageSections || SEED_HOMEPAGE_SECTIONS;
  return [...sections].sort((a, b) => a.display_order - b.display_order);
}

export function updateMockHomepageSections(
  sections: { key: string; is_enabled: boolean; display_order: number }[]
): { success: boolean; sections?: MockHomepageSection[]; error?: string } {
  if (!Array.isArray(sections) || sections.length === 0) {
    return { success: false, error: "Sections list cannot be empty." };
  }

  const validKeys = [
    "banner",
    "shop_by_category",
    "continue_browsing",
    "top_sellers",
    "category_products",
    "wall_of_love",
  ];

  const store = loadMockStore();
  const now = new Date().toISOString();

  const updatedSections: MockHomepageSection[] = sections.map((s, idx) => ({
    key: s.key,
    is_enabled: Boolean(s.is_enabled),
    display_order: Number(s.display_order) || idx + 1,
    updated_at: now,
  }));

  for (const key of validKeys) {
    if (!updatedSections.find((s) => s.key === key)) {
      updatedSections.push({
        key,
        is_enabled: true,
        display_order: updatedSections.length + 1,
        updated_at: now,
      });
    }
  }

  updatedSections.sort((a, b) => a.display_order - b.display_order);
  store.homepageSections = updatedSections;
  saveMockStore(store);
  return { success: true, sections: updatedSections };
}

// -----------------------------------------------------------------------------
// PHASE 5: BANNERS MANAGEMENT
// -----------------------------------------------------------------------------

export function loadMockBanners(): MockBanner[] {
  const store = loadMockStore();
  const banners = store.banners || SEED_BANNERS;
  return [...banners].sort((a, b) => a.display_order - b.display_order);
}

export function saveMockBanner(
  payload: Partial<MockBanner> & { image_url: string }
): { success: boolean; banner?: MockBanner; error?: string } {
  const imageUrl = payload.image_url?.trim();
  if (!imageUrl) {
    return { success: false, error: "Banner image URL is required." };
  }

  if (
    !imageUrl.startsWith("http://") &&
    !imageUrl.startsWith("https://") &&
    !imageUrl.startsWith("/")
  ) {
    return {
      success: false,
      error: "Banner image URL must start with http://, https://, or /",
    };
  }

  const linkUrl = payload.link_url?.trim() || null;
  if (
    linkUrl &&
    !linkUrl.startsWith("/") &&
    !linkUrl.startsWith("http://") &&
    !linkUrl.startsWith("https://")
  ) {
    return {
      success: false,
      error: "Destination link must be a valid path (starting with /) or full URL (http://, https://).",
    };
  }

  const store = loadMockStore();
  if (!store.banners) store.banners = [...SEED_BANNERS];

  const now = new Date().toISOString();
  let banner: MockBanner;

  if (payload.id) {
    const existing = store.banners.find((b) => b.id === payload.id);
    if (!existing) {
      return { success: false, error: `Banner '${payload.id}' was not found.` };
    }
    existing.image_url = imageUrl;
    existing.title = payload.title?.trim() || null;
    existing.link_url = linkUrl;
    existing.display_order = Number(payload.display_order) ?? existing.display_order;
    existing.is_active = payload.is_active !== undefined ? Boolean(payload.is_active) : existing.is_active;
    existing.updated_at = now;
    banner = existing;
  } else {
    banner = {
      id: `ban-${Date.now()}`,
      image_url: imageUrl,
      title: payload.title?.trim() || null,
      link_url: linkUrl,
      display_order: Number(payload.display_order) || (store.banners.length + 1),
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      created_at: now,
      updated_at: now,
    };
    store.banners.push(banner);
  }

  store.banners.sort((a, b) => a.display_order - b.display_order);
  saveMockStore(store);
  return { success: true, banner };
}

export function deleteMockBanner(bannerId: string): { success: boolean; error?: string } {
  const store = loadMockStore();
  if (!store.banners) store.banners = [...SEED_BANNERS];

  const index = store.banners.findIndex((b) => b.id === bannerId);
  if (index === -1) {
    return { success: false, error: `Banner '${bannerId}' was not found.` };
  }

  store.banners.splice(index, 1);
  saveMockStore(store);
  return { success: true };
}

export function toggleMockBannerStatus(bannerId: string): {
  success: boolean;
  banner?: MockBanner;
  error?: string;
} {
  const store = loadMockStore();
  if (!store.banners) store.banners = [...SEED_BANNERS];

  const banner = store.banners.find((b) => b.id === bannerId);
  if (!banner) {
    return { success: false, error: `Banner '${bannerId}' was not found.` };
  }

  banner.is_active = !banner.is_active;
  banner.updated_at = new Date().toISOString();
  saveMockStore(store);
  return { success: true, banner };
}

export function reorderMockBanners(orderedIds: string[]): {
  success: boolean;
  banners?: MockBanner[];
  error?: string;
} {
  const store = loadMockStore();
  if (!store.banners) store.banners = [...SEED_BANNERS];

  const now = new Date().toISOString();
  orderedIds.forEach((id, index) => {
    const banner = store.banners.find((b) => b.id === id);
    if (banner) {
      banner.display_order = index + 1;
      banner.updated_at = now;
    }
  });

  store.banners.sort((a, b) => a.display_order - b.display_order);
  saveMockStore(store);
  return { success: true, banners: store.banners };
}

// -----------------------------------------------------------------------------
// PHASE 5: OFFER AND DISCOUNT ANNOUNCEMENTS (Text-Only Top Ribbon)
// -----------------------------------------------------------------------------

export function loadMockAnnouncements(): MockAnnouncement[] {
  const store = loadMockStore();
  const announcements = store.announcements || SEED_ANNOUNCEMENTS;
  return [...announcements].sort((a, b) => a.display_order - b.display_order);
}

export function saveMockAnnouncement(payload: {
  id?: string;
  text: string;
  is_active?: boolean;
  display_order?: number;
}): { success: boolean; announcement?: MockAnnouncement; error?: string } {
  const text = payload.text?.trim();
  if (!text) {
    return { success: false, error: "Announcement text is required." };
  }

  // Enforce text-only requirement: no image tags, markdown images, or data URIs
  if (
    text.includes("<img") ||
    text.includes("<svg") ||
    text.includes("data:image") ||
    /!\[.*?\]\(.*?\)/.test(text)
  ) {
    return {
      success: false,
      error: "Announcements must contain text only. Images, icons, and HTML media are not allowed.",
    };
  }

  const store = loadMockStore();
  if (!store.announcements) store.announcements = [...SEED_ANNOUNCEMENTS];

  const now = new Date().toISOString();
  let announcement: MockAnnouncement;

  if (payload.id) {
    const existing = store.announcements.find((a) => a.id === payload.id);
    if (!existing) {
      return { success: false, error: `Announcement '${payload.id}' was not found.` };
    }
    existing.text = text;
    existing.is_active = payload.is_active !== undefined ? Boolean(payload.is_active) : existing.is_active;
    existing.display_order = Number(payload.display_order) ?? existing.display_order;
    existing.updated_at = now;
    announcement = existing;
  } else {
    announcement = {
      id: `ann-${Date.now()}`,
      text,
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      display_order: Number(payload.display_order) || (store.announcements.length + 1),
      created_at: now,
      updated_at: now,
    };
    store.announcements.push(announcement);
  }

  store.announcements.sort((a, b) => a.display_order - b.display_order);
  saveMockStore(store);
  return { success: true, announcement };
}

export function deleteMockAnnouncement(id: string): { success: boolean; error?: string } {
  const store = loadMockStore();
  if (!store.announcements) store.announcements = [...SEED_ANNOUNCEMENTS];

  const index = store.announcements.findIndex((a) => a.id === id);
  if (index === -1) {
    return { success: false, error: `Announcement '${id}' was not found.` };
  }

  store.announcements.splice(index, 1);
  saveMockStore(store);
  return { success: true };
}

export function toggleMockAnnouncementStatus(id: string): {
  success: boolean;
  announcement?: MockAnnouncement;
  error?: string;
} {
  const store = loadMockStore();
  if (!store.announcements) store.announcements = [...SEED_ANNOUNCEMENTS];

  const announcement = store.announcements.find((a) => a.id === id);
  if (!announcement) {
    return { success: false, error: `Announcement '${id}' was not found.` };
  }

  announcement.is_active = !announcement.is_active;
  announcement.updated_at = new Date().toISOString();
  saveMockStore(store);
  return { success: true, announcement };
}

export function reorderMockAnnouncements(orderedIds: string[]): {
  success: boolean;
  announcements?: MockAnnouncement[];
  error?: string;
} {
  const store = loadMockStore();
  if (!store.announcements) store.announcements = [...SEED_ANNOUNCEMENTS];

  const now = new Date().toISOString();
  orderedIds.forEach((id, index) => {
    const item = store.announcements.find((a) => a.id === id);
    if (item) {
      item.display_order = index + 1;
      item.updated_at = now;
    }
  });

  store.announcements.sort((a, b) => a.display_order - b.display_order);
  saveMockStore(store);
  return { success: true, announcements: store.announcements };
}

// -----------------------------------------------------------------------------
// PHASE 5: FESTIVE DISCOUNT CAMPAIGNS MANAGEMENT
// -----------------------------------------------------------------------------

export function loadMockFestiveCampaigns(): MockFestiveCampaign[] {
  const store = loadMockStore();
  const campaigns = store.festiveCampaigns || SEED_FESTIVE_CAMPAIGNS;
  return [...campaigns].sort((a, b) => a.display_order - b.display_order);
}

export function saveMockFestiveCampaign(payload: {
  id?: string;
  name: string;
  description: string;
  image_url?: string | null;
  product_ids: string[];
  discount_tag?: string | null;
  discount_percent?: number | null;
  is_active?: boolean;
  display_order?: number;
}): { success: boolean; campaign?: MockFestiveCampaign; error?: string } {
  const name = payload.name?.trim();
  if (!name) {
    return { success: false, error: "Campaign name is required." };
  }

  const description = payload.description?.trim();
  if (!description) {
    return { success: false, error: "Campaign offer description is required." };
  }

  // Validate discount percentage if supplied (must be 0-90%)
  let discountPercent: number | null = null;
  if (payload.discount_percent !== undefined && payload.discount_percent !== null && payload.discount_percent !== ("" as any)) {
    const val = Number(payload.discount_percent);
    if (isNaN(val) || val < 0 || val > 90) {
      return {
        success: false,
        error: "Discount percentage must be a valid number between 0% and 90%.",
      };
    }
    discountPercent = val > 0 ? val : null;
  }

  const store = loadMockStore();
  if (!store.festiveCampaigns) store.festiveCampaigns = [...SEED_FESTIVE_CAMPAIGNS];

  // Validate selected product IDs against shared product repository
  const validProductIds = Array.isArray(payload.product_ids)
    ? payload.product_ids.filter((id) => store.products.some((p) => p.id === id))
    : [];

  const imageUrl = payload.image_url?.trim() || null;
  if (
    imageUrl &&
    !imageUrl.startsWith("http://") &&
    !imageUrl.startsWith("https://") &&
    !imageUrl.startsWith("/")
  ) {
    return {
      success: false,
      error: "Campaign image URL must start with http://, https://, or /",
    };
  }

  const now = new Date().toISOString();
  let campaign: MockFestiveCampaign;

  if (payload.id) {
    const existing = store.festiveCampaigns.find((c) => c.id === payload.id);
    if (!existing) {
      return { success: false, error: `Campaign '${payload.id}' was not found.` };
    }
    existing.name = name;
    existing.description = description;
    existing.image_url = imageUrl;
    existing.product_ids = validProductIds;
    existing.discount_tag = payload.discount_tag?.trim() || null;
    existing.discount_percent = discountPercent;
    existing.is_active = payload.is_active !== undefined ? Boolean(payload.is_active) : existing.is_active;
    existing.display_order = Number(payload.display_order) ?? existing.display_order;
    existing.updated_at = now;
    campaign = existing;
  } else {
    campaign = {
      id: `camp-${Date.now()}`,
      name,
      description,
      image_url: imageUrl,
      product_ids: validProductIds,
      discount_tag: payload.discount_tag?.trim() || null,
      discount_percent: discountPercent,
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      display_order: Number(payload.display_order) || (store.festiveCampaigns.length + 1),
      created_at: now,
      updated_at: now,
    };
    store.festiveCampaigns.push(campaign);
  }

  store.festiveCampaigns.sort((a, b) => a.display_order - b.display_order);
  saveMockStore(store);
  return { success: true, campaign };
}

export function deleteMockFestiveCampaign(id: string): { success: boolean; error?: string } {
  const store = loadMockStore();
  if (!store.festiveCampaigns) store.festiveCampaigns = [...SEED_FESTIVE_CAMPAIGNS];

  const index = store.festiveCampaigns.findIndex((c) => c.id === id);
  if (index === -1) {
    return { success: false, error: `Campaign '${id}' was not found.` };
  }

  // NOTE: Deleting a campaign removes the campaign configuration only.
  // Catalog products in store.products are strictly preserved.
  store.festiveCampaigns.splice(index, 1);
  saveMockStore(store);
  return { success: true };
}

export function toggleMockFestiveCampaignStatus(id: string): {
  success: boolean;
  campaign?: MockFestiveCampaign;
  error?: string;
} {
  const store = loadMockStore();
  if (!store.festiveCampaigns) store.festiveCampaigns = [...SEED_FESTIVE_CAMPAIGNS];

  const campaign = store.festiveCampaigns.find((c) => c.id === id);
  if (!campaign) {
    return { success: false, error: `Campaign '${id}' was not found.` };
  }

  campaign.is_active = !campaign.is_active;
  campaign.updated_at = new Date().toISOString();
  saveMockStore(store);
  return { success: true, campaign };
}

export function reorderMockFestiveCampaigns(orderedIds: string[]): {
  success: boolean;
  campaigns?: MockFestiveCampaign[];
  error?: string;
} {
  const store = loadMockStore();
  if (!store.festiveCampaigns) store.festiveCampaigns = [...SEED_FESTIVE_CAMPAIGNS];

  const now = new Date().toISOString();
  orderedIds.forEach((id, index) => {
    const item = store.festiveCampaigns.find((c) => c.id === id);
    if (item) {
      item.display_order = index + 1;
      item.updated_at = now;
    }
  });

  store.festiveCampaigns.sort((a, b) => a.display_order - b.display_order);
  saveMockStore(store);
  return { success: true, campaigns: store.festiveCampaigns };
}

// -----------------------------------------------------------------------------
// PHASE 5: TESTIMONIALS MANAGEMENT (Wall of Love)
// -----------------------------------------------------------------------------

export function loadMockTestimonials(): MockTestimonial[] {
  const store = loadMockStore();
  const testimonials = store.testimonials || SEED_TESTIMONIALS;
  return [...testimonials].sort((a, b) => a.display_order - b.display_order);
}

export function saveMockTestimonial(
  payload: Partial<MockTestimonial> & { customer_name: string; content: string }
): { success: boolean; testimonial?: MockTestimonial; error?: string } {
  const customerName = payload.customer_name?.trim();
  if (!customerName || customerName.length < 2) {
    return { success: false, error: "Customer name is required (minimum 2 characters)." };
  }

  const content = payload.content?.trim();
  if (!content || content.length < 10) {
    return { success: false, error: "Testimonial review content is required (minimum 10 characters)." };
  }

  let rating = payload.rating !== undefined && payload.rating !== null ? Number(payload.rating) : null;
  if (rating !== null && (rating < 1 || rating > 5)) {
    return { success: false, error: "Rating must be between 1 and 5 stars." };
  }

  const store = loadMockStore();
  if (!store.testimonials) store.testimonials = [...SEED_TESTIMONIALS];

  const now = new Date().toISOString();
  let testimonial: MockTestimonial;

  if (payload.id) {
    const existing = store.testimonials.find((t) => t.id === payload.id);
    if (!existing) {
      return { success: false, error: `Testimonial '${payload.id}' was not found.` };
    }
    existing.customer_name = customerName;
    existing.designation = payload.designation?.trim() || null;
    existing.avatar_url = payload.avatar_url?.trim() || null;
    existing.content = content;
    existing.rating = rating;
    existing.display_order = Number(payload.display_order) ?? existing.display_order;
    existing.is_active = payload.is_active !== undefined ? Boolean(payload.is_active) : existing.is_active;
    existing.updated_at = now;
    testimonial = existing;
  } else {
    testimonial = {
      id: `test-${Date.now()}`,
      customer_name: customerName,
      designation: payload.designation?.trim() || null,
      avatar_url: payload.avatar_url?.trim() || null,
      content: content,
      rating,
      display_order: Number(payload.display_order) || (store.testimonials.length + 1),
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      created_at: now,
      updated_at: now,
    };
    store.testimonials.push(testimonial);
  }

  store.testimonials.sort((a, b) => a.display_order - b.display_order);
  saveMockStore(store);
  return { success: true, testimonial };
}

export function deleteMockTestimonial(testimonialId: string): { success: boolean; error?: string } {
  const store = loadMockStore();
  if (!store.testimonials) store.testimonials = [...SEED_TESTIMONIALS];

  const index = store.testimonials.findIndex((t) => t.id === testimonialId);
  if (index === -1) {
    return { success: false, error: `Testimonial '${testimonialId}' was not found.` };
  }

  store.testimonials.splice(index, 1);
  saveMockStore(store);
  return { success: true };
}

export function toggleMockTestimonialStatus(testimonialId: string): {
  success: boolean;
  testimonial?: MockTestimonial;
  error?: string;
} {
  const store = loadMockStore();
  if (!store.testimonials) store.testimonials = [...SEED_TESTIMONIALS];

  const testimonial = store.testimonials.find((t) => t.id === testimonialId);
  if (!testimonial) {
    return { success: false, error: `Testimonial '${testimonialId}' was not found.` };
  }

  testimonial.is_active = !testimonial.is_active;
  testimonial.updated_at = new Date().toISOString();
  saveMockStore(store);
  return { success: true, testimonial };
}

export function reorderMockTestimonials(orderedIds: string[]): {
  success: boolean;
  testimonials?: MockTestimonial[];
  error?: string;
} {
  const store = loadMockStore();
  if (!store.testimonials) store.testimonials = [...SEED_TESTIMONIALS];

  const now = new Date().toISOString();
  orderedIds.forEach((id, index) => {
    const testimonial = store.testimonials.find((t) => t.id === id);
    if (testimonial) {
      testimonial.display_order = index + 1;
      testimonial.updated_at = now;
    }
  });

  store.testimonials.sort((a, b) => a.display_order - b.display_order);
  saveMockStore(store);
  return { success: true, testimonials: store.testimonials };
}

// -----------------------------------------------------------------------------
// PHASE 6A: ABOUT US CONTENT BLOCKS (about_us_sections in schema ecomm.txt)
// -----------------------------------------------------------------------------

export function loadMockAboutSections(): MockAboutSection[] {
  const store = loadMockStore();
  const sections = store.aboutUsSections || SEED_ABOUT_SECTIONS;
  return [...sections].sort((a, b) => a.display_order - b.display_order);
}

export function saveMockAboutSection(
  payload: Partial<MockAboutSection>
): { success: boolean; section?: MockAboutSection; error?: string } {
  const heading = payload.heading?.trim() || null;
  const body = payload.body?.trim() || null;

  if (!heading && !body) {
    return { success: false, error: "Please provide at least a section heading or body description." };
  }

  const store = loadMockStore();
  if (!store.aboutUsSections) store.aboutUsSections = [...SEED_ABOUT_SECTIONS];

  const now = new Date().toISOString();
  let section: MockAboutSection;

  if (payload.id) {
    const existing = store.aboutUsSections.find((s) => s.id === payload.id);
    if (!existing) {
      return { success: false, error: `About section '${payload.id}' was not found.` };
    }
    existing.heading = heading;
    existing.subheading = payload.subheading?.trim() || null;
    existing.body = body;
    existing.image_url = payload.image_url?.trim() || null;
    existing.display_order = Number(payload.display_order) ?? existing.display_order;
    existing.is_active = payload.is_active !== undefined ? Boolean(payload.is_active) : existing.is_active;
    existing.updated_at = now;
    section = existing;
  } else {
    section = {
      id: `about-${Date.now()}`,
      heading,
      subheading: payload.subheading?.trim() || null,
      body,
      image_url: payload.image_url?.trim() || null,
      display_order: Number(payload.display_order) || (store.aboutUsSections.length + 1),
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      created_at: now,
      updated_at: now,
    };
    store.aboutUsSections.push(section);
  }

  store.aboutUsSections.sort((a, b) => a.display_order - b.display_order);
  saveMockStore(store);
  return { success: true, section };
}

export function deleteMockAboutSection(sectionId: string): { success: boolean; error?: string } {
  const store = loadMockStore();
  if (!store.aboutUsSections) store.aboutUsSections = [...SEED_ABOUT_SECTIONS];

  const index = store.aboutUsSections.findIndex((s) => s.id === sectionId);
  if (index === -1) {
    return { success: false, error: `About section '${sectionId}' was not found.` };
  }

  store.aboutUsSections.splice(index, 1);
  saveMockStore(store);
  return { success: true };
}

export function toggleMockAboutSectionStatus(
  sectionId: string,
  explicitActive?: boolean
): {
  success: boolean;
  section?: MockAboutSection;
  error?: string;
} {
  const store = loadMockStore();
  if (!store.aboutUsSections) store.aboutUsSections = [...SEED_ABOUT_SECTIONS];

  const section = store.aboutUsSections.find((s) => s.id === sectionId);
  if (!section) {
    return { success: false, error: `About section '${sectionId}' was not found.` };
  }

  section.is_active = explicitActive !== undefined ? explicitActive : !section.is_active;
  section.updated_at = new Date().toISOString();
  saveMockStore(store);
  return { success: true, section };
}

export function reorderMockAboutSections(orderedIds: string[]): {
  success: boolean;
  sections?: MockAboutSection[];
  error?: string;
} {
  const store = loadMockStore();
  if (!store.aboutUsSections) store.aboutUsSections = [...SEED_ABOUT_SECTIONS];

  const now = new Date().toISOString();
  orderedIds.forEach((id, index) => {
    const sec = store.aboutUsSections.find((s) => s.id === id);
    if (sec) {
      sec.display_order = index + 1;
      sec.updated_at = now;
    }
  });

  store.aboutUsSections.sort((a, b) => a.display_order - b.display_order);
  saveMockStore(store);
  return { success: true, sections: store.aboutUsSections };
}

// -----------------------------------------------------------------------------
// PHASE 6B: FAQS MANAGEMENT (faqs in schema ecomm.txt)
// -----------------------------------------------------------------------------

export function loadMockFaqs(categoryFilter?: string): MockFaq[] {
  const store = loadMockStore();
  const faqs = store.faqs || SEED_FAQS;
  let result = [...faqs].sort((a, b) => a.display_order - b.display_order);
  if (categoryFilter && categoryFilter !== "All") {
    result = result.filter((f) => (f.category || "General").toLowerCase() === categoryFilter.toLowerCase());
  }
  return result;
}

export function saveMockFaq(
  payload: Partial<MockFaq> & { question?: string; answer?: string }
): { success: boolean; faq?: MockFaq; error?: string } {
  const question = payload.question?.trim();
  const answer = payload.answer?.trim();

  if (!question || question.length < 5) {
    return { success: false, error: "Question is required (minimum 5 characters)." };
  }
  if (!answer || answer.length < 10) {
    return { success: false, error: "Answer is required (minimum 10 characters)." };
  }

  const store = loadMockStore();
  if (!store.faqs) store.faqs = [...SEED_FAQS];

  const now = new Date().toISOString();
  let faq: MockFaq;

  if (payload.id) {
    const existing = store.faqs.find((f) => f.id === payload.id);
    if (!existing) {
      return { success: false, error: `FAQ '${payload.id}' was not found.` };
    }
    existing.question = question;
    existing.answer = answer;
    existing.category = payload.category?.trim() || "General";
    existing.display_order = Number(payload.display_order) ?? existing.display_order;
    existing.is_active = payload.is_active !== undefined ? Boolean(payload.is_active) : existing.is_active;
    existing.updated_at = now;
    faq = existing;
  } else {
    faq = {
      id: `faq-${Date.now()}`,
      question,
      answer,
      category: payload.category?.trim() || "General",
      display_order: Number(payload.display_order) || (store.faqs.length + 1),
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      created_at: now,
      updated_at: now,
    };
    store.faqs.push(faq);
  }

  store.faqs.sort((a, b) => a.display_order - b.display_order);
  saveMockStore(store);
  return { success: true, faq };
}

export function deleteMockFaq(faqId: string): { success: boolean; error?: string } {
  const store = loadMockStore();
  if (!store.faqs) store.faqs = [...SEED_FAQS];

  const index = store.faqs.findIndex((f) => f.id === faqId);
  if (index === -1) {
    return { success: false, error: `FAQ '${faqId}' was not found.` };
  }

  store.faqs.splice(index, 1);
  saveMockStore(store);
  return { success: true };
}

export function toggleMockFaqStatus(
  faqId: string,
  explicitActive?: boolean
): {
  success: boolean;
  faq?: MockFaq;
  error?: string;
} {
  const store = loadMockStore();
  if (!store.faqs) store.faqs = [...SEED_FAQS];

  const faq = store.faqs.find((f) => f.id === faqId);
  if (!faq) {
    return { success: false, error: `FAQ '${faqId}' was not found.` };
  }

  faq.is_active = explicitActive !== undefined ? explicitActive : !faq.is_active;
  faq.updated_at = new Date().toISOString();
  saveMockStore(store);
  return { success: true, faq };
}

export function reorderMockFaqs(orderedIds: string[]): {
  success: boolean;
  faqs?: MockFaq[];
  error?: string;
} {
  const store = loadMockStore();
  if (!store.faqs) store.faqs = [...SEED_FAQS];

  const now = new Date().toISOString();
  orderedIds.forEach((id, index) => {
    const faq = store.faqs.find((f) => f.id === id);
    if (faq) {
      faq.display_order = index + 1;
      faq.updated_at = now;
    }
  });

  store.faqs.sort((a, b) => a.display_order - b.display_order);
  saveMockStore(store);
  return { success: true, faqs: store.faqs };
}

// -----------------------------------------------------------------------------
// PHASE 6C: SITE POLICIES (site_policies in schema ecomm.txt - UNIQUE on type)
// -----------------------------------------------------------------------------

export function loadMockPolicies(): MockSitePolicy[] {
  const store = loadMockStore();
  const policies = store.sitePolicies || SEED_POLICIES;
  return [...policies];
}

export function getMockPolicyByType(
  type: "privacy" | "terms" | "cancellation" | "refund" | "shipping" | "return",
  includeDraft = false
): MockSitePolicy | null {
  const store = loadMockStore();
  const policies = store.sitePolicies || SEED_POLICIES;
  let policy = policies.find((p) => p.type === type);
  if (!policy && type === "refund") {
    policy = policies.find((p) => p.type === "return");
  } else if (!policy && type === "return") {
    policy = policies.find((p) => p.type === "refund");
  }

  if (!policy) return null;

  if (includeDraft) {
    return policy;
  }

  // Public storefront only displays published content
  if (policy.is_published === false) {
    return {
      ...policy,
      content: "", // Triggers graceful unpublished fallback in PolicyView
    };
  }

  return policy;
}

export function saveMockPolicy(
  type: "privacy" | "terms" | "cancellation" | "refund" | "shipping" | "return",
  title: string,
  content: string,
  isDraft = false
): { success: boolean; policy?: MockSitePolicy; error?: string } {
  const validTitle = title?.trim();
  const validContent = content?.trim();

  if (!validTitle || validTitle.length < 3) {
    return { success: false, error: "Policy title is required (minimum 3 characters)." };
  }
  if (!validContent || validContent.length < 20) {
    return { success: false, error: "Policy content is required (minimum 20 characters)." };
  }

  const validTypes = ["privacy", "terms", "cancellation", "refund", "shipping", "return"];
  if (!validTypes.includes(type)) {
    return { success: false, error: `Invalid policy type '${type}'. Must be one of: ${validTypes.join(", ")}` };
  }

  const store = loadMockStore();
  if (!store.sitePolicies) store.sitePolicies = [...SEED_POLICIES];

  const now = new Date().toISOString();
  let policy = store.sitePolicies.find((p) => p.type === type);

  // Schema compatibility: if refund or return, link to existing row if type differs
  if (!policy && type === "refund") {
    policy = store.sitePolicies.find((p) => p.type === "return");
  }

  if (policy) {
    policy.title = validTitle;
    policy.updated_at = now;
    if (isDraft) {
      policy.draft_content = validContent;
      // Note: publication state tracked in local model; published content unchanged
    } else {
      policy.content = validContent;
      policy.draft_content = undefined;
      policy.is_published = true;
    }
  } else {
    policy = {
      id: `pol-${type}-${Date.now()}`,
      type,
      title: validTitle,
      content: isDraft ? "" : validContent,
      draft_content: isDraft ? validContent : undefined,
      is_published: !isDraft,
      updated_at: now,
    };
    store.sitePolicies.push(policy);
  }

  saveMockStore(store);
  return { success: true, policy };
}

// -----------------------------------------------------------------------------
// PHASE 6D: SITE SETTINGS (site_settings in schema ecomm.txt - key / jsonb value)
// -----------------------------------------------------------------------------

export function loadMockSettings(key = "footer"): any {
  const store = loadMockStore();
  const settingsMap = store.siteSettings || SEED_SETTINGS;
  return settingsMap[key] || SEED_SETTINGS[key] || {};
}

export function saveMockSettings(
  key: string,
  value: Record<string, any>
): { success: boolean; settings?: any; error?: string } {
  if (!key?.trim()) {
    return { success: false, error: "Settings key is required." };
  }

  // Safety validations for 'footer' settings
  if (key === "footer") {
    if (!value.brand_name || value.brand_name.trim().length < 2) {
      return { success: false, error: "Brand name is required." };
    }
    if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) {
      return { success: false, error: "Please enter a valid store email address." };
    }
    if (value.logo_url && value.logo_url.trim()) {
      const url = value.logo_url.trim();
      const isValid = url.startsWith("/") || /^https?:\/\//i.test(url);
      if (!isValid) {
        return { success: false, error: "Logo URL must be an absolute web URL (http/https) or relative path (/logo.svg)." };
      }
    }
    if (value.social) {
      for (const [platform, sUrl] of Object.entries(value.social)) {
        if (sUrl && typeof sUrl === "string" && sUrl.trim()) {
          const trimmed = sUrl.trim();
          if (!/^https?:\/\//i.test(trimmed)) {
            return {
              success: false,
              error: `Social channel URL for ${platform} must start with http:// or https://`,
            };
          }
        }
      }
    }
  }

  const store = loadMockStore();
  if (!store.siteSettings) store.siteSettings = { ...SEED_SETTINGS };

  store.siteSettings[key] = {
    ...store.siteSettings[key],
    ...value,
  };

  saveMockStore(store);
  return { success: true, settings: store.siteSettings[key] };
}

// -----------------------------------------------------------------------------
// PHASE 6E: CONTACT SUBMISSIONS INBOX (contact_submissions in schema ecomm.txt)
// -----------------------------------------------------------------------------

export function loadMockContactSubmissions(filter?: {
  status?: string;
  search?: string;
}): MockContactSubmission[] {
  const store = loadMockStore();
  let list = store.contactSubmissions || SEED_CONTACT_SUBMISSIONS;

  if (filter?.status && filter.status !== "all") {
    list = list.filter((s) => s.status === filter.status);
  }

  if (filter?.search && filter.search.trim()) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        s.message.toLowerCase().includes(q)
    );
  }

  return [...list].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getMockContactSubmissionById(id: string): MockContactSubmission | null {
  const store = loadMockStore();
  const list = store.contactSubmissions || SEED_CONTACT_SUBMISSIONS;
  return list.find((s) => s.id === id) || null;
}

export function updateMockContactStatus(
  id: string,
  status: "new" | "in_progress" | "resolved"
): { success: boolean; submission?: MockContactSubmission; error?: string } {
  const validStatuses: ("new" | "in_progress" | "resolved")[] = ["new", "in_progress", "resolved"];
  if (!validStatuses.includes(status)) {
    return {
      success: false,
      error: `Invalid contact status '${status}'. Must be one of: ${validStatuses.join(", ")}`,
    };
  }

  const store = loadMockStore();
  if (!store.contactSubmissions) store.contactSubmissions = [...SEED_CONTACT_SUBMISSIONS];

  const submission = store.contactSubmissions.find((s) => s.id === id);
  if (!submission) {
    return { success: false, error: `Contact submission '${id}' was not found.` };
  }

  submission.status = status;
  submission.updated_at = new Date().toISOString();
  saveMockStore(store);
  return { success: true, submission };
}

export function deleteMockContactSubmission(id: string): { success: boolean; error?: string } {
  const store = loadMockStore();
  if (!store.contactSubmissions) store.contactSubmissions = [...SEED_CONTACT_SUBMISSIONS];

  const index = store.contactSubmissions.findIndex((s) => s.id === id);
  if (index === -1) {
    return { success: false, error: `Contact submission '${id}' was not found.` };
  }

  store.contactSubmissions.splice(index, 1);
  saveMockStore(store);
  return { success: true };
}

// -----------------------------------------------------------------------------
// PHASE 6F: LEADS MANAGEMENT (leads in schema ecomm.txt)
// -----------------------------------------------------------------------------

export function loadMockLeads(filter?: {
  status?: string;
  search?: string;
}): MockLead[] {
  const store = loadMockStore();
  let list = store.leads || SEED_LEADS;

  if (filter?.status && filter.status !== "all") {
    list = list.filter((l) => l.status === filter.status);
  }

  if (filter?.search && filter.search.trim()) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (l) =>
        (l.name && l.name.toLowerCase().includes(q)) ||
        l.email.toLowerCase().includes(q) ||
        (l.phone && l.phone.toLowerCase().includes(q)) ||
        (l.source && l.source.toLowerCase().includes(q)) ||
        (l.message && l.message.toLowerCase().includes(q))
    );
  }

  return [...list].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getMockLeadById(id: string): MockLead | null {
  const store = loadMockStore();
  const list = store.leads || SEED_LEADS;
  return list.find((l) => l.id === id) || null;
}

export function updateMockLeadStatus(
  id: string,
  status: "new" | "contacted" | "converted" | "closed"
): { success: boolean; lead?: MockLead; error?: string } {
  const validStatuses: ("new" | "contacted" | "converted" | "closed")[] = [
    "new",
    "contacted",
    "converted",
    "closed",
  ];
  if (!validStatuses.includes(status)) {
    return {
      success: false,
      error: `Invalid lead status '${status}'. Must be one of: ${validStatuses.join(", ")}`,
    };
  }

  const store = loadMockStore();
  if (!store.leads) store.leads = [...SEED_LEADS];

  const lead = store.leads.find((l) => l.id === id);
  if (!lead) {
    return { success: false, error: `Lead '${id}' was not found.` };
  }

  lead.status = status;
  lead.updated_at = new Date().toISOString();
  saveMockStore(store);
  return { success: true, lead };
}

export function deleteMockLead(id: string): { success: boolean; error?: string } {
  const store = loadMockStore();
  if (!store.leads) store.leads = [...SEED_LEADS];

  const index = store.leads.findIndex((l) => l.id === id);
  if (index === -1) {
    return { success: false, error: `Lead '${id}' was not found.` };
  }

  store.leads.splice(index, 1);
  saveMockStore(store);
  return { success: true };
}

// -----------------------------------------------------------------------------
// PHASE 6G: UNIFIED INQUIRIES & RESPONSE WORKFLOW (Local Development Model)
// -----------------------------------------------------------------------------

export interface UnifiedInquiry {
  id: string;
  entity_type: "contact_submission" | "lead";
  name: string;
  email: string;
  phone: string | null;
  source: string;
  source_type: "contact_submission" | "lead";
  message: string;
  status: string; // original status ('new' | 'in_progress' | 'resolved' OR 'new' | 'contacted' | 'converted' | 'closed')
  created_at: string;
  updated_at: string;
  has_response: boolean;
  response_count: number;
}

export interface InquiryKpiMetrics {
  totalLeads: number;
  unreadLeads: number;
  respondedLeads: number;
}

export function loadMockResponseNotes(inquiryId?: string): MockResponseNote[] {
  const store = loadMockStore();
  let notes = store.responseNotes || SEED_RESPONSE_NOTES;
  if (inquiryId) {
    notes = notes.filter((n) => n.inquiry_id === inquiryId);
  }
  return [...notes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function addMockResponseNote(
  inquiryId: string,
  entityType: "contact_submission" | "lead",
  note: string,
  responder: string = "Admin (Amber)"
): { success: boolean; note?: MockResponseNote; error?: string } {
  if (!note || !note.trim()) {
    return { success: false, error: "Response note text cannot be empty." };
  }

  const store = loadMockStore();
  if (!store.responseNotes) store.responseNotes = [...SEED_RESPONSE_NOTES];

  // Verify entity exists
  if (entityType === "contact_submission") {
    const sub = (store.contactSubmissions || SEED_CONTACT_SUBMISSIONS).find((s) => s.id === inquiryId);
    if (!sub) return { success: false, error: `Contact submission '${inquiryId}' not found.` };
  } else {
    const lead = (store.leads || SEED_LEADS).find((l) => l.id === inquiryId);
    if (!lead) return { success: false, error: `Lead '${inquiryId}' not found.` };
  }

  const newNote: MockResponseNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    inquiry_id: inquiryId,
    entity_type: entityType,
    note: note.trim(),
    responder: responder.trim() || "Admin (Amber)",
    created_at: new Date().toISOString(),
  };

  store.responseNotes.push(newNote);
  saveMockStore(store);
  return { success: true, note: newNote };
}

export function markInquiryAsRead(
  id: string,
  entityType: "contact_submission" | "lead"
): { success: boolean; error?: string; newStatus?: string } {
  if (entityType === "contact_submission") {
    const store = loadMockStore();
    const sub = (store.contactSubmissions || SEED_CONTACT_SUBMISSIONS).find((s) => s.id === id);
    if (!sub) return { success: false, error: `Contact submission '${id}' not found.` };
    if (sub.status === "new") {
      sub.status = "in_progress";
      sub.updated_at = new Date().toISOString();
      saveMockStore(store);
    }
    return { success: true, newStatus: sub.status };
  } else {
    const store = loadMockStore();
    const lead = (store.leads || SEED_LEADS).find((l) => l.id === id);
    if (!lead) return { success: false, error: `Lead '${id}' not found.` };
    if (lead.status === "new") {
      lead.status = "contacted";
      lead.updated_at = new Date().toISOString();
      saveMockStore(store);
    }
    return { success: true, newStatus: lead.status };
  }
}

export function updateUnifiedInquiryStatus(
  id: string,
  entityType: "contact_submission" | "lead",
  status: string
): { success: boolean; error?: string } {
  if (entityType === "contact_submission") {
    return updateMockContactStatus(id, status as any);
  } else {
    return updateMockLeadStatus(id, status as any);
  }
}

export function deleteUnifiedInquiry(
  id: string,
  entityType: "contact_submission" | "lead"
): { success: boolean; error?: string } {
  const store = loadMockStore();
  if (entityType === "contact_submission") {
    if (!store.contactSubmissions) store.contactSubmissions = [...SEED_CONTACT_SUBMISSIONS];
    const index = store.contactSubmissions.findIndex((s) => s.id === id);
    if (index === -1) {
      return { success: false, error: `Contact submission '${id}' was not found.` };
    }
    store.contactSubmissions.splice(index, 1);
  } else {
    if (!store.leads) store.leads = [...SEED_LEADS];
    const index = store.leads.findIndex((l) => l.id === id);
    if (index === -1) {
      return { success: false, error: `Lead '${id}' was not found.` };
    }
    store.leads.splice(index, 1);
  }

  // Also purge linked response notes
  if (store.responseNotes) {
    store.responseNotes = store.responseNotes.filter((n) => n.inquiry_id !== id);
  }

  saveMockStore(store);
  return { success: true };
}

export function getUnifiedInquiries(): UnifiedInquiry[] {
  const store = loadMockStore();
  const submissions = store.contactSubmissions || SEED_CONTACT_SUBMISSIONS;
  const leads = store.leads || SEED_LEADS;
  const notes = store.responseNotes || SEED_RESPONSE_NOTES;

  const unifiedList: UnifiedInquiry[] = [];

  // Map contact submissions
  for (const s of submissions) {
    const sNotes = notes.filter((n) => n.inquiry_id === s.id);
    unifiedList.push({
      id: s.id,
      entity_type: "contact_submission",
      name: s.name || "Anonymous Visitor",
      email: s.email,
      phone: s.phone,
      source: "Contact Form",
      source_type: "contact_submission",
      message: s.message,
      status: s.status,
      created_at: s.created_at,
      updated_at: s.updated_at,
      has_response: sNotes.length > 0 || s.status === "resolved",
      response_count: sNotes.length,
    });
  }

  // Map leads
  for (const l of leads) {
    const lNotes = notes.filter((n) => n.inquiry_id === l.id);
    unifiedList.push({
      id: l.id,
      entity_type: "lead",
      name: l.name || "Audience Subscriber",
      email: l.email,
      phone: l.phone,
      source: l.source ? `Lead (${l.source})` : "Audience Lead",
      source_type: "lead",
      message: l.message || "Audience member captured through website lead magnet or newsletter.",
      status: l.status,
      created_at: l.created_at,
      updated_at: l.updated_at,
      has_response:
        lNotes.length > 0 ||
        l.status === "contacted" ||
        l.status === "converted" ||
        l.status === "closed",
      response_count: lNotes.length,
    });
  }

  return unifiedList.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getInquiryKpis(): InquiryKpiMetrics {
  const unified = getUnifiedInquiries();

  // 1. Total Leads: all records included in the unified contact inquiry view
  const totalLeads = unified.length;

  // 2. Unread Leads: records that have not yet been reviewed or actioned (status === 'new')
  const unreadLeads = unified.filter((item) => item.status === "new").length;

  // 3. Responded Leads: records with a response recorded in the local development workflow
  // (Either has logged response notes, OR resolved contact submission, OR contacted/converted/closed lead)
  // Each record is counted at most once
  const respondedLeads = unified.filter((item) => item.has_response).length;

  return {
    totalLeads,
    unreadLeads,
    respondedLeads,
  };
}


