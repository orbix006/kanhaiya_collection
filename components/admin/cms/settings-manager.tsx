"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Store,
  MonitorPlay,
  Sliders,
  ExternalLink,
} from "lucide-react";
import {
  InstagramIcon,
  FacebookIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@/components/ui/social-icons";
import {
  AdminForm,
  FormField,
  FormInput,
  FormActions,
  FormButton,
} from "@/components/admin/form";
import { ImageUploader } from "@/components/ui/image-uploader";
import { saveSiteSettingsAction } from "@/app/(admin)/admin/cms/actions";
import type { FooterSettings } from "@/lib/data/cms";

interface SettingsManagerProps {
  initialSettings: FooterSettings;
}

export function SettingsManager({ initialSettings }: SettingsManagerProps) {
  const [settings, setSettings] = useState<FooterSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
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
        if (parsed.siteSettings && parsed.siteSettings.footer) {
          setSettings({
            ...initialSettings,
            ...parsed.siteSettings.footer,
            social: {
              ...initialSettings.social,
              ...(parsed.siteSettings.footer.social || {}),
            },
          });
        }
      }
    } catch {}
  }, [initialSettings]);

  const validateInputs = (): boolean => {
    setValidationError(null);

    if (!settings.brand_name || settings.brand_name.trim().length < 2) {
      setValidationError("Brand name is required (minimum 2 characters).");
      return false;
    }

    if (!settings.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email.trim())) {
      setValidationError("Please enter a valid official contact email address.");
      return false;
    }

    if (settings.logo_url && settings.logo_url.trim()) {
      const url = settings.logo_url.trim();
      const isValid = url.startsWith("/") || /^https?:\/\//i.test(url);
      if (!isValid) {
        setValidationError("Logo URL must be an absolute URL (https://) or local path (/logo.svg).");
        return false;
      }
    }

    if (settings.social) {
      for (const [platform, sUrl] of Object.entries(settings.social)) {
        if (sUrl && sUrl.trim()) {
          const trimmed = sUrl.trim();
          if (!/^https?:\/\//i.test(trimmed)) {
            setValidationError(`Social link for ${platform} must start with http:// or https://`);
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsSubmitting(true);
    setToastMessage(null);

    try {
      const res = await saveSiteSettingsAction("footer", settings);
      if (res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else {
        setToastMessage({
          text: "Site & Footer settings updated and published successfully!",
          type: "success",
        });
      }
    } catch {
      setToastMessage({
        text: "Failed to update site settings. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Tab Switcher: Editor Form vs Live Footer Preview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="inline-flex rounded-xl bg-muted/60 p-1 border border-border/60">
          <button
            onClick={() => setActiveTab("form")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "form"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Settings Editor</span>
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
            <span>Live Footer Preview</span>
          </button>
        </div>

        <div className="text-xs text-muted-foreground">
          JSON Key: <code className="font-mono text-primary font-bold">site_settings.footer</code>
        </div>
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

      {activeTab === "form" ? (
        <AdminForm onSubmit={handleSubmit} error={validationError}>
          {/* Brand Information Section */}
          <div className="space-y-4 pb-6 border-b border-border/60">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Store className="h-4 w-4 text-primary" />
              <span>Storefront Brand Identity</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Brand Name" required>
                <FormInput
                  value={settings.brand_name}
                  onChange={(e) =>
                    setSettings({ ...settings, brand_name: e.target.value })
                  }
                  placeholder="Kanhaiya Collection"
                />
              </FormField>

              <FormField label="Tagline / Brand Philosophy">
                <FormInput
                  value={settings.tagline}
                  onChange={(e) =>
                    setSettings({ ...settings, tagline: e.target.value })
                  }
                  placeholder="Sacred Devotion & Spiritual Living"
                />
              </FormField>
            </div>

            <FormField
              label="Brand Logo URL"
              helperText="Upload image or provide relative SVG asset path (e.g. /logo.svg)."
            >
              <ImageUploader
                bucket="media"
                folderPath="brand"
                currentImageUrl={settings.logo_url}
                onUploadComplete={(url) => setSettings({ ...settings, logo_url: url })}
                aspectRatio="auto"
                label=""
              />
            </FormField>
          </div>

          {/* Contact Details Section */}
          <div className="space-y-4 pb-6 border-b border-border/60 pt-2">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Phone className="h-4 w-4 text-primary" />
              <span>Direct Customer Care Channels</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Customer Support Phone" required>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <FormInput
                    className="pl-9"
                    value={settings.phone}
                    onChange={(e) =>
                      setSettings({ ...settings, phone: e.target.value })
                    }
                    placeholder="+91 98290 12345"
                  />
                </div>
              </FormField>

              <FormField label="Official Care Email" required>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <FormInput
                    className="pl-9"
                    type="email"
                    value={settings.email}
                    onChange={(e) =>
                      setSettings({ ...settings, email: e.target.value })
                    }
                    placeholder="care@kanhaiyacollection.com"
                  />
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Physical Store & Studio Address" required>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <FormInput
                    className="pl-9"
                    value={settings.address}
                    onChange={(e) =>
                      setSettings({ ...settings, address: e.target.value })
                    }
                    placeholder="108 Heritage Boulevard, Varanasi, Uttar Pradesh 221001"
                  />
                </div>
              </FormField>

              <FormField label="Business Operating Hours">
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <FormInput
                    className="pl-9"
                    value={settings.business_hours || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, business_hours: e.target.value })
                    }
                    placeholder="Monday – Saturday: 9:00 AM – 8:00 PM IST"
                  />
                </div>
              </FormField>
            </div>
          </div>

          {/* Social Media Channels */}
          <div className="space-y-4 pb-4 pt-2">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Official Social Media Channels</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Instagram Profile URL">
                <div className="relative">
                  <InstagramIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <FormInput
                    className="pl-9"
                    value={settings.social?.instagram || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        social: { ...settings.social, instagram: e.target.value },
                      })
                    }
                    placeholder="https://instagram.com/kanhaiya_collection"
                  />
                </div>
              </FormField>

              <FormField label="Facebook Page URL">
                <div className="relative">
                  <FacebookIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <FormInput
                    className="pl-9"
                    value={settings.social?.facebook || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        social: { ...settings.social, facebook: e.target.value },
                      })
                    }
                    placeholder="https://facebook.com/kanhaiyacollection"
                  />
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Twitter / X Profile URL">
                <div className="relative">
                  <TwitterIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <FormInput
                    className="pl-9"
                    value={settings.social?.twitter || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        social: { ...settings.social, twitter: e.target.value },
                      })
                    }
                    placeholder="https://twitter.com/kanhaiyacoll"
                  />
                </div>
              </FormField>

              <FormField label="YouTube Channel URL">
                <div className="relative">
                  <YoutubeIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <FormInput
                    className="pl-9"
                    value={settings.social?.youtube || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        social: { ...settings.social, youtube: e.target.value },
                      })
                    }
                    placeholder="https://youtube.com/@kanhaiyacollection"
                  />
                </div>
              </FormField>
            </div>
          </div>

          <FormActions>
            <FormButton type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Publishing Settings...</span>
                </>
              ) : (
                <span>Save & Publish Footer Settings</span>
              )}
            </FormButton>
          </FormActions>
        </AdminForm>
      ) : (
        /* LIVE FOOTER PREVIEW */
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <MonitorPlay className="h-4 w-4 text-primary" />
              <span>Live Footer Simulation</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Shows how changes look live on the customer-facing storefront
            </span>
          </div>

          {/* Actual Rendered Storefront Footer Replica */}
          <div className="rounded-3xl border border-[rgba(200,137,26,0.2)] bg-[#FFF8EC] text-[#3B2416] p-8 sm:p-12 shadow-sm font-sans">
            <div className="max-w-5xl mx-auto space-y-10">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-12">
                {/* Brand & Description */}
                <div className="max-w-md space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFFDF7] ring-1 ring-[#C8891A]/30 text-[#C8891A] shadow-2xs">
                      {/* Diya SVG Icon */}
                      <svg
                        className="h-5 w-5 text-[#C8891A]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2c.5 2 2.5 3.5 2.5 5.5A2.5 2.5 0 0 1 12 10a2.5 2.5 0 0 1-2.5-2.5C9.5 5.5 11.5 4 12 2z" />
                        <path d="M4 14c0 3.866 3.582 7 8 7s8-3.134 8-7H4z" />
                        <path d="M4 14h16" />
                      </svg>
                    </div>
                    <span className="font-serif text-2xl font-bold tracking-tight text-[#3B2416]">
                      {settings.brand_name || "Kanhaiya Collection"}
                    </span>
                  </div>

                  <p className="text-sm text-[#806B57] leading-relaxed">
                    {settings.tagline || "Sacred Devotion & Spiritual Living — Handcrafted in Varanasi"}
                  </p>

                  {/* Social Channel Icons */}
                  <div className="flex items-center gap-4 pt-1 text-[#806B57]">
                    {settings.social?.instagram && (
                      <span title={settings.social.instagram} className="p-1.5 rounded-full hover:text-[#C8891A] transition-colors">
                        <InstagramIcon className="h-4 w-4" />
                      </span>
                    )}
                    {settings.social?.facebook && (
                      <span title={settings.social.facebook} className="p-1.5 rounded-full hover:text-[#C8891A] transition-colors">
                        <FacebookIcon className="h-4 w-4" />
                      </span>
                    )}
                    {settings.social?.twitter && (
                      <span title={settings.social.twitter} className="p-1.5 rounded-full hover:text-[#C8891A] transition-colors">
                        <TwitterIcon className="h-4 w-4" />
                      </span>
                    )}
                    {settings.social?.youtube && (
                      <span title={settings.social.youtube} className="p-1.5 rounded-full hover:text-[#C8891A] transition-colors">
                        <YoutubeIcon className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct Contact Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#C8891A]">
                    Customer Concierge
                  </h4>
                  <div className="space-y-2 text-xs sm:text-sm text-[#806B57]">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-[#C8891A] shrink-0 mt-0.5" />
                      <span>{settings.address}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 text-[#C8891A] shrink-0" />
                      <span>{settings.phone}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 text-[#C8891A] shrink-0" />
                      <span>{settings.email}</span>
                    </div>
                    {settings.business_hours && (
                      <div className="flex items-center gap-2.5 text-xs text-[#806B57]/80 pt-1">
                        <Clock className="h-3.5 w-3.5 text-[#C8891A] shrink-0" />
                        <span>{settings.business_hours}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Copyright & Policy Links */}
              <div className="pt-8 border-t border-[rgba(200,137,26,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#806B57]">
                <span>
                  &copy; {new Date().getFullYear()} {settings.brand_name}. Consecrated Hindu Heritage.
                </span>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="hover:text-[#C8891A]">Privacy Policy</span>
                  <span>•</span>
                  <span className="hover:text-[#C8891A]">Terms of Service</span>
                  <span>•</span>
                  <span className="hover:text-[#C8891A]">Shipping & Delivery</span>
                  <span>•</span>
                  <span className="hover:text-[#C8891A]">Returns & Refunds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
