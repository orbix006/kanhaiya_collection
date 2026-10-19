"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Users,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Info,
  Check,
  Send,
  ExternalLink,
  Copy,
  Inbox,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import type { ContactSubmission, Lead } from "@/lib/data/cms";
import type { MockResponseNote, UnifiedInquiry } from "@/lib/mock-data/admin-store";
import { ADMIN_STORE_STORAGE_KEY } from "@/lib/mock-data/admin-store";
import {
  addResponseNoteAction,
  markInquiryReadAction,
  updateUnifiedInquiryStatusAction,
  deleteUnifiedInquiryAction,
} from "@/app/(admin)/admin/inbox/actions";

interface UnifiedInboxProps {
  initialSubmissions: ContactSubmission[];
  initialLeads: Lead[];
  initialNotes?: MockResponseNote[];
}

export function UnifiedInbox({
  initialSubmissions,
  initialLeads,
  initialNotes = [],
}: UnifiedInboxProps) {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>(initialSubmissions);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [responseNotes, setResponseNotes] = useState<MockResponseNote[]>(initialNotes);

  // Table state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail Modal & Action states
  const [selectedInquiry, setSelectedInquiry] = useState<UnifiedInquiry | null>(null);
  const [inquiryToDelete, setInquiryToDelete] = useState<UnifiedInquiry | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Modal response note state
  const [newNoteText, setNewNoteText] = useState("");
  const [newResponder, setNewResponder] = useState("Admin (Amber)");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Modal status change state
  const [modalStatus, setModalStatus] = useState<string>("");

  // KPI explanation toggle
  const [showKpiExplanation, setShowKpiExplanation] = useState(false);

  // Auto-clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Client hydration from mock store
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(ADMIN_STORE_STORAGE_KEY) ||
        localStorage.getItem("kanhaiya_admin_mock_store_v7") ||
        localStorage.getItem("kanhaiya_admin_mock_store_v6");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.contactSubmissions)) {
          setSubmissions(parsed.contactSubmissions);
        }
        if (Array.isArray(parsed.leads)) {
          setLeads(parsed.leads);
        }
        if (Array.isArray(parsed.responseNotes)) {
          setResponseNotes(parsed.responseNotes);
        }
      }
    } catch {
      // Fallback to server initial props
    }
  }, []);

  // Sync modal status when selectedInquiry changes
  useEffect(() => {
    if (selectedInquiry) {
      setModalStatus(selectedInquiry.status);
      setNewNoteText("");
    }
  }, [selectedInquiry]);

  // 1. Build Unified Inquiry list while preserving separate underlying entities
  const unifiedInquiries = useMemo((): UnifiedInquiry[] => {
    const list: UnifiedInquiry[] = [];

    // Map contact submissions
    for (const sub of submissions) {
      const notes = responseNotes.filter((n) => n.inquiry_id === sub.id);
      list.push({
        id: sub.id,
        entity_type: "contact_submission",
        name: sub.name || "Anonymous Visitor",
        email: sub.email,
        phone: sub.phone,
        source: "Contact Form",
        source_type: "contact_submission",
        message: sub.message,
        status: sub.status,
        created_at: sub.created_at,
        updated_at: sub.updated_at || sub.created_at,
        has_response: notes.length > 0 || sub.status === "resolved",
        response_count: notes.length,
      });
    }

    // Map leads
    for (const lead of leads) {
      const notes = responseNotes.filter((n) => n.inquiry_id === lead.id);
      list.push({
        id: lead.id,
        entity_type: "lead",
        name: lead.name || "Audience Subscriber",
        email: lead.email,
        phone: lead.phone,
        source: lead.source ? `Lead (${lead.source})` : "Audience Lead",
        source_type: "lead",
        message: lead.message || "Audience member captured through website lead magnet or newsletter.",
        status: lead.status,
        created_at: lead.created_at,
        updated_at: lead.updated_at || lead.created_at,
        has_response:
          notes.length > 0 ||
          lead.status === "contacted" ||
          lead.status === "converted" ||
          lead.status === "closed",
        response_count: notes.length,
      });
    }

    // Sort by received date
    return list.sort((a, b) => {
      const tA = new Date(a.created_at).getTime();
      const tB = new Date(b.created_at).getTime();
      return sortDirection === "desc" ? tB - tA : tA - tB;
    });
  }, [submissions, leads, responseNotes, sortDirection]);

  // 2. Compute Exactly THREE KPI Cards from the unified repository
  // Total Leads: all records included in the unified view
  // Unread Leads: records with status === 'new'
  // Responded Leads: records with a response recorded in local development workflow
  const kpiMetrics = useMemo(() => {
    const totalLeads = unifiedInquiries.length;
    const unreadLeads = unifiedInquiries.filter((item) => item.status === "new").length;
    const respondedLeads = unifiedInquiries.filter((item) => item.has_response).length;

    return {
      totalLeads,
      unreadLeads,
      respondedLeads,
    };
  }, [unifiedInquiries]);

  // Unique list of sources for filter dropdown
  const availableSources = useMemo(() => {
    const set = new Set<string>();
    unifiedInquiries.forEach((item) => {
      if (item.source) set.add(item.source);
    });
    return Array.from(set);
  }, [unifiedInquiries]);

  // 3. Filter unified list
  const filteredInquiries = useMemo(() => {
    return unifiedInquiries.filter((item) => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "unread" && item.status !== "new") return false;
        if (statusFilter === "responded" && !item.has_response) return false;
        if (statusFilter !== "unread" && statusFilter !== "responded" && item.status !== statusFilter) {
          return false;
        }
      }

      // Source filter
      if (sourceFilter !== "all") {
        if (sourceFilter === "contact_submission" && item.entity_type !== "contact_submission") {
          return false;
        }
        if (sourceFilter === "lead" && item.entity_type !== "lead") {
          return false;
        }
        if (sourceFilter !== "contact_submission" && sourceFilter !== "lead" && item.source !== sourceFilter) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesEmail = item.email.toLowerCase().includes(q);
        const matchesPhone = item.phone ? item.phone.toLowerCase().includes(q) : false;
        const matchesMessage = item.message.toLowerCase().includes(q);
        const matchesSource = item.source.toLowerCase().includes(q);

        if (!matchesName && !matchesEmail && !matchesPhone && !matchesMessage && !matchesSource) {
          return false;
        }
      }

      return true;
    });
  }, [unifiedInquiries, statusFilter, sourceFilter, searchTerm]);

  // 4. Pagination
  const totalPages = Math.max(1, Math.ceil(filteredInquiries.length / pageSize));
  const paginatedInquiries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInquiries.slice(start, start + pageSize);
  }, [filteredInquiries, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sourceFilter, pageSize]);

  // Update selectedInquiry when underlying records update
  useEffect(() => {
    if (selectedInquiry) {
      const refreshed = unifiedInquiries.find((u) => u.id === selectedInquiry.id);
      if (refreshed) {
        setSelectedInquiry(refreshed);
      }
    }
  }, [unifiedInquiries]);

  // Response notes for selected inquiry
  const selectedInquiryNotes = useMemo(() => {
    if (!selectedInquiry) return [];
    return responseNotes
      .filter((n) => n.inquiry_id === selectedInquiry.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [selectedInquiry, responseNotes]);

  // Handle Mark as Read
  const handleMarkAsRead = async (inquiry: UnifiedInquiry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsUpdating(true);
    try {
      const res = await markInquiryReadAction(inquiry.id, inquiry.entity_type);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        const newStatus = res.newStatus || (inquiry.entity_type === "contact_submission" ? "in_progress" : "contacted");
        const updatedTime = new Date().toISOString();

        if (inquiry.entity_type === "contact_submission") {
          setSubmissions((prev) =>
            prev.map((s) => (s.id === inquiry.id ? { ...s, status: newStatus as any, updated_at: updatedTime } : s))
          );
        } else {
          setLeads((prev) =>
            prev.map((l) => (l.id === inquiry.id ? { ...l, status: newStatus as any, updated_at: updatedTime } : l))
          );
        }

        setToastMessage({ text: `Marked "${inquiry.name}" as reviewed (${newStatus}).`, type: "success" });
      }
    } catch {
      setToastMessage({ text: "Failed to mark as read.", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Status Update in Modal
  const handleUpdateStatus = async () => {
    if (!selectedInquiry || !modalStatus) return;
    setIsUpdating(true);
    try {
      const res = await updateUnifiedInquiryStatusAction(
        selectedInquiry.id,
        selectedInquiry.entity_type,
        modalStatus
      );
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        const updatedTime = new Date().toISOString();
        if (selectedInquiry.entity_type === "contact_submission") {
          setSubmissions((prev) =>
            prev.map((s) => (s.id === selectedInquiry.id ? { ...s, status: modalStatus as any, updated_at: updatedTime } : s))
          );
        } else {
          setLeads((prev) =>
            prev.map((l) => (l.id === selectedInquiry.id ? { ...l, status: modalStatus as any, updated_at: updatedTime } : l))
          );
        }
        setToastMessage({ text: `Status updated to '${modalStatus.replace("_", " ")}'.`, type: "success" });
      }
    } catch {
      setToastMessage({ text: "Failed to update status.", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Record Response Note in Modal
  const handleRecordResponseNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry || !newNoteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      const res = await addResponseNoteAction(
        selectedInquiry.id,
        selectedInquiry.entity_type,
        newNoteText.trim(),
        newResponder.trim() || "Admin (Amber)"
      );

      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else if (res.note) {
        const createdNote = res.note;
        setResponseNotes((prev) => [createdNote, ...prev]);
        setNewNoteText("");
        setToastMessage({
          text: "Response note recorded in local development workflow.",
          type: "success",
        });
      }
    } catch {
      setToastMessage({ text: "Failed to record response note.", type: "error" });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!inquiryToDelete) return;
    setIsUpdating(true);
    try {
      const res = await deleteUnifiedInquiryAction(
        inquiryToDelete.id,
        inquiryToDelete.entity_type
      );
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        if (inquiryToDelete.entity_type === "contact_submission") {
          setSubmissions((prev) => prev.filter((s) => s.id !== inquiryToDelete.id));
        } else {
          setLeads((prev) => prev.filter((l) => l.id !== inquiryToDelete.id));
        }
        setResponseNotes((prev) => prev.filter((n) => n.inquiry_id !== inquiryToDelete.id));

        if (selectedInquiry?.id === inquiryToDelete.id) {
          setSelectedInquiry(null);
        }
        setToastMessage({ text: "Record removed successfully.", type: "success" });
      }
    } catch {
      setToastMessage({ text: "Failed to delete record.", type: "error" });
    } finally {
      setIsUpdating(false);
      setInquiryToDelete(null);
    }
  };

  // Copy email to clipboard helper
  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setToastMessage({ text: `Copied "${email}" to clipboard.`, type: "success" });
  };

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Status badge renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            New
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            In Progress
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            Resolved
          </span>
        );
      case "contacted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
            <Check className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
            Contacted
          </span>
        );
      case "converted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
            <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            Converted
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground">
            {status}
          </span>
        );
    }
  };

  // Source badge renderer
  const renderSourceBadge = (item: UnifiedInquiry) => {
    if (item.entity_type === "contact_submission") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
          <Mail className="h-3 w-3 text-indigo-500" />
          <span>Contact Form</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 shrink-0">
        <Users className="h-3 w-3 text-teal-600" />
        <span className="truncate max-w-[150px]">{item.source}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 shadow-sm transition-all ${
            toastMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200"
              : "bg-destructive/10 border-destructive/20 text-destructive dark:text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* SECTION A: EXACTLY THREE KPI CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span>Inquiry & Lead Performance Metrics</span>
            <button
              type="button"
              onClick={() => setShowKpiExplanation(!showKpiExplanation)}
              className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              title="Click to view KPI mapping definition"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Shared Local Repository (Zero External DB)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* KPI 1: Total Leads */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-primary/40 transition-colors">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span>Total Leads</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono font-normal">
                  Unified
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1 font-mono tracking-tight">
                {kpiMetrics.totalLeads}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                All records in unified inquiry view
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="h-6 w-6" />
            </div>
          </div>

          {/* KPI 2: Unread Leads */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-amber-500/40 transition-colors">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span>Unread Leads</span>
                {kpiMetrics.unreadLeads > 0 && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 font-mono tracking-tight">
                {kpiMetrics.unreadLeads}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Awaiting review or initial action
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Mail className="h-6 w-6" />
            </div>
          </div>

          {/* KPI 3: Responded Leads */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-colors">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span>Responded Leads</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                  Actioned
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono tracking-tight">
                {kpiMetrics.respondedLeads}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Response note logged or marked resolved
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Detailed KPI Status Mapping Banner */}
        {showKpiExplanation && (
          <div className="mt-3 p-4 rounded-xl border border-border/80 bg-muted/40 text-xs text-muted-foreground space-y-2 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between text-foreground font-semibold">
              <span className="flex items-center gap-1.5">
                <Info className="h-4 w-4 text-primary" />
                <span>Source Status to KPI Definition Mapping</span>
              </span>
              <button
                type="button"
                onClick={() => setShowKpiExplanation(false)}
                className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px] leading-relaxed">
              <div className="bg-card p-2.5 rounded-lg border border-border/60">
                <span className="font-bold text-foreground block mb-1">1. Total Leads</span>
                Count of every record across <code className="text-primary font-mono">contact_submissions</code> and <code className="text-primary font-mono">leads</code>. De-duplicated by unique source key so no record is ever counted twice.
              </div>
              <div className="bg-card p-2.5 rounded-lg border border-border/60">
                <span className="font-bold text-foreground block mb-1">2. Unread Leads</span>
                Records where <code className="text-amber-600 font-mono">status = &apos;new&apos;</code> across both collections. Represents items awaiting review or action.
              </div>
              <div className="bg-card p-2.5 rounded-lg border border-border/60">
                <span className="font-bold text-foreground block mb-1">3. Responded Leads</span>
                Records with at least one recorded response note, OR <code className="text-emerald-600 font-mono">resolved</code> contact submissions, OR <code className="text-emerald-600 font-mono">contacted/converted/closed</code> leads.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION B: CONTACT TABLE & FILTERS */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="p-4 border-b border-border/60 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, phone, or message text..."
                className="w-full h-10 pl-10 pr-9 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-muted text-muted-foreground flex items-center justify-center cursor-pointer text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Filter Selects */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs">
                <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="unread">Unread (New only)</option>
                  <option value="responded">Responded only</option>
                  <option value="new">Status: New</option>
                  <option value="in_progress">Status: In Progress</option>
                  <option value="contacted">Status: Contacted</option>
                  <option value="converted">Status: Converted</option>
                  <option value="resolved">Status: Resolved</option>
                  <option value="closed">Status: Closed</option>
                </select>
              </div>

              {/* Source Filter */}
              <div className="flex items-center gap-1 text-xs">
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Sources</option>
                  <option value="contact_submission">Contact Form Submissions</option>
                  <option value="lead">All Captured Leads</option>
                  {availableSources.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By Received Date */}
              <button
                type="button"
                onClick={() => setSortDirection(sortDirection === "desc" ? "asc" : "desc")}
                className="h-10 px-3 rounded-xl border border-border bg-background hover:bg-muted/50 text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Sort by received date"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
                <span>{sortDirection === "desc" ? "Newest First" : "Oldest First"}</span>
              </button>
            </div>
          </div>

          {/* Active Filter Pills */}
          {(searchTerm || statusFilter !== "all" || sourceFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
              <span>Active filters:</span>
              {searchTerm && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                  Query: &quot;{searchTerm}&quot;
                  <button type="button" onClick={() => setSearchTerm("")} className="cursor-pointer">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                  Status: {statusFilter}
                  <button type="button" onClick={() => setStatusFilter("all")} className="cursor-pointer">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {sourceFilter !== "all" && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                  Source: {sourceFilter}
                  <button type="button" onClick={() => setSourceFilter("all")} className="cursor-pointer">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSourceFilter("all");
                }}
                className="text-primary hover:underline font-bold ml-1 cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>

        {/* Responsive Compact Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground border-collapse">
            <thead className="bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="py-3 px-4">
                  Name
                </th>
                <th scope="col" className="py-3 px-4">
                  Email
                </th>
                <th scope="col" className="py-3 px-4 hidden md:table-cell">
                  Phone
                </th>
                <th scope="col" className="py-3 px-4">
                  Inquiry Source / Type
                </th>
                <th scope="col" className="py-3 px-4 hidden lg:table-cell">
                  Received Date
                </th>
                <th scope="col" className="py-3 px-4">
                  Status
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {paginatedInquiries.length > 0 ? (
                paginatedInquiries.map((item) => (
                  <tr
                    key={`${item.entity_type}-${item.id}`}
                    onClick={() => setSelectedInquiry(item)}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    {/* Name */}
                    <td className="py-3 px-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.response_count > 0 && (
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                                title={`${item.response_count} response note(s) logged`}
                              />
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[200px] sm:hidden">
                            {item.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 align-middle font-mono text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[180px]">{item.email}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyEmail(item.email);
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity p-0.5 rounded cursor-pointer"
                          title="Copy email"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 align-middle font-mono text-[11px] text-muted-foreground hidden md:table-cell">
                      {item.phone ? (
                        <span>{item.phone}</span>
                      ) : (
                        <span className="text-muted-foreground/40 font-mono">—</span>
                      )}
                    </td>

                    {/* Inquiry Source / Type */}
                    <td className="py-3 px-4 align-middle">
                      {renderSourceBadge(item)}
                    </td>

                    {/* Received Date */}
                    <td className="py-3 px-4 align-middle text-muted-foreground text-[11px] hidden lg:table-cell whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      {renderStatusBadge(item.status)}
                    </td>

                    {/* Compact Actions */}
                    <td className="py-3 px-4 align-middle text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {/* Quick Mark As Read (if status === 'new') */}
                        {item.status === "new" && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(item, e)}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-500/10 transition-colors cursor-pointer"
                            title="Mark as read / reviewed"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* View Details Icon */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInquiry(item);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          title="View complete details & response history"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete Icon */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInquiryToDelete(item);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Inbox className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-semibold text-foreground">
                        No inquiries or leads found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {searchTerm || statusFilter !== "all" || sourceFilter !== "all"
                          ? "Try modifying your search or clearing the active filters."
                          : "No contact submissions or leads are currently recorded in the repository."}
                      </p>
                      {(searchTerm || statusFilter !== "all" || sourceFilter !== "all") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("all");
                            setSourceFilter("all");
                          }}
                          className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/60 bg-muted/10 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-hidden cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
            <span className="text-muted-foreground/60 mx-1">|</span>
            <span>
              Showing{" "}
              <strong className="text-foreground">
                {filteredInquiries.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-foreground">
                {Math.min(currentPage * pageSize, filteredInquiries.length)}
              </strong>{" "}
              of <strong className="text-foreground">{filteredInquiries.length}</strong> inquiries
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-mono font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 w-8 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Workflow & Out-of-Scope Email Disclaimer Banner */}
      <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong>Local Workflow Model:</strong> Status updates and recorded response notes are saved directly to the local development repository. Live automated email dispatching requires a configured transactional email service, which is out of scope.
          </span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground/70 shrink-0">
          Zero Supabase Connection • Local Mock Persistence
        </span>
      </div>

      {/* SECTION C: LEAD DETAIL POPUP (MODAL) */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-150"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-border/80 flex items-start justify-between gap-4 bg-muted/20">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold text-foreground tracking-tight">
                    {selectedInquiry.name}
                  </h2>
                  {renderSourceBadge(selectedInquiry)}
                  {renderStatusBadge(selectedInquiry.status)}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span>ID: {selectedInquiry.id}</span>
                  <span>•</span>
                  <span>Received: {formatDate(selectedInquiry.created_at)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs text-foreground">
              {/* Contact Information Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/70 bg-muted/20">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                    <Mail className="h-3 w-3" />
                    <span>Email Address</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="truncate">{selectedInquiry.email}</span>
                    <button
                      type="button"
                      onClick={() => copyEmail(selectedInquiry.email)}
                      className="text-primary hover:underline font-bold text-[11px] ml-2 cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/70 bg-muted/20">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                    <Phone className="h-3 w-3" />
                    <span>Phone Number</span>
                  </div>
                  <div className="font-mono text-xs">
                    {selectedInquiry.phone || (
                      <span className="text-muted-foreground/60 italic">None provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Complete Verbatim Message */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Complete Inquiry Message
                </label>
                <div className="p-3.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground leading-relaxed font-sans whitespace-pre-wrap">
                  {selectedInquiry.message || (
                    <span className="text-muted-foreground italic">No message body provided.</span>
                  )}
                </div>
              </div>

              {/* Action 1: Status Transition Controls */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Update Lead Status
                  </span>
                  {selectedInquiry.status === "new" && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(selectedInquiry)}
                      disabled={isUpdating}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Mark as Reviewed</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  >
                    {selectedInquiry.entity_type === "contact_submission" ? (
                      <>
                        <option value="new">New (Awaiting Review)</option>
                        <option value="in_progress">In Progress (Under Review)</option>
                        <option value="resolved">Resolved (Inquiry Answered)</option>
                      </>
                    ) : (
                      <>
                        <option value="new">New (Subscriber Inbound)</option>
                        <option value="contacted">Contacted (Outreach Made)</option>
                        <option value="converted">Converted (Customer Order Placed)</option>
                        <option value="closed">Closed (Archived)</option>
                      </>
                    )}
                  </select>

                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    disabled={isUpdating || modalStatus === selectedInquiry.status}
                    className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Update Status"}
                  </button>
                </div>
              </div>

              {/* Action 2: Response History & Local Workflow Notes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    <span>Response History ({selectedInquiryNotes.length})</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Local Development Workflow
                  </span>
                </div>

                {/* Response Notes History Log */}
                {selectedInquiryNotes.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedInquiryNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl border border-border/80 bg-card text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground">{note.responder}</span>
                          <span className="font-mono text-[10px]">{formatDate(note.created_at)}</span>
                        </div>
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                          {note.note}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-border text-center text-muted-foreground">
                    <p className="text-xs">No response notes recorded yet for this inquiry.</p>
                  </div>
                )}

                {/* Form to Record Response Note */}
                <form onSubmit={handleRecordResponseNote} className="space-y-2 pt-2">
                  <textarea
                    rows={3}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Record an internal response note, customer reply summary, or call outcome..."
                    className="w-full p-3 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden resize-none"
                  />

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="text-[11px]">Responder:</span>
                      <input
                        type="text"
                        value={newResponder}
                        onChange={(e) => setNewResponder(e.target.value)}
                        className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:border-primary focus:outline-hidden w-36 font-sans"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingNote || !newNoteText.trim()}
                      className="h-8 px-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{isSubmittingNote ? "Recording..." : "Record Response Note"}</span>
                    </button>
                  </div>
                </form>

                {/* Explicit Disclaimer: Email Service Out of Scope */}
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <p className="leading-relaxed">
                    <strong>Development Workflow Disclaimer:</strong> Recording a response note logs internal lead follow-up history and updates the &quot;Responded Leads&quot; KPI metric. Live automated email dispatching requires a configured transactional email service (e.g. Resend or SendGrid), which is out of scope.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted font-semibold text-xs text-foreground transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {inquiryToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-150"
          onClick={() => setInquiryToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-card border border-border rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-destructive">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-foreground text-sm">
                  Delete {inquiryToDelete.entity_type === "contact_submission" ? "Inquiry" : "Lead"}
                </h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete the inquiry record for{" "}
              <strong className="text-foreground">{inquiryToDelete.name}</strong> ({inquiryToDelete.email})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInquiryToDelete(null)}
                className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isUpdating}
                className="px-3.5 py-2 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
