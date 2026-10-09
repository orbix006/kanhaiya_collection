import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      storage: {
        from: () => ({
          upload: async () => ({ data: null, error: { message: "Supabase credentials are not configured yet." } }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        }),
      },
    } as unknown as ReturnType<typeof createBrowserClient<Database>>;
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
}
