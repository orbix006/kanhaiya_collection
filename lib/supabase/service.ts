import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Validates whether the elevated Supabase service-role credentials are actively provisioned
 * with legitimate endpoints rather than unconfigured placeholders or missing variables.
 */
export function isSupabaseServiceConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  return Boolean(
    url &&
    key &&
    url.trim() !== "" &&
    key.trim() !== "" &&
    url !== "https://placeholder-project.supabase.co" &&
    key !== "placeholder-service-key" &&
    key !== "placeholder-anon-key" &&
    url.startsWith("http")
  );
}

/**
 * Creates an administrative Supabase client using the SUPABASE_SERVICE_ROLE_KEY.
 *
 * CRITICAL SECURITY RULES:
 * 1. This client bypasses Row-Level Security (RLS) entirely.
 * 2. It must ONLY be used on the server in secure contexts such as verified webhooks (e.g. Razorpay webhook)
 *    or elevated backend tasks.
 * 3. Never import or use this client in client components or expose to browser bundles.
 * 4. Never prefix SUPABASE_SERVICE_ROLE_KEY with NEXT_PUBLIC_.
 * 5. Never fall back to NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    supabaseUrl.trim() === "" ||
    serviceRoleKey.trim() === "" ||
    supabaseUrl === "https://placeholder-project.supabase.co" ||
    serviceRoleKey === "placeholder-service-key" ||
    serviceRoleKey === "placeholder-anon-key" ||
    !supabaseUrl.startsWith("http")
  ) {
    throw new Error(
      "Missing Supabase service-role credentials. Configure SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in server environment variables."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

