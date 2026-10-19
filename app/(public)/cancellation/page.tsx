import { getPublicPolicy } from "@/lib/data/cms";
import { PolicyView } from "@/components/public/policy-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cancellation Policy | Kanhaiya Collection",
  description: "Review order cancellation windows, dispatch guidelines, and refund terms for Kanhaiya Collection orders.",
};

export default async function CancellationPolicyPage() {
  const policy = await getPublicPolicy("cancellation");
  return <PolicyView policy={policy} />;
}
