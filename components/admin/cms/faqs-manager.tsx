"use client";

import { useState, useMemo } from "react";
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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Categories present in dataset
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    COMMON_CATEGORIES.forEach((c) => set.add(c));
    faqs.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    if (selectedCategoryFilter === "All") return faqs;
    return faqs.filter((f) => (f.category || "General") === selectedCategoryFilter);
  }, [faqs, selectedCategoryFilter]);

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
    if (!question.trim()) {
      setFormError("Please enter the FAQ question.");
      return;
    }
    if (!answer.trim()) {
      setFormError("Please provide an answer.");
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
            prev.map((f) => (f.id === activeFaq.id ? { ...f, ...payload } : f))
          );
        } else if (res.faq) {
          setFaqs((prev) => [...prev, res.faq as Faq]);
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
          prev.map((item) => (item.id === f.id ? { ...item, is_active: updatedStatus } : item))
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

  const confirmDelete = async () => {
    if (!faqToDelete) return;
    setIsSubmitting(true);

    try {
      const res = await deleteFaqAction(faqToDelete.id);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        setFaqs((prev) => prev.filter((item) => item.id !== faqToDelete.id));
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

  const columns: Column<Faq>[] = [
    {
      key: "question",
      header: "Question & Answer",
      sortable: true,
      render: (f) => (
        <div className="flex flex-col max-w-lg">
          <span className="font-semibold text-foreground text-xs">
            {f.question}
          </span>
          <span className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
            {f.answer}
          </span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (f) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-muted text-[11px] font-bold text-foreground border border-border/60">
          <Tag className="h-3 w-3 text-primary" />
          <span>{f.category || "General"}</span>
        </span>
      ),
    },
    {
      key: "display_order",
      header: "Order",
      sortable: true,
      render: (f) => (
        <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-muted text-xs font-bold text-foreground">
          {f.display_order}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Visibility",
      sortable: true,
      render: (f) => (
        <button
          onClick={() => handleToggle(f)}
          title="Click to toggle visibility"
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
            title="Edit FAQ"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setFaqToDelete(f);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground transition-colors cursor-pointer"
            title="Delete FAQ"
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

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategoryFilter("All")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            selectedCategoryFilter === "All"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          All Categories ({faqs.length})
        </button>
        {availableCategories.map((cat) => {
          const count = faqs.filter((f) => (f.category || "General") === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedCategoryFilter === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      <AdminDataTable
        columns={columns}
        data={filteredFaqs}
        searchPlaceholder="Search questions or answers..."
        searchKeys={["question", "answer", "category"]}
        initialSortKey="display_order"
        initialSortDirection="asc"
        actionsSlot={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Question</span>
          </button>
        }
      />

      {/* Modal: Add / Edit FAQ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-5">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  {activeFaq ? "Edit Frequently Asked Question" : "Add Frequently Asked Question"}
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
              {/* Question */}
              <FormField label="Question" required helperText="Clear, customer-centric inquiry.">
                <FormInput
                  placeholder="e.g. What is your return and exchange policy?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </FormField>

              {/* Category & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Category Grouping"
                  helperText="Choose existing or type custom category."
                >
                  <FormInput
                    placeholder="e.g. Shipping, Returns, Products"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    list="faq-category-suggestions"
                  />
                  <datalist id="faq-category-suggestions">
                    {availableCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </FormField>

                <FormField label="Display Order" required helperText="Sequence within its category.">
                  <FormInput
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                  />
                </FormField>
              </div>

              {/* Answer */}
              <FormField
                label="Answer / Explanation"
                required
                helperText="Helpful, thorough resolution for customers."
              >
                <FormTextarea
                  rows={4}
                  placeholder="We offer a 7-day hassle-free return and exchange policy..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </FormField>

              <FormSwitch
                label="Live on Storefront"
                description="When enabled, this question is published on the /faqs page."
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
                      <span>Saving FAQ...</span>
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
              Are you sure you want to remove the question{" "}
              <strong>&ldquo;{faqToDelete.question}&rdquo;</strong>?
              This will remove it from the public Help Center immediately.
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
