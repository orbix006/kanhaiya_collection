import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getLocalSession } from "@/lib/auth/local-auth";
import { isUserAdmin, resolveUserRole } from "@/lib/auth/role-check";

export interface AdminAuthResult {
  authorized: boolean;
  isDemo?: boolean;
  error?: string;
  user?: any;
  supabase: any;
}

export interface UserAuthResult {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    role: "admin" | "user" | string;
    full_name?: string | null;
  } | null;
  error?: string;
}

/**
 * Token Verification Middleware: Validates that the request has an active, legitimate session.
 * Supports both Supabase Cloud tokens and local development session cookies.
 * Resolves roles comprehensively via centralized RBAC rules.
 */
export async function verifyToken(req?: NextRequest | Request | any): Promise<UserAuthResult> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user) {
        const { data: profile } = await supabase
          .from("users")
          .select("id, full_name, email, role")
          .eq("id", user.id)
          .single();

        const role = resolveUserRole(user, profile);

        return {
          authenticated: true,
          user: {
            id: user.id,
            email: user.email || "",
            role: role,
            full_name:
              profile?.full_name ||
              (user.user_metadata?.full_name as string) ||
              null,
          },
        };
      }
    } catch {
      // Continue to local session check
    }
  }

  // Local / Offline authentication & cookie fallback
  const session = await getLocalSession(req);
  if (!session) {
    return {
      authenticated: false,
      user: null,
      error: "Unauthorized: Authentication required.",
    };
  }

  const role = resolveUserRole(session);

  return {
    authenticated: true,
    user: {
      id: session.id,
      email: session.email,
      role: role,
      full_name: session.full_name,
    },
  };
}

/**
 * Role Verification Middleware: Enforces that the verified user holds an 'admin' role.
 * Returns HTTP 403 Forbidden for any authenticated non-admin caller.
 */
export async function verifyAdmin(
  req?: NextRequest | Request | any
): Promise<{ authorized: boolean; user?: any; response?: NextResponse }> {
  const tokenResult = await verifyToken(req);

  if (!tokenResult.authenticated || !tokenResult.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized: Administrator authentication required." },
        { status: 401 }
      ),
    };
  }

  if (tokenResult.user.role !== "admin") {
    return {
      authorized: false,
      user: tokenResult.user,
      response: NextResponse.json(
        { error: "Forbidden: Administrator role required. Access denied." },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: tokenResult.user,
  };
}

/**
 * Verifies that the caller has an active authenticated administrator role.
 * Enforces authoritative server-side role check ('admin') across both Supabase and local environments.
 * Returns HTTP 403 Forbidden semantics for non-admin callers.
 */
export async function verifyAdminCaller(
  reqOrCookie?: any
): Promise<AdminAuthResult> {
  const supabase = await createClient();

  if (isSupabaseConfigured()) {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!authError && user) {
        const { data: profile } = await supabase
          .from("users")
          .select("id, full_name, email, role")
          .eq("id", user.id)
          .single();

        const isAdmin = isUserAdmin(user, profile);

        if (!isAdmin) {
          return {
            authorized: false,
            user,
            error: "Forbidden: Only administrators are authorized to perform this operation.",
            supabase,
          };
        }

        return { authorized: true, isDemo: false, user, supabase };
      }
    } catch {
      // Continue to local session fallback
    }
  }

  // Local / Offline development authorization check
  const session = await getLocalSession(reqOrCookie);
  if (!session) {
    return {
      authorized: false,
      error: "Unauthorized: You must be logged in as an administrator.",
      supabase,
    };
  }

  if (!isUserAdmin(session)) {
    return {
      authorized: false,
      user: session,
      error: "Forbidden: Only administrators are authorized to perform this operation.",
      supabase,
    };
  }

  return { authorized: true, isDemo: true, user: session, supabase };
}
