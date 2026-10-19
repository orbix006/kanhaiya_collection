import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getLocalSession } from "@/lib/auth/local-auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail = "";
  let profile: {
    full_name?: string | null;
    avatar_url?: string | null;
    role?: string;
  } = {
    full_name: "Administrator",
    role: "admin",
    avatar_url: null,
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirect("/login?redirect=/admin");
      }

      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("role, full_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (!dbProfile || dbProfile.role !== "admin") {
        redirect("/403");
      }

      userEmail = user.email || "";
      profile = {
        full_name: dbProfile.full_name || user.email || "Administrator",
        role: dbProfile.role,
        avatar_url: dbProfile.avatar_url || null,
      };
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.includes("NEXT_REDIRECT")) {
        throw err;
      }
      redirect("/login?redirect=/admin");
    }
  } else {
    // Local / Offline development authorization check
    const session = await getLocalSession();
    if (!session) {
      redirect("/login?redirect=/admin");
    }
    if (session.role !== "admin") {
      redirect("/403");
    }

    userEmail = session.email;
    profile = {
      full_name: session.full_name || session.email || "Demo Administrator",
      role: session.role,
      avatar_url: null,
    };
  }

  return (
    <AdminShell userEmail={userEmail} profile={profile}>
      {children}
    </AdminShell>
  );
}
