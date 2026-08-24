"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "../actions";
import { Store, Loader2, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, null);

  return (
    <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-card border border-border rounded-2xl shadow-xl">
      <div className="flex flex-col items-center text-center space-y-2">
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight text-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Store className="h-6 w-6" />
          </div>
          <span>Kanhaiya Collection</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Forgot Password</h1>
        <p className="text-sm text-muted-foreground">Enter your email address to receive password reset instructions</p>
      </div>

      {state?.error && (
        <div className="p-3 text-sm rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="p-3 text-sm rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          {state.success}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending reset email...
            </>
          ) : (
            <>
              Send Reset Link <KeyRound className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-sm text-muted-foreground pt-2">
        Remember your password?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
