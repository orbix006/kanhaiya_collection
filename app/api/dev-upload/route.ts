import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { verifyAdminCaller } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function detectRasterFormat(buffer: Buffer): "jpg" | "png" | "webp" | "gif" | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // GIF: GIF87a or GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return "gif";
  }

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}

export async function POST(req: NextRequest) {
  // 1. Fail closed in production environments
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Development upload endpoint is disabled in production environments." },
      { status: 403 }
    );
  }

  // 2. Strict server-side administrator authorization
  const auth = await verifyAdminCaller(req);
  if (!auth.authorized) {
    const isUnauthenticated = Boolean(auth.error?.includes("Unauthorized"));
    return NextResponse.json(
      { error: auth.error || "Administrator authorization required." },
      { status: isUnauthenticated ? 401 : 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB limit." },
        { status: 400 }
      );
    }

    // 3. MIME type allowlist (strictly excluding SVG and non-raster formats)
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are permitted." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. File signature (magic bytes) validation to detect spoofed MIME types
    const detectedExt = detectRasterFormat(buffer);
    if (!detectedExt) {
      return NextResponse.json(
        { error: "File content does not match an allowable image format (JPEG, PNG, WebP, GIF)." },
        { status: 400 }
      );
    }

    // 5. Generate secure random filename using verified extension
    const randomSuffix = crypto.randomBytes(12).toString("hex");
    const uniqueName = `img_${Date.now()}_${randomSuffix}.${detectedExt}`;

    const uploadDir = path.resolve(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Path traversal defense
    const safeFilePath = path.resolve(uploadDir, uniqueName);
    if (!safeFilePath.startsWith(uploadDir + path.sep)) {
      return NextResponse.json(
        { error: "Invalid file destination path." },
        { status: 400 }
      );
    }

    fs.writeFileSync(safeFilePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueName,
      size: file.size,
    });
  } catch (error: unknown) {
    console.error("[dev-upload] Image processing failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to process image upload." },
      { status: 500 }
    );
  }
}
