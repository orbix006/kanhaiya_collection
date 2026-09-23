"use client";

import { useState } from "react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      <AdminForm onSubmit={handleSubmit}>
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

            <FormField label="Brand Tagline" helperText="Shown beside brand logo in footer">
              <FormInput
                value={settings.tagline}
                onChange={(e) =>
                  setSettings({ ...settings, tagline: e.target.value })
                }
                placeholder="Handcrafted Luxury, Heritage Silk & Timeless Elegance"
              />
            </FormField>
          </div>

          <FormField
            label="Store Logo Image (Optional)"
            helperText="Upload transparent PNG or SVG logo for header and footer."
          >
            <ImageUploader
              bucket="media"
              folderPath="settings"
              currentImageUrl={settings.logo_url}
              onUploadComplete={(url) => setSettings({ ...settings, logo_url: url })}
              aspectRatio="square"
              label=""
            />
          </FormField>
        </div>

        {/* Customer Care & Contact */}
        <div className="space-y-4 pb-6 border-b border-border/60 pt-2">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <Phone className="h-4 w-4 text-primary" />
            <span>Customer Support & Contact Info</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Support Phone Number" required>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <FormInput
                  className="pl-9"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+91 98290 12345"
                />
              </div>
            </FormField>

            <FormField label="Customer Care Email" required>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <FormInput
                  className="pl-9"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="care@kanhaiyacollection.com"
                />
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Physical Atelier / Store Address" required>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <FormInput
                  className="pl-9"
                  value={settings.address}
                  onChange={(e) =>
                    setSettings({ ...settings, address: e.target.value })
                  }
                  placeholder="108 Heritage Boulevard, Jaipur, Rajasthan"
                />
              </div>
            </FormField>

            <FormField label="Operating Hours">
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <FormInput
                  className="pl-9"
                  value={settings.business_hours || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, business_hours: e.target.value })
                  }
                  placeholder="Monday – Saturday: 10:00 AM – 8:00 PM IST"
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Social Media Links */}
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
                  placeholder="https://youtube.com/@kanhaiya_collection"
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
    </div>
  );
}
