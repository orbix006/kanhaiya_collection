import type { Metadata } from "next";
import { TrackOrderView } from "@/components/order/track-order-view";
import { trackOrderLookupAction } from "./actions";
import { trackPublicOrder } from "@/lib/data/orders";
import type { OrderDetails } from "@/lib/data/order-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track Your Order | Kanhaiya Collection",
  description:
    "Track your Kanhaiya Collection handcrafted idols and sacred couture orders through packaging, dispatch, and delivery milestones.",
};

interface TrackPageProps {
  searchParams: Promise<{
    order?: string;
    phone?: string;
    email?: string;
  }>;
}

export default async function TrackOrderPage({ searchParams }: TrackPageProps) {
  const resolvedParams = await searchParams;
  const initialOrderNumber = resolvedParams?.order || "";
  const initialContact = resolvedParams?.phone || resolvedParams?.email || "";

  let initialOrder: OrderDetails | null = null;
  if (initialOrderNumber && initialContact) {
    try {
      initialOrder = await trackPublicOrder(initialOrderNumber, initialContact);
    } catch {
      initialOrder = null;
    }
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <TrackOrderView
        initialOrder={initialOrder}
        initialOrderNumber={initialOrderNumber}
        initialContact={initialContact}
        onTrackLookupAction={trackOrderLookupAction}
      />
    </div>
  );
}
