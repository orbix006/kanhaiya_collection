import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AddressManager, AddressItem } from "@/components/account/address-manager";

export default async function AddressBookPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account/addresses");
  }

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <AddressManager addresses={(addresses as AddressItem[]) || []} />
    </div>
  );
}
