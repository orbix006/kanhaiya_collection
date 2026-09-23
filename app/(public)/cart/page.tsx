import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserCart } from "@/lib/data/cart";
import { CartView } from "@/components/cart/cart-view";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (isConfigured && !user) {
    redirect("/login?redirect=/cart");
  }

  const userId = user?.id || "demo-user-id";
  const cart = await getUserCart(userId);

  return <CartView initialCart={cart} />;
}
