"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  MapPin,
  User as UserIcon,
  LogOut,
  ShoppingBag,
  Menu,
  X,
  Search,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { useLocation } from "./location-context";
import { SearchBar } from "./search-bar";

interface HeaderProps {
  user?: {
    email?: string;
  } | null;
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

export function Header({ user, profile }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const pathname = usePathname();
  const { location, openModal } = useLocation();

  const avatarUrl = profile?.avatar_url;
  const displayName = profile?.full_name || user?.email || "Account";
  const shortLocation = location ? location.split(",")[0].trim() : null;

  const isForYouActive = pathname === "/";
  const isCategoriesActive = pathname.startsWith("/categories");

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFDF7]/95 backdrop-blur-md shadow-[0_2px_14px_rgba(59,36,22,0.04)] border-b border-[#E8DCC8]/50 transition-all">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Desktop & Tablet Header Bar */}
        <div className="flex h-20 items-center justify-between gap-3 sm:gap-6">
          {/* MOBILE LEFT: Menu Toggle */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="p-2 -ml-2 rounded-xl text-[#3B2416] hover:bg-[#F8F1E3] transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* LEFT: Logo / Brand Mark (approx 20-25% width on desktop) */}
          <div className="flex items-center shrink-0 md:w-[22%] lg:w-[24%]">
            <Link
              href="/"
              className="group flex items-center gap-2.5 transition-opacity hover:opacity-95"
              aria-label="Kanhaiya Collection Home"
            >
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#F8F1E3] to-[#E8DCC8] shadow-xs ring-1 ring-[#C8891A]/30 transition-transform group-hover:scale-105">
                {/* Sacred Diya / Flame Motif */}
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 text-[#C8891A]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M12 2c.5 2 2.5 3.5 2.5 5.5A2.5 2.5 0 0 1 12 10a2.5 2.5 0 0 1-2.5-2.5C9.5 5.5 11.5 4 12 2z"
                    fill="#C8891A"
                    fillOpacity="0.85"
                  />
                  <path
                    d="M4 14c0 3.866 3.582 7 8 7s8-3.134 8-7H4z"
                    fill="#8B4513"
                    fillOpacity="0.15"
                  />
                  <path d="M4 14h16" />
                </svg>
              </div>

              <div className="flex flex-col">
                <span className="font-serif text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-[#3B2416] group-hover:text-[#C8891A] transition-colors leading-none">
                  Kanhaiya Collection
                </span>
                <span className="text-[9px] uppercase tracking-widest text-[#806B57] font-normal hidden sm:block mt-1">
                  Sacred Devotion & Craft
                </span>
              </div>
            </Link>
          </div>

          {/* CENTER: [ For You ] [ Categories ] [ Search Bar ] (Desktop) */}
          <div className="hidden md:flex items-center flex-1 justify-center gap-4 lg:gap-6 max-w-2xl">
            {/* Primary Discovery Navigation */}
            <nav className="flex items-center gap-4 lg:gap-6 text-sm shrink-0 font-sans">
              {/* For You */}
              <Link
                href="/"
                className={`py-1 text-sm transition-colors duration-200 ${
                  isForYouActive
                    ? "font-medium text-[#C8891A]"
                    : "font-normal text-[#806B57] hover:text-[#3B2416]"
                }`}
              >
                For You
              </Link>

              {/* Categories */}
              <Link
                href="/categories"
                className={`py-1 text-sm transition-colors duration-200 ${
                  isCategoriesActive
                    ? "font-medium text-[#C8891A]"
                    : "font-normal text-[#806B57] hover:text-[#3B2416]"
                }`}
              >
                Categories
              </Link>
            </nav>

            {/* Prominent Search Bar with rotating placeholder */}
            <div className="flex-1">
              <SearchBar />
            </div>
          </div>

          {/* RIGHT: [ Location ] [ Login / Account ] */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile Search Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Toggle search"
              className="md:hidden p-2 rounded-full text-[#7C6753] hover:text-[#3B2416] hover:bg-[#F8F1E3] transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* LOCATION ICON & DISPLAY */}
            <button
              type="button"
              onClick={() => openModal(false)}
              aria-label="Location selector"
              title={location ? `Location: ${location}` : "Select your location"}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full border border-[#E8DCC8] bg-[#FFFDF7] hover:bg-[#F8F1E3] hover:border-[#C8891A]/50 transition-all text-[#3B2416] shadow-2xs"
            >
              <MapPin className="h-4 w-4 text-[#C8891A] shrink-0" />
              {shortLocation ? (
                <span className="hidden lg:inline text-xs font-semibold max-w-[100px] truncate text-[#3B2416]">
                  {shortLocation}
                </span>
              ) : null}
            </button>

            {/* LOGIN / ACCOUNT ICON (Authentication-aware Dropdown) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="Account menu"
                className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-[#E8DCC8] bg-[#FFFDF7] text-[#3B2416] hover:bg-[#F8F1E3] hover:border-[#C8891A] hover:text-[#C8891A] transition-all shadow-2xs"
              >
                {user && avatarUrl ? (
                  <div className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full overflow-hidden">
                    <Image
                      src={avatarUrl}
                      alt="User Avatar"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : user ? (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#F8F1E3] text-[#C8891A] flex items-center justify-center font-bold text-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>

              {/* Account Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 sm:w-56 bg-[#FFFDF7] border border-[#E8DCC8] rounded-2xl shadow-xl py-2 z-50 text-xs font-sans">
                  {user ? (
                    /* Authenticated Menu Options */
                    <>
                      <div className="px-4 py-2.5 border-b border-[#E8DCC8]/60">
                        <p className="font-semibold text-sm text-[#3B2416] truncate">{displayName}</p>
                        <p className="text-[#806B57] truncate text-[11px]">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-[#3B2416] hover:bg-[#F8F1E3] hover:text-[#C8891A] transition-colors font-medium"
                        >
                          <svg className="h-4 w-4 text-[#C8891A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M3 9h18" />
                            <path d="M9 21V9" />
                          </svg>
                          <span>Admin Panel</span>
                        </Link>

                        <Link
                          href="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-[#3B2416] hover:bg-[#F8F1E3] transition-colors"
                        >
                          <UserIcon className="h-4 w-4 text-[#806B57]" />
                          <span>My Account</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-[#E8DCC8]/60">
                        <form action={logoutAction}>
                          <button
                            type="submit"
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                          </button>
                        </form>
                      </div>
                    </>
                  ) : (
                    /* Unauthenticated Menu Options: Login and Admin Panel */
                    <div className="py-1">
                      <Link
                        href="/login"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[#3B2416] hover:bg-[#F8F1E3] hover:text-[#C8891A] transition-colors font-medium text-sm"
                      >
                        <UserIcon className="h-4 w-4 text-[#C8891A]" />
                        <span>Login</span>
                      </Link>

                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[#3B2416] hover:bg-[#F8F1E3] hover:text-[#C8891A] transition-colors font-medium text-sm"
                      >
                        <svg className="h-4 w-4 text-[#C8891A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <path d="M3 9h18" />
                          <path d="M9 21V9" />
                        </svg>
                        <span>Admin Panel</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE EXPANDED SEARCH BAR */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-4 pt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
            <SearchBar isMobile onNavigate={() => setMobileSearchOpen(false)} />
          </div>
        )}
      </div>

      {/* MOBILE DRAWER / MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8DCC8]/60 bg-[#FFFDF7] px-6 py-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-base py-1.5 transition-colors ${
                isForYouActive ? "font-semibold text-[#C8891A]" : "font-medium text-[#7C6753] hover:text-[#3B2416]"
              }`}
            >
              For You
            </Link>

            <Link
              href="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-base py-1.5 transition-colors ${
                isCategoriesActive ? "font-semibold text-[#C8891A]" : "font-medium text-[#7C6753] hover:text-[#3B2416]"
              }`}
            >
              Categories
            </Link>

            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-[#7C6753] hover:text-[#3B2416] py-1.5 transition-colors"
            >
              About Us
            </Link>

            <Link
              href="/about#story"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-[#7C6753] hover:text-[#3B2416] py-1.5 transition-colors"
            >
              Our Story
            </Link>

            <div className="pt-4 border-t border-[#E8DCC8]/40 flex flex-col gap-3">
              {/* Mobile Location Selector */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openModal(false);
                }}
                className="flex items-center gap-2 text-sm font-medium text-[#3B2416] py-1"
              >
                <MapPin className="h-4 w-4 text-[#C8891A]" />
                <span>{location ? `Delivery: ${location}` : "Select Location"}</span>
              </button>

              {user ? (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#E8DCC8]/30">
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-semibold text-[#3B2416] py-1"
                  >
                    <svg className="h-4 w-4 text-[#C8891A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                    <span>Admin Panel</span>
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-semibold text-[#3B2416] py-1"
                  >
                    <UserIcon className="h-4 w-4 text-[#806B57]" />
                    <span>My Account ({displayName})</span>
                  </Link>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex items-center gap-2 text-sm text-red-600 font-medium py-1"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#E8DCC8]/30">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-semibold text-[#3B2416] py-1"
                  >
                    <UserIcon className="h-4 w-4 text-[#C8891A]" />
                    <span>Login</span>
                  </Link>
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-semibold text-[#3B2416] py-1"
                  >
                    <svg className="h-4 w-4 text-[#C8891A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                    <span>Admin Panel</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
