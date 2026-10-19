import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getLocalSession } from "@/lib/auth/local-auth";

export interface AdminAuthResult {
  authorized: boolean;
  isDemo?: boolean;
  error?: string;
  user?: any;
  supabase: any;
}

/**
 * Verifies that the caller has an active authenticated administrator role.
 * Enforces authoritative server-side role check ('admin') across both Supabase and local environments.
 */
export async function verifyAdminCaller(): Promise<AdminAuthResult> {
  const supabase = await createClient();

  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return {
        authorized: false,
        error: "Configuration Error: Supabase credentials are required in production.",
        supabase,
      };
    }
    const session = await getLocalSession();
    if (!session) {
      return {
        authorized: false,
        error: "Unauthorized: You must be logged in as an administrator.",
        supabase,
      };
    }
    if (session.role !== "admin") {
      return {
        authorized: false,
        error: "Forbidden: Only administrators are authorized to perform this operation.",
        supabase,
      };
    }
    return { authorized: true, isDemo: true, user: session, supabase };
  }

  try {
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
  } catch {
    return {
      authorized: false,
      error: "Authentication service unavailable. Please check your connection.",
      supabase,
    };
  }
}
