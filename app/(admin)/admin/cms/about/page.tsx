import React from "react";
import type { Metadata } from "next";
import { AdminComingSoon } from "@/components/admin/admin-coming-soon";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us Story — Coming Soon | Kanhaiya Admin",
  description: "About Us Story module undergoing restructuring in accordance with the Phase 0 admin updates.",
};

export default function AdminAboutPage() {
  return (
    <AdminComingSoon
      moduleName="About Us Brand Story"
      description="The brand storytelling and heritage content management module is undergoing administrative restructuring."
      icon={BookOpen}
    />
  );
}
