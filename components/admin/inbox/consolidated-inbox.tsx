"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  UserCheck,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { ContactInbox } from "./contact-inbox";
import { LeadsInbox } from "./leads-inbox";
import type { ContactSubmission, Lead } from "@/lib/data/cms";

interface ConsolidatedInboxProps {
  initialSubmissions: ContactSubmission[];
  initialLeads: Lead[];
}

export function ConsolidatedInbox({
  initialSubmissions,
  initialLeads,
}: ConsolidatedInboxProps) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [localTab, setLocalTab] = useState<"contact" | "leads">("contact");

  const activeTab: "contact" | "leads" =
    urlTab === "leads" || urlTab === "contact" ? urlTab : localTab;

  // Compute metrics
  const newSubmissionsCount = initialSubmissions.filter((s) => s.status === "new").length;
  const newLeadsCount = initialLeads.filter((l) => l.status === "new").length;

  return (
    <div className="space-y-6 font-sans">
      {/* Consolidated Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Inquiries
            </div>
            <div className="text-xl font-extrabold text-foreground mt-0.5 font-mono">
              {initialSubmissions.length}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Contact Us submissions
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              New Inquiries
            </div>
            <div className="text-xl font-extrabold text-amber-600 mt-0.5 font-mono">
              {newSubmissionsCount}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Awaiting review
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Mail className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Captured Leads
            </div>
            <div className="text-xl font-extrabold text-foreground mt-0.5 font-mono">
              {initialLeads.length}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Newsletter & popups
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Uncontacted Leads
            </div>
            <div className="text-xl font-extrabold text-teal-600 mt-0.5 font-mono">
              {newLeadsCount}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Ready for outreach
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-muted/50 rounded-2xl border border-border/80">
        <button
          type="button"
          onClick={() => setLocalTab("contact")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "contact"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-card/60"
          }`}
        >
          <Mail className="h-4 w-4" />
          <span>Contact Submissions</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary-foreground/20 font-mono">
            {initialSubmissions.length}
          </span>
          {newSubmissionsCount > 0 && (
            <span className="h-2 w-2 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setLocalTab("leads")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "leads"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-card/60"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Captured Audience Leads</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary-foreground/20 font-mono">
            {initialLeads.length}
          </span>
          {newLeadsCount > 0 && (
            <span className="h-2 w-2 rounded-full bg-teal-400" />
          )}
        </button>
      </div>

      {/* Tab Content 1: Contact Submissions */}
      {activeTab === "contact" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <ContactInbox initialSubmissions={initialSubmissions} />
        </div>
      )}

      {/* Tab Content 2: Captured Audience Leads */}
      {activeTab === "leads" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <LeadsInbox initialLeads={initialLeads} />
        </div>
      )}
    </div>
  );
}
