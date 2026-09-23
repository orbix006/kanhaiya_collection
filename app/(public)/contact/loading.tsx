export default function ContactLoading() {
  return (
    <div className="flex flex-col min-h-screen animate-pulse">
      {/* Header Skeleton */}
      <section className="border-b border-border/60 bg-muted/20 py-16 sm:py-20">
        <div className="container mx-auto max-w-4xl px-4 text-center space-y-4">
          <div className="h-6 w-48 bg-muted rounded-full mx-auto" />
          <div className="h-10 w-2/3 bg-muted rounded-2xl mx-auto" />
          <div className="h-4 w-1/2 bg-muted/80 rounded-lg mx-auto" />
        </div>
      </section>

      {/* Main Grid Skeleton */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
            {/* Left Contact Cards Skeleton */}
            <div className="lg:col-span-2 space-y-4">
              <div className="h-6 w-40 bg-muted rounded-md mb-2" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 rounded-2xl bg-card border border-border/70 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 bg-muted rounded-md" />
                    <div className="h-3 w-40 bg-muted/70 rounded-md" />
                  </div>
                </div>
              ))}
            </div>

            {/* Right Contact Form Skeleton */}
            <div className="lg:col-span-3">
              <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-4">
                <div className="h-6 w-48 bg-muted rounded-md" />
                <div className="h-4 w-64 bg-muted/70 rounded-md" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="h-10 rounded-xl bg-muted" />
                  <div className="h-10 rounded-xl bg-muted" />
                </div>
                <div className="h-10 rounded-xl bg-muted" />
                <div className="h-28 rounded-xl bg-muted" />
                <div className="h-11 rounded-xl bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
