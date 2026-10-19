"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FolderTree,
  Layers,
  ShieldCheck,
  Mail,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

interface SidebarProps {
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminSidebar({
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  // Exactly the 7 primary admin modules requested in Phase 0:
  // 1. Dashboard
  // 2. Orders
  // 3. Products
  // 4. Categories
  // 5. Homepage Sections
  // 6. Site Policies
  // 7. Contact Inquiries / Leads
  const primaryNavItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      label: "Orders",
      href: "/admin/orders",
      icon: Package,
      active: pathname.startsWith("/admin/orders"),
    },
    {
      label: "Products",
      href: "/admin/products",
      icon: ShoppingBag,
      active: pathname.startsWith("/admin/products"),
    },
    {
      label: "Categories",
      href: "/admin/categories",
      icon: FolderTree,
      active: pathname.startsWith("/admin/categories"),
    },
    {
      label: "Homepage Sections",
      href: "/admin/cms/homepage",
      icon: Layers,
      active: pathname.startsWith("/admin/cms/homepage"),
    },
    {
      label: "Site Policies",
      href: "/admin/cms/policies",
      icon: ShieldCheck,
      active: pathname.startsWith("/admin/cms/policies"),
    },
    {
      label: "Contact Inquiries / Leads",
      href: "/admin/inbox",
      icon: Mail,
      active: pathname.startsWith("/admin/inbox"),
    },
  ];

  return (
    <aside
      className={`flex h-full flex-col border-r border-border/70 bg-card text-card-foreground transition-all duration-200 font-sans ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div
        className={`flex h-16 sm:h-20 items-center border-b border-border/60 ${
          isCollapsed ? "justify-center px-2" : "justify-between px-5"
        }`}
      >
        <Link
          href="/admin"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 font-bold text-base tracking-tight text-foreground group"
          title="Kanhaiya Collection Management"
        >
          {/* Sacred Diya Brand Emblem */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#F8F1E3] to-[#E8DCC8] dark:from-[#241A12] dark:to-[#1A130D] ring-1 ring-[#C8891A]/30 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <svg
              className="h-5 w-5 text-[#C8891A]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M12 2c.5 2 2.5 3.5 2.5 5.5A2.5 2.5 0 0 1 12 10a2.5 2.5 0 0 1-2.5-2.5C9.5 5.5 11.5 4 12 2z"
                className="diya-flame"
              />
              <path
                d="M4 14c0 3.866 3.582 7 8 7s8-3.134 8-7H4z"
                className="diya-base"
              />
              <path d="M4 14h16" />
            </svg>
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold tracking-tight text-foreground text-sm truncate">
                Kanhaiya Admin
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-primary truncate">
                Executive Portal
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        {onToggleCollapse && !isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Primary Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          {!isCollapsed && (
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
              Primary Modules
            </div>
          )}
          <nav className="space-y-1.5">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center rounded-xl text-xs font-semibold transition-all ${
                    isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
                  } ${
                    item.active
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / Logout & Expand Button */}
      <div className="p-3 border-t border-border/60 space-y-2">
        {onToggleCollapse && isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}

        <form action={logoutAction}>
          <button
            type="submit"
            title={isCollapsed ? "Exit Preview / Sign Out" : undefined}
            className={`w-full flex items-center justify-center rounded-xl border border-border/80 bg-muted/30 text-xs font-semibold text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors ${
              isCollapsed ? "p-2" : "gap-2 px-3 py-2"
            }`}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}
