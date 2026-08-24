import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-20 flex flex-col items-center justify-center text-center space-y-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">403 — Access Denied</h1>
        <p className="max-w-md text-muted-foreground text-sm">
          You do not have administrator permissions to access this page.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Return to Homepage
      </Link>
    </div>
  );
}
