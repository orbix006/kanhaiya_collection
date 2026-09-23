"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, ExternalLink, ShieldCheck } from "lucide-react";

interface TopBarProps {
  userEmail?: string;
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
    role?: string;
  } | null;
  onOpenMobileMenu: () => void;
}

export function AdminTopBar({
  userEmail,
  profile,
  onOpenMobileMenu,
}: TopBarProps) {
  const displayName = profile?.full_name || userEmail || "Administrator";
  const avatarUrl = profile?.avatar_url;

  return (
    <header className="sticky top-0 z-30 flex h-16 sm:h-20 w-full items-center justify-between border-b border-border/70 bg-background/95 backdrop-blur px-4 sm:px-6 lg:px-8 shadow-2xs">
      {/* Left: Mobile hamburger */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 text-foreground hover:bg-muted transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right: Storefront Link & Admin Profile Badge */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          title="Open live storefront"
        >
          <ExternalLink className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Storefront</span>
        </Link>

        <div className="flex items-center gap-2.5 pl-2 border-l border-border/60">
          {avatarUrl ? (
            <div className="relative h-8 w-8 rounded-full overflow-hidden border border-primary/40 shrink-0">
              <Image
                src={avatarUrl}
                alt="Admin avatar"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/30 shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-foreground leading-none truncate max-w-[130px]">
              {displayName}
            </span>
            <div className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              <ShieldCheck className="h-3 w-3" />
              <span>Admin Access</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
