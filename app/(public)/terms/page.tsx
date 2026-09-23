import { getPublicPolicy } from "@/lib/data/cms";
import { PolicyView } from "@/components/public/policy-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Terms of Service | Kanhaiya Collection",
  description: "Terms and conditions governing orders and catalog use at Kanhaiya Collection.",
};

export default async function TermsPolicyPage() {
  const policy = await getPublicPolicy("terms");
  return <PolicyView policy={policy} />;
}
