import React from "react";
import type { Metadata } from "next";
import { getContactSubmissionsAdmin, getLeadsAdmin, getResponseNotesAdmin } from "@/lib/data/cms";
import { UnifiedInbox } from "@/components/admin/inbox/unified-inbox";
import { Mail, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Inquiries & Leads | Kanhaiya Admin",
  description: "Review and manage customer contact form inquiries and captured leads in a consolidated admin experience.",
};

export default async function AdminInboxPage() {
  const [submissions, leads, notes] = await Promise.all([
    getContactSubmissionsAdmin(),
    getLeadsAdmin(),
    getResponseNotesAdmin(),
  ]);

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Audience & Communications Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Contact Inquiries & Captured Leads
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Review customer contact submissions and audience subscriber leads in a unified administrative interface while preserving distinct backend data models.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border shrink-0">
          <Mail className="h-4 w-4 text-primary" />
          <span>{submissions.length + leads.length} total audience records</span>
        </div>
      </div>

      <UnifiedInbox
        initialSubmissions={submissions}
        initialLeads={leads}
        initialNotes={notes}
      />
    </div>
  );
}
