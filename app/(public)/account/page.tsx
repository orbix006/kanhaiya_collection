import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getLocalSession, findLocalUserById, findLocalUserByEmail } from "@/lib/auth/local-auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/profile-form";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  let user: { id: string; email: string } | null = null;
  let profile: {
    id: string;
    full_name?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    role?: string;
  } | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        user = { id: authUser.id, email: authUser.email || "" };
        const { data: prof } = await supabase
          .from("profiles")
          .select("id, full_name, phone, avatar_url, role")
          .eq("id", authUser.id)
          .single();
        profile = prof;
      }
    } catch {
      user = null;
    }
  } else {
    const session = await getLocalSession();
    if (session) {
      user = { id: session.id, email: session.email };
      const localUser = findLocalUserById(session.id) || findLocalUserByEmail(session.email);
      profile = {
        id: session.id,
        full_name: localUser?.full_name || session.full_name,
        phone: (localUser as any)?.phone || "",
        avatar_url: (localUser as any)?.avatar_url || null,
        role: session.role,
      };
    }
  }

  if (!user) {
    redirect("/login?redirect=/account");
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <ProfileForm
        userId={user.id}
        email={user.email || ""}
        fullName={profile?.full_name || ""}
        phone={profile?.phone || ""}
        avatarUrl={profile?.avatar_url || null}
        role={profile?.role || "user"}
      />
    </div>
  );
}
