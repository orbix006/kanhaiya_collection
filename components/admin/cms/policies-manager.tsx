"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Shield,
  Truck,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Edit2,
  X,
} from "lucide-react";
import { AdminDataTable, Column } from "@/components/admin/data-table";
import {
  AdminForm,
  FormField,
  FormInput,
  FormTextarea,
  FormActions,
  FormButton,
} from "@/components/admin/form";
import {
  savePolicyAction,
  updatePolicyOrderAction,
} from "@/app/(admin)/admin/cms/actions";
import type { SitePolicy, PolicyType } from "@/lib/data/cms";

interface PoliciesManagerProps {
  initialPolicies: SitePolicy[];
}

const POLICY_METADATA: Record<
  PolicyType,
  { label: string; icon: React.ComponentType<{ className?: string }>; route: string }
> = {
  privacy: { label: "Privacy Policy", icon: Shield, route: "/privacy" },
  terms: { label: "Terms of Service", icon: FileText, route: "/terms" },
  shipping: { label: "Shipping & Delivery", icon: Truck, route: "/shipping" },
  return: { label: "Return & Refund", icon: RotateCcw, route: "/return" },
};

export function PoliciesManager({ initialPolicies }: PoliciesManagerProps) {
  const [policies, setPolicies] = useState<SitePolicy[]>(() => {
    return [...initialPolicies].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SitePolicy | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number>(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const openEditModal = (p: SitePolicy) => {
    setEditingPolicy(p);
    setTitle(p.title);
    setContent(p.content);
    setDisplayOrder(p.display_order ?? 1);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;

    if (!title.trim()) {
      setFormError("Policy title is required.");
      return;
    }
    if (!content.trim()) {
      setFormError("Policy content cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await savePolicyAction(
        editingPolicy.type,
        title.trim(),
        content.trim(),
        Number(displayOrder) || 1
      );

      if (res.error) {
        setFormError(res.error);
      } else {
        setPolicies((prev) => {
          const updated = prev.map((p) =>
            p.type === editingPolicy.type
              ? {
                  ...p,
                  title: title.trim(),
                  content: content.trim(),
                  display_order: Number(displayOrder) || 1,
                  updated_at: new Date().toISOString(),
                }
              : p
          );
          return updated.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
        });

        setToastMessage({
          text: `${title.trim()} updated and published successfully!`,
          type: "success",
        });
        setModalOpen(false);
      }
    } catch {
      setFormError("Failed to update policy. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const movePolicy = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === policies.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...policies];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Recalculate 1..N order
    const updated = reordered.map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }));

    setPolicies(updated);
    setIsReordering(true);
    setToastMessage(null);

    try {
      const payload = updated.map((p) => ({
        type: p.type,
        display_order: p.display_order,
      }));
      const res = await updatePolicyOrderAction(payload);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        setToastMessage({
          text: "Policy display order updated across storefront.",
          type: "success",
        });
      }
    } catch {
      setToastMessage({ text: "Failed to persist policy order.", type: "error" });
    } finally {
      setIsReordering(false);
    }
  };

  const columns: Column<SitePolicy>[] = [
    {
      key: "display_order",
      header: "Order & Sequence",
      sortable: true,
      className: "w-36",
      render: (item) => {
        const index = policies.findIndex((p) => p.id === item.id);
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold w-5 text-center text-muted-foreground">
              {item.display_order}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => movePolicy(index, "up")}
                disabled={index === 0 || isReordering}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Move Up"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => movePolicy(index, "down")}
                disabled={index === policies.length - 1 || isReordering}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
      key: "title",
      header: "Policy Document",
      sortable: true,
      render: (item) => {
        const meta = POLICY_METADATA[item.type] || {
          label: item.title,
          icon: FileText,
          route: `/${item.type}`,
        };
        const Icon = meta.icon;

        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="font-bold text-foreground text-xs">{item.title}</div>
              <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                Type: <span className="uppercase text-primary font-semibold">{item.type}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "route",
      header: "Storefront Route",
      render: (item) => {
        const meta = POLICY_METADATA[item.type];
        return (
          <Link
            href={meta?.route || `/${item.type}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-mono"
          >
            <span>{meta?.route || `/${item.type}`}</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        );
      },
    },
    {
      key: "updated_at",
      header: "Last Updated",
      sortable: true,
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {item.updated_at
            ? new Date(item.updated_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Default System Template"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right w-24",
      render: (item) => (
        <button
          type="button"
          onClick={() => openEditModal(item)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
        >
          <Edit2 className="h-3.5 w-3.5" />
          <span>Edit</span>
        </button>
      ),
    },
  ];

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const currentMeta = editingPolicy ? POLICY_METADATA[editingPolicy.type] : null;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
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

      {/* Main Policies Table */}
      <AdminDataTable
        columns={columns}
        data={policies}
        searchPlaceholder="Search policies by title or type..."
        searchKeys={["title", "type"]}
        initialSortKey="display_order"
        initialSortDirection="asc"
        emptyMessage="No policy documents configured."
      />

      {/* Edit Policy Modal */}
      {modalOpen && editingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  Edit Policy: {editingPolicy.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 p-3 text-xs rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <AdminForm onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <FormField label="Official Policy Title" required>
                    <FormInput
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Privacy Policy"
                    />
                  </FormField>
                </div>

                <FormField label="Display Order Sequence" required>
                  <FormInput
                    type="number"
                    min={1}
                    max={10}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                  />
                </FormField>
              </div>

              <FormField
                label="Policy Content (Markdown supported)"
                required
                helperText={`Headings (###), bold (**text**), bullet points, and paragraphs are supported. Current word count: ${wordCount} words.`}
              >
                <FormTextarea
                  rows={14}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="### 1. Overview&#10;Write official policy text here..."
                  className="font-mono text-xs leading-relaxed"
                />
              </FormField>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/60">
                {currentMeta && (
                  <Link
                    href={currentMeta.route}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <span>View Public Route ({currentMeta.route})</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}

                <FormActions className="border-t-0 pt-0">
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
                        <span>Saving Policy...</span>
                      </>
                    ) : (
                      <span>Save & Publish</span>
                    )}
                  </FormButton>
                </FormActions>
              </div>
            </AdminForm>
          </div>
        </div>
      )}
    </div>
  );
}
