import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getLocalSession } from "@/lib/auth/local-auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BrandStatement } from "@/components/layout/brand-statement";
import { LocationProvider } from "@/components/layout/location-context";
import { LocationModal } from "@/components/layout/location-modal";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: { email?: string; id?: string } | null = null;
  let profile: { full_name: string | null; avatar_url: string | null; role?: string } | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();

      if (supabaseUser) {
        user = { id: supabaseUser.id, email: supabaseUser.email };
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, role")
          .eq("id", supabaseUser.id)
          .single();
        profile = profileData;
      }
    } catch {
      user = null;
      profile = null;
    }
  } else {
    const session = await getLocalSession();
    if (session) {
      user = { id: session.id, email: session.email };
      profile = {
        full_name: session.full_name,
        avatar_url: null,
        role: session.role,
      };
    }
  }

  return (
    <LocationProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Header user={user} profile={profile} />
        <main className="flex-1">{children}</main>
        {/* Dedicated Visual Brand Section Immediately Before Footer */}
        <BrandStatement />
        <Footer />
        <LocationModal />
      </div>
    </LocationProvider>
  );
}
