import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Creates an administrative Supabase client using the SUPABASE_SERVICE_ROLE_KEY.
 *
 * CRITICAL SECURITY RULES:
 * 1. This client bypasses Row-Level Security (RLS) entirely.
 * 2. It must ONLY be used on the server in secure contexts such as verified webhooks (e.g. Razorpay webhook)
 *    or elevated backend tasks.
 * 3. Never import or use this client in client components or expose to browser bundles.
 * 4. Never prefix SUPABASE_SERVICE_ROLE_KEY with NEXT_PUBLIC_.
 */
export function createServiceClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://placeholder-project.supabase.co";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-service-key";

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
