import { getPublicPolicy } from "@/lib/data/cms";
import { PolicyView } from "@/components/public/policy-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacy Policy | Kanhaiya Collection",
  description: "Privacy policy and data protection principles for Kanhaiya Collection.",
};

export default async function PrivacyPolicyPage() {
  const policy = await getPublicPolicy("privacy");
  return <PolicyView policy={policy} />;
}
