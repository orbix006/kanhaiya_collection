"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { submitContactAction, type ContactFormState } from "@/app/(public)/contact/actions";

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<ContactFormState | null>(null);

  const validateClientSide = (): boolean => {
    const errors: FieldErrors = {};

    if (!name.trim() || name.trim().length < 2) {
      errors.name = "Please enter your full name (at least 2 characters).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (phone.trim()) {
      const digitsOnly = phone.replace(/\D/g, "");
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        errors.phone = "Phone number must contain between 7 and 15 digits.";
      }
    }

    if (!message.trim() || message.trim().length < 10) {
      errors.message = "Please share a message of at least 10 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!validateClientSide()) {
      setStatus({
        success: false,
        error: "Please correct the highlighted fields before submitting.",
      });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    formData.append("phone", phone.trim());
    formData.append("message", message.trim());

    try {
      const res = await submitContactAction(formData);
      setStatus(res);

      if (res.fieldErrors) {
        setFieldErrors(res.fieldErrors);
      } else if (res.success) {
        setFieldErrors({});
      }
    } catch {
      setStatus({
        success: false,
        error: "An unexpected error occurred while submitting your message. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setFieldErrors({});
    setStatus(null);
  };

  // If successfully submitted, show celebration & confirmation state
  if (status?.success) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-4 animate-in fade-in duration-300"
      >
        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-foreground">Message Dispatched</h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {status.message || "Thank you! Your message has been received by our royal concierge team."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Send Another Inquiry</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Contact Concierge Form">
      {status?.error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-3 p-4 rounded-xl text-xs font-semibold border bg-destructive/10 text-destructive border-destructive/30"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{status.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="contact-name" className="text-xs font-semibold text-foreground flex items-center gap-1">
            <span>Full Name</span>
            <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            required
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
            placeholder="e.g. Sunita Kapoor"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }}
            className={`h-10 w-full rounded-xl border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 transition-all ${
              fieldErrors.name
                ? "border-destructive focus:border-destructive focus:ring-destructive"
                : "border-border focus:border-primary focus:ring-primary"
            }`}
          />
          {fieldErrors.name && (
            <p id="contact-name-error" className="text-[11px] font-medium text-destructive mt-1">
              {fieldErrors.name}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label htmlFor="contact-email" className="text-xs font-semibold text-foreground flex items-center gap-1">
            <span>Email Address</span>
            <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            required
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
            placeholder="e.g. sunita@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            className={`h-10 w-full rounded-xl border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 transition-all ${
              fieldErrors.email
                ? "border-destructive focus:border-destructive focus:ring-destructive"
                : "border-border focus:border-primary focus:ring-primary"
            }`}
          />
          {fieldErrors.email && (
            <p id="contact-email-error" className="text-[11px] font-medium text-destructive mt-1">
              {fieldErrors.email}
            </p>
          )}
        </div>
      </div>

      {/* Phone (Optional) */}
      <div className="space-y-1.5">
        <label htmlFor="contact-phone" className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>Contact Phone</span>
          <span className="text-[11px] font-normal text-muted-foreground">Optional</span>
        </label>
        <input
          id="contact-phone"
          type="tel"
          aria-invalid={Boolean(fieldErrors.phone)}
          aria-describedby={fieldErrors.phone ? "contact-phone-error" : undefined}
          placeholder="e.g. +91 98290 12345"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
          }}
          className={`h-10 w-full rounded-xl border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 transition-all ${
            fieldErrors.phone
              ? "border-destructive focus:border-destructive focus:ring-destructive"
              : "border-border focus:border-primary focus:ring-primary"
          }`}
        />
        {fieldErrors.phone && (
          <p id="contact-phone-error" className="text-[11px] font-medium text-destructive mt-1">
            {fieldErrors.phone}
          </p>
        )}
      </div>

      {/* Inquiry Message */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="contact-message" className="text-xs font-semibold text-foreground flex items-center gap-1">
            <span>Inquiry Message / Request</span>
            <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <span className="text-[11px] text-muted-foreground">
            {message.length}/3000 (min 10)
          </span>
        </div>
        <textarea
          id="contact-message"
          rows={5}
          required
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
          placeholder="Please share details about your inquiry, styling assistance, or bridal consultation..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (fieldErrors.message) setFieldErrors((prev) => ({ ...prev, message: undefined }));
          }}
          className={`w-full rounded-xl border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 transition-all resize-y ${
            fieldErrors.message
              ? "border-destructive focus:border-destructive focus:ring-destructive"
              : "border-border focus:border-primary focus:ring-primary"
          }`}
        />
        {fieldErrors.message && (
          <p id="contact-message-error" className="text-[11px] font-medium text-destructive mt-1">
            {fieldErrors.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sending Inquiry to Concierge...</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span>Send Message to Concierge</span>
          </>
        )}
      </button>
    </form>
  );
}
