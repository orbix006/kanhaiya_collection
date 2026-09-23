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
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { AdminDataTable, Column } from "@/components/admin/data-table";
import {
  AdminForm,
  FormField,
  FormInput,
  FormSwitch,
  FormActions,
  FormButton,
} from "@/components/admin/form";
import { ImageUploader } from "@/components/ui/image-uploader";
import {
  saveBannerAction,
  deleteBannerAction,
  toggleBannerStatusAction,
  BannerPayload,
} from "@/app/(admin)/admin/cms/actions";
import type { Banner } from "@/lib/data/cms";

interface BannersManagerProps {
  initialBanners: Banner[];
}

export function BannersManager({ initialBanners }: BannersManagerProps) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);

  // Form State
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const openCreateModal = () => {
    setActiveBanner(null);
    setImageUrl("");
    setTitle("");
    setLinkUrl("");
    setDisplayOrder(banners.length + 1);
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setActiveBanner(banner);
    setImageUrl(banner.image_url);
    setTitle(banner.title || "");
    setLinkUrl(banner.link_url || "");
    setDisplayOrder(banner.display_order);
    setIsActive(banner.is_active);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setFormError("Please upload or enter a banner image URL.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: BannerPayload = {
      id: activeBanner?.id,
      image_url: imageUrl.trim(),
      title: title.trim() || null,
      link_url: linkUrl.trim() || null,
      display_order: Number(displayOrder) || 0,
      is_active: isActive,
    };

    try {
      const res = await saveBannerAction(payload);
      if (res.error) {
        setFormError(res.error);
      } else {
        setToastMessage({
          text: res.message || "Banner saved successfully.",
          type: "success",
        });

        if (activeBanner) {
          setBanners((prev) =>
            prev.map((b) => (b.id === activeBanner.id ? { ...b, ...payload } : b))
          );
        } else if (res.banner) {
          setBanners((prev) => [...prev, res.banner as Banner]);
        }
        setModalOpen(false);
      }
    } catch {
      setFormError("Failed to save banner. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (banner: Banner) => {
    const updatedStatus = !banner.is_active;
    try {
      const res = await toggleBannerStatusAction(banner.id, updatedStatus);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, is_active: updatedStatus } : b))
        );
        setToastMessage({
          text: `Banner ${updatedStatus ? "activated" : "hidden"} successfully.`,
          type: "success",
        });
      }
    } catch {
      setToastMessage({ text: "Failed to update banner status.", type: "error" });
    }
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;
    setIsSubmitting(true);

    try {
      const res = await deleteBannerAction(bannerToDelete.id);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        setBanners((prev) => prev.filter((b) => b.id !== bannerToDelete.id));
        setToastMessage({ text: "Banner deleted successfully.", type: "success" });
        setDeleteModalOpen(false);
      }
    } catch {
      setToastMessage({ text: "Failed to delete banner.", type: "error" });
    } finally {
      setIsSubmitting(false);
      setBannerToDelete(null);
    }
  };

  const columns: Column<Banner>[] = [
    {
      key: "image_url",
      header: "Banner Preview",
      render: (b) => (
        <div className="relative h-16 w-32 rounded-lg overflow-hidden border border-border/70 bg-muted/30">
          <Image
            src={b.image_url}
            alt={b.title || "Banner Preview"}
            fill
            className="object-cover"
          />
        </div>
      ),
    },
    {
      key: "title",
      header: "Title & Destination",
      sortable: true,
      render: (b) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-xs">
            {b.title || "Untitled Promotional Banner"}
          </span>
          {b.link_url ? (
            <span className="text-[11px] text-primary flex items-center gap-1 mt-0.5 font-mono">
              <LinkIcon className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-xs">{b.link_url}</span>
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground mt-0.5">
              No link assigned
            </span>
          )}
        </div>
      ),
    },
    {
      key: "display_order",
      header: "Display Order",
      sortable: true,
      render: (b) => (
        <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-muted text-xs font-bold text-foreground">
          {b.display_order}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Visibility",
      sortable: true,
      render: (b) => (
        <button
          onClick={() => handleToggle(b)}
          title="Click to toggle visibility"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
            b.is_active
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
          }`}
        >
          {b.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          <span>{b.is_active ? "Active" : "Hidden"}</span>
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(b)}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
            title="Edit Banner"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setBannerToDelete(b);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground transition-colors cursor-pointer"
            title="Delete Banner"
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
        data={banners}
        searchPlaceholder="Search banners by title or link..."
        searchKeys={["title", "link_url"]}
        initialSortKey="display_order"
        initialSortDirection="asc"
        actionsSlot={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Banner</span>
          </button>
        }
      />

      {/* Modal: Add / Edit Banner */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  {activeBanner ? "Edit Promotional Banner" : "Create New Promotional Banner"}
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
              {/* Image Uploader */}
              <FormField
                label="Banner Image"
                required
                helperText="Upload wide banner image (1600x600 recommended) to the media storage bucket."
              >
                <ImageUploader
                  bucket="media"
                  folderPath="banners"
                  currentImageUrl={imageUrl}
                  onUploadComplete={(url) => setImageUrl(url)}
                  aspectRatio="banner"
                  label=""
                />
              </FormField>

              {/* Title / Caption */}
              <FormField
                label="Banner Title / Caption"
                helperText="Optional headline displayed over the banner."
              >
                <FormInput
                  placeholder="e.g. Royal Summer Wedding Collection 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormField>

              {/* Link URL */}
              <FormField
                label="Destination Link URL"
                helperText="Deep-link destination when clicking banner (e.g. /shop?category=menswear)."
              >
                <FormInput
                  placeholder="/shop?category=menswear"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </FormField>

              {/* Display Order & Active */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Display Order"
                  required
                  helperText="Ordering sequence in hero carousel (1 = first)."
                >
                  <FormInput
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                  />
                </FormField>

                <div className="flex flex-col justify-center">
                  <FormSwitch
                    label="Live / Active Banner"
                    description="When enabled, this banner is displayed on the storefront hero carousel."
                    checked={isActive}
                    onChange={(checked) => setIsActive(checked)}
                  />
                </div>
              </div>

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
                      <span>Saving Banner...</span>
                    </>
                  ) : (
                    <span>{activeBanner ? "Update Banner" : "Publish Banner"}</span>
                  )}
                </FormButton>
              </FormActions>
            </AdminForm>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && bannerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 text-destructive">
              <Trash2 className="h-4.5 w-4.5" />
              <span>Confirm Banner Deletion</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to permanently remove banner{" "}
              <strong>&ldquo;{bannerToDelete.title || "Untitled"}&rdquo;</strong>?
              This will remove it from the storefront carousel immediately.
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
                {isSubmitting ? "Deleting..." : "Delete Banner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
