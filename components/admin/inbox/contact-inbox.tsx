"use client";

import { useState, useMemo, useEffect } from "react";
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
  Search,
  Sparkles,
  Inbox,
  User,
  Send,
  Check,
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

  // Client hydration from mock store
  useEffect(() => {
    try {
      const raw = localStorage.getItem("kanhaiya_admin_mock_store_v6");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.contactSubmissions) && parsed.contactSubmissions.length > 0) {
          setSubmissions(
            [...parsed.contactSubmissions].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          );
        }
      }
    } catch {}
  }, []);

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
        const updatedTime = new Date().toISOString();
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submission.id ? { ...s, status: newStatus, updated_at: updatedTime } : s
          )
        );
        if (selectedSubmission?.id === submission.id) {
          setSelectedSubmission((prev) =>
            prev ? { ...prev, status: newStatus, updated_at: updatedTime } : null
          );
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
      label: "New",
      className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 font-bold",
    },
    in_progress: {
      label: "In Progress",
      className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold",
    },
    resolved: {
      label: "Resolved",
      className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold",
    },
  };

  const columns: Column<ContactSubmission>[] = [
    {
      key: "name",
      header: "Customer",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          {s.status === "new" ? (
            <span
              className="h-2 w-2 rounded-full bg-blue-500 shrink-0 ring-4 ring-blue-500/20 animate-pulse"
              title="Unread/New Submission"
            />
          ) : (
            <span className="h-2 w-2 rounded-full bg-transparent shrink-0" />
          )}
          <div className="flex flex-col">
            <span
              className={`text-xs ${
                s.status === "new" ? "font-bold text-foreground" : "font-medium text-foreground"
              }`}
            >
              {s.name}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Mail className="h-2.5 w-2.5" />
              <span>{s.email}</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (s) => (
        <span className="text-xs text-muted-foreground font-mono">
          {s.phone || "—"}
        </span>
      ),
    },
    {
      key: "message",
      header: "Message Snippet",
      render: (s) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-sm">
          {s.message}
        </p>
      ),
    },
    {
      key: "created_at",
      header: "Submitted",
      sortable: true,
      render: (s) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(s.created_at).toLocaleDateString("en-US", {
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
      render: (s) => {
        const badge = statusBadges[s.status];
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] border ${badge.className}`}
          >
            {s.status === "new" && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
            {s.status === "in_progress" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
            {s.status === "resolved" && <Check className="h-3 w-3" />}
            <span>{badge.label}</span>
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setSelectedSubmission(s)}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-muted-foreground transition-colors cursor-pointer"
            title="Inspect Message"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setSubmissionToDelete(s);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground transition-colors cursor-pointer"
            title="Delete Record"
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter("all")}
          className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "all"
              ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/40"
              : "bg-card border-border/70 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              All Inquiries
            </span>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </div>
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
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>New</span>
            </span>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </div>
          <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">
            {counts.new}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("in_progress")}
          className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "in_progress"
              ? "bg-amber-500/10 border-amber-500 shadow-xs ring-1 ring-amber-500/40"
              : "bg-card border-border/70 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              In Progress
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">
            {counts.in_progress}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("resolved")}
          className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "resolved"
              ? "bg-emerald-500/10 border-emerald-500 shadow-xs ring-1 ring-emerald-500/40"
              : "bg-card border-border/70 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Resolved
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {counts.resolved}
          </span>
        </button>
      </div>

      <AdminDataTable
        columns={columns}
        data={filteredSubmissions}
        searchPlaceholder="Search by customer name, email, phone, or message keywords..."
        searchKeys={["name", "email", "phone", "message"]}
        initialSortKey="created_at"
        initialSortDirection="desc"
      />

      {/* Slide-over Inspection Drawer / Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-8 overflow-hidden space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {selectedSubmission.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(selectedSubmission.created_at).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-muted/30 border border-border/70 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  Email Address
                </span>
                <a
                  href={`mailto:${selectedSubmission.email}`}
                  className="font-semibold text-primary hover:underline flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{selectedSubmission.email}</span>
                </a>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  Contact Phone
                </span>
                {selectedSubmission.phone ? (
                  <a
                    href={`tel:${selectedSubmission.phone}`}
                    className="font-semibold text-foreground hover:text-primary flex items-center gap-1.5"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{selectedSubmission.phone}</span>
                  </a>
                ) : (
                  <span className="text-muted-foreground">Not provided</span>
                )}
              </div>
            </div>

            {/* Inquiry Message Body */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground">Customer Message / Note:</span>
              <div className="p-4 rounded-2xl bg-muted/20 border border-border text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line">
                {selectedSubmission.message}
              </div>
            </div>

            {/* Status Transition Control (Schema strictly: new | in_progress | resolved) */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-foreground">
                Inquiry Resolution Status:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(["new", "in_progress", "resolved"] as const).map((st) => {
                  const isCurrent = selectedSubmission.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(selectedSubmission, st)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isCurrent
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {isCurrent && <Check className="h-3.5 w-3.5" />}
                      <span>{st === "in_progress" ? "In Progress" : st.charAt(0).toUpperCase() + st.slice(1)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <button
                onClick={() => {
                  setSubmissionToDelete(selectedSubmission);
                  setDeleteModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Submission</span>
              </button>

              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-muted text-foreground hover:bg-muted/80 cursor-pointer"
              >
                Close View
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
              Are you sure you want to delete the submission from{" "}
              <strong>&ldquo;{submissionToDelete.name}&rdquo;</strong>? This record will be permanently removed.
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
                {isUpdating ? "Deleting..." : "Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
