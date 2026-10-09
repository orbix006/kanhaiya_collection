import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function CheckoutPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8F1E3] text-[#C8891A] ring-1 ring-[#C8891A]/30 mb-6">
        <ShieldCheck className="h-8 w-8" />
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#3B2416]">
        Secure Checkout
      </h1>
      <p className="mt-3 text-sm sm:text-base text-[#7C6753] max-w-md mx-auto">
        Checkout will open once our launch orders commence.
      </p>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#C8891A] text-white text-sm font-medium hover:bg-[#B37814] transition-all shadow-xs"
        >
          <span>Return to Home</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
