"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Loader2,
  Layers,
  Smartphone,
  Monitor,
} from "lucide-react";
import type { Announcement } from "@/lib/data/cms";
import {
  loadMockAnnouncements,
  saveMockAnnouncement,
  deleteMockAnnouncement,
  toggleMockAnnouncementStatus,
  reorderMockAnnouncements,
} from "@/lib/mock-data/admin-store";
import {
  saveAnnouncementAction,
  deleteAnnouncementAction,
  toggleAnnouncementStatusAction,
  reorderAnnouncementsAction,
} from "@/app/(admin)/admin/cms/actions";

interface AnnouncementsManagerProps {
  initialAnnouncements?: Announcement[];
}

export function AnnouncementsManager({ initialAnnouncements = [] }: AnnouncementsManagerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    return [...initialAnnouncements].sort((a, b) => a.display_order - b.display_order);
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<Announcement | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Announcement | null>(null);

  // Form State
  const [formText, setFormText] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interactive Live Ribbon Preview State
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true);
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshFromStore = () => {
    try {
      const stored = loadMockAnnouncements();
      if (stored && stored.length > 0) {
        setAnnouncements(stored);
      }
    } catch {}
  };

  useEffect(() => {
    refreshFromStore();
  }, []);

  const activeAnnouncements = useMemo(() => {
    return announcements
      .filter((a) => a.is_active)
      .sort((a, b) => a.display_order - b.display_order);
  }, [announcements]);

  // Adjust preview index if active announcements count shrinks
  useEffect(() => {
    if (previewIndex >= activeAnnouncements.length && activeAnnouncements.length > 0) {
      setPreviewIndex(0);
    }
  }, [activeAnnouncements.length, previewIndex]);

  // Working rotating slider timer with pause/resume support
  useEffect(() => {
    if (!isAutoCycling || activeAnnouncements.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoCycling, activeAnnouncements.length]);

  const nextPreview = () => {
    if (activeAnnouncements.length <= 1) return;
    setPreviewIndex((prev) => (prev + 1) % activeAnnouncements.length);
  };

  const prevPreview = () => {
    if (activeAnnouncements.length <= 1) return;
    setPreviewIndex((prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length);
  };

  const openCreateModal = () => {
    setActiveItem(null);
    setFormText("");
    setFormIsActive(true);
    setFormOrder(announcements.length + 1);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (item: Announcement) => {
    setActiveItem(item);
    setFormText(item.text);
    setFormIsActive(item.is_active);
    setFormOrder(item.display_order);
    setFormError(null);
    setModalOpen(true);
  };

  // Reorder announcements
  const handleMove = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === announcements.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...announcements];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const updated = reordered.map((a, idx) => ({
      ...a,
      display_order: idx + 1,
    }));

    setAnnouncements(updated);
    const orderedIds = updated.map((a) => a.id);
    reorderMockAnnouncements(orderedIds);
    await reorderAnnouncementsAction(orderedIds);
    showToast("Announcement sequence reordered successfully.");
  };

  // Submit Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = formText.trim();
    if (!cleanText) {
      setFormError("Announcement text is required.");
      return;
    }

    // Text-only strict validation
    if (
      cleanText.includes("<img") ||
      cleanText.includes("<svg") ||
      cleanText.includes("data:image") ||
      /!\[.*?\]\(.*?\)/.test(cleanText)
    ) {
      setFormError("Announcements must contain text only. Images, icons, and HTML media are not allowed.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      id: activeItem?.id,
      text: cleanText,
      is_active: formIsActive,
      display_order: Number(formOrder) || 1,
    };

    try {
      // 1. Direct local mock store save
      saveMockAnnouncement(payload);

      // 2. Server action sync
      const res = await saveAnnouncementAction(payload);
      if (res.error) {
        setFormError(res.error);
      } else {
        refreshFromStore();
        showToast(activeItem ? "Announcement updated successfully." : "New announcement created.");
        setModalOpen(false);
      }
    } catch {
      setFormError("Failed to save announcement. Please check form inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active / inactive
  const handleToggle = async (item: Announcement) => {
    const nextStatus = !item.is_active;
    try {
      toggleMockAnnouncementStatus(item.id);
      const res = await toggleAnnouncementStatusAction(item.id, nextStatus);
      if (res.error) {
        showToast(res.error, "error");
      } else {
        refreshFromStore();
        showToast(`Announcement ${nextStatus ? "activated" : "deactivated"} successfully.`);
      }
    } catch {
      showToast("Failed to toggle announcement status.", "error");
    }
  };

  // Delete with confirmation
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      deleteMockAnnouncement(itemToDelete.id);
      const res = await deleteAnnouncementAction(itemToDelete.id);
      if (res.error) {
        showToast(res.error, "error");
      } else {
        refreshFromStore();
        showToast("Announcement removed successfully.");
        setDeleteModalOpen(false);
        setItemToDelete(null);
      }
    } catch {
      showToast("Failed to delete announcement.", "error");
    }
  };

  const currentPreviewAnnouncement = activeAnnouncements[previewIndex];

  return (
    <div className="space-y-8 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold tracking-wide uppercase mb-2">
            <Megaphone className="h-3.5 w-3.5" />
            <span>Storefront Top Ribbon CMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Offer & Discount Announcements
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Manage the text-only announcement strip positioned above the website header. Multiple active announcements automatically rotate with pause/resume controls.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Add Announcement</span>
        </button>
      </div>

      {/* Schema / Local Model Notice */}
      <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-start gap-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">Text-Only Architecture & Schema Guidance</p>
          <p>
            The existing PostgreSQL database schema does not define a dedicated <code className="font-mono text-primary">announcements</code> table.
            Announcements are managed through the central development mock store with full client/server sync.
            Persistent database storage will require a later approved schema migration. Images are strictly forbidden in this ribbon.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-semibold transition-all ${
            toastMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* LIVE ANNOUNCEMENT STRIP PREVIEW */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
          <div>
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Megaphone className="h-4.5 w-4.5 text-primary" />
              <span>Live Announcement Strip Preview</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Exact representation of the ribbon rendered directly above the storefront header.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Viewport Switcher */}
            <div className="flex items-center p-1 bg-muted rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setPreviewViewport("desktop")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  previewViewport === "desktop"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Desktop Viewport"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport("mobile")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  previewViewport === "mobile"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Mobile Viewport Simulation"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Pause / Resume Rotation Control */}
            {activeAnnouncements.length > 1 && (
              <button
                type="button"
                onClick={() => setIsAutoCycling(!isAutoCycling)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  isAutoCycling
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {isAutoCycling ? (
                  <>
                    <Pause className="h-3 w-3" /> Rotating
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" /> Paused
                  </>
                )}
              </button>
            )}

            {/* Slide Index Badge */}
            <span className="bg-muted px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-bold text-muted-foreground border border-border/60">
              {activeAnnouncements.length > 0
                ? `Announcement ${previewIndex + 1} of ${activeAnnouncements.length}`
                : "0 Active Announcements"}
            </span>
          </div>
        </div>

        {/* Ribbon Viewport Render */}
        {activeAnnouncements.length > 0 && currentPreviewAnnouncement ? (
          <div
            className={`mx-auto transition-all duration-300 ${
              previewViewport === "mobile" ? "max-w-sm" : "w-full"
            }`}
          >
            <div className="relative rounded-2xl overflow-hidden border border-[#C8891A]/30 bg-gradient-to-r from-[#2A180E] via-[#3B2416] to-[#2A180E] text-[#FFFDF7] p-3 sm:py-2.5 sm:px-6 shadow-md flex items-center justify-between gap-3">
              {/* Manual Prev Control */}
              {activeAnnouncements.length > 1 && (
                <button
                  type="button"
                  onClick={prevPreview}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  title="Previous Announcement"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              {/* Text-Only Content: Strictly Formatted & Responsive */}
              <div className="flex-1 text-center min-w-0 px-2">
                <p className="text-xs sm:text-[13px] font-medium leading-snug tracking-wide break-words">
                  {currentPreviewAnnouncement.text}
                </p>
              </div>

              {/* Manual Next Control */}
              {activeAnnouncements.length > 1 && (
                <button
                  type="button"
                  onClick={nextPreview}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  title="Next Announcement"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {previewViewport === "mobile" && (
              <p className="text-center text-[10px] text-muted-foreground mt-1.5 italic">
                Mobile view simulation: verifies text wrapping without horizontal overflow.
              </p>
            )}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
            <Megaphone className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
            <h4 className="font-bold text-foreground text-sm">Announcement Ribbon is Inactive</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Activate at least one announcement below to display the rotating promotional ribbon above the storefront header.
            </p>
          </div>
        )}
      </div>

      {/* ANNOUNCEMENT RECORDS TABLE */}
      <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="p-6 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-foreground">
              Configured Announcements ({announcements.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Arranged in rotating sequence. Reorder using arrow controls.
            </p>
          </div>
        </div>

        {announcements.length > 0 ? (
          <div className="divide-y divide-border/60">
            {announcements.map((item, index) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
              >
                {/* Left: Order, Text, Status */}
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 shrink-0 pt-0.5 sm:pt-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-muted-foreground hover:text-foreground"
                      title="Move Up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === announcements.length - 1}
                      onClick={() => handleMove(index, "down")}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-muted-foreground hover:text-foreground"
                      title="Move Down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Order Badge */}
                  <span className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center font-mono text-xs font-bold text-muted-foreground shrink-0 border border-border/60">
                    #{item.display_order}
                  </span>

                  {/* Announcement Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug break-words">
                      {item.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.is_active
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-stone-500/15 text-stone-600 dark:text-stone-400"
                        }`}
                      >
                        {item.is_active ? "Active in Rotation" : "Deactivated / Hidden"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ID: {item.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(item)}
                    className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                      item.is_active
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground"
                    }`}
                    title={item.is_active ? "Deactivate" : "Activate"}
                  >
                    {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground cursor-pointer transition-colors"
                    title="Edit Announcement Text"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setItemToDelete(item);
                      setDeleteModalOpen(true);
                    }}
                    className="p-2 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer transition-colors"
                    title="Delete Announcement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No announcements configured yet.</p>
            <p className="text-xs mt-1">Click "Add Announcement" above to create your first top ribbon message.</p>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                <h3 className="text-base font-extrabold text-foreground">
                  {activeItem ? "Edit Text Announcement" : "Create New Text Announcement"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Text Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">
                  Announcement Text <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Shubh Deepavali Special: Complimentary Brass Diya Set with orders above ₹2,499. Use code DIWALI108."
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 text-xs resize-none"
                  required
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Plain text only. Media and image tags are strictly prohibited.</span>
                  <span>{formText.length} characters</span>
                </div>
              </div>

              {/* Pre-Save Ribbon Preview */}
              {formText.trim() && (
                <div className="space-y-1 p-3 rounded-2xl border border-border/80 bg-muted/30">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Live Ribbon Preview:
                  </span>
                  <div className="rounded-xl border border-[#C8891A]/30 bg-gradient-to-r from-[#2A180E] via-[#3B2416] to-[#2A180E] text-[#FFFDF7] p-2.5 text-center shadow-xs">
                    <p className="text-xs font-medium leading-snug break-words">
                      {formText.trim()}
                    </p>
                  </div>
                </div>
              )}

              {/* Display Order & Active Toggle */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="font-bold text-foreground">Status</label>
                  <button
                    type="button"
                    onClick={() => setFormIsActive(!formIsActive)}
                    className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      formIsActive
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {formIsActive ? (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Published in Ribbon
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> Hidden / Inactive
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/70">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>{activeItem ? "Update Announcement" : "Save Announcement"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="h-10 w-10 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">Confirm Announcement Deletion</h3>
                <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border text-xs text-foreground italic break-words">
              "{itemToDelete.text}"
            </div>

            <p className="text-xs text-muted-foreground">
              Are you sure you want to permanently remove this announcement from the rotating ribbon sequence?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-bold text-xs shadow-xs hover:bg-destructive/90 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
