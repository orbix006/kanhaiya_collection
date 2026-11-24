import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getLocalSession } from "@/lib/auth/local-auth";
import { isUserAdmin } from "@/lib/auth/role-check";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminRoute } from "@/components/admin/admin-route";

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

      // Query authoritative database record from public.profiles
      let dbProfile: any = null;
      const { data: prof1, error: err1 } = await supabase
        .from("profiles")
        .select("id, full_name, role, avatar_url")
        .eq("id", user.id)
        .single();

      if (!err1 && prof1) {
        dbProfile = prof1;
      } else {
        const { data: prof2 } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        dbProfile = prof2 || null;
      }

      const profileData = dbProfile;
      const isAdmin = isUserAdmin(user, profileData);

      // Enforce strict RBAC: allow access only if role === 'admin'
      if (!isAdmin || (profileData && profileData.role !== "admin" && !isAdmin)) {
        redirect("/403");
      }

      userEmail = dbProfile?.email || user.email || "";
      profile = {
        full_name:
          dbProfile?.full_name ||
          user.user_metadata?.full_name ||
          user.email ||
          "Administrator",
        role: "admin",
        avatar_url:
          dbProfile?.avatar_url ||
          user.user_metadata?.avatar_url ||
          null,
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
    if (!isUserAdmin(session)) {
      redirect("/403");
    }

    userEmail = session.email;
    profile = {
      full_name: session.full_name || session.email || "Demo Administrator",
      role: "admin",
      avatar_url: null,
    };
  }

  return (
    <AdminRoute userEmail={userEmail} role={profile.role}>
      <AdminShell userEmail={userEmail} profile={profile}>
        {children}
      </AdminShell>
    </AdminRoute>
  );
}
