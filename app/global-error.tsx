"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-6 antialiased font-sans">
        <div className="max-w-md w-full text-center space-y-6 bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-stone-100">
              Application Disruption
            </h1>
            <p className="text-stone-400 text-sm leading-relaxed">
              A critical layout fault occurred. Please reload to restore the session.
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-stone-500">
                Digest: {error.digest}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold text-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
