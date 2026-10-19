import React from "react";
import type { Metadata } from "next";
import { AdminComingSoon } from "@/components/admin/admin-coming-soon";
import { HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQs & Help — Coming Soon | Kanhaiya Admin",
  description: "FAQs module undergoing restructuring in accordance with the Phase 0 admin updates.",
};

export default function AdminFaqsPage() {
  return (
    <AdminComingSoon
      moduleName="FAQs & Help Center"
      description="The FAQs and customer knowledge base management module is temporarily undergoing administrative restructuring."
      icon={HelpCircle}
    />
  );
}
