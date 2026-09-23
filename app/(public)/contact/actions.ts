"use server";

import { createClient } from "@/lib/supabase/server";

export interface ContactFormState {
  success?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
  };
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 255;
}

function validatePhone(phone: string): boolean {
  if (!PHONE_REGEX.test(phone)) return false;
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

// Sliding-window in-memory rate limiter to mitigate abuse on public forms
interface RateLimitRecord {
  timestamps: number[];
}

const contactRateLimitStore = new Map<string, RateLimitRecord>();
const newsletterRateLimitStore = new Map<string, RateLimitRecord>();

function isRateLimited(
  store: Map<string, RateLimitRecord>,
  key: string,
  maxRequests = 5,
  windowMs = 10 * 60 * 1000
): boolean {
  const now = Date.now();
  const record = store.get(key) || { timestamps: [] };
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
  if (record.timestamps.length >= maxRequests) {
    return true; // Limit exceeded
  }
  record.timestamps.push(now);
  store.set(key, record);
  return false;
}

/**
 * Public action to submit a Contact Us inquiry.
 * Public visitors have write-only permission: they can submit messages but cannot read existing submissions.
 */
export async function submitContactAction(
  formData: FormData
): Promise<ContactFormState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const rawPhone = String(formData.get("phone") || "").trim();
  const phone = rawPhone.length > 0 ? rawPhone : null;
  const message = String(formData.get("message") || "").trim();

  const fieldErrors: ContactFormState["fieldErrors"] = {};

  if (!name || name.length < 2) {
    fieldErrors.name = "Please enter your full name (at least 2 characters).";
  } else if (name.length > 100) {
    fieldErrors.name = "Name must be less than 100 characters.";
  }

  if (!email || !validateEmail(email)) {
    fieldErrors.email = "Please provide a valid email address (e.g. name@example.com).";
  }

  if (phone !== null && !validatePhone(phone)) {
    fieldErrors.phone = "Please enter a valid phone number (at least 7 digits) or leave blank.";
  }

  if (!message || message.length < 10) {
    fieldErrors.message = "Message must be at least 10 characters long.";
  } else if (message.length > 3000) {
    fieldErrors.message = "Message must not exceed 3,000 characters.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      error: "Please correct the highlighted fields before submitting.",
      fieldErrors,
    };
  }

  // Rate limit protection: Max 5 submissions per email address per 10 minutes
  if (isRateLimited(contactRateLimitStore, email, 5, 10 * 60 * 1000)) {
    return {
      success: false,
      error: "You have submitted multiple inquiries recently. Please wait a few minutes before sending another.",
    };
  }

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    return {
      success: true,
      message: "Thank you for reaching out! We have received your inquiry and our concierge team will get in touch shortly.",
    };
  }

  try {
    const supabase = await createClient();

    // Write-only insert: Public clients have insert permissions; SELECT is restricted to administrators by RLS
    const { error } = await supabase.from("contact_submissions").insert({
      name,
      email,
      phone,
      message,
      status: "new",
    });

    if (error) {
      console.error("Contact submission error:", error.message);
      return {
        success: false,
        error: "Unable to submit your message at this time. Please try again or reach out to our concierge directly.",
      };
    }

    return {
      success: true,
      message: "Thank you! Your message has been sent to our royal concierge team. We will respond within 24 business hours.",
    };
  } catch (err) {
    console.error("Unexpected error in contact submission:", err);
    return {
      success: false,
      error: "A temporary error occurred. Please try again shortly.",
    };
  }
}

/**
 * Public action to capture newsletter subscriptions as leads.
 * - Validates email strictly.
 * - Creates a lead with source `newsletter`.
 * - Privacy protection: Avoids exposing whether an email already exists in the system by returning
 *   the exact same friendly success feedback regardless of duplicate entry.
 */
export async function submitNewsletterAction(
  emailInput: string,
  nameInput?: string
): Promise<ContactFormState> {
  const email = String(emailInput || "").trim().toLowerCase();
  const name = nameInput ? String(nameInput).trim() : null;

  if (!email || !validateEmail(email)) {
    return {
      success: false,
      error: "Please enter a valid email address to subscribe.",
      fieldErrors: { email: "Please enter a valid email address." },
    };
  }

  // Rate limit protection: Max 5 subscription attempts per email per 10 minutes
  if (isRateLimited(newsletterRateLimitStore, email, 5, 10 * 60 * 1000)) {
    return {
      success: false,
      error: "Too many subscription attempts for this address. Please wait a few minutes.",
    };
  }

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  const genericSuccessMessage =
    "Thank you for subscribing! Check your inbox soon for exclusive festive collections.";

  if (!isConfigured) {
    return {
      success: true,
      message: genericSuccessMessage,
    };
  }

  try {
    const supabase = await createClient();

    // Insert lead with source 'newsletter'
    const { error } = await supabase.from("leads").insert({
      name,
      email,
      source: "newsletter",
      message: "Subscribed to storefront newsletter updates.",
      status: "new",
    });

    if (error) {
      // Postgres code 23505 is unique violation.
      // Even if the email already exists or conflicts, DO NOT reveal this to the caller.
      // Return the exact same success response so external attackers cannot enumerate subscriber emails.
      if (error.code === "23505" || error.message?.toLowerCase().includes("unique") || error.message?.toLowerCase().includes("duplicate")) {
        return {
          success: true,
          message: genericSuccessMessage,
        };
      }

      console.error("Newsletter submission error:", error.message);
      return {
        success: false,
        error: "Subscription could not be processed. Please try again later.",
      };
    }

    return {
      success: true,
      message: genericSuccessMessage,
    };
  } catch (err) {
    console.error("Unexpected error in newsletter submission:", err);
    return {
      success: false,
      error: "Unable to process subscription at this time. Please try again later.",
    };
  }
}
