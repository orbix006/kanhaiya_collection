import type { Metadata } from "next";
import { getUserCart, getCartUserId } from "@/lib/data/cart";
import { CartView } from "@/components/cart/cart-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shopping Bag | Kanhaiya Collection",
  description: "View and manage sacred items in your Kanhaiya Collection shopping bag.",
};

export default async function CartPage() {
  const userId = await getCartUserId();
  const cart = await getUserCart(userId);

  return (
    <main className="min-h-screen bg-[#FFFDF7] py-6 sm:py-10">
      <CartView initialCart={cart} />
    </main>
  );
}
