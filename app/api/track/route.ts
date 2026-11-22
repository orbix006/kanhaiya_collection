import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co" &&
      process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http");

    if (!isConfigured) {
      return NextResponse.json({ ok: true, dev: true });
    }

    const body = await request.json().catch(() => ({}));
    const rawPath = body.path || "/";
    const path = typeof rawPath === "string" && rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
    const referrer = typeof body.referrer === "string" ? body.referrer : "";

    // 1. Resolve or generate persistent visitor_key cookie (UUID or SHA256)
    let visitorKey = request.cookies.get("kc_vid")?.value;
    let isNewVisitorCookie = false;
    if (!visitorKey) {
      visitorKey = `v_${crypto.randomUUID()}`;
      isNewVisitorCookie = true;
    }

    // 2. Resolve or generate session_id cookie (30 min sliding window)
    let sessionId = request.cookies.get("kc_sid")?.value;
    let isNewSessionCookie = false;
    if (!sessionId) {
      sessionId = `s_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
      isNewSessionCookie = true;
    }

    // 3. User agent & IP hash for rate limiting / anonymized visitor identification
    const userAgent = request.headers.get("user-agent") || "unknown";
    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const ipHash = crypto.createHash("sha256").update(clientIp + "kc_salt").digest("hex").slice(0, 32);

    // 4. Invoke authoritative public.track_page_view RPC using service role client
    const supabase = createServiceClient();
    const { error: rpcErr } = await (supabase.rpc as any)("track_page_view", {
      p_visitor_key: visitorKey,
      p_session_id: sessionId,
      p_path: path,
      p_referrer: referrer,
      p_user_agent: userAgent,
      p_ip_hash: ipHash,
      p_consented: false,
    });

    if (rpcErr) {
      console.warn("[analytics:track_page_view] RPC returned:", rpcErr.message);
    }

    const response = NextResponse.json({ ok: true });

    // Set persistent visitor cookie (1 year)
    if (isNewVisitorCookie) {
      response.cookies.set("kc_vid", visitorKey, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    // Set session cookie (30 min)
    response.cookies.set("kc_sid", sessionId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 30,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
