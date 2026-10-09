"use client";

import { useState, useMemo } from "react";
import {
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
} from "lucide-react";
import { AdminDataTable, Column } from "@/components/admin/data-table";
import {
  updateContactStatusAction,
  deleteContactSubmissionAction,
} from "@/app/(admin)/admin/inbox/actions";
import type { ContactSubmission } from "@/lib/data/cms";

interface ContactInboxProps {
  initialSubmissions: ContactSubmission[];
}

export function ContactInbox({ initialSubmissions }: ContactInboxProps) {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>(initialSubmissions);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<ContactSubmission | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const filteredSubmissions = useMemo(() => {
    if (statusFilter === "all") return submissions;
    return submissions.filter((s) => s.status === statusFilter);
  }, [submissions, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: submissions.length,
      new: submissions.filter((s) => s.status === "new").length,
      in_progress: submissions.filter((s) => s.status === "in_progress").length,
      resolved: submissions.filter((s) => s.status === "resolved").length,
    };
  }, [submissions]);

  const handleStatusChange = async (
    submission: ContactSubmission,
    newStatus: "new" | "in_progress" | "resolved"
  ) => {
    setIsUpdating(true);
    try {
      const res = await updateContactStatusAction(submission.id, newStatus);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === submission.id ? { ...s, status: newStatus } : s))
        );
        if (selectedSubmission?.id === submission.id) {
          setSelectedSubmission((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        setToastMessage({
          text: `Inquiry status changed to '${newStatus.replace("_", " ")}'.`,
          type: "success",
        });
      }
    } catch {
      setToastMessage({ text: "Failed to update inquiry status.", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = async () => {
    if (!submissionToDelete) return;
    setIsUpdating(true);

    try {
      const res = await deleteContactSubmissionAction(submissionToDelete.id);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        setSubmissions((prev) => prev.filter((s) => s.id !== submissionToDelete.id));
        if (selectedSubmission?.id === submissionToDelete.id) {
          setSelectedSubmission(null);
        }
        setToastMessage({ text: "Inquiry record deleted.", type: "success" });
        setDeleteModalOpen(false);
      }
    } catch {
      setToastMessage({ text: "Failed to delete submission.", type: "error" });
    } finally {
      setIsUpdating(false);
      setSubmissionToDelete(null);
    }
  };

  const statusBadges = {
    new: {
      label: "New Inquiry",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    },
    in_progress: {
      label: "In Progress",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    },
    resolved: {
      label: "Resolved",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    },
  };

  const columns: Column<ContactSubmission>[] = [
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (s) => {
        const badge = statusBadges[s.status] || statusBadges.new;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.className}`}
          >
            {s.status === "resolved" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : s.status === "in_progress" ? (
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
      key: "name",
      header: "Customer",
      sortable: true,
      render: (s) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-xs">{s.name}</span>
          <span className="text-[11px] text-muted-foreground">{s.email}</span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (s) => (
        <span className="text-xs text-muted-foreground">
          {s.phone || "—"}
        </span>
      ),
    },
    {
      key: "message",
      header: "Inquiry Message",
      render: (s) => (
        <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm">
          {s.message}
        </p>
      ),
    },
    {
      key: "created_at",
      header: "Date Received",
      sortable: true,
      render: (s) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(s.created_at).toLocaleDateString("en-IN", {
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
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setSelectedSubmission(s)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/70 hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span>Inspect</span>
          </button>
          <button
            onClick={() => {
              setSubmissionToDelete(s);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground transition-colors cursor-pointer"
            title="Delete Inquiry"
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
          All Inquiries ({counts.all})
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
          onClick={() => setStatusFilter("in_progress")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            statusFilter === "in_progress"
              ? "bg-amber-600 text-white border-amber-600"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          In Progress ({counts.in_progress})
        </button>
        <button
          onClick={() => setStatusFilter("resolved")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            statusFilter === "resolved"
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          Resolved ({counts.resolved})
        </button>
      </div>

      <AdminDataTable
        columns={columns}
        data={filteredSubmissions}
        searchPlaceholder="Search inquiries by customer name, email, phone, or message text..."
        searchKeys={["name", "email", "phone", "message"]}
        initialSortKey="created_at"
        initialSortDirection="desc"
      />

      {/* Inspection Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl p-6 overflow-hidden space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  Inquiry from {selectedSubmission.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Customer Details Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-muted/40 border border-border/60 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[11px] font-semibold">
                  Customer Email
                </span>
                <a
                  href={`mailto:${selectedSubmission.email}`}
                  className="font-bold text-primary hover:underline flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{selectedSubmission.email}</span>
                </a>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[11px] font-semibold">
                  Contact Phone
                </span>
                {selectedSubmission.phone ? (
                  <a
                    href={`tel:${selectedSubmission.phone}`}
                    className="font-bold text-foreground hover:underline flex items-center gap-1.5"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{selectedSubmission.phone}</span>
                  </a>
                ) : (
                  <span className="text-muted-foreground">Not provided</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[11px] font-semibold">
                  Received Timestamp
                </span>
                <span className="text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {new Date(selectedSubmission.created_at).toLocaleString("en-IN")}
                  </span>
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[11px] font-semibold">
                  Current Status
                </span>
                <span className="font-bold uppercase tracking-wide text-primary">
                  {selectedSubmission.status.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Full Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Inquiry Message / Note
              </label>
              <div className="p-4 rounded-xl border border-border bg-background text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {selectedSubmission.message}
              </div>
            </div>

            {/* Status Transition Buttons */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <span className="text-xs font-semibold text-muted-foreground">
                Update Status:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isUpdating || selectedSubmission.status === "new"}
                  onClick={() => handleStatusChange(selectedSubmission, "new")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedSubmission.status === "new"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Mark as New
                </button>
                <button
                  type="button"
                  disabled={isUpdating || selectedSubmission.status === "in_progress"}
                  onClick={() => handleStatusChange(selectedSubmission, "in_progress")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedSubmission.status === "in_progress"
                      ? "bg-amber-600 text-white border-amber-600"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Mark In Progress
                </button>
                <button
                  type="button"
                  disabled={isUpdating || selectedSubmission.status === "resolved"}
                  onClick={() => handleStatusChange(selectedSubmission, "resolved")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedSubmission.status === "resolved"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Mark Resolved
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmissionToDelete(selectedSubmission);
                  setDeleteModalOpen(true);
                }}
                className="text-xs font-semibold text-destructive hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete submission</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && submissionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 text-destructive">
              <Trash2 className="h-4.5 w-4.5" />
              <span>Confirm Inquiry Deletion</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to remove the message from{" "}
              <strong>&ldquo;{submissionToDelete.name}&rdquo;</strong>?
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
                {isUpdating ? "Deleting..." : "Delete Inquiry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
