import type { Metadata } from "next";
import { getPublicPolicy } from "@/lib/data/cms";
import { PolicyView } from "@/components/public/policy-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Return & Refund Policy | Kanhaiya Collection",
  description: "7-day easy return, replacement, and refund guidelines for Kanhaiya Collection purchases.",
  alternates: {
    canonical: "/return",
  },
};

export default async function ReturnPolicyPage() {
  const policy = await getPublicPolicy("return");
  return <PolicyView policy={policy} />;
}
