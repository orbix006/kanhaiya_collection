"use client";

import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import { updateHomepageSectionsAction } from "@/app/(admin)/admin/cms/actions";
import type { HomepageSection } from "@/lib/data/cms";

interface SectionMeta {
  title: string;
  description: string;
  badge: string;
}

const SECTION_METADATA: Record<string, SectionMeta> = {
  banner: {
    title: "Hero Banner Carousel",
    description: "Full-width curated promotional banners with optional deep-links and auto-advance.",
    badge: "Hero Block",
  },
  shop_by_category: {
    title: "Shop by Category Grid",
    description: "Visual category boxes deep-linking directly to filtered catalog views.",
    badge: "Taxonomy",
  },
  continue_browsing: {
    title: "Continue Browsing (Recent Views)",
    description: "Personalized browsing history for logged-in users; automatically hides if empty.",
    badge: "Personalized",
  },
  top_sellers: {
    title: "Top Sellers Showcase",
    description: "Auto-ranked by sold count with admin manual pins floating to the top.",
    badge: "Ranked",
  },
  category_products: {
    title: "Category Product Showcase",
    description: "Horizontal rows of featured items grouped under top-level catalog categories.",
    badge: "Catalog",
  },
  wall_of_love: {
    title: "Wall of Love (Testimonials)",
    description: "Social proof grid featuring authentic verified customer reviews and star ratings.",
    badge: "Social Proof",
  },
};

interface HomepageManagerProps {
  initialSections: HomepageSection[];
}

export function HomepageManager({ initialSections }: HomepageManagerProps) {
  const [sections, setSections] = useState<HomepageSection[]>(() => {
    return [...initialSections].sort((a, b) => a.display_order - b.display_order);
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const moveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Recalculate display_order 1..N
    const reordered = newSections.map((sec, idx) => ({
      ...sec,
      display_order: idx + 1,
    }));

    setSections(reordered);
    setMessage(null);
  };

  const toggleSection = (key: string) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.key === key ? { ...sec, is_enabled: !sec.is_enabled } : sec
      )
    );
    setMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await updateHomepageSectionsAction(sections);
      if (res.error) {
        setMessage({ text: res.error, type: "error" });
      } else {
        setMessage({
          text: res.message || "Homepage layout changes saved successfully!",
          type: "success",
        });
      }
    } catch {
      setMessage({
        text: "An unexpected error occurred while saving section order.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/70 p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-primary" />
            <span>Storefront Section Sequence</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sections render on the live homepage strictly following this order. Disabled sections are completely omitted from client rendering.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Save & Publish Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Status Alert */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl text-xs font-semibold border ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              : "bg-destructive/10 text-destructive border-destructive/30"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-3">
        {sections.map((sec, index) => {
          const meta = SECTION_METADATA[sec.key] || {
            title: sec.key,
            description: "Custom homepage block.",
            badge: "Section",
          };

          return (
            <div
              key={sec.key}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                sec.is_enabled
                  ? "bg-card border-border/80 shadow-xs hover:border-primary/40"
                  : "bg-muted/40 border-border/40 opacity-70"
              }`}
            >
              {/* Left Order & Title */}
              <div className="flex items-center gap-3.5">
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => moveSection(index, "up")}
                    disabled={index === 0}
                    title="Move Up"
                    className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveSection(index, "down")}
                    disabled={index === sections.length - 1}
                    title="Move Down"
                    className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-extrabold text-sm">
                  {sec.display_order}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">
                      {meta.title}
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                      {meta.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                    {meta.description}
                  </p>
                </div>
              </div>

              {/* Right Toggle */}
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => toggleSection(sec.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    sec.is_enabled
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  }`}
                >
                  {sec.is_enabled ? (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Live on Homepage</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Hidden</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-center justify-between">
        <span>Looking to manage the items within these sections?</span>
        <div className="flex items-center gap-3">
          <a
            href="/admin/cms/banners"
            className="text-primary font-bold hover:underline inline-flex items-center gap-1"
          >
            <span>Banners</span>
            <ArrowRight className="h-3 w-3" />
          </a>
          <span>•</span>
          <a
            href="/admin/cms/testimonials"
            className="text-primary font-bold hover:underline inline-flex items-center gap-1"
          >
            <span>Testimonials</span>
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
