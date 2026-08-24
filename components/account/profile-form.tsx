"use client";

import { useActionState, useState } from "react";
import { updateProfileAction } from "@/app/(public)/account/actions";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Loader2, Save, MapPin } from "lucide-react";
import Link from "next/link";

interface ProfileFormProps {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  role: string;
}

export function ProfileForm({
  userId,
  email,
  fullName,
  phone,
  avatarUrl,
  role,
}: ProfileFormProps) {
  const [currentAvatar, setCurrentAvatar] = useState<string>(avatarUrl || "");
  const [state, formAction, isPending] = useActionState(updateProfileAction, null);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Account Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your personal profile and preferences</p>
        </div>
        <Link
          href="/account/addresses"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium text-foreground transition-colors self-start sm:self-auto"
        >
          <MapPin className="h-4 w-4 text-primary" />
          <span>Manage Address Book</span>
        </Link>
      </div>

      {state?.error && (
        <div className="p-3.5 text-sm rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="p-3.5 text-sm rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          {state.success}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="avatarUrl" value={currentAvatar} />

        {/* Avatar Upload */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground">Profile Avatar</h2>
          <ImageUploader
            bucket="avatars"
            folderPath={`avatars/${userId}`}
            currentImageUrl={currentAvatar}
            onUploadComplete={(url) => setCurrentAvatar(url)}
            label="Upload new picture"
            maxSizeMB={5}
            aspectRatio="square"
          />
        </div>

        {/* Personal Details */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground">Personal Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                defaultValue={fullName}
                placeholder="Enter your full name"
                className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={phone}
                placeholder="+91 98765 43210"
                className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full h-11 px-3.5 rounded-lg border border-input bg-muted/60 text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Account Role
              </label>
              <div className="h-11 px-3.5 flex items-center">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary capitalize">
                  {role}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
