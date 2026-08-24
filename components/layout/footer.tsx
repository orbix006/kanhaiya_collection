export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-8 text-center text-sm text-muted-foreground">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} Kanhaiya Collection. All rights reserved.</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Privacy Policy (Placeholder)</span>
          <span>Terms of Service (Placeholder)</span>
          <span>Contact (Placeholder)</span>
        </div>
      </div>
    </footer>
  );
}
