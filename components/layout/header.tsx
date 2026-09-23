"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Store,
  Search,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Package,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import type { Category } from "@/lib/data/homepage";

interface HeaderProps {
  user?: {
    email?: string;
  } | null;
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
  categories?: Category[];
  cartCount?: number;
}

export function Header({
  user,
  profile,
  categories = [],
  cartCount = 0,
}: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [liveCartCount, setLiveCartCount] = useState<number>(cartCount);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileParent, setExpandedMobileParent] = useState<string | null>(null);
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLiveCartCount(cartCount);
  }, [cartCount]);

  useEffect(() => {
    const handleCartUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ count: number }>;
      if (typeof customEvent.detail?.count === "number") {
        setLiveCartCount(customEvent.detail.count);
      }
    };

    window.addEventListener("cart:updated", handleCartUpdated);
    return () => {
      window.removeEventListener("cart:updated", handleCartUpdated);
    };
  }, []);

  const avatarUrl = profile?.avatar_url;
  const displayName = profile?.full_name || user?.email || "Account";

  // Organize categories into parents and children
  const topCategories = categories.filter((c) => c.parent_id === null);
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get("q");
      if (q) {
        queueMicrotask(() => setSearchQuery(q));
      }
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      router.push("/shop");
    } else {
      router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
    }
    setIsMobileMenuOpen(false);
  };

  const handleMouseEnterMenu = () => {
    if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    setIsMegaMenuOpen(true);
  };

  const handleMouseLeaveMenu = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-xs">
      {/* Top micro-bar for brand statement */}
      <div className="hidden lg:block bg-primary text-primary-foreground py-1 text-center text-xs font-semibold tracking-wide">
        Free Standard Express Delivery Across India on Orders Above ₹1,999
      </div>

      <div className="container mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between gap-2 sm:gap-6 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Toggle & Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 text-foreground hover:bg-muted transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg sm:text-xl tracking-tight text-foreground group shrink-0"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs group-hover:scale-105 transition-transform">
              <Store className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-foreground">Kanhaiya</span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-primary -mt-1">
                Collection
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation & Mega-Menu */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-foreground/80">
          <Link
            href="/"
            className="transition-colors hover:text-primary active:text-primary py-2"
          >
            Home
          </Link>

          <Link
            href="/shop"
            className="transition-colors hover:text-primary active:text-primary py-2"
          >
            Shop All
          </Link>

          {/* Categories Dropdown / Mega-Menu */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnterMenu}
            onMouseLeave={handleMouseLeaveMenu}
          >
            <button
              type="button"
              onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
              className="flex items-center gap-1 transition-colors hover:text-primary py-2 group cursor-pointer"
            >
              <span>Categories</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  isMegaMenuOpen ? "rotate-180 text-primary" : "text-muted-foreground"
                }`}
              />
            </button>

            {/* Mega-Menu Panel */}
            {isMegaMenuOpen && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[720px] rounded-2xl border border-border/80 bg-background/98 backdrop-blur-md p-6 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                onMouseEnter={handleMouseEnterMenu}
                onMouseLeave={handleMouseLeaveMenu}
              >
                <div className="grid grid-cols-3 gap-6">
                  {topCategories.map((topCat) => {
                    const subCats = getSubcategories(topCat.id);
                    return (
                      <div key={topCat.id} className="flex flex-col">
                        <Link
                          href={`/shop?category=${encodeURIComponent(topCat.slug)}`}
                          onClick={() => setIsMegaMenuOpen(false)}
                          className="flex items-center gap-1.5 font-bold text-sm text-foreground hover:text-primary pb-2 mb-2 border-b border-border/60 transition-colors group"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span>{topCat.name}</span>
                        </Link>

                        <div className="flex flex-col gap-1.5 pl-1">
                          {subCats.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/shop?category=${encodeURIComponent(sub.slug)}`}
                              onClick={() => setIsMegaMenuOpen(false)}
                              className="text-xs text-muted-foreground hover:text-primary hover:translate-x-1 transition-all py-1"
                            >
                              {sub.name}
                            </Link>
                          ))}
                          {subCats.length === 0 && (
                            <Link
                              href={`/shop?category=${encodeURIComponent(topCat.slug)}`}
                              onClick={() => setIsMegaMenuOpen(false)}
                              className="text-xs text-muted-foreground hover:text-primary py-1"
                            >
                              View All {topCat.name}
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom banner link inside mega-menu */}
                <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Explore full catalog of hand-woven fabrics & couture</span>
                  <Link
                    href="/shop"
                    onClick={() => setIsMegaMenuOpen(false)}
                    className="font-bold text-primary hover:underline"
                  >
                    View All Collections →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/about"
            className="transition-colors hover:text-primary active:text-primary py-2"
          >
            About
          </Link>

          <Link
            href="/faqs"
            className="transition-colors hover:text-primary active:text-primary py-2"
          >
            FAQs
          </Link>

          <Link
            href="/contact"
            className="transition-colors hover:text-primary active:text-primary py-2"
          >
            Contact
          </Link>
        </nav>

        {/* Right: Search Field, Cart, Auth / Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Search Field */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex relative items-center w-52 xl:w-64"
          >
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-border/80 bg-muted/50 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
            />
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          </form>

          {/* Cart Icon with Live Cart Count */}
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card text-foreground hover:border-primary hover:text-primary transition-colors"
            title="View Cart"
            aria-label={`Shopping cart with ${liveCartCount} items`}
          >
            <ShoppingBag className="h-5 w-5" />
            <span
              id="header-cart-count"
              className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs animate-in zoom-in"
            >
              {liveCartCount}
            </span>
          </Link>

          {/* Auth / Profile Area */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/account"
                className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors group"
                title="Your Account"
              >
                {avatarUrl ? (
                  <div className="relative h-9 w-9 rounded-full overflow-hidden border border-border group-hover:border-primary transition-colors">
                    <Image
                      src={avatarUrl}
                      alt="User Avatar"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden xl:inline max-w-[100px] truncate font-semibold">
                  {displayName}
                </span>
              </Link>

              <Link
                href="/account/orders"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Orders"
              >
                <Package className="h-4 w-4" />
                <span>Orders</span>
              </Link>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-border/80 bg-muted/40 text-xs font-medium text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90 shadow-xs transition-colors"
              >
                Signup
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/98 backdrop-blur px-4 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          {/* Mobile Search Field */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-muted/50 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-hidden"
            />
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          </form>

          {/* Nav Links */}
          <div className="flex flex-col space-y-1 text-sm font-medium">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-muted text-foreground"
            >
              Home
            </Link>

            <Link
              href="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-muted text-foreground"
            >
              Shop All
            </Link>

            {/* Mobile Category Hierarchy */}
            <div className="py-2 border-y border-border/50">
              <div className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Categories
              </div>
              <div className="space-y-1">
                {topCategories.map((cat) => {
                  const subCats = getSubcategories(cat.id);
                  const isExpanded = expandedMobileParent === cat.id;

                  return (
                    <div key={cat.id} className="flex flex-col">
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted">
                        <Link
                          href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="font-medium text-foreground text-sm"
                        >
                          {cat.name}
                        </Link>
                        {subCats.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMobileParent(isExpanded ? null : cat.id)
                            }
                            className="p-1 text-muted-foreground"
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Subcategories list */}
                      {isExpanded && subCats.length > 0 && (
                        <div className="pl-6 space-y-1 pb-2">
                          {subCats.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/shop?category=${encodeURIComponent(sub.slug)}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block py-1.5 text-xs text-muted-foreground hover:text-primary"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cart Link in Mobile */}
            <Link
              href="/cart"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted text-foreground"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span>Cart</span>
              </div>
              <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
                {cartCount} items
              </span>
            </Link>

            {/* About, FAQs, Contact Mobile Links */}
            <div className="pt-2 border-t border-border/50 space-y-1">
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
              >
                About Our Heritage
              </Link>
              <Link
                href="/faqs"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
              >
                Help & FAQs
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
              >
                Contact Concierge
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
