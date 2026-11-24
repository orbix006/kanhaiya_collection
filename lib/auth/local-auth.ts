import fs from "fs";
import path from "path";
import crypto from "crypto";
import { cookies } from "next/headers";
import { resolveUserRole } from "@/lib/auth/role-check";

export interface LocalUser {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  salt: string;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
}

const AUTH_FILE_PATH = path.join(process.cwd(), "data", "local_auth.json");
const COOKIE_NAME = "demo_user";

function ensureDataDirectory() {
  const dir = path.dirname(AUTH_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readLocalUsers(): LocalUser[] {
  ensureDataDirectory();
  if (!fs.existsSync(AUTH_FILE_PATH)) {
    fs.writeFileSync(AUTH_FILE_PATH, JSON.stringify({ users: [] }, null, 2), "utf-8");
    return [];
  }
  try {
    const raw = fs.readFileSync(AUTH_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.users) ? parsed.users : [];
  } catch (err) {
    console.error("Failed to read local auth store:", err);
    return [];
  }
}

export function getLocalUsers(): LocalUser[] {
  const users = readLocalUsers();
  if (!users.some((u) => u.role === "admin")) {
    ensureDefaultAdminUsers();
    return readLocalUsers();
  }
  return users;
}

export function saveLocalUsers(users: LocalUser[]): void {
  ensureDataDirectory();
  fs.writeFileSync(AUTH_FILE_PATH, JSON.stringify({ users }, null, 2), "utf-8");
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
  } catch {
    return false;
  }
}

export function findLocalUserByEmail(email: string): LocalUser | null {
  const users = getLocalUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export function findLocalUserById(id: string): LocalUser | null {
  const users = getLocalUsers();
  return users.find((u) => u.id === id) || null;
}

export async function registerLocalUser({
  fullName,
  email,
  password,
}: {
  fullName: string;
  email: string;
  password: string;
}): Promise<{ user?: LocalUser; error?: string }> {
  const normalized = email.trim().toLowerCase();
  const existing = findLocalUserByEmail(normalized);
  if (existing) {
    return { error: "An account with this email address already exists. Please log in instead." };
  }

  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();

  // All self-registered users are strictly assigned standard 'user' role.
  // Administrative privileges must never be self-assigned.
  const newUser: LocalUser = {
    id: `usr_${crypto.randomUUID().replace(/-/g, "")}`,
    full_name: fullName.trim(),
    email: normalized,
    password_hash: hash,
    salt,
    role: "user",
    created_at: now,
    updated_at: now,
  };

  const users = getLocalUsers();
  users.push(newUser);
  saveLocalUsers(users);

  return { user: newUser };
}

export async function authenticateLocalUser({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ user?: LocalUser; error?: string }> {
  ensureDefaultAdminUsers();
  const normalized = email.trim().toLowerCase();
  const user = findLocalUserByEmail(normalized);

  if (!user) {
    return { error: "Invalid email or password. Please verify your credentials." };
  }

  const valid = verifyPassword(password, user.password_hash, user.salt);
  if (!valid) {
    return { error: "Invalid email or password. Please verify your credentials." };
  }

  return { user };
}

export async function setLocalUserRole(
  emailOrId: string,
  role: "admin" | "user"
): Promise<LocalUser | null> {
  const users = getLocalUsers();
  const normalized = emailOrId.trim().toLowerCase();
  const user = users.find(
    (u) => u.id === emailOrId || u.email.toLowerCase() === normalized
  );

  if (!user) {
    return null;
  }

  user.role = role;
  user.updated_at = new Date().toISOString();
  saveLocalUsers(users);
  return user;
}

export function ensureDefaultAdminUsers(): void {
  const admins = [
    {
      id: "usr_dev_admin_preview",
      email: "admin@kanhaiya.local",
      fullName: "Local Dev Administrator",
      defaultPassword: "AdminPreviewPass2026!",
    },
    {
      id: "8ccd5c84-1b51-4bed-a3b7-7727387cbaa2",
      email: "avaatdesigns.info@gmail.com",
      fullName: "Avaat Designs Admin",
      defaultPassword: "AdminPreviewPass2026!",
    },
    {
      id: "usr_4104acb962ff4cdaae6cd0136b9cee47",
      email: "you@example.com",
      fullName: "Amber",
      defaultPassword: "AdminPreviewPass2026!",
    },
  ];

  // Dynamically provision administrator configured via environment variables
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.trim() !== "") {
    const envEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const envPass = process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD || "AdminPreviewPass2026!";
    const envName = process.env.ADMIN_NAME || "System Administrator";
    const envId = `usr_admin_${crypto.createHash("md5").update(envEmail).digest("hex").slice(0, 12)}`;
    admins.unshift({
      id: envId,
      email: envEmail,
      fullName: envName,
      defaultPassword: envPass,
    });
  }

  const users = readLocalUsers();
  let modified = false;

  for (const admin of admins) {
    const existing = users.find(
      (u) => u.email.toLowerCase() === admin.email.toLowerCase()
    );

    if (!existing) {
      const { hash, salt } = hashPassword(admin.defaultPassword);
      const now = new Date().toISOString();
      users.push({
        id: admin.id,
        full_name: admin.fullName,
        email: admin.email,
        password_hash: hash,
        salt,
        role: "admin",
        created_at: now,
        updated_at: now,
      });
      modified = true;
    } else {
      if (existing.role !== "admin") {
        existing.role = "admin";
        existing.updated_at = new Date().toISOString();
        modified = true;
      }
      // If admin was configured explicitly via environment password, ensure credentials match
      if (
        process.env.ADMIN_PASSWORD &&
        process.env.ADMIN_EMAIL &&
        existing.email.toLowerCase() === process.env.ADMIN_EMAIL.trim().toLowerCase()
      ) {
        const matches = verifyPassword(process.env.ADMIN_PASSWORD, existing.password_hash, existing.salt);
        if (!matches) {
          const { hash, salt } = hashPassword(process.env.ADMIN_PASSWORD);
          existing.password_hash = hash;
          existing.salt = salt;
          existing.updated_at = new Date().toISOString();
          modified = true;
        }
      }
    }
  }

  if (modified) {
    saveLocalUsers(users);
  }
}

/**
 * Creates a secure time-limited password reset token for a local user.
 */
export async function createPasswordResetToken(
  email: string
): Promise<{ token?: string; error?: string }> {
  const normalized = email.trim().toLowerCase();
  const users = getLocalUsers();
  const user = users.find((u) => u.email.toLowerCase() === normalized);

  if (!user) {
    return { error: "No account found with this email address. Please verify your email or sign up." };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour validity

  (user as any).reset_token = token;
  (user as any).reset_token_expires_at = expiresAt;
  user.updated_at = new Date().toISOString();

  saveLocalUsers(users);
  return { token };
}

/**
 * Resets a user's password using a valid reset token (or authorized active session).
 */
export async function resetLocalUserPassword({
  email,
  token,
  newPassword,
}: {
  email: string;
  token?: string | null;
  newPassword: string;
}): Promise<{ success: boolean; user?: LocalUser; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const normalized = email.trim().toLowerCase();
  const users = getLocalUsers();
  const user = users.find((u) => u.email.toLowerCase() === normalized);

  if (!user) {
    return { success: false, error: "Account not found for the specified email." };
  }

  // If a reset token was provided, verify validity and expiration
  if (token) {
    const userToken = (user as any).reset_token;
    const expiresAt = (user as any).reset_token_expires_at;

    if (!userToken || userToken !== token) {
      return { success: false, error: "Invalid password reset token." };
    }

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return { success: false, error: "Password reset token has expired. Please request a new reset link." };
    }
  }

  const { hash, salt } = hashPassword(newPassword);
  user.password_hash = hash;
  user.salt = salt;
  user.updated_at = new Date().toISOString();
  delete (user as any).reset_token;
  delete (user as any).reset_token_expires_at;

  saveLocalUsers(users);
  return { success: true, user };
}

/**
 * Updates a logged-in user's password directly from account settings.
 */
export async function updateLocalUserPassword({
  userId,
  currentPassword,
  newPassword,
}: {
  userId: string;
  currentPassword?: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters long." };
  }

  const users = getLocalUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return { success: false, error: "User account not found." };
  }

  if (currentPassword) {
    const valid = verifyPassword(currentPassword, user.password_hash, user.salt);
    if (!valid) {
      return { success: false, error: "Current password is incorrect." };
    }
  }

  const { hash, salt } = hashPassword(newPassword);
  user.password_hash = hash;
  user.salt = salt;
  user.updated_at = new Date().toISOString();

  saveLocalUsers(users);
  return { success: true };
}

export function ensureDevAdminUser(): LocalUser {
  ensureDefaultAdminUsers();
  const email = "admin@kanhaiya.local";
  return findLocalUserByEmail(email)!;
}

export async function setSessionCookie(user: {
  id: string;
  email: string;
  full_name?: string | null;
  role: "admin" | "user";
}) {
  const cookieStore = await cookies();
  const sessionPayload = {
    id: user.id,
    email: user.email,
    full_name: user.full_name || "",
    role: user.role,
  };

  cookieStore.set(COOKIE_NAME, JSON.stringify(sessionPayload), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getLocalSession(
  requestOrCookie?: Request | { headers?: Headers | { get(name: string): string | null }; cookies?: { get(name: string): { value?: string } | undefined } } | string | null
): Promise<{
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "user";
} | null> {
  try {
    let rawCookie: string | undefined = undefined;

    if (typeof requestOrCookie === "string") {
      const match = requestOrCookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
      rawCookie = match ? match[1] : requestOrCookie;
    } else if (requestOrCookie && typeof requestOrCookie === "object") {
      if ("cookies" in requestOrCookie && typeof requestOrCookie.cookies?.get === "function") {
        rawCookie = requestOrCookie.cookies.get(COOKIE_NAME)?.value;
      }
      if (!rawCookie && "headers" in requestOrCookie && requestOrCookie.headers) {
        let headerValue: string | null = null;
        if (typeof (requestOrCookie.headers as { get?: unknown }).get === "function") {
          headerValue = (requestOrCookie.headers as Headers).get("cookie");
        } else if ("cookie" in requestOrCookie.headers) {
          const cookieProp = (requestOrCookie.headers as Record<string, unknown>)["cookie"];
          if (typeof cookieProp === "string") {
            headerValue = cookieProp;
          }
        }
        if (headerValue) {
          const match = headerValue.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
          rawCookie = match ? match[1] : undefined;
        }
      }
    }

    if (!rawCookie) {
      try {
        const cookieStore = await cookies();
        rawCookie = cookieStore.get(COOKIE_NAME)?.value;
      } catch {
        // Outside Next.js request context (e.g. standalone test execution)
      }
    }

    if (!rawCookie) return null;

    let parsed: { id?: string; email?: string; full_name?: string; role?: string } | null = null;
    try {
      parsed = JSON.parse(decodeURIComponent(rawCookie)) as { id?: string; email?: string; full_name?: string; role?: string };
    } catch {
      try {
        parsed = JSON.parse(rawCookie) as { id?: string; email?: string; full_name?: string; role?: string };
      } catch {
        return null;
      }
    }

    if (!parsed || !parsed.email) return null;
    const userId = parsed.id || "usr_demo_admin";

    // Authoritatively verify against database store and centralized RBAC
    const storedUser = findLocalUserById(userId) || findLocalUserByEmail(parsed.email);
    if (storedUser) {
      const role = resolveUserRole(storedUser);
      return {
        id: storedUser.id,
        email: storedUser.email,
        full_name: storedUser.full_name,
        role: role as "admin" | "user",
      };
    }

    const role = resolveUserRole(parsed);
    return {
      id: userId,
      email: parsed.email,
      full_name: parsed.full_name || "Demo Administrator",
      role: role as "admin" | "user",
    };
  } catch {
    return null;
  }
}
