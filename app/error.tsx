"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, Sparkles } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client-side error to console/monitoring
    console.error("[Application Error Boundary Caught]:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-lg w-full text-center space-y-8 bg-stone-900/60 border border-rose-900/30 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-10 h-10 animate-pulse" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unexpected Experience Error</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-100">
            Something Went Awry
          </h1>
          <p className="text-stone-400 text-sm sm:text-base leading-relaxed">
            We encountered a temporary disruption while crafting your royal experience.
            You can try refreshing the action or return to the main hall.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-stone-500 pt-2">
              Reference code: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-stone-800">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold text-sm transition-colors shadow-lg shadow-amber-600/20 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium text-sm transition-colors"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
