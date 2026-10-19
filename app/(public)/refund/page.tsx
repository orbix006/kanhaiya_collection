import { getPublicPolicy } from "@/lib/data/cms";
import { PolicyView } from "@/components/public/policy-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Refund Policy | Kanhaiya Collection",
  description: "Learn about Kanhaiya Collection's 7-day refund commitment, inspection criteria, and payment processing timelines.",
};

export default async function RefundPolicyPage() {
  const policy = await getPublicPolicy("refund");
  return <PolicyView policy={policy} />;
}
