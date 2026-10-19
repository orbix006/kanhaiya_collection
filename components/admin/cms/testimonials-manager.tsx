"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  User,
  Heart,
  Quote,
  ChevronUp,
  ChevronDown,
  Layers,
  ShieldCheck,
} from "lucide-react";
import {
  saveTestimonialAction,
  deleteTestimonialAction,
  toggleTestimonialStatusAction,
  TestimonialPayload,
} from "@/app/(admin)/admin/cms/actions";
import {
  loadMockTestimonials,
  saveMockTestimonial,
  deleteMockTestimonial,
  toggleMockTestimonialStatus,
  reorderMockTestimonials,
} from "@/lib/mock-data/admin-store";
import type { Testimonial } from "@/lib/data/cms";

interface TestimonialsManagerProps {
  initialTestimonials: Testimonial[];
}

export function TestimonialsManager({
  initialTestimonials,
}: TestimonialsManagerProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => {
    return [...initialTestimonials].sort((a, b) => a.display_order - b.display_order);
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState<Testimonial | null>(null);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [designation, setDesignation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Hydrate on mount from mock store
  const refreshFromStore = () => {
    try {
      const stored = loadMockTestimonials();
      if (stored && stored.length > 0) {
        setTestimonials(stored);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    refreshFromStore();
  }, []);

  // Filter active testimonials for Wall of Love preview
  const activeTestimonials = useMemo(() => {
    return testimonials
      .filter((t) => t.is_active)
      .sort((a, b) => a.display_order - b.display_order);
  }, [testimonials]);

  const openCreateModal = () => {
    setActiveTestimonial(null);
    setCustomerName("");
    setDesignation("");
    setAvatarUrl("");
    setContent("");
    setRating(5);
    setDisplayOrder(testimonials.length + 1);
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (t: Testimonial) => {
    setActiveTestimonial(t);
    setCustomerName(t.customer_name);
    setDesignation(t.designation || "");
    setAvatarUrl(t.avatar_url || "");
    setContent(t.content);
    setRating(t.rating || 5);
    setDisplayOrder(t.display_order);
    setIsActive(t.is_active);
    setFormError(null);
    setModalOpen(true);
  };

  // Reorder quick handlers
  const moveTestimonial = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === testimonials.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...testimonials];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const updated = reordered.map((t, idx) => ({
      ...t,
      display_order: idx + 1,
    }));

    setTestimonials(updated);
    reorderMockTestimonials(updated.map((t) => t.id));
    setToastMessage({
      text: "Testimonial display sequence updated.",
      type: "success",
    });
  };

  // Validation & Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = customerName.trim();
    if (!cleanName || cleanName.length < 2) {
      setFormError("Customer name is required (minimum 2 characters).");
      return;
    }

    const cleanContent = content.trim();
    if (!cleanContent || cleanContent.length < 10) {
      setFormError("Testimonial review content is required (minimum 10 characters).");
      return;
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      setFormError("Rating must be between 1 and 5 stars.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: TestimonialPayload = {
      id: activeTestimonial?.id,
      customer_name: cleanName,
      designation: designation.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      content: cleanContent,
      rating: numRating,
      display_order: Number(displayOrder) || 1,
      is_active: isActive,
    };

    try {
      // 1. Direct local mock store save
      saveMockTestimonial(payload as any);

      // 2. Server action sync
      const res = await saveTestimonialAction(payload);
      if (res.error) {
        setFormError(res.error);
      } else {
        refreshFromStore();
        setToastMessage({
          text: res.message || "Testimonial saved successfully.",
          type: "success",
        });
        setModalOpen(false);
      }
    } catch {
      setFormError("Failed to save testimonial. Please verify form inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (t: Testimonial) => {
    const updatedStatus = !t.is_active;
    try {
      toggleMockTestimonialStatus(t.id);
      const res = await toggleTestimonialStatusAction(t.id, updatedStatus);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        refreshFromStore();
        setToastMessage({
          text: `Testimonial ${updatedStatus ? "published" : "hidden"} successfully.`,
          type: "success",
        });
      }
    } catch {
      setToastMessage({ text: "Failed to toggle testimonial status.", type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!testimonialToDelete) return;
    try {
      deleteMockTestimonial(testimonialToDelete.id);
      const res = await deleteTestimonialAction(testimonialToDelete.id);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        refreshFromStore();
        setToastMessage({ text: "Testimonial deleted successfully.", type: "success" });
        setDeleteModalOpen(false);
        setTestimonialToDelete(null);
      }
    } catch {
      setToastMessage({ text: "Failed to delete testimonial.", type: "error" });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
            <span>Social Proof CMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Wall of Love & Devotee Testimonials
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Curate authentic feedback, praise, and blessings from devotees across India. Active testimonials display prominently in the storefront &quot;Wall of Love&quot; section.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Add Testimonial</span>
        </button>
      </div>

      {/* Notification Toast */}
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

      {/* INTERACTIVE WALL OF LOVE SECTION PREVIEW */}
      <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-[#FFFDF7] to-amber-500/5 dark:from-[#12100E] dark:to-muted/20 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-primary uppercase tracking-wider mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Live Storefront Preview</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground font-serif tracking-tight">
              Wall of Love — Devotee Praise
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live preview of active testimonials as rendered on the storefront homepage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-xs font-bold border border-primary/20">
              {activeTestimonials.length} Testimonials Active
            </span>
          </div>
        </div>

        {/* Testimonials Grid Preview */}
        {activeTestimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeTestimonials.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all relative group"
              >
                <div className="space-y-3">
                  {/* Rating Stars & Quote Icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= (t.rating || 5)
                              ? "fill-amber-500 text-amber-500"
                              : "fill-muted text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <Quote className="h-5 w-5 text-primary/30 group-hover:text-primary/70 transition-colors" />
                  </div>

                  {/* Review Text */}
                  <p className="text-xs text-foreground/90 leading-relaxed italic line-clamp-5">
                    &quot;{t.content}&quot;
                  </p>
                </div>

                {/* Customer Author Footer */}
                <div className="flex items-center gap-3 pt-4 mt-3 border-t border-border/60">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border border-border/60">
                    {t.avatar_url ? (
                      <img
                        src={t.avatar_url}
                        alt={t.customer_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{t.customer_name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h5 className="font-bold text-xs text-foreground truncate">
                      {t.customer_name}
                    </h5>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {t.designation || "Verified Devotee"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/60">
            <Heart className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <h4 className="font-bold text-foreground text-sm">No Active Testimonials</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Activate or add testimonials below to display this section on the storefront.
            </p>
          </div>
        )}
      </div>

      {/* TESTIMONIALS MANAGEMENT TABLE */}
      <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-foreground text-base">
              All Testimonials ({testimonials.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage devotee reviews, adjust sequence order, or edit testimonials.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/70 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Order</th>
                <th className="py-3 px-4">Devotee Customer</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Review Content</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {testimonials.map((t, index) => (
                <tr
                  key={t.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    !t.is_active ? "opacity-60 bg-muted/10" : ""
                  }`}
                >
                  {/* Order Controls */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveTestimonial(index, "up")}
                          disabled={index === 0}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTestimonial(index, "down")}
                          disabled={index === testimonials.length - 1}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-mono font-bold text-sm text-foreground ml-1">
                        {t.display_order}
                      </span>
                    </div>
                  </td>

                  {/* Devotee Customer Details */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-border">
                        {t.avatar_url ? (
                          <img
                            src={t.avatar_url}
                            alt={t.customer_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{t.customer_name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-foreground text-sm block">
                          {t.customer_name}
                        </span>
                        <span className="text-[11px] text-muted-foreground block">
                          {t.designation || "Verified Devotee"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Star Rating */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= (t.rating || 5)
                              ? "fill-amber-500 text-amber-500"
                              : "fill-muted text-muted-foreground/30"
                          }`}
                        />
                      ))}
                      <span className="ml-1 font-bold text-foreground font-mono">
                        {t.rating || 5}.0
                      </span>
                    </div>
                  </td>

                  {/* Review Content */}
                  <td className="py-3 px-4 max-w-md">
                    <p className="line-clamp-2 text-foreground/80 leading-relaxed font-normal">
                      &quot;{t.content}&quot;
                    </p>
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(t)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                        t.is_active
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                      }`}
                    >
                      {t.is_active ? (
                        <>
                          <Eye className="h-3 w-3" /> Live
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" /> Hidden
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(t)}
                        className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        title="Edit Testimonial"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTestimonialToDelete(t);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                        title="Delete Testimonial"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT TESTIMONIAL MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg p-6 sm:p-7 rounded-3xl border border-border/80 bg-card shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <h3 className="font-black text-lg text-foreground">
                {activeTestimonial ? "Edit Testimonial" : "Add Devotee Testimonial"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
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
              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">
                  Customer / Devotee Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pandit Radhe Shyam Shastri"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 text-xs"
                  required
                />
              </div>

              {/* Designation / Location */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">
                  Designation / Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Head Priest, Vrindavan Dham or Devotee, Mumbai"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 text-xs"
                />
              </div>

              {/* Avatar URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... or /avatars/..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 text-xs"
                />
              </div>

              {/* Testimonial Content */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">
                  Testimonial Content <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Write the devotee's praise, review, or blessing..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 text-xs leading-relaxed"
                  required
                />
                <span className="text-[11px] text-muted-foreground block">
                  Minimum 10 characters.
                </span>
              </div>

              {/* Star Rating Select */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Rating (1 to 5 Stars)</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-hidden"
                >
                  <option value="5">★★★★★ (5 Stars — Supreme Praise)</option>
                  <option value="4">★★★★☆ (4 Stars — Highly Satisfied)</option>
                  <option value="3">★★★☆☆ (3 Stars — Good Quality)</option>
                  <option value="2">★★☆☆☆ (2 Stars — Needs Improvement)</option>
                  <option value="1">★☆☆☆☆ (1 Star — Unsatisfied)</option>
                </select>
              </div>

              {/* Display Order & Active Toggle */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="font-bold text-foreground">Active Status</label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> Hidden
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
                  <span>{activeTestimonial ? "Update Testimonial" : "Save Testimonial"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && testimonialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl border border-border/80 bg-card shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <div className="h-10 w-10 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-foreground">
                  Permanently Delete Testimonial?
                </h3>
                <span className="text-xs text-muted-foreground">
                  By {testimonialToDelete.customer_name}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This testimonial will be permanently removed from the Wall of Love and database records. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setTestimonialToDelete(null);
                }}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 cursor-pointer shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
