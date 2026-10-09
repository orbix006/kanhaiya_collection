import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null; avatar_url: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
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
