import React from "react";
import { getFestiveOffer } from "@/lib/store";
import { loadMockStore } from "@/lib/mock-data/admin-store";
import { DashboardView } from "@/components/admin/dashboard-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Executive Admin Dashboard | Kanhaiya Collection",
  description: "Executive Management & Operations Portal for Kanhaiya Collection",
};

export default async function AdminDashboardPage() {
  const festiveData = await getFestiveOffer();
  const initialStore = loadMockStore();

  return (
    <DashboardView
      initialStore={initialStore}
      festiveOffer={festiveData.offer}
    />
  );
}

