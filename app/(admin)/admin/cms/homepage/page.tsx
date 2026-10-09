import { getHomepageSectionsAdmin } from "@/lib/data/cms";
import { HomepageManager } from "@/components/admin/cms/homepage-manager";
import { Layers, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminHomepageSectionsPage() {
  const sections = await getHomepageSectionsAdmin();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Storefront Layout</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Homepage Section Sequence & Enablement
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Control the visual ordering and live visibility of sections on the storefront homepage without code deployment.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border">
          <Layers className="h-4 w-4 text-primary" />
          <span>{sections.length} configurable sections</span>
        </div>
      </div>

      <HomepageManager initialSections={sections} />
    </div>
  );
}
