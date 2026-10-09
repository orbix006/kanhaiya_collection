import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  image_url: string;
  mobile_image_url?: string | null;
  is_active: boolean;
  display_order: number;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  show_on_homepage: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  base_price: number;
  compare_at_price?: number | null;
  stock_quantity: number;
  sold_count: number;
  is_active: boolean;
  is_featured_top_seller: boolean;
  top_seller_display_order?: number | null;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface FestiveOffer {
  enabled: boolean;
  title: string;
  subtitle: string;
  product_ids: string[];
  updated_at: string;
}

export interface StoreData {
  banners: Banner[];
  categories: Category[];
  products: Product[];
  festive_offer: FestiveOffer;
}

// Initial seed data reflecting authentic Kanhaiya Collection devotional products
const INITIAL_STORE_DATA: StoreData = {
  banners: [
    {
      id: "banner-1",
      title: "Janmashtami Collection",
      subtitle: "Celebrate divine love and devotion with consecrated brass idols and sacred flute offerings.",
      cta_text: "Explore Collection",
      cta_link: "/shop?category=idols",
      image_url: "/images/janmashtami-campaign.jpg",
      mobile_image_url: "/images/janmashtami-mobile.jpg",
      is_active: true,
      display_order: 1,
      start_date: null,
      end_date: null,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: "banner-2",
      title: "Diwali Deepotsav Collection",
      subtitle: "Bring sacred light, consecrated brass akhand diyas and timeless warmth to your home mandir.",
      cta_text: "Shop Now",
      cta_link: "/shop?category=pooja-essentials",
      image_url: "/images/diwali-campaign.jpg",
      mobile_image_url: null,
      is_active: true,
      display_order: 2,
      start_date: null,
      end_date: null,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "banner-3",
      title: "Sacred Temple Brassware & Aromas",
      subtitle: "Artisan engraved puja thalis, pure cow-dung dhoop cones and natural Vrindavan chandan.",
      cta_text: "Discover Pooja Essentials",
      cta_link: "/shop?category=sacred-aromas",
      image_url: "/images/temple-atmosphere.jpg",
      mobile_image_url: null,
      is_active: true,
      display_order: 3,
      start_date: null,
      end_date: null,
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ],
  categories: [
    {
      id: "cat-1",
      name: "Idols & Murtis",
      slug: "idols",
      description: "Handcrafted sacred Radha Krishna, Bal Gopal and Ganesha brass idols",
      image_url: "/images/preview-murti.jpg",
      display_order: 1,
      is_active: true,
      show_on_homepage: true,
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: "cat-2",
      name: "Pooja Essentials",
      slug: "pooja-essentials",
      description: "Pure brass engraved thalis, akhand diyas, ghanti bells and aarti vessels",
      image_url: "/images/preview-thali.jpg",
      display_order: 2,
      is_active: true,
      show_on_homepage: true,
      created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    },
    {
      id: "cat-3",
      name: "Sacred Aromas",
      slug: "sacred-aromas",
      description: "Natural temple chandan, pure cow dung dhoop, sambrani and incense cones",
      image_url: "/images/temple-atmosphere.jpg",
      display_order: 3,
      is_active: true,
      show_on_homepage: true,
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    },
    {
      id: "cat-4",
      name: "Temple Brassware",
      slug: "temple-brassware",
      description: "Heavy cast brass mandir bells, shankh stands and ceremonial kalashes",
      image_url: "/images/hero-flute.jpg",
      display_order: 4,
      is_active: true,
      show_on_homepage: true,
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: "cat-5",
      name: "Decorative & Aasans",
      slug: "decorative",
      description: "Pure silk deity robes, handwoven mandir prayer rugs and altar textiles",
      image_url: "/images/preview-murti.jpg",
      display_order: 5,
      is_active: true,
      show_on_homepage: true,
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
  ],
  products: [
    {
      id: "prod-1",
      category_id: "cat-1",
      name: "Handcrafted Brass Krishna Idol with Flute",
      slug: "krishna-idol",
      description: "Intricately detailed pure brass Krishna idol playing the sacred flute with divine ornamentation. Consecrated with holy mantras.",
      brand: "Kanhaiya Collection",
      base_price: 3499,
      compare_at_price: 4299,
      stock_quantity: 15,
      sold_count: 142, // High sold_count -> Bestseller!
      is_active: true,
      is_featured_top_seller: true,
      top_seller_display_order: 1,
      image_url: "/images/preview-murti.jpg",
      created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "prod-2",
      category_id: "cat-2",
      name: "Artisan Engraved Akhand Diya",
      slug: "brass-diya",
      description: "Traditional solid brass akhand diya with steady flame glass chimney and floral engraving. Designed for long ritual burning.",
      brand: "Kanhaiya Collection",
      base_price: 899,
      compare_at_price: 1199,
      stock_quantity: 45,
      sold_count: 310, // Top Bestseller!
      is_active: true,
      is_featured_top_seller: true,
      top_seller_display_order: 2,
      image_url: "/images/hero-flute.jpg",
      created_at: new Date(Date.now() - 86400000 * 11).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "prod-3",
      category_id: "cat-2",
      name: "Royal Brass Puja Thali Set (7 Pieces)",
      slug: "artisan-puja-thali",
      description: "Exquisite hand-hammered brass puja thali complete with ghanti bell, aarti diya, kumkum katori, agarbatti stand, and spoon.",
      brand: "Kanhaiya Collection",
      base_price: 1899,
      compare_at_price: 2499,
      stock_quantity: 20,
      sold_count: 195, // Top Bestseller!
      is_active: true,
      is_featured_top_seller: false,
      top_seller_display_order: null,
      image_url: "/images/preview-thali.jpg",
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "prod-4",
      category_id: "cat-3",
      name: "Pure Temple Chandan & Guggul Dhoop",
      slug: "pure-chandan-dhoop",
      description: "Slow-burning organic dhoop sticks made with natural Vrindavan sandalwood dust, desi ghee, and holy Ayurvedic herbs.",
      brand: "Kanhaiya Collection",
      base_price: 450,
      compare_at_price: 550,
      stock_quantity: 80,
      sold_count: 260, // Top Bestseller!
      is_active: true,
      is_featured_top_seller: false,
      top_seller_display_order: null,
      image_url: "/images/temple-atmosphere.jpg",
      created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "prod-5",
      category_id: "cat-1",
      name: "Radha Krishna Panchaloha Sacred Murti",
      slug: "radha-krishna-murti",
      description: "Consecrated five-metal sacred couple murti with delicate smiling expressions, peacock feather crown, and lotus pedestal.",
      brand: "Kanhaiya Collection",
      base_price: 5999,
      compare_at_price: 7499,
      stock_quantity: 8,
      sold_count: 85,
      is_active: true,
      is_featured_top_seller: false,
      top_seller_display_order: null,
      image_url: "/images/preview-murti.jpg",
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "prod-6",
      category_id: "cat-1",
      name: "Ashtadhatu Bal Gopal (Laddu Gopal) Seva Murti",
      slug: "laddu-gopal-murti",
      description: "Auspicious Bal Gopal idol in crawling posture holding makhan. Ideal for daily seva, bathing, and devotional dressing rituals.",
      brand: "Kanhaiya Collection",
      base_price: 1499,
      compare_at_price: 1899,
      stock_quantity: 30,
      sold_count: 175,
      is_active: true,
      is_featured_top_seller: false,
      top_seller_display_order: null,
      image_url: "/images/preview-murti.jpg",
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "prod-7",
      category_id: "cat-5",
      name: "Vedic Gold-Border Raw Silk Mandir Aasan",
      slug: "mandir-silk-aasan",
      description: "Lustrous raw silk altar seat for deities featuring zari embroidery and auspicious lotus motifs. Keeps spiritual energy pure.",
      brand: "Kanhaiya Collection",
      base_price: 1199,
      compare_at_price: 1499,
      stock_quantity: 25,
      sold_count: 98,
      is_active: true,
      is_featured_top_seller: false,
      top_seller_display_order: null,
      image_url: "/images/preview-thali.jpg",
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "prod-8",
      category_id: "cat-4",
      name: "Heavy Temple Brass Hanging Bell with Chain",
      slug: "temple-brass-bell",
      description: "Resonant brass ghanta producing deep meditative reverberation. Includes heavy link brass chain for mandir ceiling installation.",
      brand: "Kanhaiya Collection",
      base_price: 2799,
      compare_at_price: 3299,
      stock_quantity: 12,
      sold_count: 115,
      is_active: true,
      is_featured_top_seller: false,
      top_seller_display_order: null,
      image_url: "/images/hero-flute.jpg",
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(), // Newly Added!
      updated_at: new Date().toISOString(),
    },
    {
      id: "prod-9",
      category_id: "cat-3",
      name: "Natural Loban & Sambrani Cup Dhoop (Box of 24)",
      slug: "sambrani-cup-dhoop",
      description: "Purifying herbal charcoal cups filled with natural guggal resin and sambrani. Cleanses negative vibrations and sanctifies air.",
      brand: "Kanhaiya Collection",
      base_price: 399,
      compare_at_price: 499,
      stock_quantity: 60,
      sold_count: 180,
      is_active: true,
      is_featured_top_seller: false,
      top_seller_display_order: null,
      image_url: "/images/temple-atmosphere.jpg",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // Newly Added!
      updated_at: new Date().toISOString(),
    },
    {
      id: "prod-10",
      category_id: "cat-5",
      name: "Gold Embossed Tanjore Radha Krishna Altar Frame",
      slug: "radha-krishna-frame",
      description: "22-karat gold foil foil-work traditional Tanjore devotional altar frame with teakwood border and protective glass cover.",
      brand: "Kanhaiya Collection",
      base_price: 2199,
      compare_at_price: 2799,
      stock_quantity: 14,
      sold_count: 72,
      is_active: true,
      is_featured_top_seller: false,
      top_seller_display_order: null,
      image_url: "/images/preview-murti.jpg",
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(), // Brand New!
      updated_at: new Date().toISOString(),
    },
  ],
  festive_offer: {
    enabled: true,
    title: "Deepotsav & Sacred Festive Offerings",
    subtitle: "Bless your home mandir this season with consecrated brassware and auspicious puja essentials.",
    product_ids: ["prod-1", "prod-2", "prod-3", "prod-8"],
    updated_at: new Date().toISOString(),
  },
};

const DATA_FILE_PATH = path.join(process.cwd(), "data", "ecomm_store.json");

function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getLocalStoreData(): StoreData {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        banners: parsed.banners || INITIAL_STORE_DATA.banners,
        categories: parsed.categories || INITIAL_STORE_DATA.categories,
        products: parsed.products || INITIAL_STORE_DATA.products,
        festive_offer: parsed.festive_offer || INITIAL_STORE_DATA.festive_offer,
      };
    }
  } catch (err) {
    console.warn("[Local Store Warning] Error reading store file:", err);
  }

  // Write default if not found
  try {
    ensureDirectoryExists(DATA_FILE_PATH);
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(INITIAL_STORE_DATA, null, 2), "utf-8");
  } catch {
    // Non-fatal
  }

  return INITIAL_STORE_DATA;
}

export function saveLocalStoreData(data: StoreData): void {
  try {
    ensureDirectoryExists(DATA_FILE_PATH);
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Local Store Error] Failed to write data file:", err);
  }
}

// -----------------------------------------------------------------------------
// PUBLIC ASYNC ACCESSORS (Compatible with Supabase and Fallback Store)
// -----------------------------------------------------------------------------

export async function getActiveBanners(): Promise<Banner[]> {
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((b: any) => ({
          id: b.id,
          title: b.title || "Kanhaiya Collection",
          subtitle: b.description || b.subtitle || "",
          cta_text: b.cta_text || "Shop Now",
          cta_link: b.link_url || "/shop",
          image_url: b.image_url || "/images/hero-flute.jpg",
          is_active: b.is_active,
          display_order: b.display_order,
          start_date: b.start_date || null,
          end_date: b.end_date || null,
          created_at: b.created_at,
          updated_at: b.updated_at,
        }));
      }
    } catch {
      // Fallback below
    }
  }

  const store = getLocalStoreData();
  const now = new Date().toISOString();
  return store.banners
    .filter((b) => {
      if (!b.is_active) return false;
      if (b.start_date && b.start_date > now) return false;
      if (b.end_date && b.end_date < now) return false;
      return true;
    })
    .sort((a, b) => a.display_order - b.display_order);
}

export async function getAllBanners(): Promise<Banner[]> {
  const store = getLocalStoreData();
  return store.banners.sort((a, b) => a.display_order - b.display_order);
}

export async function getActiveCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Category[];
      }
    } catch {
      // Fallback below
    }
  }

  const store = getLocalStoreData();
  return store.categories
    .filter((c) => c.is_active)
    .sort((a, b) => a.display_order - b.display_order);
}

export async function getAllCategories(): Promise<Category[]> {
  const store = getLocalStoreData();
  return store.categories.sort((a, b) => a.display_order - b.display_order);
}

export async function getAllProducts(): Promise<Product[]> {
  const store = getLocalStoreData();
  return store.products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const store = getLocalStoreData();
  return store.products.find((p) => p.slug === slug) || null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const store = getLocalStoreData();
  const map = new Map(store.products.map((p) => [p.id, p]));
  const result: Product[] = [];
  for (const id of ids) {
    const item = map.get(id);
    if (item && item.is_active) {
      result.push(item);
    }
  }
  return result;
}

export async function getBestsellerProducts(limit = 8): Promise<Product[]> {
  const store = getLocalStoreData();
  // Rank by pinned first, then sold_count desc
  const sorted = [...store.products]
    .filter((p) => p.is_active)
    .sort((a, b) => {
      if (a.is_featured_top_seller !== b.is_featured_top_seller) {
        return a.is_featured_top_seller ? -1 : 1;
      }
      return b.sold_count - a.sold_count;
    });
  return sorted.slice(0, limit);
}

export async function getNewlyAddedProducts(limit = 10): Promise<Product[]> {
  const store = getLocalStoreData();
  const sorted = [...store.products]
    .filter((p) => p.is_active)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return sorted.slice(0, limit);
}

export async function getFestiveOffer(): Promise<{
  offer: FestiveOffer;
  products: Product[];
}> {
  const store = getLocalStoreData();
  const offer = store.festive_offer;
  if (!offer.enabled) {
    return { offer, products: [] };
  }
  const products = await getProductsByIds(offer.product_ids);
  return { offer, products };
}
