import { getPublicPolicy } from "@/lib/data/cms";
import { PolicyView } from "@/components/public/policy-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Terms of Service | Kanhaiya Collection",
  description: "Terms and conditions of service for Kanhaiya Collection purchases, sacred idol craftsmanship, and orders.",
};

export default async function TermsPage() {
  const policy = await getPublicPolicy("terms");
  return <PolicyView policy={policy} />;
}
