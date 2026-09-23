export default function AboutLoading() {
  return (
    <div className="flex flex-col min-h-screen animate-pulse">
      {/* Hero Skeleton */}
      <section className="border-b border-border/60 bg-muted/20 py-16 sm:py-24">
        <div className="container mx-auto max-w-4xl px-4 text-center space-y-4">
          <div className="h-6 w-48 bg-muted rounded-full mx-auto" />
          <div className="h-10 sm:h-12 w-3/4 bg-muted rounded-2xl mx-auto" />
          <div className="h-4 w-1/2 bg-muted/80 rounded-lg mx-auto" />
        </div>
      </section>

      {/* Sections Skeleton */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4 space-y-20">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${
                i % 2 === 0 ? "lg:grid-flow-dense" : ""
              }`}
            >
              <div
                className={`aspect-4/3 rounded-3xl bg-muted/60 ${
                  i % 2 === 0 ? "lg:col-start-2" : ""
                }`}
              />
              <div className="space-y-4">
                <div className="h-4 w-32 bg-muted rounded-md" />
                <div className="h-8 w-3/4 bg-muted rounded-xl" />
                <div className="space-y-2">
                  <div className="h-3.5 w-full bg-muted/70 rounded-md" />
                  <div className="h-3.5 w-5/6 bg-muted/70 rounded-md" />
                  <div className="h-3.5 w-4/6 bg-muted/70 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
