export default function HomePage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-primary text-primary-foreground">
          Phase 1.1 Active
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Project Scaffold Established
        </h1>
        <p className="max-w-2xl text-muted-foreground text-base">
          Next.js App Router, TypeScript, Tailwind CSS, and Supabase SSR are configured and ready.
        </p>
      </div>
    </div>
  );
}
