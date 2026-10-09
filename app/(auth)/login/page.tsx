"use client";

import { useActionState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "../actions";
import { Loader2, ArrowRight } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const message = searchParams.get("message");

  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-[#FFFFFF] border border-[#E8DCC8] rounded-2xl shadow-[0_8px_30px_rgba(59,36,22,0.06)] font-sans">
      <div className="flex flex-col items-center text-center space-y-2">
        <Link href="/" className="flex items-center gap-2 group transition-opacity">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#F8F1E3] to-[#E8DCC8] ring-1 ring-[#C8891A]/30">
            <svg
              className="h-6 w-6 text-[#C8891A]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M12 2c.5 2 2.5 3.5 2.5 5.5A2.5 2.5 0 0 1 12 10a2.5 2.5 0 0 1-2.5-2.5C9.5 5.5 11.5 4 12 2z"
                fill="#C8891A"
                fillOpacity="0.85"
              />
              <path d="M4 14c0 3.866 3.582 7 8 7s8-3.134 8-7H4z" fill="#8B4513" fillOpacity="0.15" />
              <path d="M4 14h16" />
            </svg>
          </div>
          <span className="font-serif text-2xl font-semibold tracking-tight text-[#3B2416]">
            Kanhaiya Collection
          </span>
        </Link>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#3B2416] pt-2">
          Welcome Back
        </h1>
        <p className="text-xs sm:text-sm text-[#806B57] font-normal font-sans">
          Sign in to your account to continue
        </p>
      </div>

      {message && (
        <div className="p-3 text-xs sm:text-sm rounded-xl bg-[#F8F1E3] border border-[#C8891A]/30 text-[#8B4513] font-normal">
          {message}
        </div>
      )}

      {state?.error && (
        <div className="p-3 text-xs sm:text-sm rounded-xl bg-red-50 border border-red-200 text-red-700 font-normal">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4 font-sans">
        <input type="hidden" name="redirect" value={redirect} />

        <div className="space-y-1.5 text-left">
          <label className="text-xs font-medium uppercase tracking-wider text-[#806B57]" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full h-11 px-3.5 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] placeholder-[#806B57]/60 font-normal focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
          />
        </div>

        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-wider text-[#806B57]" htmlFor="password">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#C8891A] font-medium hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="w-full h-11 px-3.5 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] placeholder-[#806B57]/60 font-normal focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8891A] text-white font-medium text-sm hover:bg-[#B37814] transition-all disabled:opacity-50 shadow-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-[#806B57] pt-2 font-sans font-normal">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-[#C8891A] hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#806B57] font-sans">Loading login form...</div>}>
      <LoginForm />
    </Suspense>
  );
}
