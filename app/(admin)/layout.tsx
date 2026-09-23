import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  let user = null;
  let profile: { full_name: string | null; avatar_url: string | null; role?: string } | null = null;

  if (isConfigured) {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      redirect("/login?redirect=/admin");
    }
    user = authUser;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("role, full_name, avatar_url")
      .eq("id", authUser.id)
      .single();

    if (!profileData || profileData.role !== "admin") {
      redirect("/403");
    }
    profile = profileData;
  } else {
    // Initial development mode / offline fallback
    user = { email: "admin@kanhaiya.com" };
    profile = {
      full_name: "Kanhaiya Store Administrator",
      avatar_url: null,
      role: "admin",
    };
  }

  return (
    <AdminShell userEmail={user?.email} profile={profile}>
      {children}
    </AdminShell>
  );
}
