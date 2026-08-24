import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/profile-form";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, avatar_url, role")
    .eq("id", user.id)
    .single();

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
