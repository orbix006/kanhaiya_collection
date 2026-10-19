import { redirect } from "next/navigation";

export default function AdminBannersPage() {
  redirect("/admin/cms/homepage?tab=hero");
}
