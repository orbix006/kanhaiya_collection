import React from "react";
import type { Metadata } from "next";
import { AdminComingSoon } from "@/components/admin/admin-coming-soon";
import { Sliders } from "lucide-react";

export const metadata: Metadata = {
  title: "Site Settings — Coming Soon | Kanhaiya Admin",
  description: "Site & footer settings module undergoing restructuring in accordance with the Phase 0 admin updates.",
};

export default function AdminSiteSettingsPage() {
  return (
    <AdminComingSoon
      moduleName="Site Settings and Footer Settings"
      description="Site configuration and footer settings management is undergoing administrative restructuring."
      icon={Sliders}
    />
  );
}
