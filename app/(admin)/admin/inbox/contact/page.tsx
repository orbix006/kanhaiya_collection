import { redirect } from "next/navigation";

export default function AdminContactInboxPage() {
  redirect("/admin/inbox?tab=contact");
}
