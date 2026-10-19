import { redirect } from "next/navigation";

export default function AdminLeadsInboxPage() {
  redirect("/admin/inbox?tab=leads");
}
