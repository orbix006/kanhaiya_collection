"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Loader2,
  X,
  Image as ImageIcon,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Check,
  RefreshCw,
} from "lucide-react";
import { uploadAdminImageAction } from "@/app/(admin)/admin/actions/upload";

export interface UploadedImageItem {
  id?: string;
  url: string;
  storage_path?: string | null;
  alt_text?: string | null;
  display_order?: number;
  is_primary?: boolean;
}

interface ImageUploaderProps {
  bucket?: string;
  folderPath?: string;
  label?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  aspectRatio?: "square" | "banner" | "auto";
  multiple?: boolean;
  // Single image mode
  currentImageUrl?: string | null;
  onUploadComplete?: (url: string, storagePath?: string) => void;
  // Multiple images mode
  images?: UploadedImageItem[];
  onChangeImages?: (images: UploadedImageItem[]) => void;
  onRemoveSingle?: () => void;
}

export function ImageUploader({
  bucket = "product-images",
  folderPath = "uploads",
  label = "Upload Image",
  maxSizeMB = 5,
  allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"],
  aspectRatio = "auto",
  multiple = false,
  currentImageUrl,
  onUploadComplete,
  images = [],
  onChangeImages,
  onRemoveSingle,
}: ImageUploaderProps) {
  const [singlePreview, setSinglePreview] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync when currentImageUrl changes externally
  const prevImageUrlRef = useRef(currentImageUrl);
  if (!multiple && currentImageUrl !== prevImageUrlRef.current && !isUploading) {
    prevImageUrlRef.current = currentImageUrl;
    setSinglePreview(currentImageUrl || null);
  }

  const uploadFile = async (file: File): Promise<{ url: string; storage_path?: string }> => {
    // Client-side validations
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.map((t) => t.split("/")[1]).join(", ")}`);
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File "${file.name}" exceeds ${maxSizeMB}MB limit.`);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    formData.append("folder", folderPath);

    const res = await uploadAdminImageAction(formData);
    if (!res.success || !res.url) {
      throw new Error(res.error || "Upload failed. Please try again.");
    }

    return { url: res.url, storage_path: res.storage_path };
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      if (multiple) {
        const fileList = Array.from(files);
        const uploadedItems: UploadedImageItem[] = [];

        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          const result = await uploadFile(file);
          uploadedItems.push({
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            url: result.url,
            storage_path: result.storage_path || null,
            alt_text: file.name.replace(/\.[^/.]+$/, ""),
            display_order: images.length + i + 1,
            is_primary: images.length === 0 && i === 0,
          });
          setUploadProgress(Math.round(((i + 1) / fileList.length) * 100));
        }

        const newImages = [...images, ...uploadedItems];
        onChangeImages?.(newImages);
      } else {
        const file = files[0];
        const result = await uploadFile(file);
        setSinglePreview(result.url);
        onUploadComplete?.(result.url, result.storage_path);
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image(s).");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Multiple mode handlers
  const handleRemoveImage = (indexToRemove: number) => {
    if (!onChangeImages) return;
    const filtered = images.filter((_, idx) => idx !== indexToRemove);
    // If the removed image was primary, make the first remaining image primary
    if (filtered.length > 0 && !filtered.some((img) => img.is_primary)) {
      filtered[0].is_primary = true;
    }
    // Re-index display order
    const updated = filtered.map((img, idx) => ({
      ...img,
      display_order: idx + 1,
    }));
    onChangeImages(updated);
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (!onChangeImages) return;
    const updated = images.map((img, idx) => ({
      ...img,
      is_primary: idx === indexToPrimary,
    }));
    onChangeImages(updated);
  };

  const handleMoveImage = (index: number, direction: "up" | "down") => {
    if (!onChangeImages) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const copy = [...images];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    const reordered = copy.map((img, idx) => ({
      ...img,
      display_order: idx + 1,
    }));
    onChangeImages(reordered);
  };

  const handleClearSingle = () => {
    setSinglePreview(null);
    onUploadComplete?.("", "");
    onRemoveSingle?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const aspectClasses = {
    square: "w-28 h-28 rounded-2xl",
    banner: "w-full h-36 rounded-2xl",
    auto: "w-full h-40 rounded-2xl",
  }[aspectRatio];

  return (
    <div className="space-y-3 font-sans">
      {label && (
        <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
          {label}
        </label>
      )}

      {error && (
        <div className="flex items-center gap-2 p-2.5 text-xs rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MULTIPLE IMAGES MODE */}
      {multiple ? (
        <div className="space-y-3">
          {/* Grid of uploaded images */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <div
                  key={img.id || `${img.url}-${idx}`}
                  className={`relative group aspect-square rounded-2xl border overflow-hidden bg-muted/40 transition-all ${
                    img.is_primary ? "ring-2 ring-primary border-primary shadow-xs" : "border-border hover:border-primary/50"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt_text || `Product image ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />

                  {/* Primary Badge */}
                  {img.is_primary && (
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold shadow-xs">
                      Primary
                    </span>
                  )}

                  {/* Hover Actions Toolbar */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        disabled={img.is_primary}
                        className={`p-1 rounded-md text-[10px] font-bold transition-colors ${
                          img.is_primary
                            ? "bg-primary text-primary-foreground"
                            : "bg-black/60 text-white hover:bg-primary"
                        }`}
                        title={img.is_primary ? "Current Primary" : "Set as Primary Image"}
                      >
                        <Check className="h-3 w-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 rounded-md bg-destructive/90 text-destructive-foreground hover:bg-destructive transition-colors"
                        title="Remove image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Reorder arrows */}
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveImage(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 rounded-md bg-black/70 text-white hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move left/up"
                      >
                        <ArrowUp className="h-3 w-3 -rotate-90 sm:rotate-0" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveImage(idx, "down")}
                        disabled={idx === images.length - 1}
                        className="p-1 rounded-md bg-black/70 text-white hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move right/down"
                      >
                        <ArrowDown className="h-3 w-3 -rotate-90 sm:rotate-0" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Drop Zone for multiple files */}
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40 rounded-2xl p-5 text-center cursor-pointer transition-colors">
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Uploading files... {uploadProgress ? `${uploadProgress}%` : ""}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 py-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-xs font-bold text-foreground">
                  Select Multiple Files from Device
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Supported: JPEG, PNG, WebP, AVIF up to {maxSizeMB}MB each
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={allowedTypes.join(",")}
              onChange={handleFilesSelected}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        /* SINGLE IMAGE MODE */
        <div className="flex items-center gap-4">
          {singlePreview ? (
            <div className={`relative overflow-hidden border border-border/80 bg-muted/40 shadow-xs group ${aspectClasses}`}>
              <Image
                src={singlePreview}
                alt="Uploaded preview"
                fill
                className="object-cover"
                unoptimized
              />
              {isUploading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              {/* Replace / Remove Overlay on Hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white cursor-pointer transition-colors" title="Replace image">
                  <RefreshCw className="h-4 w-4" />
                  <input
                    type="file"
                    accept={allowedTypes.join(",")}
                    onChange={handleFilesSelected}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleClearSingle}
                  disabled={isUploading}
                  className="p-1.5 rounded-lg bg-destructive/90 hover:bg-destructive text-white transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <label
              className={`flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors ${aspectClasses}`}
            >
              <div className="flex flex-col items-center justify-center p-4 text-center space-y-1">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">Select File</span>
                    <span className="text-[10px] text-muted-foreground">Up to {maxSizeMB}MB</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={allowedTypes.join(",")}
                onChange={handleFilesSelected}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
