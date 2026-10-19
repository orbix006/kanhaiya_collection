"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  ChevronDown,
  ExternalLink,
  Sliders,
  LogOut,
  Sparkles,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

interface ProfileDropdownProps {
  userEmail?: string;
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
    role?: string;
  } | null;
}

export function ProfileDropdown({ userEmail, profile }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.full_name || userEmail || "Administrator";
  const avatarUrl = profile?.avatar_url;

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 sm:px-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted transition-colors text-left"
        aria-label="Admin profile menu"
      >
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
          <span className="text-xs font-bold text-foreground leading-none truncate max-w-[120px]">
            {displayName}
          </span>
          <div className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
            <ShieldCheck className="h-3 w-3" />
            <span>Store Admin</span>
          </div>
        </div>

        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-2 space-y-1">
          {/* User info box */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <div className="text-xs font-bold text-foreground truncate">
              {displayName}
            </div>
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
              {userEmail || "admin@kanhaiya.local"}
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
              <span>Dev Preview Active</span>
            </div>
          </div>

          {/* Links */}
          <Link
            href="/"
            target="_blank"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>View Live Storefront</span>
            </div>
            <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
          </Link>

          <Link
            href="/admin/cms/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Sliders className="h-4 w-4 text-primary" />
            <span>Site & Brand Settings</span>
          </Link>

          <div className="pt-1 border-t border-border/60">
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Exit Preview / Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
