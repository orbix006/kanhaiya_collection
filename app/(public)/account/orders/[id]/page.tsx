import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getOrderById } from "@/lib/data/orders";
import { OrderDetailView } from "@/components/account/order-detail-view";

export const dynamic = "force-dynamic";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: OrderDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const isJustConfirmed = sp.confirmed === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (isConfigured && !user) {
    redirect(`/login?redirect=/account/orders/${id}`);
  }

  const userId = user?.id || "demo-user-id";
  const order = await getOrderById(id, userId);

  if (!order) {
    notFound();
  }

  return (
    <OrderDetailView
      order={order}
      isJustConfirmed={isJustConfirmed}
    />
  );
}
