import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getAllActiveCategories } from "@/lib/data/homepage";
import { getUserCartCount } from "@/lib/data/cart";

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
  let cartCount = 0;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = profileData;

    cartCount = await getUserCartCount(user.id);
  } else {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";
    if (!isConfigured) {
      cartCount = await getUserCartCount("demo-user-id");
    }
  }

  const categories = await getAllActiveCategories();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header
        user={user}
        profile={profile}
        categories={categories}
        cartCount={cartCount}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
