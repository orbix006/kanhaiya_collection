"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  MonitorPlay,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { AdminDataTable, Column } from "@/components/admin/data-table";
import {
  AdminForm,
  FormField,
  FormInput,
  FormTextarea,
  FormSwitch,
  FormActions,
  FormButton,
} from "@/components/admin/form";
import { ImageUploader } from "@/components/ui/image-uploader";
import {
  saveAboutSectionAction,
  deleteAboutSectionAction,
  toggleAboutSectionStatusAction,
  reorderAboutSectionsAction,
  AboutSectionPayload,
} from "@/app/(admin)/admin/cms/actions";
import type { AboutSection } from "@/lib/data/cms";

interface AboutManagerProps {
  initialSections: AboutSection[];
}

export function AboutManager({ initialSections }: AboutManagerProps) {
  const [sections, setSections] = useState<AboutSection[]>(initialSections);
  const [activeTab, setActiveTab] = useState<"sections" | "preview">("sections");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<AboutSection | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<AboutSection | null>(null);

  // Form State
  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Client hydration from localStorage mock store
  useEffect(() => {
    try {
      const raw = localStorage.getItem("kanhaiya_admin_mock_store_v6");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.aboutUsSections) && parsed.aboutUsSections.length > 0) {
          setSections([...parsed.aboutUsSections].sort((a, b) => a.display_order - b.display_order));
        }
      }
    } catch {}
  }, []);

  const openCreateModal = () => {
    setActiveSection(null);
    setHeading("");
    setSubheading("");
    setBody("");
    setImageUrl("");
    setDisplayOrder(sections.length + 1);
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (sec: AboutSection) => {
    setActiveSection(sec);
    setHeading(sec.heading || "");
    setSubheading(sec.subheading || "");
    setBody(sec.body || "");
    setImageUrl(sec.image_url || "");
    setDisplayOrder(sec.display_order);
    setIsActive(sec.is_active);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heading.trim() && !body.trim()) {
      setFormError("Please provide at least a heading or narrative body.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: AboutSectionPayload = {
      id: activeSection?.id,
      heading: heading.trim() || null,
      subheading: subheading.trim() || null,
      body: body.trim() || null,
      image_url: imageUrl.trim() || null,
      display_order: Number(displayOrder) || 1,
      is_active: isActive,
    };

    try {
      const res = await saveAboutSectionAction(payload);
      if (res.error) {
        setFormError(res.error);
      } else {
        setToastMessage({
          text: res.message || "About section saved successfully.",
          type: "success",
        });

        if (activeSection) {
          setSections((prev) =>
            prev.map((s) =>
              s.id === activeSection.id
                ? {
                    ...s,
                    heading: payload.heading ?? null,
                    subheading: payload.subheading ?? null,
                    body: payload.body ?? null,
                    image_url: payload.image_url ?? null,
                    display_order: payload.display_order,
                    is_active: payload.is_active,
                    updated_at: new Date().toISOString(),
                  }
                : s
            ).sort((a, b) => a.display_order - b.display_order)
          );
        } else if (res.section) {
          setSections((prev) =>
            [...prev, res.section as AboutSection].sort((a, b) => a.display_order - b.display_order)
          );
        }
        setModalOpen(false);
      }
    } catch {
      setFormError("Failed to save About section. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (sec: AboutSection) => {
    const updatedStatus = !sec.is_active;
    try {
      const res = await toggleAboutSectionStatusAction(sec.id, updatedStatus);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        setSections((prev) =>
          prev.map((s) => (s.id === sec.id ? { ...s, is_active: updatedStatus } : s))
        );
        setToastMessage({
          text: `Section "${sec.heading || "Block"}" is now ${updatedStatus ? "Live" : "Hidden"}.`,
          type: "success",
        });
      }
    } catch {
      setToastMessage({ text: "Failed to update section visibility.", type: "error" });
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    setIsReordering(true);
    const updated = [...sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reorderedWithOrder = updated.map((sec, idx) => ({
      ...sec,
      display_order: idx + 1,
    }));

    setSections(reorderedWithOrder);

    try {
      const orderedIds = reorderedWithOrder.map((s) => s.id);
      await reorderAboutSectionsAction(orderedIds);
      setToastMessage({ text: "Section order re-sequenced successfully.", type: "success" });
    } catch {
      setToastMessage({ text: "Failed to persist new sequence order.", type: "error" });
    } finally {
      setIsReordering(false);
    }
  };

  const confirmDelete = async () => {
    if (!sectionToDelete) return;
    setIsSubmitting(true);

    try {
      const res = await deleteAboutSectionAction(sectionToDelete.id);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        setSections((prev) => prev.filter((s) => s.id !== sectionToDelete.id));
        setToastMessage({ text: "About section deleted successfully.", type: "success" });
        setDeleteModalOpen(false);
      }
    } catch {
      setToastMessage({ text: "Failed to delete section.", type: "error" });
    } finally {
      setIsSubmitting(false);
      setSectionToDelete(null);
    }
  };

  const columns: Column<AboutSection>[] = [
    {
      key: "display_order",
      header: "Order",
      sortable: true,
      className: "w-24 text-center",
      render: (s: AboutSection) => {
        const idx = sections.findIndex((item) => item.id === s.id);
        return (
          <div className="flex items-center justify-center gap-1">
            <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-muted text-xs font-bold text-foreground">
              {s.display_order}
            </span>
            <div className="flex flex-col">
              <button
                onClick={() => handleMoveOrder(idx, "up")}
                disabled={idx <= 0 || isReordering}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                title="Move Up"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleMoveOrder(idx, "down")}
                disabled={idx === -1 || idx === sections.length - 1 || isReordering}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                title="Move Down"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      },
    },
    {
      key: "image_url",
      header: "Visual",
      render: (s) => (
        <div className="relative h-14 w-20 rounded-lg overflow-hidden border border-border/70 bg-muted/30 shrink-0 flex items-center justify-center">
          {s.image_url ? (
            <Image
              src={s.image_url}
              alt={s.heading || "About Visual"}
              fill
              className="object-cover"
            />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: "heading",
      header: "Heading & Subheading",
      sortable: true,
      render: (s) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-xs">
            {s.heading || "Untitled Section"}
          </span>
          {s.subheading && (
            <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
              {s.subheading}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "body",
      header: "Content Body",
      render: (s) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-sm">
          {s.body || "No text body provided."}
        </p>
      ),
    },
    {
      key: "is_active",
      header: "Visibility",
      sortable: true,
      render: (s) => (
        <button
          onClick={() => handleToggle(s)}
          title="Click to toggle visibility"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
            s.is_active
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
          }`}
        >
          {s.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          <span>{s.is_active ? "Live" : "Hidden"}</span>
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(s)}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
            title="Edit Section"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setSectionToDelete(s);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground transition-colors cursor-pointer"
            title="Delete Section"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Switcher: Manage Blocks vs Live Preview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="inline-flex rounded-xl bg-muted/60 p-1 border border-border/60">
          <button
            onClick={() => setActiveTab("sections")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "sections"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Content Blocks ({sections.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "preview"
                ? "bg-background text-foreground shadow-xs text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MonitorPlay className="h-3.5 w-3.5" />
            <span>Live Storefront Preview</span>
          </button>
        </div>

        {activeTab === "sections" && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Story Section</span>
          </button>
        )}
      </div>

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

      {activeTab === "sections" ? (
        <AdminDataTable
          columns={columns}
          data={sections}
          searchPlaceholder="Search About Us sections by heading or content..."
          searchKeys={["heading", "subheading", "body"]}
          initialSortKey="display_order"
          initialSortDirection="asc"
        />
      ) : (
        /* LIVE PREVIEW OF ABOUT US STORYTELLING */
        <div className="space-y-8 rounded-3xl border border-border/80 bg-background/50 p-6 sm:p-10 shadow-inner">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Storefront Simulation Mode
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-foreground">
                About Kanhaiya Collection — Sacred Devotion & Living Heritage
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {sections.filter((s) => s.is_active).length} Active Story Blocks
            </span>
          </div>

          {/* Hero Story Banner */}
          <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-linear-to-r from-[#FFF8EC] to-[#FBF4E6] dark:from-stone-900 dark:to-stone-950 p-8 sm:p-12 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8891A]/10 text-[#C8891A] text-xs font-bold uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generational Artisan Devotion</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-[#3B2416] dark:text-stone-100 max-w-2xl mx-auto">
              Sanctifying Homes with Timeless Temple Craftsmanship
            </h1>
            <p className="text-sm text-[#806B57] dark:text-stone-300 max-w-xl mx-auto leading-relaxed">
              Every brass idol, consecrated deepam, and ceremonial vessel is cast with absolute metallurgical fidelity and spiritual reverence along the holy ghats of Varanasi.
            </p>
          </div>

          {/* Alternating Narrative Story Blocks */}
          <div className="space-y-12 pt-4">
            {sections
              .filter((s) => s.is_active)
              .map((section, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={section.id}
                    className={`flex flex-col ${
                      isEven ? "md:flex-row" : "md:flex-row-reverse"
                    } items-center gap-8 md:gap-12 p-6 sm:p-8 rounded-2xl border border-border/60 bg-card shadow-xs`}
                  >
                    {/* Visual */}
                    {section.image_url ? (
                      <div className="relative w-full md:w-1/2 h-64 sm:h-80 rounded-xl overflow-hidden border border-border/80 shadow-md shrink-0">
                        <Image
                          src={section.image_url}
                          alt={section.heading || "Story Visual"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full md:w-1/2 h-64 sm:h-80 rounded-xl bg-muted/40 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                        <FileText className="h-10 w-10 mb-2 opacity-50" />
                        <span className="text-xs font-medium">Text-focused narrative section</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="w-full md:w-1/2 space-y-4">
                      {section.subheading && (
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">
                          {section.subheading}
                        </span>
                      )}
                      <h3 className="text-2xl font-bold font-serif text-foreground">
                        {section.heading || "Sacred Tradition"}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                        {section.body || "No description provided."}
                      </p>
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                          <span>Verified Artisan Heritage</span>
                          <Sparkles className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

            {sections.filter((s) => s.is_active).length === 0 && (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">No active About Us sections to preview.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Activate sections in the Content Blocks tab to see them appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add / Edit About Section */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  {activeSection ? "Edit About Us Section" : "Add Brand Story Section"}
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
                label="Section Visual Image (Optional)"
                helperText="Upload supporting craftsmanship or Varanasi temple photography (stored in media bucket)."
              >
                <ImageUploader
                  bucket="media"
                  folderPath="about"
                  currentImageUrl={imageUrl}
                  onUploadComplete={(url) => setImageUrl(url)}
                  aspectRatio="auto"
                  label=""
                />
              </FormField>

              {/* Heading & Subheading */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Section Heading" helperText="Primary story headline">
                  <FormInput
                    placeholder="e.g. Master Craftsmanship"
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                  />
                </FormField>

                <FormField label="Subheading / Tagline" helperText="Optional secondary title">
                  <FormInput
                    placeholder="e.g. Uncompromising Attention to Detail"
                    value={subheading}
                    onChange={(e) => setSubheading(e.target.value)}
                  />
                </FormField>
              </div>

              {/* Display Order & Active */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Display Order" required helperText="Sequence on /about page.">
                  <FormInput
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                  />
                </FormField>

                <div className="flex flex-col justify-center">
                  <FormSwitch
                    label="Live on Storefront"
                    description="When enabled, this story block renders on the public /about page."
                    checked={isActive}
                    onChange={(checked) => setIsActive(checked)}
                  />
                </div>
              </div>

              {/* Body Content */}
              <FormField
                label="Story / Narrative Body"
                helperText="Detailed narrative explaining our brand heritage, craftsmanship, or materials."
              >
                <FormTextarea
                  rows={5}
                  placeholder="Kanhaiya Collection was founded to preserve authentic brass temple casting..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </FormField>

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
                    <span>{activeSection ? "Update Section" : "Publish Section"}</span>
                  )}
                </FormButton>
              </FormActions>
            </AdminForm>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && sectionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 text-destructive">
              <Trash2 className="h-4.5 w-4.5" />
              <span>Confirm Section Deletion</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to remove the About Us section{" "}
              <strong>&ldquo;{sectionToDelete.heading || "Untitled"}&rdquo;</strong>?
              This will remove it from the public story page immediately.
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
                {isSubmitting ? "Deleting..." : "Delete Section"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
