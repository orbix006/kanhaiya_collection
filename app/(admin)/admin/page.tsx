import React from "react";
import {
  getAllBanners,
  getAllCategories,
  getAllProducts,
  getFestiveOffer,
} from "@/lib/store";
import { AdminPanel } from "@/components/admin/admin-panel";

export const revalidate = 0; // Dynamic server rendering for admin portal

export const metadata = {
  title: "Admin Panel | Kanhaiya Collection",
  description: "Administrative Management Portal for Banners, Categories, and Festive Offers",
};

export default async function AdminDashboardPage() {
  const [banners, categories, products, festiveData] = await Promise.all([
    getAllBanners(),
    getAllCategories(),
    getAllProducts(),
    getFestiveOffer(),
  ]);

  return (
    <AdminPanel
      initialBanners={banners}
      initialCategories={categories}
      initialProducts={products}
      initialFestiveOffer={festiveData.offer}
    />
  );
}
