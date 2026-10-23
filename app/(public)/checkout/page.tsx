import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocalSession } from "@/lib/auth/local-auth";
import { getUserCart } from "@/lib/data/cart";
import { CheckoutView } from "@/components/checkout/checkout-view";
import type { AddressItem } from "@/components/account/address-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Secure Checkout | Kanhaiya Collection",
  description: "Complete your sacred order securely with Kanhaiya Collection.",
};

export default async function CheckoutPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isConfigured =
    Boolean(supabaseUrl) &&
    supabaseUrl !== "https://placeholder-project.supabase.co" &&
    supabaseUrl?.startsWith("http");

  let userEmail = "customer@example.com";
  let userId = "demo-user-id";
  let savedAddresses: AddressItem[] = [];

  if (isConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?redirect=/checkout");
    }

    userId = user.id;
    userEmail = user.email || "customer@example.com";

    const { data: addressRows } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    savedAddresses = (addressRows as AddressItem[]) || [];
  } else {
    // Local / development mode
    const localSession = await getLocalSession();
    if (!localSession) {
      redirect("/login?redirect=/checkout");
    }
    userId = localSession.id;
    userEmail = localSession.email;
  }

  const cart = await getUserCart(userId);

  // If cart is empty, redirect back to cart
  if (cart.items.length === 0) {
    redirect("/cart");
  }

  return (
    <main className="min-h-screen bg-[#FFFDF7] py-6 sm:py-10">
      <CheckoutView
        cart={cart}
        savedAddresses={savedAddresses}
        userEmail={userEmail}
      />
    </main>
  );
}
