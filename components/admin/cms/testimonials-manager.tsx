"use client";

import { useState } from "react";
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
} from "lucide-react";
import { AdminDataTable, Column } from "@/components/admin/data-table";
import {
  AdminForm,
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
  FormSwitch,
  FormActions,
  FormButton,
} from "@/components/admin/form";
import { ImageUploader } from "@/components/ui/image-uploader";
import {
  saveTestimonialAction,
  deleteTestimonialAction,
  toggleTestimonialStatusAction,
  TestimonialPayload,
} from "@/app/(admin)/admin/cms/actions";
import type { Testimonial } from "@/lib/data/cms";

interface TestimonialsManagerProps {
  initialTestimonials: Testimonial[];
}

export function TestimonialsManager({
  initialTestimonials,
}: TestimonialsManagerProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setFormError("Please enter the customer name.");
      return;
    }
    if (!content.trim()) {
      setFormError("Please provide the testimonial review content.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: TestimonialPayload = {
      id: activeTestimonial?.id,
      customer_name: customerName.trim(),
      designation: designation.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      content: content.trim(),
      rating: Number(rating) || 5,
      display_order: Number(displayOrder) || 1,
      is_active: isActive,
    };

    try {
      const res = await saveTestimonialAction(payload);
      if (res.error) {
        setFormError(res.error);
      } else {
        setToastMessage({
          text: res.message || "Testimonial saved successfully.",
          type: "success",
        });

        if (activeTestimonial) {
          setTestimonials((prev) =>
            prev.map((t) => (t.id === activeTestimonial.id ? { ...t, ...payload } : t))
          );
        } else if (res.testimonial) {
          setTestimonials((prev) => [...prev, res.testimonial as Testimonial]);
        }
        setModalOpen(false);
      }
    } catch {
      setFormError("Failed to save testimonial. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (t: Testimonial) => {
    const updatedStatus = !t.is_active;
    try {
      const res = await toggleTestimonialStatusAction(t.id, updatedStatus);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        setTestimonials((prev) =>
          prev.map((item) => (item.id === t.id ? { ...item, is_active: updatedStatus } : item))
        );
        setToastMessage({
          text: `Testimonial ${updatedStatus ? "published" : "hidden"} successfully.`,
          type: "success",
        });
      }
    } catch {
      setToastMessage({ text: "Failed to update testimonial status.", type: "error" });
    }
  };

  const confirmDelete = async () => {
    if (!testimonialToDelete) return;
    setIsSubmitting(true);

    try {
      const res = await deleteTestimonialAction(testimonialToDelete.id);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        setTestimonials((prev) => prev.filter((item) => item.id !== testimonialToDelete.id));
        setToastMessage({ text: "Testimonial removed successfully.", type: "success" });
        setDeleteModalOpen(false);
      }
    } catch {
      setToastMessage({ text: "Failed to delete testimonial.", type: "error" });
    } finally {
      setIsSubmitting(false);
      setTestimonialToDelete(null);
    }
  };

  const columns: Column<Testimonial>[] = [
    {
      key: "avatar_url",
      header: "Customer",
      render: (t) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-full overflow-hidden border border-border/70 bg-muted/30 shrink-0 flex items-center justify-center">
            {t.avatar_url ? (
              <Image
                src={t.avatar_url}
                alt={t.customer_name}
                fill
                className="object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-xs">
              {t.customer_name}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {t.designation || "Customer"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${
                i < (t.rating || 5)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
          <span className="text-xs font-bold text-foreground ml-1">
            {t.rating || 5}/5
          </span>
        </div>
      ),
    },
    {
      key: "content",
      header: "Review Snippet",
      render: (t) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-md italic">
          &ldquo;{t.content}&rdquo;
        </p>
      ),
    },
    {
      key: "display_order",
      header: "Order",
      sortable: true,
      render: (t) => (
        <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-muted text-xs font-bold text-foreground">
          {t.display_order}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Visibility",
      sortable: true,
      render: (t) => (
        <button
          onClick={() => handleToggle(t)}
          title="Click to toggle visibility"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
            t.is_active
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
          }`}
        >
          {t.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          <span>{t.is_active ? "Published" : "Hidden"}</span>
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (t) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(t)}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
            title="Edit Testimonial"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setTestimonialToDelete(t);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground transition-colors cursor-pointer"
            title="Delete Testimonial"
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

      <AdminDataTable
        columns={columns}
        data={testimonials}
        searchPlaceholder="Search testimonials by customer name or review text..."
        searchKeys={["customer_name", "content", "designation"]}
        initialSortKey="display_order"
        initialSortDirection="asc"
        actionsSlot={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Testimonial</span>
          </button>
        }
      />

      {/* Modal: Add / Edit Testimonial */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  {activeTestimonial ? "Edit Customer Review" : "Add Wall of Love Testimonial"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <AdminForm onSubmit={handleSubmit} error={formError}>
              {/* Customer Photo Uploader */}
              <FormField
                label="Customer Avatar Photo"
                helperText="Upload square customer portrait photo (stored in media bucket)."
              >
                <ImageUploader
                  bucket="media"
                  folderPath="testimonials"
                  currentImageUrl={avatarUrl}
                  onUploadComplete={(url) => setAvatarUrl(url)}
                  aspectRatio="square"
                  label=""
                />
              </FormField>

              {/* Name & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Customer Name" required>
                  <FormInput
                    placeholder="e.g. Priya Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </FormField>

                <FormField label="Designation / City" helperText="e.g. Verified Buyer, New Delhi">
                  <FormInput
                    placeholder="e.g. Fashion Blogger, Mumbai"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </FormField>
              </div>

              {/* Rating & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Star Rating">
                  <FormSelect
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value) || 5)}
                  >
                    <option value={5}>5 Stars (Exceptional)</option>
                    <option value={4}>4 Stars (Very Good)</option>
                    <option value={3}>3 Stars (Good)</option>
                    <option value={2}>2 Stars (Fair)</option>
                    <option value={1}>1 Star (Poor)</option>
                  </FormSelect>
                </FormField>

                <FormField label="Display Order" required helperText="Sort order on Wall of Love.">
                  <FormInput
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                  />
                </FormField>
              </div>

              {/* Testimonial Text */}
              <FormField
                label="Testimonial / Review Content"
                required
                helperText="Quote highlighting fabric quality, fit, or shopping experience."
              >
                <FormTextarea
                  rows={4}
                  placeholder="The craftsmanship of pure Banarasi silk is outstanding..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </FormField>

              <FormSwitch
                label="Live on Storefront"
                description="When enabled, this review appears in the Wall of Love on the homepage."
                checked={isActive}
                onChange={(checked) => setIsActive(checked)}
              />

              <FormActions>
                <FormButton
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </FormButton>
                <FormButton type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{activeTestimonial ? "Update Testimonial" : "Publish Testimonial"}</span>
                  )}
                </FormButton>
              </FormActions>
            </AdminForm>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && testimonialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 text-destructive">
              <Trash2 className="h-4.5 w-4.5" />
              <span>Confirm Testimonial Deletion</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to remove the testimonial from{" "}
              <strong>&ldquo;{testimonialToDelete.customer_name}&rdquo;</strong>?
              This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border text-foreground hover:bg-muted cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete Testimonial"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
