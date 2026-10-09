import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Server-side admin verification when Supabase is configured
  if (supabaseUrl) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?redirect=/admin");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      redirect("/403");
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#3B2416] font-sans antialiased">
      {children}
    </div>
  );
}
