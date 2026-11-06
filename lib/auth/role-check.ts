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
 * Kept for test utility backward compatibility.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_WHITELIST_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
}

/**
 * Checks whether a user ID matches an authorized administrator UID.
 * Kept for test utility backward compatibility.
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
  [key: string]: any;
}

export interface ProfileLike {
  id?: string | null;
  role?: string | null;
  [key: string]: any;
}

/**
 * Authoritatively evaluates whether a user holds administrator privileges.
 * Directly inspects the authoritative database role from public.users:
 * 1. Checks profile?.role === 'admin' (database users record role)
 * 2. Checks user?.role === 'admin' (database users record role mapped to user object)
 */
export function isUserAdmin(
  user?: UserLike | null,
  profile?: ProfileLike | null
): boolean {
  if (!user && !profile) return false;

  // 1. Authoritative Database public.users record role
  if (profile?.role === "admin") {
    return true;
  }

  // 2. Direct User role attribute from public.users record / session
  if (user?.role === "admin") {
    return true;
  }

  return false;
}

/**
 * Resolves the normalized role string ('admin' | 'user') for a given user & profile.
 * Defaults strictly to 'user' if role is not 'admin'.
 */
export function resolveUserRole(
  user?: UserLike | null,
  profile?: ProfileLike | null
): "admin" | "user" {
  return isUserAdmin(user, profile) ? "admin" : "user";
}


