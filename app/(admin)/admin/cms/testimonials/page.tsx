import React from "react";
import type { Metadata } from "next";
import { AdminComingSoon } from "@/components/admin/admin-coming-soon";
import { MessageSquareHeart } from "lucide-react";

export const metadata: Metadata = {
  title: "Wall of Love — Coming Soon | Kanhaiya Admin",
  description: "Wall of Love module undergoing restructuring in accordance with the Phase 0 admin updates.",
};

export default function AdminTestimonialsPage() {
  return (
    <AdminComingSoon
      moduleName="Wall of Love / Testimonials"
      description="The customer testimonials management module is undergoing administrative restructuring in accordance with the updated admin architecture."
      icon={MessageSquareHeart}
    />
  );
}
