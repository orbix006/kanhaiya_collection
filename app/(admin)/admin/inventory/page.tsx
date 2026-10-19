import React from "react";
import type { Metadata } from "next";
import { AdminComingSoon } from "@/components/admin/admin-coming-soon";
import { Boxes } from "lucide-react";

export const metadata: Metadata = {
  title: "Inventory & Stock Control — Coming Soon | Kanhaiya Admin",
  description: "Inventory module undergoing restructuring in accordance with the Phase 0 admin updates.",
};

export default function AdminInventoryPage() {
  return (
    <AdminComingSoon
      moduleName="Inventory & Stock Control"
      description="Inventory management is undergoing administrative restructuring to integrate directly into product catalog controls. Advanced multi-warehouse tracking will be available in an upcoming phase."
      icon={Boxes}
    />
  );
}
