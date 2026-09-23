import Link from "next/link";
import { Compass, ShoppingBag, ArrowLeft, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full text-center space-y-8 bg-stone-900/60 border border-amber-900/30 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Compass className="w-10 h-10 animate-[spin_10s_linear_infinite]" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
          </span>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Page Not Found &bull; 404</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-100">
            Lost in the Royal Courtyard
          </h1>
          <p className="text-stone-400 text-sm sm:text-base leading-relaxed">
            The page you are looking for has been relocated or never existed in our archives.
            Let us guide you back to our curated collections.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-stone-800">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold text-sm transition-colors shadow-lg shadow-amber-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Grand Hall</span>
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium text-sm transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Explore Couture Shop</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
