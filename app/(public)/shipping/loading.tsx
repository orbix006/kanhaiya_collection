export default function ShippingLoading() {
  return (
    <div className="flex flex-col min-h-screen animate-pulse">
      <div className="border-b border-border/60 bg-muted/20 py-12 sm:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-4">
          <div className="h-4 w-32 bg-muted rounded-md" />
          <div className="h-10 w-2/3 bg-muted rounded-2xl" />
          <div className="h-4 w-1/3 bg-muted/70 rounded-md" />
        </div>
      </div>
      <div className="py-12 sm:py-16">
        <div className="container mx-auto max-w-4xl px-4 space-y-6">
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 space-y-4">
            <div className="h-6 w-1/3 bg-muted rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted/60 rounded-md" />
              <div className="h-4 w-5/6 bg-muted/60 rounded-md" />
              <div className="h-4 w-4/6 bg-muted/60 rounded-md" />
            </div>
            <div className="h-6 w-1/4 bg-muted rounded-lg pt-4" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted/60 rounded-md" />
              <div className="h-4 w-3/4 bg-muted/60 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
