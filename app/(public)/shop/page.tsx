import React from "react";
import Link from "next/link";
import { getAllProducts, getActiveCategories } from "@/lib/store";
import { ProductCard } from "@/components/ui/product-card";
import { ShoppingBag } from "lucide-react";

export const metadata = {
  title: "Shop All Sacred Offerings | Kanhaiya Collection",
  description:
    "Explore our curated store for sacred brass idols, puja essentials, temple brassware, and spiritual home offerings.",
};

interface ShopPageProps {
  searchParams: Promise<{ category?: string; sort?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category: selectedCategorySlug, sort } = await searchParams;

  const [categories, allProducts] = await Promise.all([
    getActiveCategories(),
    getAllProducts(),
  ]);

  const selectedCategory = selectedCategorySlug
    ? categories.find((c) => c.slug === selectedCategorySlug)
    : null;

  let filtered = allProducts.filter((p) => p.is_active);

  if (selectedCategory) {
    filtered = filtered.filter((p) => p.category_id === selectedCategory.id);
  }

  // Sorting
  if (sort === "bestseller") {
    filtered.sort((a, b) => b.sold_count - a.sold_count);
  } else if (sort === "newest") {
    filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } else if (sort === "price-low") {
    filtered.sort((a, b) => a.base_price - b.base_price);
  } else if (sort === "price-high") {
    filtered.sort((a, b) => b.base_price - a.base_price);
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="min-h-screen bg-[#FFFDF7] py-10 sm:py-16 font-sans">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F8F1E3] border border-[#E8DCC8] px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#C8891A] mb-3">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Divine Store</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#3B2416]">
            {selectedCategory ? selectedCategory.name : "All Sacred Offerings"}
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-[#806B57] font-normal leading-relaxed">
            {selectedCategory?.description ||
              "Curated collection of sacred idols, puja essentials, pure brassware, and festive treasures."}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          <Link
            href="/shop"
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              !selectedCategorySlug
                ? "bg-[#C8891A] text-white shadow-xs"
                : "bg-[#FFFDF7] border border-[#E8DCC8] text-[#3B2416] hover:bg-[#F8F1E3]"
            }`}
          >
            All Products ({allProducts.length})
          </Link>
          {categories.map((cat) => {
            const isSelected = selectedCategorySlug === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-[#C8891A] text-white shadow-xs"
                    : "bg-[#FFFDF7] border border-[#E8DCC8] text-[#3B2416] hover:bg-[#F8F1E3]"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-[#F8F1E3]/40 border border-[#E8DCC8]">
            <p className="font-serif text-lg text-[#3B2416]">No products found in this category.</p>
            <Link
              href="/shop"
              className="mt-4 inline-block px-5 py-2 rounded-xl bg-[#C8891A] text-white text-xs font-semibold"
            >
              View All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={categoryMap.get(product.category_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
