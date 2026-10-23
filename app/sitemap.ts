import type { MetadataRoute } from "next";
import { getAllActiveCategories, type Category, type ProductItem } from "@/lib/data/homepage";
import { getShopProducts } from "@/lib/data/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://kanhaiyacollection.com";
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");

  // Canonical public static routes (excludes redirect-only routes like /faq, /refund, /privacy-policy)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faqs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/shipping`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/return`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/cancellation`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  try {
    const [categories, shopResult] = await Promise.all([
      getAllActiveCategories().catch(() => [] as Category[]),
      getShopProducts({ pageSize: 100 }).catch(() => ({
        products: [] as ProductItem[],
        totalCount: 0,
        page: 1,
        pageSize: 100,
        totalPages: 1,
      })),
    ]);

    const categoryRoutes: MetadataRoute.Sitemap = (categories || [])
      .filter((cat: Category) => cat.slug && cat.slug.trim())
      .map((cat: Category) => ({
        url: `${baseUrl}/shop?category=${encodeURIComponent(cat.slug)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    // Canonical product routes: /shop/product/[slug]
    const productRoutes: MetadataRoute.Sitemap = (shopResult?.products || [])
      .filter((prod: ProductItem) => prod.slug && prod.slug.trim())
      .map((prod: ProductItem) => ({
        url: `${baseUrl}/shop/product/${encodeURIComponent(prod.slug)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch (err) {
    console.error("[Sitemap Generation Error]:", err);
    return staticRoutes;
  }
}
