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

export function getLocalUsers(): LocalUser[] {
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
    },
    {
      id: "8ccd5c84-1b51-4bed-a3b7-7727387cbaa2",
      email: "avaatdesigns.info@gmail.com",
      fullName: "Avaat Designs Admin",
    },
  ];

  const users = getLocalUsers();
  let modified = false;

  for (const admin of admins) {
    const existing = users.find(
      (u) =>
        u.email.toLowerCase() === admin.email.toLowerCase() ||
        u.id === admin.id
    );

    if (!existing) {
      const { hash, salt } = hashPassword("AdminPreviewPass2026!");
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
    } else if (existing.role !== "admin") {
      existing.role = "admin";
      existing.updated_at = new Date().toISOString();
      modified = true;
    }
  }

  if (modified) {
    saveLocalUsers(users);
  }
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
