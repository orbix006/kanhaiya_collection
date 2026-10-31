import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getLocalSession } from "@/lib/auth/local-auth";
import { resolveUserRole } from "@/lib/auth/role-check";
import { getActiveCategories } from "@/lib/store";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BrandStatement } from "@/components/layout/brand-statement";
import { LocationProvider } from "@/components/layout/location-context";
import { LocationModal } from "@/components/layout/location-modal";
import { WhatsAppStickyButton } from "@/components/layout/whatsapp-sticky-button";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: { email?: string; id?: string; role?: string } | null = null;
  let profile: { full_name: string | null; avatar_url: string | null; role?: string } | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();

      if (supabaseUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, role")
          .eq("id", supabaseUser.id)
          .single();

        const role = resolveUserRole(supabaseUser, profileData);
        user = { id: supabaseUser.id, email: supabaseUser.email, role };
        profile = {
          full_name:
            profileData?.full_name ||
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.email ||
            "Account",
          avatar_url:
            profileData?.avatar_url ||
            supabaseUser.user_metadata?.avatar_url ||
            null,
          role,
        };
      }
    } catch {
      user = null;
      profile = null;
    }
  } else {
    const session = await getLocalSession();
    if (session) {
      const role = resolveUserRole(session);
      user = { id: session.id, email: session.email, role };
      profile = {
        full_name: session.full_name,
        avatar_url: null,
        role,
      };
    }
  }

  let categories: any[] = [];
  try {
    const fetched = await getActiveCategories();
    categories = Array.isArray(fetched) ? fetched : [];
  } catch {
    categories = [];
  }

  return (
    <LocationProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Header user={user} profile={profile} categories={categories} />
        <main className="flex-1">{children}</main>
        {/* Dedicated Visual Brand Section Immediately Before Footer */}
        <BrandStatement />
        <Footer />
        <LocationModal />
        {/* Floating WhatsApp CTA */}
        <WhatsAppStickyButton />
      </div>
    </LocationProvider>
  );
}
