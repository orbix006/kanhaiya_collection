import { createClient } from "@/lib/supabase/server";

export interface HomepageSection {
  key: string;
  is_enabled: boolean;
  display_order: number;
}

export interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  show_on_homepage: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  base_price: number;
  compare_at_price: number | null;
  avg_rating: number;
  review_count: number;
  stock_quantity: number;
  image_url: string | null;
  is_featured_top_seller?: boolean;
  category_id?: string | null;
  category_slug?: string | null;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  designation: string | null;
  avatar_url: string | null;
  content: string;
  rating: number | null;
  display_order: number;
  is_active: boolean;
}

export interface CategoryProductSection {
  category: Category;
  products: ProductItem[];
}

// Fallback seed catalog matching scripts/seed.ts for graceful offline/unseeded fallback
const FALLBACK_SECTIONS: HomepageSection[] = [
  { key: "banner", is_enabled: true, display_order: 1 },
  { key: "shop_by_category", is_enabled: true, display_order: 2 },
  { key: "continue_browsing", is_enabled: true, display_order: 3 },
  { key: "top_sellers", is_enabled: true, display_order: 4 },
  { key: "category_products", is_enabled: true, display_order: 5 },
  { key: "wall_of_love", is_enabled: true, display_order: 6 },
];

const FALLBACK_BANNERS: Banner[] = [
  {
    id: "banner-1",
    image_url: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1600&q=80",
    title: "Summer Festive Collection 2026",
    link_url: "/shop?category=menswear",
    display_order: 1,
    is_active: true,
  },
  {
    id: "banner-2",
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80",
    title: "Handcrafted Heritage Sarees & Kurtas",
    link_url: "/shop?category=womenswear",
    display_order: 2,
    is_active: true,
  },
  {
    id: "banner-3",
    image_url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1600&q=80",
    title: "Artisanal Accessories & Fine Footwear",
    link_url: "/shop?category=accessories",
    display_order: 3,
    is_active: true,
  },
];

const FALLBACK_CATEGORIES: Category[] = [
  {
    id: "cat-1",
    parent_id: null,
    name: "Menswear",
    slug: "menswear",
    description: "Premium traditional and contemporary men's apparel",
    image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    display_order: 1,
    is_active: true,
    show_on_homepage: true,
  },
  {
    id: "cat-2",
    parent_id: null,
    name: "Womenswear",
    slug: "womenswear",
    description: "Elegant ethnic, designer sarees, and bridal couture",
    image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    display_order: 2,
    is_active: true,
    show_on_homepage: true,
  },
  {
    id: "cat-3",
    parent_id: null,
    name: "Accessories",
    slug: "accessories",
    description: "Handcrafted leather mojris, stoles, and royal watches",
    image_url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    display_order: 3,
    is_active: true,
    show_on_homepage: true,
  },
  // Subcategories
  {
    id: "cat-1-1",
    parent_id: "cat-1",
    name: "Shirts",
    slug: "mens-shirts",
    description: "Formal & Casual Royal Linen Shirts",
    image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
    display_order: 1,
    is_active: true,
    show_on_homepage: true,
  },
  {
    id: "cat-1-2",
    parent_id: "cat-1",
    name: "Trousers",
    slug: "mens-trousers",
    description: "Tailored Trousers & Pleated Chinos",
    image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80",
    display_order: 2,
    is_active: true,
    show_on_homepage: true,
  },
  {
    id: "cat-2-1",
    parent_id: "cat-2",
    name: "Dresses",
    slug: "womens-dresses",
    description: "Designer Anarkalis & Festive Gowns",
    image_url: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=600&q=80",
    display_order: 1,
    is_active: true,
    show_on_homepage: true,
  },
  {
    id: "cat-2-2",
    parent_id: "cat-2",
    name: "Sarees",
    slug: "womens-sarees",
    description: "Traditional Kanjeevaram & Banarasi Silk Sarees",
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
    display_order: 2,
    is_active: true,
    show_on_homepage: true,
  },
  {
    id: "cat-3-1",
    parent_id: "cat-3",
    name: "Footwear",
    slug: "footwear",
    description: "Handstitched Leather Mojris & Oxfords",
    image_url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80",
    display_order: 1,
    is_active: true,
    show_on_homepage: true,
  },
  {
    id: "cat-3-2",
    parent_id: "cat-3",
    name: "Watches & Jewelry",
    slug: "jewelry",
    description: "Kundan Statement Necklaces & Chronographs",
    image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80",
    display_order: 2,
    is_active: true,
    show_on_homepage: true,
  },
];

const FALLBACK_PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    name: "Royal Linen Formal Shirt",
    slug: "royal-linen-formal-shirt",
    brand: "Kanhaiya Heritage",
    base_price: 2499,
    compare_at_price: 2999,
    stock_quantity: 45,
    avg_rating: 4.8,
    review_count: 24,
    image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
    is_featured_top_seller: true,
    category_id: "cat-1-1",
    category_slug: "menswear",
  },
  {
    id: "prod-2",
    name: "Handcrafted Khadi Casual Shirt",
    slug: "handcrafted-khadi-casual-shirt",
    brand: "Kanhaiya Heritage",
    base_price: 1899,
    compare_at_price: 2299,
    stock_quantity: 30,
    avg_rating: 4.6,
    review_count: 18,
    image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
    is_featured_top_seller: false,
    category_id: "cat-1-1",
    category_slug: "menswear",
  },
  {
    id: "prod-3",
    name: "Tailored Slim Fit Chinos",
    slug: "tailored-slim-fit-chinos",
    brand: "Kanhaiya Heritage",
    base_price: 2799,
    compare_at_price: 3499,
    stock_quantity: 25,
    avg_rating: 4.7,
    review_count: 15,
    image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
    is_featured_top_seller: false,
    category_id: "cat-1-2",
    category_slug: "menswear",
  },
  {
    id: "prod-4",
    name: "Classic Pleated Dress Trousers",
    slug: "classic-pleated-dress-trousers",
    brand: "Kanhaiya Heritage",
    base_price: 3199,
    compare_at_price: 3999,
    stock_quantity: 20,
    avg_rating: 4.9,
    review_count: 31,
    image_url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
    is_featured_top_seller: false,
    category_id: "cat-1-2",
    category_slug: "menswear",
  },
  {
    id: "prod-5",
    name: "Silk Embroidered Anarkali Dress",
    slug: "silk-embroidered-anarkali-dress",
    brand: "Kanhaiya Couture",
    base_price: 5999,
    compare_at_price: 7499,
    stock_quantity: 15,
    avg_rating: 4.9,
    review_count: 42,
    image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    is_featured_top_seller: true,
    category_id: "cat-2-1",
    category_slug: "womenswear",
  },
  {
    id: "prod-6",
    name: "Floral Print Festive Maxi Dress",
    slug: "floral-print-maxi-dress",
    brand: "Kanhaiya Couture",
    base_price: 3499,
    compare_at_price: 4299,
    stock_quantity: 35,
    avg_rating: 4.7,
    review_count: 20,
    image_url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    is_featured_top_seller: false,
    category_id: "cat-2-1",
    category_slug: "womenswear",
  },
  {
    id: "prod-7",
    name: "Kanjeevaram Banarasi Silk Saree",
    slug: "kanjeevaram-banarasi-silk-saree",
    brand: "Kanhaiya Artisan",
    base_price: 12999,
    compare_at_price: 15999,
    stock_quantity: 10,
    avg_rating: 5.0,
    review_count: 58,
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    is_featured_top_seller: true,
    category_id: "cat-2-2",
    category_slug: "womenswear",
  },
  {
    id: "prod-8",
    name: "Chanderi Handloom Cotton Saree",
    slug: "chanderi-handloom-cotton-saree",
    brand: "Kanhaiya Artisan",
    base_price: 4499,
    compare_at_price: 5499,
    stock_quantity: 18,
    avg_rating: 4.8,
    review_count: 27,
    image_url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    is_featured_top_seller: false,
    category_id: "cat-2-2",
    category_slug: "womenswear",
  },
  {
    id: "prod-9",
    name: "Handstitched Leather Mojris",
    slug: "handstitched-leather-mojris",
    brand: "Kanhaiya Footwear",
    base_price: 2199,
    compare_at_price: 2799,
    stock_quantity: 40,
    avg_rating: 4.7,
    review_count: 19,
    image_url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
    is_featured_top_seller: false,
    category_id: "cat-3-1",
    category_slug: "accessories",
  },
  {
    id: "prod-10",
    name: "Classic Oxford Leather Shoes",
    slug: "classic-oxford-leather-shoes",
    brand: "Kanhaiya Footwear",
    base_price: 4299,
    compare_at_price: 4999,
    stock_quantity: 22,
    avg_rating: 4.8,
    review_count: 34,
    image_url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80",
    is_featured_top_seller: false,
    category_id: "cat-3-1",
    category_slug: "accessories",
  },
  {
    id: "prod-11",
    name: "Kundan Statement Necklace",
    slug: "kundan-statement-necklace",
    brand: "Kanhaiya Jewels",
    base_price: 8999,
    compare_at_price: 10999,
    stock_quantity: 12,
    avg_rating: 4.9,
    review_count: 48,
    image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    is_featured_top_seller: true,
    category_id: "cat-3-2",
    category_slug: "accessories",
  },
  {
    id: "prod-12",
    name: "Antique Brass Chronograph Watch",
    slug: "antique-brass-chronograph-watch",
    brand: "Kanhaiya Time",
    base_price: 6499,
    compare_at_price: 7999,
    stock_quantity: 16,
    avg_rating: 4.9,
    review_count: 37,
    image_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    is_featured_top_seller: false,
    category_id: "cat-3-2",
    category_slug: "accessories",
  },
];

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1",
    customer_name: "Priya Sharma",
    designation: "Fashion Blogger, Mumbai",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    content: "The quality of pure Kanjeevaram silk and handloom craftsmanship is outstanding. It feels regal and authentic in every weave.",
    rating: 5,
    display_order: 1,
    is_active: true,
  },
  {
    id: "test-2",
    customer_name: "Rahul Verma",
    designation: "Verified Buyer, New Delhi",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    content: "Perfect fitting tailored chinos and linen shirts. Fast delivery and premium eco-friendly packaging exceeded my expectations.",
    rating: 5,
    display_order: 2,
    is_active: true,
  },
  {
    id: "test-3",
    customer_name: "Ananya Mehta",
    designation: "Design Consultant, Bangalore",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    content: "Exquisite Kundan jewelry and festive ensembles. Truly timeless pieces that draw compliments at every celebration!",
    rating: 5,
    display_order: 3,
    is_active: true,
  },
  {
    id: "test-4",
    customer_name: "Vikram Singh",
    designation: "Corporate Executive, Jaipur",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    content: "Great luxury linen collection. Kanhaiya Heritage never disappoints in fabric quality, stitch perfection, and refined styling.",
    rating: 5,
    display_order: 4,
    is_active: true,
  },
];

export async function getHomepageSections(): Promise<HomepageSection[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("homepage_sections")
      .select("key, is_enabled, display_order")
      .eq("is_enabled", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_SECTIONS.filter((s) => s.is_enabled);
    }
    return data as HomepageSection[];
  } catch {
    return FALLBACK_SECTIONS.filter((s) => s.is_enabled);
  }
}

export async function getActiveBanners(): Promise<Banner[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("banners")
      .select("id, image_url, title, link_url, display_order, is_active")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_BANNERS.filter((b) => b.is_active);
    }
    return data as Banner[];
  } catch {
    return FALLBACK_BANNERS.filter((b) => b.is_active);
  }
}

export async function getHomepageCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("show_on_homepage", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_CATEGORIES.filter((c) => c.show_on_homepage && c.parent_id === null);
    }
    return data as Category[];
  } catch {
    return FALLBACK_CATEGORIES.filter((c) => c.show_on_homepage && c.parent_id === null);
  }
}

export async function getAllActiveCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_CATEGORIES;
    }
    return data as Category[];
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export async function getContinueBrowsingProducts(userId?: string | null): Promise<ProductItem[]> {
  if (!userId) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_views")
      .select(`
        viewed_at,
        product:products (
          id,
          name,
          slug,
          brand,
          base_price,
          compare_at_price,
          avg_rating,
          review_count,
          stock_quantity,
          is_active,
          product_images (
            image_url,
            is_primary
          )
        )
      `)
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) {
      return [];
    }

    const items: ProductItem[] = [];
    for (const row of data) {
      const p = row.product as any;
      if (!p || p.is_active === false) continue;
      const primaryImg =
        p.product_images?.find((img: any) => img.is_primary)?.image_url ||
        p.product_images?.[0]?.image_url ||
        null;

      items.push({
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
      });
    }

    return items;
  } catch {
    return [];
  }
}

export async function getTopSellers(): Promise<ProductItem[]> {
  try {
    const supabase = await createClient();
    const { data: topSellers, error } = await supabase
      .from("v_top_sellers")
      .select("*")
      .limit(8);

    if (error || !topSellers || topSellers.length === 0) {
      return FALLBACK_PRODUCTS.filter((p) => p.is_featured_top_seller).concat(
        FALLBACK_PRODUCTS.filter((p) => !p.is_featured_top_seller)
      ).slice(0, 8);
    }

    const productIds = topSellers.map((p) => p.id).filter(Boolean) as string[];
    const { data: images } = await supabase
      .from("product_images")
      .select("product_id, image_url, is_primary")
      .in("product_id", productIds);

    return topSellers.map((p) => {
      const matchingImg =
        images?.find((img) => img.product_id === p.id && img.is_primary)?.image_url ||
        images?.find((img) => img.product_id === p.id)?.image_url ||
        null;

      return {
        id: p.id || "",
        name: p.name || "",
        slug: p.slug || "",
        brand: p.brand || null,
        base_price: Number(p.base_price || 0),
        compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
        avg_rating: Number(p.avg_rating || 0),
        review_count: Number(p.review_count || 0),
        stock_quantity: Number(p.stock_quantity || 0),
        image_url: matchingImg,
        is_featured_top_seller: Boolean(p.is_featured_top_seller),
        category_id: p.category_id,
      };
    });
  } catch {
    return FALLBACK_PRODUCTS.filter((p) => p.is_featured_top_seller).concat(
      FALLBACK_PRODUCTS.filter((p) => !p.is_featured_top_seller)
    ).slice(0, 8);
  }
}

export async function getCategoryProductSections(): Promise<CategoryProductSection[]> {
  try {
    const supabase = await createClient();
    // Get all categories to establish hierarchy
    const { data: allCategories } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    const categoriesList = allCategories && allCategories.length > 0 ? (allCategories as Category[]) : FALLBACK_CATEGORIES;
    const homepageCategories = categoriesList.filter((c) => c.show_on_homepage && (c.parent_id === null || !categoriesList.some(p => p.id === c.parent_id && p.show_on_homepage)));

    // Fetch products
    const { data: productsData } = await supabase
      .from("products")
      .select(`
        id,
        category_id,
        name,
        slug,
        brand,
        base_price,
        compare_at_price,
        avg_rating,
        review_count,
        stock_quantity,
        is_active,
        product_images (
          image_url,
          is_primary
        )
      `)
      .eq("is_active", true);

    let productItems: ProductItem[] = [];

    if (productsData && productsData.length > 0) {
      productItems = productsData.map((p: any) => {
        const primaryImg =
          p.product_images?.find((img: any) => img.is_primary)?.image_url ||
          p.product_images?.[0]?.image_url ||
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
          category_id: p.category_id,
        };
      });
    } else {
      productItems = FALLBACK_PRODUCTS;
    }

    const sections: CategoryProductSection[] = [];

    for (const hpCat of homepageCategories) {
      // Find subcategories belonging to this category
      const subCategoryIds = categoriesList
        .filter((c) => c.parent_id === hpCat.id)
        .map((c) => c.id);
      const targetCategoryIds = [hpCat.id, ...subCategoryIds];

      const matchingProducts = productItems.filter(
        (p) =>
          (p.category_id && targetCategoryIds.includes(p.category_id)) ||
          p.category_slug === hpCat.slug
      );

      if (matchingProducts.length > 0) {
        sections.push({
          category: hpCat,
          products: matchingProducts.slice(0, 4),
        });
      }
    }

    if (sections.length === 0) {
      // Return fallback grouped sections
      const topCats = FALLBACK_CATEGORIES.filter((c) => c.parent_id === null);
      for (const cat of topCats) {
        const prods = FALLBACK_PRODUCTS.filter((p) => p.category_slug === cat.slug);
        if (prods.length > 0) {
          sections.push({ category: cat, products: prods.slice(0, 4) });
        }
      }
    }

    return sections;
  } catch {
    const topCats = FALLBACK_CATEGORIES.filter((c) => c.parent_id === null);
    return topCats.map((cat) => ({
      category: cat,
      products: FALLBACK_PRODUCTS.filter((p) => p.category_slug === cat.slug).slice(0, 4),
    }));
  }
}

export async function getActiveTestimonials(): Promise<Testimonial[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("testimonials")
      .select("id, customer_name, designation, avatar_url, content, rating, display_order, is_active")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_TESTIMONIALS.filter((t) => t.is_active);
    }
    return data as Testimonial[];
  } catch {
    return FALLBACK_TESTIMONIALS.filter((t) => t.is_active);
  }
}
