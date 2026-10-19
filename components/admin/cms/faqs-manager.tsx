"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  HelpCircle,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  MonitorPlay,
  Search,
  ChevronRight,
  MessageCircle,
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
import {
  saveFaqAction,
  deleteFaqAction,
  toggleFaqStatusAction,
  reorderFaqsAction,
  FaqPayload,
} from "@/app/(admin)/admin/cms/actions";
import type { Faq } from "@/lib/data/cms";

interface FaqsManagerProps {
  initialFaqs: Faq[];
}

const COMMON_CATEGORIES = [
  "Shipping",
  "Returns",
  "Products",
  "Orders",
  "Payments",
  "General",
];

export function FaqsManager({ initialFaqs }: FaqsManagerProps) {
  const [faqs, setFaqs] = useState<Faq[]>(initialFaqs);
  const [activeTab, setActiveTab] = useState<"faqs" | "preview">("faqs");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<Faq | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<Faq | null>(null);

  // Form State
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("General");
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Preview interactive state
  const [previewSearch, setPreviewSearch] = useState("");
  const [previewOpenId, setPreviewOpenId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
        if (Array.isArray(parsed.faqs) && parsed.faqs.length > 0) {
          setFaqs([...parsed.faqs].sort((a, b) => a.display_order - b.display_order));
        }
      }
    } catch {}
  }, []);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    COMMON_CATEGORIES.forEach((c) => set.add(c));
    faqs.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    return faqs.filter((f) => {
      const matchesCat =
        selectedCategoryFilter === "All" ||
        (f.category || "General").toLowerCase() === selectedCategoryFilter.toLowerCase();
      const matchesStatus =
        selectedStatusFilter === "all" ||
        (selectedStatusFilter === "active" ? f.is_active : !f.is_active);
      return matchesCat && matchesStatus;
    });
  }, [faqs, selectedCategoryFilter, selectedStatusFilter]);

  const openCreateModal = () => {
    setActiveFaq(null);
    setQuestion("");
    setAnswer("");
    setCategory(selectedCategoryFilter !== "All" ? selectedCategoryFilter : "General");
    setDisplayOrder(faqs.length + 1);
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (f: Faq) => {
    setActiveFaq(f);
    setQuestion(f.question);
    setAnswer(f.answer);
    setCategory(f.category || "General");
    setDisplayOrder(f.display_order);
    setIsActive(f.is_active);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || question.trim().length < 5) {
      setFormError("FAQ question is required (minimum 5 characters).");
      return;
    }
    if (!answer.trim() || answer.trim().length < 10) {
      setFormError("FAQ answer is required (minimum 10 characters).");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: FaqPayload = {
      id: activeFaq?.id,
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim() || "General",
      display_order: Number(displayOrder) || 1,
      is_active: isActive,
    };

    try {
      const res = await saveFaqAction(payload);
      if (res.error) {
        setFormError(res.error);
      } else {
        setToastMessage({
          text: res.message || "FAQ saved successfully.",
          type: "success",
        });

        if (activeFaq) {
          setFaqs((prev) =>
            prev.map((f) =>
              f.id === activeFaq.id
                ? {
                    ...f,
                    question: payload.question,
                    answer: payload.answer,
                    category: payload.category || "General",
                    display_order: payload.display_order,
                    is_active: payload.is_active,
                    updated_at: new Date().toISOString(),
                  }
                : f
            ).sort((a, b) => a.display_order - b.display_order)
          );
        } else if (res.faq) {
          setFaqs((prev) =>
            [...prev, res.faq as Faq].sort((a, b) => a.display_order - b.display_order)
          );
        }
        setModalOpen(false);
      }
    } catch {
      setFormError("Failed to save FAQ. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (f: Faq) => {
    const updatedStatus = !f.is_active;
    try {
      const res = await toggleFaqStatusAction(f.id, updatedStatus);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        setFaqs((prev) =>
          prev.map((faq) => (faq.id === f.id ? { ...faq, is_active: updatedStatus } : faq))
        );
        setToastMessage({
          text: `FAQ ${updatedStatus ? "published" : "hidden"} successfully.`,
          type: "success",
        });
      }
    } catch {
      setToastMessage({ text: "Failed to update FAQ status.", type: "error" });
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    setIsReordering(true);
    const updated = [...faqs];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((f, idx) => ({
      ...f,
      display_order: idx + 1,
    }));

    setFaqs(reordered);

    try {
      const orderedIds = reordered.map((f) => f.id);
      await reorderFaqsAction(orderedIds);
      setToastMessage({ text: "FAQ sequence updated.", type: "success" });
    } catch {
      setToastMessage({ text: "Failed to reorder FAQs.", type: "error" });
    } finally {
      setIsReordering(false);
    }
  };

  const confirmDelete = async () => {
    if (!faqToDelete) return;
    setIsSubmitting(true);

    try {
      const res = await deleteFaqAction(faqToDelete.id);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        setFaqs((prev) => prev.filter((f) => f.id !== faqToDelete.id));
        setToastMessage({ text: "FAQ deleted successfully.", type: "success" });
        setDeleteModalOpen(false);
      }
    } catch {
      setToastMessage({ text: "Failed to delete FAQ.", type: "error" });
    } finally {
      setIsSubmitting(false);
      setFaqToDelete(null);
    }
  };

  const previewFiltered = useMemo(() => {
    return faqs
      .filter((f) => f.is_active)
      .filter((f) => {
        if (!previewSearch.trim()) return true;
        const q = previewSearch.toLowerCase();
        return (
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q) ||
          (f.category && f.category.toLowerCase().includes(q))
        );
      });
  }, [faqs, previewSearch]);

  const columns: Column<Faq>[] = [
    {
      key: "display_order",
      header: "Order",
      sortable: true,
      className: "w-24 text-center",
      render: (f: Faq) => {
        const idx = faqs.findIndex((item) => item.id === f.id);
        return (
          <div className="flex items-center justify-center gap-1">
            <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-muted text-xs font-bold text-foreground">
              {f.display_order}
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
                disabled={idx === -1 || idx === faqs.length - 1 || isReordering}
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
      key: "question",
      header: "Question & Category",
      sortable: true,
      render: (f) => (
        <div className="flex flex-col space-y-1">
          <span className="font-semibold text-foreground text-xs">{f.question}</span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
              <Tag className="h-2.5 w-2.5 text-primary" />
              <span>{f.category || "General"}</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "answer",
      header: "Customer Solution",
      render: (f) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-md">
          {f.answer}
        </p>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      render: (f) => (
        <button
          onClick={() => handleToggle(f)}
          title="Click to toggle status"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
            f.is_active
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
          }`}
        >
          {f.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          <span>{f.is_active ? "Live" : "Hidden"}</span>
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (f) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(f)}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
            title="Edit Question"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setFaqToDelete(f);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground transition-colors cursor-pointer"
            title="Delete Question"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls: Tabs & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="inline-flex rounded-xl bg-muted/60 p-1 border border-border/60">
          <button
            onClick={() => setActiveTab("faqs")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "faqs"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Manage Questions ({faqs.length})</span>
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
            <span>Storefront FAQ Preview</span>
          </button>
        </div>

        {activeTab === "faqs" && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add New FAQ</span>
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

      {activeTab === "faqs" ? (
        <div className="space-y-4">
          {/* Category Filter Pills & Status Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-muted/30 border border-border/70">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-muted-foreground mr-1">Category:</span>
              <button
                onClick={() => setSelectedCategoryFilter("All")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategoryFilter === "All"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border border-border/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({faqs.length})
              </button>
              {availableCategories.map((cat) => {
                const count = faqs.filter((f) => (f.category || "General") === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedCategoryFilter === cat
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-card border border-border/70 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-muted-foreground">Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                aria-label="Filter FAQs by publication status"
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Live Only</option>
                <option value="hidden">Hidden Only</option>
              </select>
            </div>
          </div>

          <AdminDataTable
            columns={columns}
            data={filteredFaqs}
            searchPlaceholder="Search questions or answers..."
            searchKeys={["question", "answer", "category"]}
            initialSortKey="display_order"
            initialSortDirection="asc"
          />
        </div>
      ) : (
        /* LIVE ACCORDION PREVIEW OF THE PUBLIC FAQ PAGE */
        <div className="space-y-8 rounded-3xl border border-border/80 bg-background/50 p-6 sm:p-10 shadow-inner">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Storefront Simulation Mode
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-foreground">
                Customer Care & Help Center (FAQ)
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {previewFiltered.length} Published Answers
            </span>
          </div>

          {/* Search Box Simulation */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search help topics, packing guarantee, shipping rates..."
              value={previewSearch}
              onChange={(e) => setPreviewSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 shadow-xs"
            />
          </div>

          {/* Interactive Accordion List */}
          <div className="space-y-3 max-w-3xl mx-auto pt-2">
            {previewFiltered.map((faq) => {
              const isOpen = previewOpenId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-2xs transition-colors"
                >
                  <button
                    onClick={() => setPreviewOpenId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 pr-4">
                      <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                      <span>{faq.question}</span>
                    </div>
                    <span className="inline-flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
                        {faq.category || "General"}
                      </span>
                      <ChevronRight
                        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 bg-muted/10">
                      <p className="whitespace-pre-line">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {previewFiltered.length === 0 && (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border text-muted-foreground">
                <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">No questions matched your search query.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching for another topic or clear the search query.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add / Edit FAQ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-5">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  {activeFaq ? "Edit FAQ Item" : "Create New Help FAQ"}
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
              <FormField label="Category Label" required helperText="Topic grouping for customers.">
                <div className="space-y-2">
                  <FormInput
                    placeholder="e.g. Shipping, Returns, Products, Orders"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COMMON_CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                          category === c
                            ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                            : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </FormField>

              <FormField label="Frequently Asked Question" required>
                <FormInput
                  placeholder="e.g. What packaging is used to protect consecrated brass murtis?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </FormField>

              <FormField
                label="Detailed Customer Solution"
                required
                helperText="Provide a clear, reassuring answer with policy details."
              >
                <FormTextarea
                  rows={4}
                  placeholder="Every murti is wrapped in consecrated velvet and high-density foam cushioning..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Display Order" required helperText="Sequence within list">
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
                    description="When enabled, question appears on public /faqs."
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
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{activeFaq ? "Update FAQ" : "Publish FAQ"}</span>
                  )}
                </FormButton>
              </FormActions>
            </AdminForm>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && faqToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 text-destructive">
              <Trash2 className="h-4.5 w-4.5" />
              <span>Confirm FAQ Deletion</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete this FAQ:{" "}
              <strong>&ldquo;{faqToDelete.question}&rdquo;</strong>? This cannot be undone.
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
                {isSubmitting ? "Deleting..." : "Delete FAQ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
