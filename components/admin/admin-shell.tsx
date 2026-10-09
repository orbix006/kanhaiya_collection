"use client";

import { useState, ReactNode } from "react";
import { AdminSidebar } from "./sidebar";
import { AdminTopBar } from "./top-bar";
import { X } from "lucide-react";

interface AdminShellProps {
  children: ReactNode;
  userEmail?: string;
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
    role?: string;
  } | null;
}

export function AdminShell({ children, userEmail, profile }: AdminShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:w-64 shrink-0">
        <div className="fixed inset-y-0 left-0 z-40 w-64">
          <AdminSidebar />
        </div>
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-card shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="absolute right-3 top-4 z-50">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <AdminSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <AdminTopBar
          userEmail={userEmail}
          profile={profile}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
