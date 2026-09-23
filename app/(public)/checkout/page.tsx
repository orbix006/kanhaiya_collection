import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserCart } from "@/lib/data/cart";
import { CheckoutView } from "@/components/checkout/checkout-view";
import type { AddressItem } from "@/components/account/address-manager";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (isConfigured && !user) {
    redirect("/login?redirect=/checkout");
  }

  const userId = user?.id || "demo-user-id";

  // 1. Fetch current cart
  const cart = await getUserCart(userId);
  if (cart.items.length === 0) {
    redirect("/cart");
  }

  // 2. Fetch user's saved addresses
  let savedAddresses: AddressItem[] = [];

  if (isConfigured && user) {
    const { data: addresses } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    savedAddresses = (addresses as AddressItem[]) || [];
  }

  return (
    <CheckoutView
      cart={cart}
      savedAddresses={savedAddresses}
      userEmail={user?.email || "customer@example.com"}
    />
  );
}
