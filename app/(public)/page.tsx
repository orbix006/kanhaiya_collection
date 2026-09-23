import { createClient } from "@/lib/supabase/server";
import {
  getHomepageSections,
  getActiveBanners,
  getHomepageCategories,
  getContinueBrowsingProducts,
  getTopSellers,
  getCategoryProductSections,
  getActiveTestimonials,
} from "@/lib/data/homepage";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { CategoryGrid } from "@/components/home/category-grid";
import { ContinueBrowsing } from "@/components/home/continue-browsing";
import { TopSellersSection } from "@/components/home/top-sellers";
import { CategoryProductRows } from "@/components/home/category-product-rows";
import { TestimonialsSection } from "@/components/home/testimonials-section";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all homepage data in parallel
  const [
    sections,
    banners,
    homepageCategories,
    continueBrowsingProducts,
    topSellers,
    categoryProductSections,
    testimonials,
  ] = await Promise.all([
    getHomepageSections(),
    getActiveBanners(),
    getHomepageCategories(),
    getContinueBrowsingProducts(user?.id),
    getTopSellers(),
    getCategoryProductSections(),
    getActiveTestimonials(),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sections dynamically rendered strictly according to homepage_sections.display_order */}
      {sections.map((section) => {
        if (!section.is_enabled) return null;

        switch (section.key) {
          case "banner":
            return <BannerCarousel key={section.key} banners={banners} />;

          case "shop_by_category":
            return (
              <CategoryGrid
                key={section.key}
                categories={homepageCategories}
              />
            );

          case "continue_browsing":
            // Render nothing for logged-out users or empty view history
            if (!user || continueBrowsingProducts.length === 0) {
              return null;
            }
            return (
              <ContinueBrowsing
                key={section.key}
                products={continueBrowsingProducts}
                isAuthenticated={true}
              />
            );

          case "top_sellers":
            return (
              <TopSellersSection
                key={section.key}
                products={topSellers}
              />
            );

          case "category_products":
            return (
              <CategoryProductRows
                key={section.key}
                categorySections={categoryProductSections}
              />
            );

          case "wall_of_love":
            return (
              <TestimonialsSection
                key={section.key}
                testimonials={testimonials}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
