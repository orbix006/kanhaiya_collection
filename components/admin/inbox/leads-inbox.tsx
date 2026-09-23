"use client";

import { useState, useMemo } from "react";
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
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const filteredLeads = useMemo(() => {
    if (statusFilter === "all") return leads;
    return leads.filter((l) => l.status === statusFilter);
  }, [leads, statusFilter]);

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
        setLeads((prev) =>
          prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l))
        );
        if (selectedLead?.id === lead.id) {
          setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
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
      label: "New Lead",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    },
    contacted: {
      label: "Contacted",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    },
    converted: {
      label: "Converted",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    },
    closed: {
      label: "Closed",
      className: "bg-muted text-muted-foreground border-border",
    },
  };

  const columns: Column<Lead>[] = [
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (l) => {
        const badge = statusBadges[l.status] || statusBadges.new;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.className}`}
          >
            {l.status === "converted" ? (
              <Check className="h-3 w-3" />
            ) : l.status === "contacted" ? (
              <Clock className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            <span>{badge.label}</span>
          </span>
        );
      },
    },
    {
      key: "email",
      header: "Lead Contact",
      sortable: true,
      render: (l) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-xs">{l.email}</span>
          {l.name && (
            <span className="text-[11px] text-muted-foreground">{l.name}</span>
          )}
        </div>
      ),
    },
    {
      key: "source",
      header: "Capture Source",
      sortable: true,
      render: (l) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-muted text-[11px] font-bold text-foreground border border-border/60 uppercase tracking-wider font-mono">
          <Share2 className="h-3 w-3 text-primary" />
          <span>{l.source || "newsletter"}</span>
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (l) => (
        <span className="text-xs text-muted-foreground">
          {l.phone || "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Subscribed Date",
      sortable: true,
      render: (l) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(l.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (l) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setSelectedLead(l)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/70 hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span>Inspect</span>
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            statusFilter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          All Leads ({counts.all})
        </button>
        <button
          onClick={() => setStatusFilter("new")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            statusFilter === "new"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          New ({counts.new})
        </button>
        <button
          onClick={() => setStatusFilter("contacted")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            statusFilter === "contacted"
              ? "bg-amber-600 text-white border-amber-600"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          Contacted ({counts.contacted})
        </button>
        <button
          onClick={() => setStatusFilter("converted")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            statusFilter === "converted"
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          Converted ({counts.converted})
        </button>
        <button
          onClick={() => setStatusFilter("closed")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            statusFilter === "closed"
              ? "bg-muted text-foreground border-border"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          Closed ({counts.closed})
        </button>
      </div>

      <AdminDataTable
        columns={columns}
        data={filteredLeads}
        searchPlaceholder="Search leads by email, name, phone, or capture source..."
        searchKeys={["email", "name", "phone", "source", "message"]}
        initialSortKey="created_at"
        initialSortDirection="desc"
      />

      {/* Inspection Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl p-6 overflow-hidden space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  Lead: {selectedLead.email}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Lead Details Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-muted/40 border border-border/60 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[11px] font-semibold">
                  Email Address
                </span>
                <a
                  href={`mailto:${selectedLead.email}`}
                  className="font-bold text-primary hover:underline flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{selectedLead.email}</span>
                </a>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[11px] font-semibold">
                  Full Name
                </span>
                <span className="font-semibold text-foreground">
                  {selectedLead.name || "Not provided"}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[11px] font-semibold">
                  Capture Source
                </span>
                <span className="font-mono uppercase font-bold text-foreground">
                  {selectedLead.source || "newsletter"}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[11px] font-semibold">
                  Phone Number
                </span>
                {selectedLead.phone ? (
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="font-bold text-foreground hover:underline flex items-center gap-1.5"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{selectedLead.phone}</span>
                  </a>
                ) : (
                  <span className="text-muted-foreground">Not provided</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[11px] font-semibold">
                  Subscription Timestamp
                </span>
                <span className="text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {new Date(selectedLead.created_at).toLocaleString("en-IN")}
                  </span>
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[11px] font-semibold">
                  Current Status
                </span>
                <span className="font-bold uppercase tracking-wide text-primary">
                  {selectedLead.status}
                </span>
              </div>
            </div>

            {selectedLead.message && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Attached Note / Request
                </label>
                <div className="p-3 rounded-xl border border-border bg-background text-xs text-foreground leading-relaxed">
                  {selectedLead.message}
                </div>
              </div>
            )}

            {/* Status Transition Buttons */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <span className="text-xs font-semibold text-muted-foreground">
                Update Lead Status:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isUpdating || selectedLead.status === "new"}
                  onClick={() => handleStatusChange(selectedLead, "new")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedLead.status === "new"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  New
                </button>
                <button
                  type="button"
                  disabled={isUpdating || selectedLead.status === "contacted"}
                  onClick={() => handleStatusChange(selectedLead, "contacted")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedLead.status === "contacted"
                      ? "bg-amber-600 text-white border-amber-600"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Contacted
                </button>
                <button
                  type="button"
                  disabled={isUpdating || selectedLead.status === "converted"}
                  onClick={() => handleStatusChange(selectedLead, "converted")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedLead.status === "converted"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Converted
                </button>
                <button
                  type="button"
                  disabled={isUpdating || selectedLead.status === "closed"}
                  onClick={() => handleStatusChange(selectedLead, "closed")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedLead.status === "closed"
                      ? "bg-muted text-foreground border-border"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Closed
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setLeadToDelete(selectedLead);
                  setDeleteModalOpen(true);
                }}
                className="text-xs font-semibold text-destructive hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete lead record</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
              >
                Close
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
              Are you sure you want to remove lead{" "}
              <strong>&ldquo;{leadToDelete.email}&rdquo;</strong>?
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
