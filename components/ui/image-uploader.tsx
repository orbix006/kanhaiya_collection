"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Upload, Loader2, X, Image as ImageIcon, AlertCircle } from "lucide-react";

interface ImageUploaderProps {
  bucket: string;
  folderPath: string;
  currentImageUrl?: string | null;
  onUploadComplete: (url: string) => void;
  label?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  aspectRatio?: "square" | "banner" | "auto";
}

export function ImageUploader({
  bucket,
  folderPath,
  currentImageUrl,
  onUploadComplete,
  label = "Upload Image",
  maxSizeMB = 5,
  allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  aspectRatio = "square",
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate type
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Allowed: ${allowedTypes.map((t) => t.split("/")[1]).join(", ")}`);
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    // Local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload to Supabase Storage
    setIsUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = folderPath ? `${folderPath.replace(/\/$/, "")}/${fileName}` : fileName;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      const publicUrl = urlData.publicUrl;

      setPreview(publicUrl);
      onUploadComplete(publicUrl);
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setPreview(null);
    onUploadComplete("");
  };

  const aspectClasses = {
    square: "w-32 h-32 rounded-full",
    banner: "w-full h-40 rounded-xl",
    auto: "w-full h-48 rounded-xl",
  }[aspectRatio];

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}

      {error && (
        <div className="flex items-center gap-2 p-2.5 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        {preview ? (
          <div className={`relative overflow-hidden border border-border bg-muted ${aspectClasses}`}>
            <Image
              src={preview}
              alt="Uploaded preview"
              fill
              className="object-cover"
              unoptimized
            />
            {isUploading && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-xs flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <button
              type="button"
              onClick={clearImage}
              disabled={isUploading}
              className="absolute top-1 right-1 p-1 rounded-full bg-background/80 text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            className={`flex flex-col items-center justify-center border-2 border-dashed border-input hover:border-primary/50 bg-card hover:bg-muted/50 cursor-pointer transition-colors ${aspectClasses}`}
          >
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-1">
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Select File</span>
                </>
              )}
            </div>
            <input
              type="file"
              accept={allowedTypes.join(",")}
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}
