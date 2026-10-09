"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { submitNewsletterAction } from "@/app/(public)/contact/actions";

export function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setMessage({ text: "Please enter a valid email address.", isError: true });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await submitNewsletterAction(trimmed);
      if (res.error) {
        setMessage({ text: res.error, isError: true });
      } else {
        setMessage({
          text: res.message || "Thank you for subscribing! Check your inbox soon.",
          isError: false,
        });
        setEmail("");
      }
    } catch {
      setMessage({
        text: "Unable to process subscription. Please try again later.",
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-2">
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-label="Newsletter subscription form"
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address for newsletter
          </label>
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (message?.isError) setMessage(null);
            }}
            placeholder="Enter your email address..."
            aria-required="true"
            aria-invalid={message?.isError}
            aria-describedby={message ? "newsletter-feedback" : undefined}
            className={`h-9.5 w-full rounded-xl border bg-card/60 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 transition-all ${
              message?.isError
                ? "border-destructive focus:border-destructive focus:ring-destructive"
                : "border-border focus:border-primary focus:ring-primary"
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-label="Subscribe to newsletter"
          className="inline-flex h-9.5 items-center justify-center gap-1.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <span>Subscribe</span>
              <ArrowRight className="h-3 w-3" />
            </>
          )}
        </button>
      </form>

      {message && (
        <div
          id="newsletter-feedback"
          role="status"
          aria-live="polite"
          className={`text-[11px] font-medium flex items-center gap-1.5 mt-1.5 ${
            message.isError
              ? "text-destructive"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {message.isError ? (
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
