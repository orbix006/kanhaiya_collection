"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  X,
  MapPin,
  Package,
  Phone,
  Mail,
  Calendar,
  Clock,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  User,
  AlertTriangle,
  Copy,
  Check,
  Shield,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";
import {
  type MockCustomer,
  type MockAddress,
  type MockOrder,
  loadMockCustomers,
  updateMockUserRole,
  getMockCustomerOrders,
} from "@/lib/mock-data/admin-store";
import { updateUserRoleAction } from "@/app/(admin)/admin/users/actions";

export type CustomerProfileItem = MockCustomer;

interface UsersManagerProps {
  initialProfiles: MockCustomer[];
  currentUserId?: string;
}

export function UsersManager({
  initialProfiles,
  currentUserId,
}: UsersManagerProps) {
  const [profiles, setProfiles] = useState<MockCustomer[]>(initialProfiles);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [sortBy, setSortBy] = useState<
    "name_asc" | "name_desc" | "date_desc" | "date_asc" | "orders_desc" | "spent_desc"
  >("date_desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Drawer & Modal state
  const [selectedCustomer, setSelectedCustomer] = useState<MockCustomer | null>(null);
  const [confirmRoleModal, setConfirmRoleModal] = useState<{
    isOpen: boolean;
    targetUser: MockCustomer | null;
    newRole: "admin" | "user";
  }>({
    isOpen: false,
    targetUser: null,
    newRole: "user",
  });

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Client hydration from localStorage mock store
  useEffect(() => {
    try {
      const stored = loadMockCustomers();
      if (stored && stored.length > 0) {
        setProfiles(stored);
      }
    } catch {
      // Fallback to initialProfiles
    }
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter and sort customer profiles
  const filteredProfiles = useMemo(() => {
    const list = profiles.filter((user) => {
      // Role filter
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }

      // Search keyword
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const name = (user.full_name || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        const phone = (user.phone || "").toLowerCase();
        const id = user.id.toLowerCase();
        const addresses = (user.addresses || [])
          .map((a) => `${a.city} ${a.state} ${a.address_line1}`)
          .join(" ")
          .toLowerCase();

        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          id.includes(q) ||
          addresses.includes(q)
        );
      }

      return true;
    });

    list.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return (a.full_name || "").localeCompare(b.full_name || "");
        case "name_desc":
          return (b.full_name || "").localeCompare(a.full_name || "");
        case "date_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "orders_desc":
          return (b.orders_count || 0) - (a.orders_count || 0);
        case "spent_desc":
          return (b.total_spent || 0) - (a.total_spent || 0);
        case "date_desc":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return list;
  }, [profiles, roleFilter, searchTerm, sortBy]);

  // Dynamic metric calculations
  const stats = useMemo(() => {
    const totalCustomers = profiles.length;
    const adminCount = profiles.filter((p) => p.role === "admin").length;
    const userCount = profiles.filter((p) => p.role === "user").length;
    const totalOrdersPlaced = profiles.reduce((sum, p) => sum + (p.orders_count || 0), 0);
    const totalCustomerSpent = profiles.reduce((sum, p) => sum + (p.total_spent || 0), 0);

    return {
      totalCustomers,
      adminCount,
      userCount,
      totalOrdersPlaced,
      totalCustomerSpent,
    };
  }, [profiles]);

  // Pagination slice
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / pageSize));
  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProfiles.slice(start, start + pageSize);
  }, [filteredProfiles, currentPage, pageSize]);

  // Execute confirmed role change
  const executeRoleChange = async () => {
    if (!confirmRoleModal.targetUser) return;

    const { targetUser, newRole } = confirmRoleModal;
    const targetUserId = targetUser.id;
    const targetName = targetUser.full_name || "User";

    setConfirmRoleModal({ isOpen: false, targetUser: null, newRole: "user" });
    setUpdatingId(targetUserId);
    setActionError(null);
    setActionSuccess(null);

    try {
      // 1. Update in local mock store (persists in localStorage)
      const mockResult = updateMockUserRole(targetUserId, newRole);
      if (!mockResult.success) {
        setActionError(mockResult.error || "Failed to update role.");
        setUpdatingId(null);
        return;
      }

      // 2. Update local state
      setProfiles((prev) =>
        prev.map((p) => (p.id === targetUserId ? { ...p, role: newRole } : p))
      );

      // If drawer is currently showing this customer, update it as well
      if (selectedCustomer && selectedCustomer.id === targetUserId) {
        setSelectedCustomer((prev) => (prev ? { ...prev, role: newRole } : null));
      }

      // 3. Sync with server action
      await updateUserRoleAction(targetUserId, newRole);

      setActionSuccess(
        `Role for '${targetName}' updated successfully to '${newRole}'. Local store updated.`
      );
    } catch (err: any) {
      setActionError(err.message || "Failed to update user role.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Orders for drawer
  const customerOrders: MockOrder[] = useMemo(() => {
    if (!selectedCustomer) return [];
    return getMockCustomerOrders(selectedCustomer.id);
  }, [selectedCustomer]);

  return (
    <div className="space-y-8">
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Profiles
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.totalCustomers}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Registered customer accounts
            </p>
          </div>
        </div>

        <div
          onClick={() => setRoleFilter("admin")}
          className={`cursor-pointer rounded-2xl border ${
            roleFilter === "admin" ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40" : "border-border/80 bg-card"
          } p-5 shadow-xs transition-all hover:border-amber-500`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Store Admins
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400">
              {stats.adminCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Full administrative access
            </p>
          </div>
        </div>

        <div
          onClick={() => setRoleFilter("user")}
          className={`cursor-pointer rounded-2xl border ${
            roleFilter === "user" ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40" : "border-border/80 bg-card"
          } p-5 shadow-xs transition-all hover:border-blue-500`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Standard Users
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <UserCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.userCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Purchasing customers
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Spent
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              ₹{stats.totalCustomerSpent.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats.totalOrdersPlaced} orders placed across accounts
            </p>
          </div>
        </div>
      </div>

      {/* Role Management Prototype Disclaimer Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 text-xs text-muted-foreground space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Simulated Local Role Administration (UI Prototype)</span>
        </div>
        <p className="leading-relaxed">
          This role interface allows administrators to toggle schema-supported roles (<code>admin</code> and <code>user</code>) in the local mock store. Local role adjustments survive browser refreshes for interface testing. Role changes here do not substitute for backend server authentication, and standard users cannot elevate themselves to production administrative assets without proper credentials.
        </p>
      </div>

      {/* Action Alerts */}
      {actionError && (
        <div className="flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, email, phone, city, or profile ID..."
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Roles ({profiles.length})</option>
                <option value="admin">Administrators ({stats.adminCount})</option>
                <option value="user">Users ({stats.userCount})</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="date_desc">Joined: Newest First</option>
                <option value="date_asc">Joined: Oldest First</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
                <option value="orders_desc">Orders: Most First</option>
                <option value="spent_desc">Total Spent: High to Low</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(searchTerm || roleFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("all");
                  setSortBy("date_desc");
                }}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1.5 underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Counter Bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span>
            Showing <strong className="text-foreground">{filteredProfiles.length}</strong> of{" "}
            <strong className="text-foreground">{profiles.length}</strong> total customers
          </span>
          <div className="flex items-center gap-2">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Profiles Table */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Customer Profile</th>
                <th className="py-3.5 px-4">Contact & Location</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Member Since</th>
                <th className="py-3.5 px-4">Orders Placed</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedProfiles.length > 0 ? (
                paginatedProfiles.map((user) => {
                  const defaultShipping = user.addresses?.find((a) => a.type === "shipping" && a.is_default);
                  const isSelf = user.id === currentUserId;
                  const isUpdating = updatingId === user.id;
                  const targetName = user.full_name || "User";

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/20 transition-colors group cursor-pointer"
                      onClick={() => setSelectedCustomer(user)}
                    >
                      {/* Customer Profile Column */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <div className="relative h-9 w-9 rounded-full overflow-hidden border border-border shrink-0">
                              <Image
                                src={user.avatar_url}
                                alt={targetName}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                              {targetName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedCustomer(user)}
                              className="font-bold text-foreground text-xs hover:text-primary transition-colors text-left truncate"
                            >
                              {targetName}
                            </button>
                            <span className="text-[11px] text-muted-foreground truncate">
                              {user.email}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                                {user.id}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(user.id, user.id)}
                                title="Copy UUID"
                                className="text-muted-foreground hover:text-foreground p-0.5"
                              >
                                {copiedId === user.id ? (
                                  <Check className="h-2.5 w-2.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-2.5 w-2.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-muted-foreground">
                            {user.phone || "No phone listed"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {defaultShipping
                              ? `${defaultShipping.city}, ${defaultShipping.state}`
                              : "No address recorded"}
                          </span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {user.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-2xs">
                            <ShieldCheck className="h-3 w-3" />
                            <span>Admin</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                            <UserCheck className="h-3 w-3" />
                            <span>User</span>
                          </span>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td className="py-3.5 px-4">
                        <span className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Orders & Total Spent */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {user.orders_count || 0}{" "}
                            {user.orders_count === 1 ? "order" : "orders"}
                          </span>
                          {(user.total_spent || 0) > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              ₹{(user.total_spent || 0).toLocaleString("en-IN")} spent
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted text-xs font-semibold transition-colors shadow-2xs"
                            title="View Full Profile & Addresses"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </button>

                          {user.role === "admin" ? (
                            <button
                              type="button"
                              disabled={isUpdating || isSelf}
                              onClick={() =>
                                setConfirmRoleModal({
                                  isOpen: true,
                                  targetUser: user,
                                  newRole: "user",
                                })
                              }
                              title={
                                isSelf
                                  ? "Safety guard: You cannot demote yourself"
                                  : "Demote to standard user"
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>{isUpdating ? "Updating..." : "Demote"}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                setConfirmRoleModal({
                                  isOpen: true,
                                  targetUser: user,
                                  newRole: "admin",
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-2xs hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>{isUpdating ? "Updating..." : "Make Admin"}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-6 w-6 text-muted-foreground/60" />
                      <span className="font-semibold">No customer profiles found</span>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Try modifying search keywords or clearing the role filter.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredProfiles.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-muted/20 border-t border-border/80 text-xs">
            <span className="text-muted-foreground">
              Showing{" "}
              <strong>
                {Math.min((currentPage - 1) * pageSize + 1, filteredProfiles.length)}-
                {Math.min(currentPage * pageSize, filteredProfiles.length)}
              </strong>{" "}
              of <strong>{filteredProfiles.length}</strong> customers
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted font-medium transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </button>

              <span className="px-2 font-semibold text-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted font-medium transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CUSTOMER DETAILS SLIDE-OVER DRAWER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div
            className="w-full max-w-xl bg-card border-l border-border h-full overflow-y-auto p-6 sm:p-8 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  {selectedCustomer.avatar_url ? (
                    <div className="relative h-12 w-12 rounded-full overflow-hidden border border-border shrink-0">
                      <Image
                        src={selectedCustomer.avatar_url}
                        alt={selectedCustomer.full_name || "User"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0 border border-primary/20">
                      {(selectedCustomer.full_name || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-black text-foreground">
                      {selectedCustomer.full_name || "Unnamed Customer"}
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono">
                      {selectedCustomer.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedCustomer.role === "admin" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Administrator Profile</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Customer Account</span>
                  </span>
                )}

                <span className="text-xs text-muted-foreground font-medium px-2.5 py-1 bg-muted rounded-lg">
                  Joined:{" "}
                  {new Date(selectedCustomer.created_at).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Profile Details Card (Schema fields: id, phone, updated_at) */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border/50 font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                  <span>Account Information (profiles schema)</span>
                  <span className="font-mono">Read-Only</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-muted-foreground">Profile UUID:</span>
                    <p className="font-mono text-foreground truncate">{selectedCustomer.id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contact Phone:</span>
                    <p className="font-mono text-foreground">
                      {selectedCustomer.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Orders Placed:</span>
                    <p className="font-bold text-foreground">
                      {selectedCustomer.orders_count || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Value Spent:</span>
                    <p className="font-bold text-foreground">
                      ₹{(selectedCustomer.total_spent || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Saved Delivery Addresses (addresses schema: type, default, lines) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Customer Saved Addresses ({selectedCustomer.addresses?.length || 0})</span>
                  </div>
                </div>

                {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedCustomer.addresses.map((address) => (
                      <div
                        key={address.id}
                        className="rounded-xl border border-border p-3.5 bg-card text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground capitalize">
                              {address.type} Address
                            </span>
                            {address.is_default && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                Default {address.type}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {address.postal_code}
                          </span>
                        </div>

                        <div className="text-muted-foreground">
                          <p className="font-semibold text-foreground">{address.full_name}</p>
                          <p>{address.address_line1}</p>
                          {address.address_line2 && <p>{address.address_line2}</p>}
                          <p>
                            {address.city}, {address.state} — {address.postal_code}
                          </p>
                          <p>{address.country}</p>
                          <p className="font-mono mt-1">Phone: {address.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-border bg-muted/20 text-center text-xs text-muted-foreground italic">
                    No addresses recorded in customer profile.
                  </div>
                )}
              </div>

              {/* Customer Order History Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-primary" />
                    <span>Order History ({customerOrders.length})</span>
                  </div>
                </div>

                {customerOrders.length > 0 ? (
                  <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden bg-card text-xs">
                    {customerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/orders/${ord.id}`}
                              className="font-mono font-bold text-foreground hover:text-primary transition-colors text-xs"
                            >
                              {ord.order_number}
                            </Link>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                              {ord.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {new Date(ord.placed_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            · {ord.items?.length || 0} items
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-bold text-foreground">
                            ₹{(ord.total || 0).toLocaleString("en-IN")}
                          </p>
                          <Link
                            href={`/admin/orders/${ord.id}`}
                            className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5 font-semibold mt-0.5"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-border bg-muted/20 text-center text-xs text-muted-foreground italic">
                    This customer has not placed any orders yet.
                  </div>
                )}
              </div>

              {/* Read-Only Schema Policy Note */}
              <div className="rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <span>
                  <strong>Read-Only Notice:</strong> Customer personal profile data and delivery address books are created directly by users. Addresses on past orders remain historical immutable snapshots and are not modified by changes here.
                </span>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-6 border-t border-border flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Close Drawer
              </button>

              {/* Role Toggle inside Drawer */}
              {selectedCustomer.role === "admin" ? (
                <button
                  type="button"
                  disabled={selectedCustomer.id === currentUserId}
                  onClick={() =>
                    setConfirmRoleModal({
                      isOpen: true,
                      targetUser: selectedCustomer,
                      newRole: "user",
                    })
                  }
                  className="px-4 py-2 rounded-xl border border-destructive/40 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-40"
                >
                  Demote to User
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmRoleModal({
                      isOpen: true,
                      targetUser: selectedCustomer,
                      newRole: "admin",
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
                >
                  Promote to Admin
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ROLE CHANGE CONFIRMATION MODAL */}
      {confirmRoleModal.isOpen && confirmRoleModal.targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold text-foreground">
                {confirmRoleModal.newRole === "admin"
                  ? "Grant Administrator Privileges?"
                  : "Demote to Standard User?"}
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {confirmRoleModal.newRole === "admin"
                ? `Are you sure you want to promote ${
                    confirmRoleModal.targetUser.full_name || "this user"
                  } to Administrator? They will receive full permissions to manage store orders, product catalog, customer accounts, and site settings.`
                : `Are you sure you want to demote ${
                    confirmRoleModal.targetUser.full_name || "this user"
                  } to standard User? They will immediately lose access to the administrative dashboard.`}
            </p>

            <div className="p-3 bg-muted/40 rounded-xl text-[11px] text-muted-foreground">
              <strong>Security Protocol:</strong> In this UI prototype, role assignments persist in local development storage. Production role permissions are enforced via backend JWT and RLS security policies.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() =>
                  setConfirmRoleModal({ isOpen: false, targetUser: null, newRole: "user" })
                }
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeRoleChange}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm ${
                  confirmRoleModal.newRole === "user"
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                {confirmRoleModal.newRole === "admin" ? "Confirm Promotion" : "Confirm Demotion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
