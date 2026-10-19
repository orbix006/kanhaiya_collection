import React from "react";
import type { Metadata } from "next";
import { AdminComingSoon } from "@/components/admin/admin-coming-soon";
import { Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Reviews Moderation — Coming Soon | Kanhaiya Admin",
  description: "Customer reviews moderation module undergoing restructuring in accordance with the Phase 0 admin updates.",
};

export default function AdminReviewsPage() {
  return (
    <AdminComingSoon
      moduleName="Customer Review Moderation"
      description="The customer reviews moderation portal is undergoing administrative restructuring. Review management and verified purchase moderation will be available in an upcoming phase."
      icon={Star}
    />
  );
}
