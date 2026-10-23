import type { Metadata } from "next";
import { getPublicPolicy } from "@/lib/data/cms";
import { PolicyView } from "@/components/public/policy-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy | Kanhaiya Collection",
  description: "Learn how Kanhaiya Collection handles, protects, and stores customer personal data.",
  alternates: {
    canonical: "/privacy",
  },
};

export default async function PrivacyPolicyPage() {
  const policy = await getPublicPolicy("privacy");
  return <PolicyView policy={policy} />;
}
