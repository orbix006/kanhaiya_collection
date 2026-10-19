import { redirect } from "next/navigation";

export default function AdminOffersPage() {
  redirect("/admin/cms/homepage?tab=offers");
}
