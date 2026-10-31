/**
 * Centralized Role Verification & RBAC Authorization Utility
 * Single authoritative source of truth for administrator privileges across:
 * - Edge Middleware (middleware.ts)
 * - Server Layouts & Route Guards (app/(admin)/layout.tsx, app/(public)/layout.tsx)
 * - Client Guards (components/admin/admin-route.tsx)
 * - Navigation & UI Controls (components/layout/header.tsx)
 * - Backend API & Server Actions (lib/auth/admin.ts, admin actions)
 */

export const ADMIN_WHITELIST_EMAILS = [
  "avaatdesigns.info@gmail.com",
  "admin@kanhaiya.local",
  "you@example.com",
] as const;

export const ADMIN_WHITELIST_UIDS = [
  "8ccd5c84-1b51-4bed-a3b7-7727387cbaa2",
  "usr_dev_admin_preview",
  "usr_4104acb962ff4cdaae6cd0136b9cee47",
] as const;

/**
 * Checks whether an email matches an authorized administrator email (case-insensitive).
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_WHITELIST_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
}

/**
 * Checks whether a user ID matches an authorized administrator UID.
 */
export function isAdminUid(uid?: string | null): boolean {
  if (!uid || typeof uid !== "string") return false;
  const trimmed = uid.trim();
  return ADMIN_WHITELIST_UIDS.some((adminUid) => adminUid === trimmed);
}

export interface UserLike {
  id?: string | null;
  email?: string | null;
  role?: string | null;
  app_metadata?: { role?: string; claims_admin?: boolean; [key: string]: any } | null;
  user_metadata?: { role?: string; is_admin?: boolean; [key: string]: any } | null;
  [key: string]: any;
}

export interface ProfileLike {
  id?: string | null;
  role?: string | null;
  is_admin?: boolean | null;
  [key: string]: any;
}

/**
 * Authoritatively evaluates whether a user holds administrator privileges.
 * Comprehensively verifies:
 * 1. Admin Email Whitelist (e.g. avaatdesigns.info@gmail.com)
 * 2. Admin UID Whitelist (e.g. 8ccd5c84-1b51-4bed-a3b7-7727387cbaa2)
 * 3. Supabase Auth app_metadata: user?.app_metadata?.role === 'admin'
 * 4. Supabase Auth user_metadata: user?.user_metadata?.role === 'admin'
 * 5. Database Profile Record: profile?.role === 'admin' || profile?.is_admin === true
 * 6. Direct User Role: user?.role === 'admin'
 */
export function isUserAdmin(
  user?: UserLike | null,
  profile?: ProfileLike | null
): boolean {
  if (!user && !profile) return false;

  // 1. Admin Email Whitelist
  if (user?.email && isAdminEmail(user.email)) return true;
  if ((profile as any)?.email && isAdminEmail((profile as any).email)) return true;

  // 2. Admin UID Whitelist
  if (user?.id && isAdminUid(user.id)) return true;
  if (profile?.id && isAdminUid(profile.id)) return true;

  // 3. Supabase Auth app_metadata check
  if (
    user?.app_metadata?.role === "admin" ||
    user?.app_metadata?.claims_admin === true
  ) {
    return true;
  }

  // 4. Supabase Auth user_metadata check
  if (
    user?.user_metadata?.role === "admin" ||
    user?.user_metadata?.is_admin === true
  ) {
    return true;
  }

  // 5. Database Profile Table Field Check (role column or is_admin boolean)
  if (
    profile?.role === "admin" ||
    profile?.is_admin === true
  ) {
    return true;
  }

  // 6. Direct User Role Attribute (e.g. local session or hydrated user object)
  if (user?.role === "admin") {
    return true;
  }

  return false;
}

/**
 * Resolves the normalized role string ('admin' | 'user') for a given user & profile.
 */
export function resolveUserRole(
  user?: UserLike | null,
  profile?: ProfileLike | null
): "admin" | "user" {
  return isUserAdmin(user, profile) ? "admin" : "user";
}

