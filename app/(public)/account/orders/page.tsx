import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserOrders } from "@/lib/data/orders";
import { OrdersList } from "@/components/account/orders-list";

export const dynamic = "force-dynamic";

export default async function CustomerOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (isConfigured && !user) {
    redirect("/login?redirect=/account/orders");
  }

  const userId = user?.id || "demo-user-id";
  const orders = await getUserOrders(userId);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
      <OrdersList orders={orders} />
    </div>
  );
}
