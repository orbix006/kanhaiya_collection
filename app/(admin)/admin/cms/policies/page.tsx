import { getSitePoliciesAdmin } from "@/lib/data/cms";
import { PoliciesManager } from "@/components/admin/cms/policies-manager";
import { Sparkles, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPoliciesPage() {
  const policies = await getSitePoliciesAdmin();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Legal & Store Terms</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Site Policies & Governance
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Edit content for the 4 core customer policy documents: Privacy Policy, Terms of Service, Shipping & Delivery, and Returns & Refunds.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>4 policy documents</span>
        </div>
      </div>

      <PoliciesManager initialPolicies={policies} />
    </div>
  );
}
