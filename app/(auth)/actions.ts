"use server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  registerLocalUser,
  authenticateLocalUser,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth/local-auth";
import { isUserAdmin } from "@/lib/auth/role-check";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signupAction(prevState: any, formData: FormData) {
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // 1. Validation
  if (!fullName) {
    return { error: "Please enter your full name." };
  }

  if (!email) {
    return { error: "Please enter your email address." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: "Please enter a valid email address (e.g. name@example.com)." };
  }

  if (!password) {
    return { error: "Please enter a password." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match. Please re-enter your password." };
  }

  // 2. Production / Cloud Supabase Provider Mode
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        const msg = error.message || "";
        if (msg.includes("fetch failed") || msg.includes("Failed to fetch") || error.status === 0) {
          return {
            error:
              "Unable to reach the authentication service. Please check your network connection or verify NEXT_PUBLIC_SUPABASE_URL in .env.local.",
          };
        }
        if (msg.includes("already registered") || msg.includes("already exists")) {
          return { error: "An account with this email address already exists. Please log in instead." };
        }
        return { error: error.message };
      }

      revalidatePath("/", "layout");

      // If user session is established immediately (e.g. email confirmation disabled)
      if (data.session) {
        redirect("/");
      }

      return {
        success:
          "Account created successfully! Please check your email inbox to confirm your account, then log in.",
      };
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.includes("NEXT_REDIRECT")) {
        throw err;
      }
      return {
        error:
          "Unable to connect to the authentication service. Please check your Supabase configuration or network connection.",
      };
    }
  }

  // 3. Local Development Mode (when Supabase credentials are not configured)
  const result = await registerLocalUser({
    fullName,
    email,
    password,
  });

  if (result.error || !result.user) {
    return { error: result.error || "Failed to create account." };
  }

  // Sign in newly registered local user
  await setSessionCookie(result.user);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  let redirectPath = ((formData.get("redirect") as string) || "/").trim();

  // Guard against open redirect attacks: only relative internal paths permitted
  if (!redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    redirectPath = "/";
  }

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  // 1. Production / Cloud Supabase Provider Mode
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const msg = error.message || "";
        if (msg.includes("fetch failed") || msg.includes("Failed to fetch") || error.status === 0) {
          return {
            error:
              "Unable to reach the authentication service. Please check your network connection or verify NEXT_PUBLIC_SUPABASE_URL in .env.local.",
          };
        }
        if (msg.includes("Invalid login credentials")) {
          return { error: "Invalid email or password. Please verify your credentials." };
        }
        if (msg.includes("Email not confirmed")) {
          return {
            error:
              "Your email has not been verified yet. Please check your inbox for the confirmation email.",
          };
        }
        return { error: error.message };
      }

      // Fetch authoritative database record from public.users
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, full_name, email, role")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch failed:", profileError);
      }

      console.log("Authenticated user ID:", data.user?.id);
      console.log("Database profile:", profile);
      console.log("Database role:", profile?.role);

      const isAdmin = isUserAdmin(data.user, profile);

      revalidatePath("/", "layout");

      // Redirect administrator automatically to /admin if no specific destination requested
      if (isAdmin) {
        if (redirectPath === "/" || redirectPath === "/admin") {
          redirect("/admin");
        }
      } else if (redirectPath.startsWith("/admin")) {
        // Non-admin attempting to access admin route
        redirect("/403");
      }

      redirect(redirectPath);
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.includes("NEXT_REDIRECT")) {
        throw err;
      }
      return {
        error:
          "Unable to connect to the authentication service. Please verify your network connection and credentials.",
      };
    }
  }

  // 2. Local Development Mode (when Supabase credentials are not configured)
  const result = await authenticateLocalUser({ email, password });

  if (result.error || !result.user) {
    return { error: result.error || "Invalid email or password." };
  }

  await setSessionCookie(result.user);
  revalidatePath("/", "layout");

  const isAdmin = isUserAdmin(result.user);

  // Route to admin if legitimate administrator
  if (isAdmin) {
    if (redirectPath === "/" || redirectPath === "/admin") {
      redirect("/admin");
    }
  } else if (redirectPath.startsWith("/admin")) {
    redirect("/403");
  }

  redirect(redirectPath);
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore network errors during sign out
    }
  }

  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPasswordAction(prevState: any, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email || !EMAIL_REGEX.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { success: "Password reset instructions have been sent to your email." };
    } catch {
      return { error: "Unable to reach the authentication service. Please try again later." };
    }
  }

  return {
    success:
      "In local development mode, password changes can be administered using the local scripts or direct credentials.",
  };
}

export async function resetPasswordAction(prevState: any, formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { error: "Please fill in all fields." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        return { error: error.message };
      }

      revalidatePath("/", "layout");
      return { success: "Your password has been reset successfully." };
    } catch {
      return { error: "Unable to reach the authentication service. Please try again later." };
    }
  }

  return { success: "Password updated successfully." };
}
