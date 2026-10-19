"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction } from "../actions";
import { Loader2, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupAction, null);

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
                className="diya-flame"
              />
              <path
                d="M4 14c0 3.866 3.582 7 8 7s8-3.134 8-7H4z"
                className="diya-base"
              />
              <path d="M4 14h16" />
            </svg>
          </div>
          <span className="font-serif text-2xl font-semibold tracking-tight text-[#3B2416]">
            Kanhaiya Collection
          </span>
        </Link>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#3B2416] pt-2">
          Create an Account
        </h1>
        <p className="text-xs sm:text-sm text-[#806B57] font-normal font-sans">
          Sign up to explore royal Indian ethnic couture
        </p>
      </div>

      {state?.error && (
        <div className="p-3 text-xs sm:text-sm rounded-xl bg-red-50 border border-red-200 text-red-700 font-normal">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="p-3 text-xs sm:text-sm rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-normal">
          {state.success}
        </div>
      )}

      <form action={formAction} className="space-y-4 font-sans">
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-medium uppercase tracking-wider text-[#806B57]" htmlFor="fullName">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            placeholder="Your Name"
            className="w-full h-11 px-3.5 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] placeholder-[#806B57]/60 font-normal focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
          />
        </div>

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
          <label className="text-xs font-medium uppercase tracking-wider text-[#806B57]" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Minimum 6 characters"
            className="w-full h-11 px-3.5 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] placeholder-[#806B57]/60 font-normal focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
          />
        </div>

        <div className="space-y-1.5 text-left">
          <label className="text-xs font-medium uppercase tracking-wider text-[#806B57]" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            placeholder="Re-enter password"
            className="w-full h-11 px-3.5 rounded-xl border border-[#E8DCC8] bg-[#FFFDF7] text-sm text-[#3B2416] placeholder-[#806B57]/60 font-normal focus:outline-none focus:ring-2 focus:ring-[#C8891A]/30"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8891A] text-white font-medium text-sm hover:bg-[#B37814] transition-all disabled:opacity-50 shadow-sm cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Sign Up</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-[#806B57] pt-2 font-sans font-normal">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[#C8891A] hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
