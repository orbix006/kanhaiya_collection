"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { isUserAdmin } from "@/lib/auth/role-check";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AdminRouteProps {
  children: React.ReactNode;
  userEmail?: string;
  role?: string;
  isLoading?: boolean;
}

export function AdminRoute({
  children,
  userEmail,
  role,
  isLoading = false,
}: AdminRouteProps) {
  const router = useRouter();

  // Authoritatively evaluate admin status
  const isAdmin = isUserAdmin(
    { email: userEmail, role },
    { role }
  );

  const [isAuthorized, setIsAuthorized] = useState<boolean>(isAdmin);
  // Protect against race conditions and asynchronous session loading
  const [checking, setChecking] = useState<boolean>(
    isLoading || (role === undefined && !userEmail)
  );

  useEffect(() => {
    // If the caller explicitly indicates data is still loading, wait without redirecting
    if (isLoading) {
      setChecking(true);
      return;
    }

    // Role has not resolved and no user email present -> still initializing
    if (role === undefined && !userEmail) {
      setChecking(true);
      return;
    }

    setChecking(false);

    if (isAdmin) {
      setIsAuthorized(true);
      return;
    }

    // Standard non-admin authenticated user -> redirect to 403 Forbidden
    if (role && role !== "admin") {
      router.replace("/403");
      return;
    }

    // Unauthenticated guest -> redirect to login
    if (!userEmail && !role) {
      router.replace("/login?redirect=/admin");
      return;
    }

    // Fallback if not admin
    router.replace("/403");
  }, [role, userEmail, isAdmin, isLoading, router]);

  // Asynchronous timing guard: render loading spinner before making any rejection decision
  if (checking || isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center p-4">
        <LoadingSpinner
          size="lg"
          message="Verifying administrator permissions..."
        />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full rounded-3xl border border-[#E8DCC8] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/50">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="font-serif text-2xl font-medium text-[#3B2416]">
            Restricted Administrator Portal
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#806B57] leading-relaxed">
            Access to this administrative console is restricted exclusively to authorized staff. Standard user accounts and unauthenticated guests are strictly prohibited.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-[#C8891A] px-5 text-sm font-semibold text-white shadow-xs hover:bg-[#B37814] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Storefront</span>
            </Link>
            <Link
              href="/login?redirect=/admin"
              className="inline-flex items-center justify-center h-10 rounded-xl border border-[#E8DCC8] bg-white text-xs font-semibold text-[#3B2416] hover:bg-[#F8F1E3] transition-colors"
            >
              Sign In as Administrator
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
