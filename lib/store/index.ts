import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  link_url?: string | null;
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
  parent_id?: string | null;
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
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
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
  sku?: string | null;
  batch_number?: string;
  avg_rating?: number;
  review_count?: number;
  images?: Array<{
    id?: string;
    image_url: string;
    alt_text?: string | null;
    display_order: number;
    is_primary: boolean;
  }>;
  variants?: Array<any>;
  category?: any;
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
  products: [],
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

export function normalizeCategoryRow(row: any): Category {
  return {
    id: String(row.id),
    parent_id: row.parent_id || null,
    name: row.category_name || row.name || "Sacred Collection",
    slug: row.slug || String(row.id),
    description: row.description || "",
    image_url: row.image_url || getCategoryDefaultImage(row.slug, row.category_name || row.name),
    display_order: Number(row.display_order) || 0,
    is_active: Boolean(row.is_active ?? true),
    show_on_homepage: Boolean(row.show_on_homepage ?? true),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

export function getCategoryDefaultImage(slug?: string, name?: string): string {
  const s = (slug || name || "").toLowerCase();
  if (s.includes("poshak") || s.includes("dress") || s.includes("vastra")) {
    return "/images/preview-murti.jpg";
  }
  if (s.includes("sringar") || s.includes("jewelry") || s.includes("ornament") || s.includes("mukut") || s.includes("flute")) {
    return "/images/hero-flute.jpg";
  }
  if (s.includes("mandir") || s.includes("thali") || s.includes("pooja") || s.includes("puja") || s.includes("aasan")) {
    return "/images/preview-thali.jpg";
  }
  if (s.includes("jhula") || s.includes("swing")) {
    return "/images/hero-flute.jpg";
  }
  if (s.includes("singhasan") || s.includes("throne") || s.includes("seat")) {
    return "/images/preview-murti.jpg";
  }
  if (s.includes("toy") || s.includes("gopal")) {
    return "/images/preview-murti.jpg";
  }
  if (s.includes("bandarwaal") || s.includes("toran") || s.includes("decor")) {
    return "/images/preview-thali.jpg";
  }
  return "/images/temple-atmosphere.jpg";
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
        return data.map(normalizeCategoryRow);
      }
    } catch {
      // Fallback below
    }
  }

  const store = getLocalStoreData();
  return store.categories
    .filter((c) => c.is_active)
    .sort((a, b) => a.display_order - b.display_order)
    .map(normalizeCategoryRow);
}

export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map(normalizeCategoryRow);
      }
    } catch {
      // Fallback below
    }
  }

  const store = getLocalStoreData();
  return store.categories
    .sort((a, b) => a.display_order - b.display_order)
    .map(normalizeCategoryRow);
}

export async function getAllProducts(): Promise<Product[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images (
            id,
            image_url,
            is_primary,
            display_order
          )
        `)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((p: any) => {
          const sortedImgs = p.product_images
            ? [...p.product_images].sort(
                (a, b) => (a.display_order || 0) - (b.display_order || 0)
              )
            : [];
          const primaryImg =
            sortedImgs.find((img) => img.is_primary)?.image_url ||
            sortedImgs[0]?.image_url ||
            p.image_url ||
            null;

          return {
            id: String(p.id),
            category_id: p.category_id || null,
            name: p.product_name || p.name || "Sacred Item",
            slug: p.slug || String(p.id),
            description: p.description || null,
            brand: p.brand || "Kanhaiya Collection",
            base_price: Number(p.base_price || p.price || 0),
            compare_at_price: p.compare_at_price || p.mrp ? Number(p.compare_at_price || p.mrp) : null,
            stock_quantity: Number(p.stock_quantity ?? 0),
            sold_count: Number(p.sold_count || 0),
            is_active: Boolean(p.is_active ?? true),
            is_featured_top_seller: Boolean(p.is_featured_top_seller ?? false),
            top_seller_display_order: p.top_seller_display_order ?? null,
            image_url: primaryImg || "",
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString(),
            sku: p.sku || null,
            avg_rating: Number(p.avg_rating || 0),
            review_count: Number(p.review_count || 0),
          };
        });
      }
    } catch {
      // Fallback
    }
  }

  const store = getLocalStoreData();
  const prods = Array.isArray(store?.products) ? store.products : [];
  return prods.map((p) => {
    const primaryImg =
      p.images?.find((img) => img.is_primary)?.image_url ||
      p.images?.[0]?.image_url ||
      p.image_url;
    return {
      ...p,
      image_url: primaryImg || "",
    };
  });
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images (
            id,
            image_url,
            is_primary,
            display_order
          ),
          product_variants (
            id,
            variant_name,
            sku,
            price,
            compare_at_price,
            stock_quantity,
            image_url,
            is_active,
            attributes
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        const d = data as any;
        const sortedImgs = d.product_images
          ? [...d.product_images].sort(
              (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)
            )
          : [];
        const primaryImg =
          sortedImgs.find((img: any) => img.is_primary)?.image_url ||
          sortedImgs[0]?.image_url ||
          d.image_url ||
          null;

        return {
          id: String(d.id),
          category_id: d.category_id || null,
          name: d.product_name || d.name || "Sacred Item",
          slug: d.slug || String(d.id),
          description: d.description || null,
          brand: d.brand || "Kanhaiya Collection",
          base_price: Number(d.base_price || d.price || 0),
          compare_at_price: d.compare_at_price || d.mrp ? Number(d.compare_at_price || d.mrp) : null,
          stock_quantity: Number(d.stock_quantity ?? 0),
          sold_count: Number(d.sold_count || 0),
          is_active: Boolean(d.is_active ?? true),
          is_featured_top_seller: Boolean(d.is_featured_top_seller ?? false),
          top_seller_display_order: d.top_seller_display_order ?? null,
          image_url: primaryImg || "",
          created_at: d.created_at || new Date().toISOString(),
          updated_at: d.updated_at || new Date().toISOString(),
          sku: d.sku || null,
          avg_rating: Number(d.avg_rating || 0),
          review_count: Number(d.review_count || 0),
          images: sortedImgs,
          variants: d.product_variants || [],
        };
      }
    } catch {
      // Fallback
    }
  }

  const store = getLocalStoreData();
  const prods = Array.isArray(store?.products) ? store.products : [];
  const p = prods.find((p) => p.id === id);
  if (!p) return null;
  const primaryImg =
    p.images?.find((img) => img.is_primary)?.image_url ||
    p.images?.[0]?.image_url ||
    p.image_url;
  return {
    ...p,
    image_url: primaryImg || "",
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images (
            id,
            image_url,
            is_primary,
            display_order
          )
        `)
        .eq("slug", slug)
        .single();

      if (!error && data) {
        const d = data as any;
        const sortedImgs = d.product_images
          ? [...d.product_images].sort(
              (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)
            )
          : [];
        const primaryImg =
          sortedImgs.find((img: any) => img.is_primary)?.image_url ||
          sortedImgs[0]?.image_url ||
          d.image_url ||
          null;

        return {
          id: String(d.id),
          category_id: d.category_id || null,
          name: d.product_name || d.name || "Sacred Item",
          slug: d.slug || String(d.id),
          description: d.description || null,
          brand: d.brand || "Kanhaiya Collection",
          base_price: Number(d.base_price || d.price || 0),
          compare_at_price: d.compare_at_price || d.mrp ? Number(d.compare_at_price || d.mrp) : null,
          stock_quantity: Number(d.stock_quantity ?? 0),
          sold_count: Number(d.sold_count || 0),
          is_active: Boolean(d.is_active ?? true),
          is_featured_top_seller: Boolean(d.is_featured_top_seller ?? false),
          top_seller_display_order: d.top_seller_display_order ?? null,
          image_url: primaryImg || "",
          created_at: d.created_at || new Date().toISOString(),
          updated_at: d.updated_at || new Date().toISOString(),
          sku: d.sku || null,
          avg_rating: Number(d.avg_rating || 0),
          review_count: Number(d.review_count || 0),
        };
      }
    } catch {
      // Fallback
    }
  }

  const store = getLocalStoreData();
  const prods = Array.isArray(store?.products) ? store.products : [];
  const p = prods.find((p) => p.slug === slug && p.is_active);
  if (!p) return null;
  const primaryImg =
    p.images?.find((img) => img.is_primary)?.image_url ||
    p.images?.[0]?.image_url ||
    p.image_url;
  return {
    ...p,
    image_url: primaryImg || "",
  };
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const store = getLocalStoreData();
  const prods = Array.isArray(store?.products) ? store.products : [];
  const map = new Map(prods.map((p) => [p.id, p]));
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
  const prods = Array.isArray(store?.products) ? store.products : [];
  const sorted = [...prods]
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
  const prods = Array.isArray(store?.products) ? store.products : [];
  const sorted = [...prods]
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
