"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Shield,
  RotateCcw,
  Truck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Eye,
  Edit3,
  Columns,
  Clock,
  Save,
  Check,
  Info,
} from "lucide-react";
import { savePolicyAction } from "@/app/(admin)/admin/cms/actions";
import type { SitePolicy, PolicyType } from "@/lib/data/cms";
import { ADMIN_STORE_STORAGE_KEY } from "@/lib/mock-data/admin-store";

export type AdminSitePolicy = SitePolicy & {
  draft_content?: string;
  is_published?: boolean;
};

interface PoliciesManagerProps {
  initialPolicies: AdminSitePolicy[];
}

const POLICY_TYPES: {
  type: PolicyType;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
}[] = [
  {
    type: "terms",
    label: "Terms of Service",
    shortDesc: "Customer agreement, artisan craftsmanship & IP rights",
    icon: FileText,
    route: "/terms",
  },
  {
    type: "privacy",
    label: "Privacy Policy",
    shortDesc: "Devotee data protection, SSL standards & privacy rights",
    icon: Shield,
    route: "/privacy",
  },
  {
    type: "shipping",
    label: "Shipping & Delivery",
    shortDesc: "Dispatch timelines, free shipping threshold & fragile handling",
    icon: Truck,
    route: "/shipping",
  },
  {
    type: "return",
    label: "Return & Refund Policy",
    shortDesc: "7-day return guarantee, inspection & refund turnaround",
    icon: RotateCcw,
    route: "/return",
  },
  {
    type: "cancellation",
    label: "Cancellation Policy",
    shortDesc: "Pre-dispatch cancellation window & refund reversal guidelines",
    icon: AlertCircle,
    route: "/cancellation",
  },
];

/**
 * Parses markdown paragraphs, headings, bullet points, and bold text into styled React elements
 */
function renderMarkdownContent(content: string) {
  if (!content) return null;

  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      renderedElements.push(
        <ul
          key={`ul-${renderedElements.length}`}
          className="space-y-1.5 my-3 pl-5 list-disc text-muted-foreground text-xs sm:text-sm"
        >
          {currentList.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((rawLine, lineIdx) => {
    const line = rawLine.trim();

    if (line.startsWith("- ") || line.startsWith("* ")) {
      currentList.push(line.slice(2));
      return;
    }

    flushList();

    if (!line) {
      return;
    }

    if (line.startsWith("### ")) {
      renderedElements.push(
        <h4
          key={lineIdx}
          className="text-base font-bold text-foreground mt-5 mb-2 font-serif"
        >
          {line.replace("### ", "")}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      renderedElements.push(
        <h3
          key={lineIdx}
          className="text-lg font-bold text-foreground mt-6 mb-2.5 font-serif"
        >
          {line.replace("## ", "")}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      renderedElements.push(
        <h2
          key={lineIdx}
          className="text-xl font-extrabold text-foreground mt-7 mb-3 font-serif"
        >
          {line.replace("# ", "")}
        </h2>
      );
    } else {
      renderedElements.push(
        <p
          key={lineIdx}
          className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3"
        >
          {renderInlineMarkdown(line)}
        </p>
      );
    }
  });

  flushList();
  return renderedElements;
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function PoliciesManager({ initialPolicies }: PoliciesManagerProps) {
  const [policies, setPolicies] = useState<AdminSitePolicy[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw =
          localStorage.getItem(ADMIN_STORE_STORAGE_KEY) ||
          localStorage.getItem("kanhaiya_admin_mock_store_v7") ||
          localStorage.getItem("kanhaiya_admin_mock_store_v6");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.sitePolicies) && parsed.sitePolicies.length > 0) {
            return parsed.sitePolicies;
          }
        }
      } catch {}
    }
    return initialPolicies;
  });
  const [activeType, setActiveType] = useState<PolicyType>("terms");
  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");

  // Form State for Active Policy
  const [title, setTitle] = useState(() => {
    const cur = initialPolicies.find((p) => p.type === "terms");
    return cur?.title || "Terms of Service";
  });
  const [content, setContent] = useState(() => {
    const cur = initialPolicies.find((p) => p.type === "terms");
    return cur?.draft_content || cur?.content || "";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Auto-clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleSelectTab = (type: PolicyType) => {
    setActiveType(type);
    const current = policies.find((p) => p.type === type);
    if (current) {
      setTitle(current.title || "");
      setContent(current.draft_content || current.content || "");
    } else {
      const fallbackMeta = POLICY_TYPES.find((t) => t.type === type);
      setTitle(fallbackMeta?.label || "Policy");
      setContent("");
    }
    setFormError(null);
  };

  const activePolicyData = useMemo(() => {
    return policies.find((p) => p.type === activeType);
  }, [policies, activeType]);

  const activeMeta = useMemo(() => {
    return POLICY_TYPES.find((t) => t.type === activeType)!;
  }, [activeType]);

  const hasDraft = useMemo(() => {
    return Boolean(activePolicyData?.draft_content);
  }, [activePolicyData]);

  const wordCount = useMemo(() => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  }, [content]);

  const charCount = useMemo(() => {
    return content.length;
  }, [content]);

  const handleSaveAction = async (isDraft: boolean) => {
    if (!title.trim() || title.trim().length < 3) {
      setFormError("Policy title is required (minimum 3 characters).");
      return;
    }
    if (!content.trim() || content.trim().length < 20) {
      setFormError("Policy content is required (minimum 20 characters).");
      return;
    }

    if (isDraft) {
      setIsSavingDraft(true);
    } else {
      setIsSubmitting(true);
    }
    setFormError(null);

    try {
      const res = await savePolicyAction(
        activeType,
        title.trim(),
        content.trim(),
        undefined,
        isDraft
      );

      if (res.error) {
        setFormError(res.error);
        setToastMessage({ text: res.error, type: "error" });
      } else {
        const updatedTimestamp = new Date().toISOString();
        setPolicies((prev) => {
          const exists = prev.some((p) => p.type === activeType);
          if (exists) {
            return prev.map((p) =>
              p.type === activeType
                ? {
                    ...p,
                    title: title.trim(),
                    content: isDraft ? p.content : content.trim(),
                    draft_content: isDraft ? content.trim() : undefined,
                    is_published: isDraft ? p.is_published : true,
                    updated_at: updatedTimestamp,
                  }
                : p
            );
          } else {
            return [
              ...prev,
              {
                id: `pol-${activeType}`,
                type: activeType,
                title: title.trim(),
                content: isDraft ? "" : content.trim(),
                draft_content: isDraft ? content.trim() : undefined,
                is_published: !isDraft,
                display_order: prev.length + 1,
                updated_at: updatedTimestamp,
              },
            ];
          }
        });

        setToastMessage({
          text: isDraft
            ? `Draft for ${title.trim()} saved locally. (Public storefront remains unchanged).`
            : `${title.trim()} published successfully! Live on storefront.`,
          type: "success",
        });
      }
    } catch {
      setFormError("Failed to update policy. Please try again.");
      setToastMessage({ text: "Failed to update policy.", type: "error" });
    } finally {
      setIsSubmitting(false);
      setIsSavingDraft(false);
    }
  };

  const ActiveIcon = activeMeta.icon;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl text-xs font-semibold border shadow-sm transition-all ${
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

      {/* Separate Editor Tab Selector for Each Policy Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {POLICY_TYPES.map((pt) => {
          const Icon = pt.icon;
          const isSelected = activeType === pt.type;
          const existing = policies.find((p) => p.type === pt.type);
          const hasUnpublishedDraft = Boolean(existing?.draft_content);

          return (
            <button
              key={pt.type}
              type="button"
              onClick={() => handleSelectTab(pt.type)}
              className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/40"
                  : "bg-card border-border/70 hover:border-border hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {hasUnpublishedDraft ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <Clock className="h-2.5 w-2.5" />
                    <span>Draft</span>
                  </span>
                ) : existing?.content ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Check className="h-2.5 w-2.5" />
                    <span>Published</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    <span>Incomplete</span>
                  </span>
                )}
              </div>

              <span className="text-sm font-bold text-foreground">{pt.label}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                {pt.shortDesc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Dedicated Policy Editor Card */}
      <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs">
        {/* Editor Sub-Header & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-foreground">{activeMeta.label}</h2>
                {hasDraft ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    Draft in Progress
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Published
                  </span>
                )}
                <Link
                  href={activeMeta.route}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline ml-1"
                  title="Open live public URL in new tab"
                >
                  <span>{activeMeta.route}</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                Edits update the existing policy row strictly (unique type constraint preserved).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl bg-muted/80 p-1 border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("edit")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "edit"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Editor only"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "split"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Side by side"
              >
                <Columns className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Split View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "preview"
                    ? "bg-background text-foreground shadow-xs text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Preview only"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Editor Form & Preview Layout */}
        <div className="p-5 sm:p-6 space-y-6">
          {formError && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {hasDraft && (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs border border-amber-500/20">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>Unpublished Draft Active:</strong> You are currently editing a local draft. The public storefront will continue displaying the previously published policy until you click &quot;Publish Policy&quot;.
                </span>
              </div>
            </div>
          )}

          {/* Policy Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Official Document Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Terms of Service & Customer Agreement"
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 shadow-xs"
            />
          </div>

          {/* Content Pane: Split / Editor / Preview */}
          <div
            className={`grid gap-6 ${
              viewMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* Editor Pane */}
            {(viewMode === "split" || viewMode === "edit") && (
              <div className="space-y-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Markdown Content & Clauses <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Headings (###), bullet points (-), bold (**text**)
                  </span>
                </div>
                <textarea
                  rows={viewMode === "split" ? 18 : 22}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="### 1. Introduction&#10;Write the policy clauses here..."
                  className="w-full p-4 rounded-2xl border border-border bg-background text-xs font-mono text-foreground leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-primary/40 resize-y shadow-xs"
                />
              </div>
            )}

            {/* Formatted Readable Preview Pane */}
            {(viewMode === "split" || viewMode === "preview") && (
              <div className="space-y-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>Formatted Customer Preview</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Renders in real time
                  </span>
                </div>

                <div
                  className={`p-6 rounded-2xl border border-border/80 bg-muted/10 overflow-y-auto ${
                    viewMode === "split" ? "h-[450px]" : "min-h-[450px]"
                  }`}
                >
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div className="border-b border-border/60 pb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        Official Store Policy
                      </span>
                      <h1 className="text-xl sm:text-2xl font-bold font-serif text-foreground">
                        {title || "Untitled Policy"}
                      </h1>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Last Updated:{" "}
                          {activePolicyData?.updated_at
                            ? new Date(activePolicyData.updated_at).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Current Revision"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      {content ? (
                        renderMarkdownContent(content)
                      ) : (
                        <div className="py-12 text-center text-muted-foreground text-xs">
                          Type markdown content on the left to see the readable preview here.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Metadata & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/60">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} characters</span>
              {activePolicyData?.updated_at && (
                <>
                  <span>•</span>
                  <span>
                    Last Updated:{" "}
                    {new Date(activePolicyData.updated_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Save Draft Button */}
              <button
                type="button"
                onClick={() => handleSaveAction(true)}
                disabled={isSavingDraft || isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingDraft ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving Draft...</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Save Draft</span>
                  </>
                )}
              </button>

              {/* Publish Button */}
              <button
                type="button"
                onClick={() => handleSaveAction(false)}
                disabled={isSubmitting || isSavingDraft}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Publish Policy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Governance & Legal Notice Banner */}
      <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 text-xs text-muted-foreground flex items-start gap-3">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Compliance &amp; Governance Notice
          </p>
          <p className="leading-relaxed">
            These policy documents are managed within the local development architecture and represent internal terms for handcrafted artisan e-commerce. They do not constitute formal legal advice or statutory guarantees. Ensure all terms are verified by qualified legal counsel prior to formal production operations.
          </p>
        </div>
      </div>
    </div>
  );
}
