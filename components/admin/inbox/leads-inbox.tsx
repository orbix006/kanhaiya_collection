"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Users,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Share2,
  Check,
  Tag,
  Sparkles,
  UserCheck,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { AdminDataTable, Column } from "@/components/admin/data-table";
import {
  updateLeadStatusAction,
  deleteLeadAction,
} from "@/app/(admin)/admin/inbox/actions";
import type { Lead } from "@/lib/data/cms";

interface LeadsInboxProps {
  initialLeads: Lead[];
}

export function LeadsInbox({ initialLeads }: LeadsInboxProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Client hydration from mock store
  useEffect(() => {
    try {
      const raw = localStorage.getItem("kanhaiya_admin_mock_store_v6");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.leads) && parsed.leads.length > 0) {
          setLeads(
            [...parsed.leads].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          );
        }
      }
    } catch {}
  }, []);

  const sources = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.source) set.add(l.source);
    });
    return Array.from(set);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesStatus = statusFilter === "all" || l.status === statusFilter;
      const matchesSource =
        sourceFilter === "all" ||
        (l.source && l.source.toLowerCase() === sourceFilter.toLowerCase());
      return matchesStatus && matchesSource;
    });
  }, [leads, statusFilter, sourceFilter]);

  const counts = useMemo(() => {
    return {
      all: leads.length,
      new: leads.filter((l) => l.status === "new").length,
      contacted: leads.filter((l) => l.status === "contacted").length,
      converted: leads.filter((l) => l.status === "converted").length,
      closed: leads.filter((l) => l.status === "closed").length,
    };
  }, [leads]);

  const handleStatusChange = async (
    lead: Lead,
    newStatus: "new" | "contacted" | "converted" | "closed"
  ) => {
    setIsUpdating(true);
    try {
      const res = await updateLeadStatusAction(lead.id, newStatus);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        const updatedTime = new Date().toISOString();
        setLeads((prev) =>
          prev.map((l) =>
            l.id === lead.id ? { ...l, status: newStatus, updated_at: updatedTime } : l
          )
        );
        if (selectedLead?.id === lead.id) {
          setSelectedLead((prev) =>
            prev ? { ...prev, status: newStatus, updated_at: updatedTime } : null
          );
        }
        setToastMessage({
          text: `Lead status updated to '${newStatus}'.`,
          type: "success",
        });
      }
    } catch {
      setToastMessage({ text: "Failed to update lead status.", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    setIsUpdating(true);

    try {
      const res = await deleteLeadAction(leadToDelete.id);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
        if (selectedLead?.id === leadToDelete.id) {
          setSelectedLead(null);
        }
        setToastMessage({ text: "Lead record deleted.", type: "success" });
        setDeleteModalOpen(false);
      }
    } catch {
      setToastMessage({ text: "Failed to delete lead.", type: "error" });
    } finally {
      setIsUpdating(false);
      setLeadToDelete(null);
    }
  };

  const statusBadges = {
    new: {
      label: "New",
      className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 font-bold",
    },
    contacted: {
      label: "Contacted",
      className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold",
    },
    converted: {
      label: "Converted",
      className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold",
    },
    closed: {
      label: "Closed",
      className: "bg-muted text-muted-foreground border-border font-medium",
    },
  };

  const columns: Column<Lead>[] = [
    {
      key: "name",
      header: "Lead / Contact",
      sortable: true,
      render: (l) => (
        <div className="flex items-center gap-2.5">
          {l.status === "new" ? (
            <span
              className="h-2 w-2 rounded-full bg-blue-500 shrink-0 ring-4 ring-blue-500/20 animate-pulse"
              title="New Inbound Lead"
            />
          ) : (
            <span className="h-2 w-2 rounded-full bg-transparent shrink-0" />
          )}
          <div className="flex flex-col">
            <span
              className={`text-xs ${
                l.status === "new" ? "font-bold text-foreground" : "font-medium text-foreground"
              }`}
            >
              {l.name || "Anonymous Subscriber"}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Mail className="h-2.5 w-2.5" />
              <span>{l.email}</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (l) => (
        <span className="text-xs text-muted-foreground font-mono">
          {l.phone || "—"}
        </span>
      ),
    },
    {
      key: "source",
      header: "Channel Source",
      sortable: true,
      render: (l) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-[10px] font-semibold text-foreground border border-border/70 capitalize">
          <Tag className="h-2.5 w-2.5 text-primary" />
          <span>{l.source || "Direct Form"}</span>
        </span>
      ),
    },
    {
      key: "message",
      header: "Inquiry / Notes",
      render: (l) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-sm">
          {l.message || "Newsletter subscription / interest alert."}
        </p>
      ),
    },
    {
      key: "created_at",
      header: "Captured",
      sortable: true,
      render: (l) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(l.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (l) => {
        const badge = statusBadges[l.status];
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] border ${badge.className}`}
          >
            {l.status === "new" && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
            {l.status === "contacted" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
            {l.status === "converted" && <Check className="h-3 w-3" />}
            {l.status === "closed" && <XCircle className="h-3 w-3" />}
            <span>{badge.label}</span>
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (l) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setSelectedLead(l)}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-muted-foreground transition-colors cursor-pointer"
            title="Inspect Lead"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setLeadToDelete(l);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground transition-colors cursor-pointer"
            title="Delete Lead"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl text-xs font-semibold border ${
            toastMessage.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              : "bg-destructive/10 text-destructive border-destructive/30"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setStatusFilter("all")}
          className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "all"
              ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/40"
              : "bg-card border-border/70 hover:bg-muted/40"
          }`}
        >
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            All Leads
          </span>
          <span className="text-2xl font-extrabold text-foreground">{counts.all}</span>
        </button>

        <button
          onClick={() => setStatusFilter("new")}
          className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "new"
              ? "bg-blue-500/10 border-blue-500 shadow-xs ring-1 ring-blue-500/40"
              : "bg-card border-border/70 hover:bg-muted/40"
          }`}
        >
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span>New</span>
          </span>
          <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">
            {counts.new}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("contacted")}
          className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "contacted"
              ? "bg-amber-500/10 border-amber-500 shadow-xs ring-1 ring-amber-500/40"
              : "bg-card border-border/70 hover:bg-muted/40"
          }`}
        >
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
            Contacted
          </span>
          <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">
            {counts.contacted}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("converted")}
          className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "converted"
              ? "bg-emerald-500/10 border-emerald-500 shadow-xs ring-1 ring-emerald-500/40"
              : "bg-card border-border/70 hover:bg-muted/40"
          }`}
        >
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>Converted</span>
          </span>
          <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {counts.converted}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("closed")}
          className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "closed"
              ? "bg-muted border-foreground/30 shadow-xs ring-1 ring-foreground/20"
              : "bg-card border-border/70 hover:bg-muted/40"
          }`}
        >
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Closed
          </span>
          <span className="text-2xl font-extrabold text-foreground">{counts.closed}</span>
        </button>
      </div>

      {/* Filter by Source Pill Strip */}
      {sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl bg-muted/30 border border-border/70">
          <span className="text-xs font-bold text-muted-foreground mr-1">Source:</span>
          <button
            onClick={() => setSourceFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sourceFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card border border-border/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            All Sources
          </button>
          {sources.map((src) => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer capitalize ${
                sourceFilter === src
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              {src}
            </button>
          ))}
        </div>
      )}

      <AdminDataTable
        columns={columns}
        data={filteredLeads}
        searchPlaceholder="Search leads by customer name, email, phone, or source..."
        searchKeys={["name", "email", "phone", "source", "message"]}
        initialSortKey="created_at"
        initialSortDirection="desc"
      />

      {/* Slide-over Inspection Drawer / Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-8 overflow-hidden space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {selectedLead.name || "Anonymous Subscriber"}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(selectedLead.created_at).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Contact Information & Capture Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-muted/30 border border-border/70 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  Email Address
                </span>
                <a
                  href={`mailto:${selectedLead.email}`}
                  className="font-semibold text-primary hover:underline flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{selectedLead.email}</span>
                </a>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  Contact Phone
                </span>
                {selectedLead.phone ? (
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="font-semibold text-foreground hover:text-primary flex items-center gap-1.5"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{selectedLead.phone}</span>
                  </a>
                ) : (
                  <span className="text-muted-foreground">Not provided</span>
                )}
              </div>
              <div className="space-y-1 sm:col-span-2 pt-1 border-t border-border/40">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  Marketing Acquisition Channel
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs font-semibold text-foreground capitalize">
                  <Tag className="h-3 w-3 text-primary" />
                  <span>{selectedLead.source || "Website Inbound"}</span>
                </span>
              </div>
            </div>

            {/* Inquiry Details / Message */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground">Submission Note / Interest:</span>
              <div className="p-4 rounded-2xl bg-muted/20 border border-border text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line">
                {selectedLead.message || "Newsletter subscription initiated via storefront footer."}
              </div>
            </div>

            {/* Status Transition Control (Schema strictly: new | contacted | converted | closed) */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-foreground">
                Lead Pipeline Status:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["new", "contacted", "converted", "closed"] as const).map((st) => {
                  const isCurrent = selectedLead.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(selectedLead, st)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 capitalize ${
                        isCurrent
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {isCurrent && <Check className="h-3.5 w-3.5" />}
                      <span>{st}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <button
                onClick={() => {
                  setLeadToDelete(selectedLead);
                  setDeleteModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Lead</span>
              </button>

              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-muted text-foreground hover:bg-muted/80 cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 text-destructive">
              <Trash2 className="h-4.5 w-4.5" />
              <span>Confirm Lead Deletion</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete lead{" "}
              <strong>&ldquo;{leadToDelete.name || leadToDelete.email}&rdquo;</strong>? This record will be removed from your audience records.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border text-foreground hover:bg-muted cursor-pointer"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer disabled:opacity-50"
                disabled={isUpdating}
              >
                {isUpdating ? "Deleting..." : "Delete Lead"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
