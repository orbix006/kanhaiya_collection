import { getPublicPolicy } from "@/lib/data/cms";
import { PolicyView } from "@/components/public/policy-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shipping & Delivery Policy | Kanhaiya Collection",
  description: "Shipping timelines, free shipping thresholds, and domestic carrier delivery policies.",
};

export default async function ShippingPolicyPage() {
  const policy = await getPublicPolicy("shipping");
  return <PolicyView policy={policy} />;
}
