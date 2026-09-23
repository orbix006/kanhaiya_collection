"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderTree,
  Users,
  ShoppingBag,
  Package,
  Star,
  ExternalLink,
  Store,
  LogOut,
  Sparkles,
  Layers,
  Image as ImageIcon,
  MessageSquareHeart,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  Sliders,
  Mail,
  UserCheck,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

interface SidebarProps {
  onCloseMobile?: () => void;
}

export function AdminSidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
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
      label: "Reviews",
      href: "/admin/reviews",
      icon: Star,
      active: pathname.startsWith("/admin/reviews"),
    },
    {
      label: "Categories",
      href: "/admin/categories",
      icon: FolderTree,
      active: pathname.startsWith("/admin/categories"),
    },
    {
      label: "Users & Roles",
      href: "/admin/users",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
    },
  ];

  const cmsNavItems = [
    {
      label: "Homepage Sections",
      href: "/admin/cms/homepage",
      icon: Layers,
      active: pathname === "/admin/cms/homepage",
    },
    {
      label: "Hero Banners",
      href: "/admin/cms/banners",
      icon: ImageIcon,
      active: pathname === "/admin/cms/banners",
    },
    {
      label: "Wall of Love",
      href: "/admin/cms/testimonials",
      icon: MessageSquareHeart,
      active: pathname === "/admin/cms/testimonials",
    },
    {
      label: "About Us Story",
      href: "/admin/cms/about",
      icon: BookOpen,
      active: pathname === "/admin/cms/about",
    },
    {
      label: "FAQs & Help",
      href: "/admin/cms/faqs",
      icon: HelpCircle,
      active: pathname === "/admin/cms/faqs",
    },
    {
      label: "Site Policies",
      href: "/admin/cms/policies",
      icon: ShieldCheck,
      active: pathname === "/admin/cms/policies",
    },
    {
      label: "Site & Footer Settings",
      href: "/admin/cms/settings",
      icon: Sliders,
      active: pathname === "/admin/cms/settings",
    },
  ];

  const inboxNavItems = [
    {
      label: "Contact Inquiries",
      href: "/admin/inbox/contact",
      icon: Mail,
      active: pathname === "/admin/inbox/contact",
    },
    {
      label: "Newsletter Leads",
      href: "/admin/inbox/leads",
      icon: UserCheck,
      active: pathname === "/admin/inbox/leads",
    },
  ];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border/70 bg-card text-card-foreground">
      {/* Brand Header */}
      <div className="flex h-16 sm:h-20 items-center justify-between px-6 border-b border-border/60">
        <Link
          href="/admin"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 font-bold text-base tracking-tight text-foreground group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs group-hover:scale-105 transition-transform">
            <Store className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-foreground text-sm">
              Kanhaiya Admin
            </span>
            <span className="text-[10px] tracking-wider uppercase font-semibold text-primary">
              Management Suite
            </span>
          </div>
        </Link>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        <div>
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
            Store Administration
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    item.active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
            Content Management (CMS)
          </div>
          <nav className="space-y-1">
            {cmsNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    item.active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
            Inboxes & Audience
          </div>
          <nav className="space-y-1">
            {inboxNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    item.active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
            Storefront
          </div>
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all group"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>View Storefront</span>
            </div>
            <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
          </Link>
        </div>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-border/60">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border/80 bg-muted/30 text-xs font-semibold text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
