import React from "react";
import { getActiveCategories, getAllProducts } from "@/lib/store";
import { CategoryDiscoveryClient } from "@/components/public/category-discovery-client";

export const metadata = {
  title: "Categories & Sacred Offerings | Kanhaiya Collection",
  description:
    "Explore sacred collections of handcrafted brass idols, puja essentials, temple brassware, and altar decor categorized for your rituals.",
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  let categories: any[] = [];
  let products: any[] = [];

  try {
    const [cats, prods] = await Promise.all([
      getActiveCategories(),
      getAllProducts(),
    ]);
    categories = Array.isArray(cats) ? cats : [];
    products = Array.isArray(prods) ? prods : [];
  } catch {
    categories = [];
    products = [];
  }

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <CategoryDiscoveryClient
      categories={safeCategories}
      products={safeProducts}
    />
  );
}