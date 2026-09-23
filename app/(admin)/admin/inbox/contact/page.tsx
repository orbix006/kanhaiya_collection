import { getContactSubmissionsAdmin } from "@/lib/data/cms";
import { ContactInbox } from "@/components/admin/inbox/contact-inbox";
import { MessageSquare, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminContactInboxPage() {
  const submissions = await getContactSubmissionsAdmin();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Customer Communications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Contact Submissions Inbox
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Review, inspect, and update customer inquiries submitted through the public Contact Us form.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span>{submissions.length} total messages</span>
        </div>
      </div>

      <ContactInbox initialSubmissions={submissions} />
    </div>
  );
}
