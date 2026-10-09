import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Safe fallback client when Supabase is not configured yet
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: "Supabase credentials are not configured yet." } }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "Supabase credentials are not configured yet." } }),
        signOut: async () => ({ error: null }),
        resetPasswordForEmail: async () => ({ data: {}, error: { message: "Supabase credentials are not configured yet." } }),
        updateUser: async () => ({ data: { user: null }, error: { message: "Supabase credentials are not configured yet." } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            order: () => ({
              order: async () => ({ data: [], error: null }),
            }),
          }),
          order: () => ({
            order: async () => ({ data: [], error: null }),
          }),
        }),
        insert: async () => ({ data: null, error: { message: "Supabase credentials not configured." } }),
        update: () => ({
          eq: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
        }),
        delete: () => ({
          eq: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createServerClient<Database>>;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
}
