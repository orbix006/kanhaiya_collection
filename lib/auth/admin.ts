import { createClient } from "@/lib/supabase/server";

export interface AdminAuthResult {
  authorized: boolean;
  isDemo?: boolean;
  error?: string;
  user?: any;
  supabase: any;
}

/**
 * Verifies that the caller has an active authenticated administrator role.
 * Enforces server-side database verification against public.profiles.role = 'admin'.
 */
export async function verifyAdminCaller(): Promise<AdminAuthResult> {
  const supabase = await createClient();
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    return { authorized: true, isDemo: true, supabase };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      error: "Unauthorized: You must be logged in as an administrator.",
      supabase,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    return {
      authorized: false,
      error: "Forbidden: Only administrators are authorized to perform this operation.",
      supabase,
    };
  }

  return { authorized: true, isDemo: false, user, supabase };
}
