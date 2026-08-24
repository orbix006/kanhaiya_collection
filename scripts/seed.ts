import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

const MEDIA_BUCKET = "media";

/**
 * Creates SVG placeholder image buffer for seeding storage bucket
 */
function createPlaceholderSvg(title: string, width = 600, height = 600, bgColor = "#1e293b", textColor = "#f8fafc") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${textColor}" font-family="sans-serif" font-size="24" font-weight="bold">${title}</text>
  </svg>`;
  return Buffer.from(svg);
}

/**
 * Uploads a placeholder image to the 'media' storage bucket or returns public URL fallback
 */
async function uploadMediaPlaceholder(filename: string, title: string): Promise<string> {
  const fileBuffer = createPlaceholderSvg(title);
  
  try {
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(filename, fileBuffer, {
        contentType: "image/svg+xml",
        upsert: true,
      });

    if (error) {
      console.warn(`[Storage Upload Warning] Could not upload ${filename} to '${MEDIA_BUCKET}': ${error.message}`);
      return `${supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${filename}`;
    }

    const { data: urlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (err) {
    console.warn(`[Storage Upload Warning] Failed to upload ${filename}:`, err);
    return `${supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${filename}`;
  }
}

async function seed() {
  console.log("🌱 Starting Development Data Seeding...");
  console.log(`Connecting to: ${supabaseUrl}`);

  // 1. Upload Placeholder Images to Storage Bucket
  console.log("📷 Provisioning placeholder media images...");
  const categoryImages: Record<string, string> = {
    menswear: await uploadMediaPlaceholder("categories/menswear.svg", "Menswear Category"),
    womenswear: await uploadMediaPlaceholder("categories/womenswear.svg", "Womenswear Category"),
    accessories: await uploadMediaPlaceholder("categories/accessories.svg", "Accessories Category"),
  };

  const bannerImages = [
    await uploadMediaPlaceholder("banners/hero-banner-1.svg", "Summer Collection 2026"),
    await uploadMediaPlaceholder("banners/hero-banner-2.svg", "New Festive Arrival"),
  ];

  const avatarImages = [
    await uploadMediaPlaceholder("avatars/user-1.svg", "Priya Sharma"),
    await uploadMediaPlaceholder("avatars/user-2.svg", "Rahul Verma"),
    await uploadMediaPlaceholder("avatars/user-3.svg", "Ananya Mehta"),
    await uploadMediaPlaceholder("avatars/user-4.svg", "Vikram Singh"),
  ];

  const aboutImages = [
    await uploadMediaPlaceholder("about/heritage.svg", "Our Heritage"),
    await uploadMediaPlaceholder("about/craftsmanship.svg", "Handcrafted Quality"),
    await uploadMediaPlaceholder("about/sustainability.svg", "Sustainable Sourcing"),
  ];

  // 2. Seed Categories (3 Top-Level, 2 Subcategories per Top-Level)
  console.log("📂 Seeding Categories...");
  const topCategories = [
    { name: "Menswear", slug: "menswear", description: "Premium traditional and modern men apparel", image_url: categoryImages.menswear, display_order: 1, is_active: true, show_on_homepage: true },
    { name: "Womenswear", slug: "womenswear", description: "Elegant ethnic, fusion, and designer women wear", image_url: categoryImages.womenswear, display_order: 2, is_active: true, show_on_homepage: true },
    { name: "Accessories", slug: "accessories", description: "Handcrafted accessories, footwear, and jewelry", image_url: categoryImages.accessories, display_order: 3, is_active: true, show_on_homepage: true },
  ];

  const insertedTopCats: any[] = [];
  for (const cat of topCategories) {
    const { data, error } = await supabase
      .from("categories")
      .upsert(cat, { onConflict: "slug" })
      .select()
      .single();
    if (error) console.error("Error inserting category:", cat.name, error.message);
    else if (data) insertedTopCats.push(data);
  }

  const subCategoriesData = [
    // Menswear subcategories
    { parent_id: insertedTopCats.find((c) => c.slug === "menswear")?.id, name: "Shirts", slug: "mens-shirts", description: "Formal & Casual Shirts", display_order: 1, is_active: true, show_on_homepage: true },
    { parent_id: insertedTopCats.find((c) => c.slug === "menswear")?.id, name: "Trousers", slug: "mens-trousers", description: "Tailored Trousers & Chinos", display_order: 2, is_active: true, show_on_homepage: true },
    // Womenswear subcategories
    { parent_id: insertedTopCats.find((c) => c.slug === "womenswear")?.id, name: "Dresses", slug: "womens-dresses", description: "Designer Dresses & Gowns", display_order: 1, is_active: true, show_on_homepage: true },
    { parent_id: insertedTopCats.find((c) => c.slug === "womenswear")?.id, name: "Sarees", slug: "womens-sarees", description: "Traditional Silk & Handloom Sarees", display_order: 2, is_active: true, show_on_homepage: true },
    // Accessories subcategories
    { parent_id: insertedTopCats.find((c) => c.slug === "accessories")?.id, name: "Footwear", slug: "footwear", description: "Handmade Leather Footwear", display_order: 1, is_active: true, show_on_homepage: true },
    { parent_id: insertedTopCats.find((c) => c.slug === "accessories")?.id, name: "Watches & Jewelry", slug: "jewelry", description: "Artisanal Jewelry & Watches", display_order: 2, is_active: true, show_on_homepage: true },
  ];

  const insertedSubCats: any[] = [];
  for (const sub of subCategoriesData) {
    if (!sub.parent_id) continue;
    const { data, error } = await supabase
      .from("categories")
      .upsert(sub, { onConflict: "slug" })
      .select()
      .single();
    if (error) console.error("Error inserting subcategory:", sub.name, error.message);
    else if (data) insertedSubCats.push(data);
  }

  console.log(`✅ Seeded ${insertedTopCats.length} Top Categories & ${insertedSubCats.length} Subcategories.`);

  // 3. Seed Products (12 Total, 2 per Subcategory)
  console.log("🛍️ Seeding Products, Images, and Variants...");
  const rawProducts = [
    // Mens Shirts
    { catSlug: "mens-shirts", name: "Royal Linen Formal Shirt", slug: "royal-linen-formal-shirt", brand: "Kanhaiya Heritage", base_price: 2499, compare_at_price: 2999, stock_quantity: 45, is_featured_top_seller: true, top_seller_display_order: 1 },
    { catSlug: "mens-shirts", name: "Handcrafted Khadi Casual Shirt", slug: "handcrafted-khadi-casual-shirt", brand: "Kanhaiya Heritage", base_price: 1899, compare_at_price: 2299, stock_quantity: 30, is_featured_top_seller: false },
    // Mens Trousers
    { catSlug: "mens-trousers", name: "Tailored Slim Fit Chinos", slug: "tailored-slim-fit-chinos", brand: "Kanhaiya Heritage", base_price: 2799, compare_at_price: 3499, stock_quantity: 25, is_featured_top_seller: false },
    { catSlug: "mens-trousers", name: "Classic Pleated Dress Trousers", slug: "classic-pleated-dress-trousers", brand: "Kanhaiya Heritage", base_price: 3199, compare_at_price: 3999, stock_quantity: 20, is_featured_top_seller: false },
    // Womens Dresses
    { catSlug: "womens-dresses", name: "Silk Embroidered Anarkali Dress", slug: "silk-embroidered-anarkali-dress", brand: "Kanhaiya Couture", base_price: 5999, compare_at_price: 7499, stock_quantity: 15, is_featured_top_seller: true, top_seller_display_order: 2 },
    { catSlug: "womens-dresses", name: "Floral Print Maxi Dress", slug: "floral-print-maxi-dress", brand: "Kanhaiya Couture", base_price: 3499, compare_at_price: 4299, stock_quantity: 35, is_featured_top_seller: false },
    // Womens Sarees
    { catSlug: "womens-sarees", name: "Kanjeevaram Banarasi Silk Saree", slug: "kanjeevaram-banarasi-silk-saree", brand: "Kanhaiya Artisan", base_price: 12999, compare_at_price: 15999, stock_quantity: 10, is_featured_top_seller: true, top_seller_display_order: 3 },
    { catSlug: "womens-sarees", name: "Chanderi Handloom Cotton Saree", slug: "chanderi-handloom-cotton-saree", brand: "Kanhaiya Artisan", base_price: 4499, compare_at_price: 5499, stock_quantity: 18, is_featured_top_seller: false },
    // Footwear
    { catSlug: "footwear", name: "Handstitched Leather Mojris", slug: "handstitched-leather-mojris", brand: "Kanhaiya Footwear", base_price: 2199, compare_at_price: 2799, stock_quantity: 40, is_featured_top_seller: false },
    { catSlug: "footwear", name: "Classic Oxford Leather Shoes", slug: "classic-oxford-leather-shoes", brand: "Kanhaiya Footwear", base_price: 4299, compare_at_price: 4999, stock_quantity: 22, is_featured_top_seller: false },
    // Jewelry
    { catSlug: "jewelry", name: "Kundan Statement Necklace", slug: "kundan-statement-necklace", brand: "Kanhaiya Jewels", base_price: 8999, compare_at_price: 10999, stock_quantity: 12, is_featured_top_seller: false },
    { catSlug: "jewelry", name: "Antique Brass Chronograph Watch", slug: "antique-brass-chronograph-watch", brand: "Kanhaiya Time", base_price: 6499, compare_at_price: 7999, stock_quantity: 16, is_featured_top_seller: false },
  ];

  let totalProductsCount = 0;
  for (const prodData of rawProducts) {
    const subCat = insertedSubCats.find((c) => c.slug === prodData.catSlug);
    if (!subCat) continue;

    const productPayload = {
      category_id: subCat.id,
      name: prodData.name,
      slug: prodData.slug,
      description: `${prodData.name} crafted with premium quality materials. Perfect for all formal and celebration occasions.`,
      brand: prodData.brand,
      sku: `SKU-${prodData.slug.toUpperCase()}`,
      base_price: prodData.base_price,
      compare_at_price: prodData.compare_at_price,
      stock_quantity: prodData.stock_quantity,
      sold_count: Math.floor(Math.random() * 50) + 5,
      is_active: true,
      is_featured_top_seller: prodData.is_featured_top_seller,
      top_seller_display_order: prodData.top_seller_display_order || null,
      avg_rating: 4.8,
      review_count: 14,
      meta_title: `${prodData.name} | Kanhaiya Collection`,
      meta_description: `Buy ${prodData.name} online at best prices.`,
    };

    const { data: product, error: pError } = await supabase
      .from("products")
      .upsert(productPayload, { onConflict: "slug" })
      .select()
      .single();

    if (pError || !product) {
      console.error("Error inserting product:", prodData.name, pError?.message);
      continue;
    }

    totalProductsCount++;

    // Seed Product Images (2-3 images per product, EXACTLY 1 primary image)
    const img1Url = await uploadMediaPlaceholder(`products/${product.slug}-primary.svg`, `${product.name} - Front View`);
    const img2Url = await uploadMediaPlaceholder(`products/${product.slug}-detail.svg`, `${product.name} - Detail View`);
    const img3Url = await uploadMediaPlaceholder(`products/${product.slug}-style.svg`, `${product.name} - Styling`);

    const imagesPayload = [
      { product_id: product.id, image_url: img1Url, alt_text: `${product.name} primary view`, display_order: 1, is_primary: true },
      { product_id: product.id, image_url: img2Url, alt_text: `${product.name} detail view`, display_order: 2, is_primary: false },
      { product_id: product.id, image_url: img3Url, alt_text: `${product.name} style view`, display_order: 3, is_primary: false },
    ];

    for (const img of imagesPayload) {
      await supabase.from("product_images").insert(img).select();
    }

    // Seed Product Variants (1-2 variants per product, JSONB attributes)
    const variantsPayload = [
      {
        product_id: product.id,
        variant_name: "Medium / Blue",
        sku: `SKU-${product.slug.toUpperCase()}-M-BLU`,
        attributes: { color: "Blue", size: "M" },
        price: product.base_price,
        compare_at_price: product.compare_at_price,
        stock_quantity: Math.floor(product.stock_quantity / 2),
        image_url: img1Url,
        is_active: true,
      },
      {
        product_id: product.id,
        variant_name: "Large / Red",
        sku: `SKU-${product.slug.toUpperCase()}-L-RED`,
        attributes: { color: "Red", size: "L" },
        price: product.base_price + 100,
        compare_at_price: (product.compare_at_price || product.base_price) + 100,
        stock_quantity: Math.floor(product.stock_quantity / 2),
        image_url: img2Url,
        is_active: true,
      },
    ];

    for (const v of variantsPayload) {
      await supabase.from("product_variants").upsert(v, { onConflict: "sku" }).select();
    }
  }

  console.log(`✅ Seeded ${totalProductsCount} Products with Images & Variants.`);

  // 4. Seed Banners (2 Banners)
  console.log("🎨 Seeding Banners...");
  const bannersData = [
    { image_url: bannerImages[0], title: "Summer Festive Collection 2026", link_url: "/shop?category=menswear", display_order: 1, is_active: true },
    { image_url: bannerImages[1], title: "Handcrafted Heritage Sarees", link_url: "/shop?category=womens-sarees", display_order: 2, is_active: true },
  ];
  for (const b of bannersData) {
    await supabase.from("banners").insert(b);
  }

  // 5. Seed Testimonials (4 Testimonials)
  console.log("💬 Seeding Testimonials...");
  const testimonialsData = [
    { customer_name: "Priya Sharma", designation: "Fashion Blogger", avatar_url: avatarImages[0], content: "The quality of silk and handloom craftsmanship is outstanding. Highly recommended!", rating: 5, display_order: 1, is_active: true },
    { customer_name: "Rahul Verma", designation: "Verified Buyer", avatar_url: avatarImages[1], content: "Perfect fitting tailored chinos. Delivery was super prompt.", rating: 5, display_order: 2, is_active: true },
    { customer_name: "Ananya Mehta", designation: "Design Consultant", avatar_url: avatarImages[2], content: "Exquisite Kundan jewelry set. The packaging and finish exceeded expectations.", rating: 5, display_order: 3, is_active: true },
    { customer_name: "Vikram Singh", designation: "Corporate Executive", avatar_url: avatarImages[3], content: "Great luxury linen collection. Kanhaiya Heritage never disappoints.", rating: 4, display_order: 4, is_active: true },
  ];
  for (const t of testimonialsData) {
    await supabase.from("testimonials").insert(t);
  }

  // 6. Seed About-Us Sections (3 Sections)
  console.log("📖 Seeding About-Us Sections...");
  const aboutUsData = [
    { heading: "Our Rich Heritage", subheading: "Crafting Timeless Elegance Since 1998", body: "Kanhaiya Collection was founded with a passion to celebrate authentic Indian textile artistry and modern tailoring.", image_url: aboutImages[0], display_order: 1, is_active: true },
    { heading: "Master Craftsmanship", subheading: "Uncompromising Quality & Detail", body: "Every fabric is handpicked and crafted by master weavers across India to deliver unparalleled elegance.", image_url: aboutImages[1], display_order: 2, is_active: true },
    { heading: "Sustainable & Ethical", subheading: "Empowering Local Artisan Communities", body: "We partner directly with traditional weaver cooperatives ensuring fair wage practices and sustainable production.", image_url: aboutImages[2], display_order: 3, is_active: true },
  ];
  for (const ab of aboutUsData) {
    await supabase.from("about_us_sections").insert(ab);
  }

  // 7. Seed FAQs (6 FAQs)
  console.log("❓ Seeding FAQs...");
  const faqsData = [
    { question: "What are your shipping charges?", answer: "We offer free standard shipping across India on all orders above ₹1,999.", category: "Shipping", display_order: 1, is_active: true },
    { question: "How long does delivery take?", answer: "Standard delivery takes 3 to 5 business days depending on your location.", category: "Shipping", display_order: 2, is_active: true },
    { question: "What is your return & exchange policy?", answer: "We have a 7-day hassle-free return policy for unused products with original tags.", category: "Returns", display_order: 3, is_active: true },
    { question: "Are your products 100% authentic handloom?", answer: "Yes, all our silk and handloom collections come with authentic certified quality assurance.", category: "Products", display_order: 4, is_active: true },
    { question: "How can I track my order?", answer: "Once shipped, you will receive an SMS and email notification with your tracking link.", category: "Orders", display_order: 5, is_active: true },
    { question: "Which payment methods do you support?", answer: "We support Credit/Debit Cards, UPI, Netbanking, and Cash on Delivery (COD).", category: "Payments", display_order: 6, is_active: true },
  ];
  for (const faq of faqsData) {
    await supabase.from("faqs").insert(faq);
  }

  // 8. Seed Site Policies (4 Records: privacy, terms, shipping, return)
  console.log("📜 Seeding Site Policies...");
  const sitePoliciesData: Database["public"]["Tables"]["site_policies"]["Insert"][] = [
    { type: "privacy", title: "Privacy Policy", content: "Your privacy is important to us. We protect your personal information and never share data with third parties without consent." },
    { type: "terms", title: "Terms of Service", content: "By accessing Kanhaiya Collection, you agree to comply with our terms, conditions, and store guidelines." },
    { type: "shipping", title: "Shipping Policy", content: "Orders are processed within 24 hours. Free shipping applies on orders over ₹1,999." },
    { type: "return", title: "Return & Refund Policy", content: "Items can be returned within 7 days of delivery. Refunds are credited within 5 business days of inspection." },
  ];
  for (const policy of sitePoliciesData) {
    await supabase
      .from("site_policies")
      .upsert(policy, { onConflict: "type" });
  }

  console.log("✨ Seed process completed successfully!");
}

seed().catch((err) => {
  console.error("❌ Seed script failed:", err);
  process.exit(1);
});
