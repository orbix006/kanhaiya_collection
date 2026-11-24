import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getLocalSession } from "@/lib/auth/local-auth";
import { redirect } from "next/navigation";
import { AddressManager, AddressItem } from "@/components/account/address-manager";

export const dynamic = "force-dynamic";

export default async function AddressBookPage() {
  let user: { id: string; email: string } | null = null;
  let addresses: AddressItem[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        user = { id: authUser.id, email: authUser.email || "" };
        const { data: dbAddresses } = await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", authUser.id)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: false });
        addresses = (dbAddresses as unknown as AddressItem[]) || [];
      }
    } catch {
      user = null;
    }
  } else {
    const session = await getLocalSession();
    if (session) {
      user = { id: session.id, email: session.email };
    }
  }

  if (!user) {
    redirect("/login?redirect=/account/addresses");
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <AddressManager addresses={addresses} />
    </div>
  );
}
