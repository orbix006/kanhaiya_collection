import React from "react";
import type { Metadata } from "next";
import { AdminComingSoon } from "@/components/admin/admin-coming-soon";
import { Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Customers & Roles — Coming Soon | Kanhaiya Admin",
  description: "Customer and role management module undergoing restructuring in accordance with the Phase 0 admin updates.",
};

export default function AdminUsersPage() {
  return (
    <AdminComingSoon
      moduleName="Customer & Role Management"
      description="The customer profiles and role administration module is undergoing restructuring. Patron profiles and role-based access management will be re-introduced in a future phase."
      icon={Users}
    />
  );
}
