import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminOrderById } from "@/lib/data/orders";
import { OrderDetailView } from "@/components/admin/orders/order-detail-view";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const order = await getAdminOrderById(id);

  if (!order) {
    return { title: "Order Not Found | Admin Dashboard" };
  }

  return {
    title: `Order ${order.order_number} | Admin Operations`,
    description: `Inspect immutable item and address snapshots, customer information, and manage status transitions for order #${order.order_number}.`,
  };
}

export default async function AdminOrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getAdminOrderById(id);

  if (!order) {
    notFound();
  }

  return <OrderDetailView order={order} />;
}
