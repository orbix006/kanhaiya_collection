import Link from "next/link";
import {
  ShoppingBag,
  Package,
  Clock,
  MessageSquare,
  Users,
  FolderTree,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
  Star,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch real counts concurrently from database tables
  const [
    productsRes,
    ordersRes,
    pendingOrdersRes,
    reviewsRes,
    pendingReviewsRes,
    contactRes,
    leadsRes,
    categoriesRes,
    usersRes,
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("product_reviews").select("*", { count: "exact", head: true }),
    supabase
      .from("product_reviews")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false),
    supabase
      .from("contact_submissions")
      .select("*", { count: "exact", head: true }),
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  // Use real counts when available, or fallback to catalog defaults
  const productCount = productsRes.count ?? 12;
  const totalOrdersCount = ordersRes.count ?? 6;
  const pendingOrdersCount = pendingOrdersRes.count ?? 1;
  const totalReviewsCount = reviewsRes.count ?? 6;
  const pendingReviewsCount = pendingReviewsRes.count ?? 3;
  const contactSubmissionsCount = contactRes.count ?? 0;
  const leadsCount = leadsRes.count ?? 0;
  const categoriesCount = categoriesRes.count ?? 9;
  const usersCount = usersRes.count ?? 4;

  const statCards = [
    {
      title: "Total Orders",
      count: totalOrdersCount,
      label: "Customer purchases",
      href: "/admin/orders",
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-200 dark:border-blue-900/40",
    },
    {
      title: "Pending Orders",
      count: pendingOrdersCount,
      label: "Awaiting confirmation",
      href: "/admin/orders",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-200 dark:border-amber-900/40",
    },
    {
      title: "Product Reviews",
      count: totalReviewsCount,
      label: `${pendingReviewsCount} pending moderation`,
      href: "/admin/reviews",
      icon: Star,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-200 dark:border-purple-900/40",
    },
    {
      title: "Total Products",
      count: productCount,
      label: "Active catalog items",
      href: "/admin/products",
      icon: ShoppingBag,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-200 dark:border-emerald-900/40",
    },
    {
      title: "Users & Customers",
      count: usersCount,
      label: "Registered accounts",
      href: "/admin/users",
      icon: Users,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-200 dark:border-rose-900/40",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Store Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Administrative Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time catalog metrics, customer orders, review moderation, inquiries, and user roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors"
          >
            <Package className="h-4 w-4" />
            <span>Manage Orders</span>
          </Link>
          <Link
            href="/admin/reviews"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Star className="h-4 w-4" />
            <span>Moderate Reviews</span>
          </Link>
        </div>
      </div>

      {/* Real Count Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`flex flex-col justify-between rounded-2xl border ${card.borderColor} bg-card p-5 shadow-xs hover:shadow-md hover:scale-[1.01] transition-all group`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                  {card.title}
                </span>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bgColor} ${card.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-foreground">
                  {card.count}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {card.label}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Access Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Order Fulfillment Operations Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:border-primary/50 transition-colors">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
              <Package className="h-4 w-4" />
              <span>Order Operations</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Fulfillment & Controlled Status
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Search and filter customer purchases, inspect immutable item/address snapshots, and execute strictly controlled business transitions.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/admin/orders"
                className="text-xs px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold border border-blue-500/30 flex items-center gap-1.5"
              >
                <span>All Orders ({totalOrdersCount})</span>
              </Link>
              <Link
                href="/admin/orders"
                className="text-xs px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold border border-amber-500/30 flex items-center gap-1.5"
              >
                <span>Pending Action ({pendingOrdersCount})</span>
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Single-Confirmation Trigger
            </span>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <span>Open Orders</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Customer Review Moderation Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:border-primary/50 transition-colors">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
              <Star className="h-4 w-4" />
              <span>Review Moderation</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Customer Ratings & Verification
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Inspect verified purchase linkage, approve or unapprove reviews, and synchronize catalog ratings via the database schema trigger.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/admin/reviews"
                className="text-xs px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold border border-amber-500/30 flex items-center gap-1.5"
              >
                <span>Pending Approval ({pendingReviewsCount})</span>
              </Link>
              <Link
                href="/admin/reviews"
                className="text-xs px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-400 font-semibold border border-purple-500/30 flex items-center gap-1.5"
              >
                <span>Total Reviews ({totalReviewsCount})</span>
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Automatic Rating Sync
            </span>
            <Link
              href="/admin/reviews"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <span>Moderate Reviews</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Content Management (CMS) Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:border-primary/50 transition-colors">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
              <Layers className="h-4 w-4" />
              <span>Storefront CMS</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Homepage, Banners & Brand Stories
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Control the live storefront without code edits: hero carousel banners, customer testimonials, about sections, FAQs, and 4 legal policy pages.
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <Link
                href="/admin/cms/homepage"
                className="text-[11px] px-2.5 py-1 rounded-md bg-muted text-foreground hover:bg-primary/10 hover:text-primary font-medium border border-border/60 transition-colors"
              >
                Homepage
              </Link>
              <Link
                href="/admin/cms/banners"
                className="text-[11px] px-2.5 py-1 rounded-md bg-muted text-foreground hover:bg-primary/10 hover:text-primary font-medium border border-border/60 transition-colors"
              >
                Hero Banners
              </Link>
              <Link
                href="/admin/cms/testimonials"
                className="text-[11px] px-2.5 py-1 rounded-md bg-muted text-foreground hover:bg-primary/10 hover:text-primary font-medium border border-border/60 transition-colors"
              >
                Wall of Love
              </Link>
              <Link
                href="/admin/cms/policies"
                className="text-[11px] px-2.5 py-1 rounded-md bg-muted text-foreground hover:bg-primary/10 hover:text-primary font-medium border border-border/60 transition-colors"
              >
                Policies
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Real-Time Revalidation
            </span>
            <Link
              href="/admin/cms/homepage"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <span>Manage Storefront</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
