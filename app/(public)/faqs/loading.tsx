export default function FaqsLoading() {
  return (
    <div className="flex flex-col min-h-screen animate-pulse">
      {/* Hero Skeleton */}
      <section className="border-b border-border/60 bg-muted/20 py-16 sm:py-20">
        <div className="container mx-auto max-w-4xl px-4 text-center space-y-4">
          <div className="h-6 w-48 bg-muted rounded-full mx-auto" />
          <div className="h-10 w-3/4 bg-muted rounded-2xl mx-auto" />
          <div className="h-4 w-1/2 bg-muted/80 rounded-lg mx-auto" />
        </div>
      </section>

      {/* Main Skeleton */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto max-w-5xl px-4 space-y-8">
          {/* Search bar */}
          <div className="h-11 max-w-xl mx-auto rounded-2xl bg-muted/70" />

          {/* Category pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-muted/60" />
            ))}
          </div>

          {/* Accordion List */}
          <div className="max-w-3xl mx-auto space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-card border border-border/70" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
