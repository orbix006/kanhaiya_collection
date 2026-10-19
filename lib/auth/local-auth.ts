import fs from "fs";
import path from "path";
import crypto from "crypto";
import { cookies } from "next/headers";

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

export function ensureDevAdminUser(): LocalUser {
  const email = "admin@kanhaiya.local";
  let user = findLocalUserByEmail(email);
  if (!user) {
    const { hash, salt } = hashPassword("AdminPreviewPass2026!");
    const now = new Date().toISOString();
    user = {
      id: "usr_dev_admin_preview",
      full_name: "Local Dev Administrator",
      email: email,
      password_hash: hash,
      salt,
      role: "admin",
      created_at: now,
      updated_at: now,
    };
    const users = getLocalUsers();
    users.push(user);
    saveLocalUsers(users);
  } else if (user.role !== "admin") {
    user.role = "admin";
    user.updated_at = new Date().toISOString();
    const users = getLocalUsers();
    const idx = users.findIndex((u) => u.email === email);
    if (idx !== -1) users[idx] = user;
    saveLocalUsers(users);
  }
  return user;
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

export async function getLocalSession(): Promise<{
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "user";
} | null> {
  try {
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(COOKIE_NAME)?.value;
    if (!rawCookie) return null;

    let parsed: any = null;
    try {
      parsed = JSON.parse(decodeURIComponent(rawCookie));
    } catch {
      try {
        parsed = JSON.parse(rawCookie);
      } catch {
        return null;
      }
    }

    if (!parsed || !parsed.email) return null;
    const userId = parsed.id || "usr_demo_admin";

    // Authoritatively verify against database store so role changes are immediate
    const storedUser = findLocalUserById(userId) || findLocalUserByEmail(parsed.email);
    if (storedUser) {
      return {
        id: storedUser.id,
        email: storedUser.email,
        full_name: storedUser.full_name,
        role: storedUser.role,
      };
    }

    return {
      id: userId,
      email: parsed.email,
      full_name: parsed.full_name || "Demo Administrator",
      role: parsed.role === "admin" ? "admin" : "user",
    };
  } catch {
    return null;
  }
}
