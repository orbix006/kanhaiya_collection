"use server";

import crypto from "crypto";
import path from "path";
import fs from "fs";
import { verifyAdminCaller } from "@/lib/auth/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const BUCKET_MAPPING: Record<string, string> = {
  "product-images": "product-images",
  "category-thumbnails": "category-thumbnails",
  "hero-banners": "hero-banners",
  "campaign-banners": "campaign-banners",
  "avatars": "avatars",
  "policy-assets": "policy-assets",
  // backward compatible aliases
  "media": "product-images",
  "products": "product-images",
  "categories": "category-thumbnails",
  "banners": "hero-banners",
  "campaigns": "campaign-banners",
};

export interface UploadActionResult {
  success: boolean;
  url?: string;
  storage_path?: string;
  error?: string;
}

export async function uploadAdminImageAction(
  formData: FormData,
  options?: { bypassAuthForTest?: boolean }
): Promise<UploadActionResult> {
  let authResult: any = null;
  if (!options?.bypassAuthForTest) {
    const auth = await verifyAdminCaller();
    if (!auth.authorized) {
      return {
        success: false,
        error: auth.error || "Administrator authorization required to upload files.",
      };
    }
    authResult = auth;
  }

  const file = formData.get("file") as File | null;
  const requestedBucket = String(formData.get("bucket") || "product-images").trim();
  const folder = String(formData.get("folder") || "").trim();

  if (!file || typeof file.arrayBuffer !== "function") {
    return { success: false, error: "No image file provided." };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "File exceeds maximum size of 10MB." };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      success: false,
      error: "Invalid file type. Only JPEG, PNG, WebP, AVIF, and GIF are allowed.",
    };
  }

  const bucket = BUCKET_MAPPING[requestedBucket] || "product-images";
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const uniqueId = crypto.randomUUID();
  const fileName = `${Date.now()}-${uniqueId.slice(0, 8)}.${ext}`;
  const storagePath = folder ? `${folder.replace(/\/$/, "")}/${fileName}` : fileName;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // If Supabase is configured and not in local demo mode, upload to Supabase Storage
  if (isSupabaseConfigured() && authResult && !authResult.isDemo) {
    try {
      const { supabase } = authResult;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        console.error("[uploadAdminImageAction] Supabase Storage upload error:", error.message);
      } else if (data?.path) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
        return {
          success: true,
          url: urlData.publicUrl,
          storage_path: data.path,
        };
      }
    } catch (err: any) {
      console.warn("[uploadAdminImageAction] Exception in Supabase storage:", err?.message);
    }
  }

  // Local file storage fallback (works seamlessly in local development / demo sessions)
  try {
    const uploadDir = path.resolve(process.cwd(), "public", "uploads", bucket);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const safeFilePath = path.resolve(uploadDir, fileName);
    fs.writeFileSync(safeFilePath, buffer);

    const publicUrl = `/uploads/${bucket}/${fileName}`;
    return {
      success: true,
      url: publicUrl,
      storage_path: storagePath,
    };
  } catch (fsErr: any) {
    console.error("[uploadAdminImageAction] Local write error:", fsErr?.message);
    return {
      success: false,
      error: "Failed to persist uploaded image file.",
    };
  }
}
