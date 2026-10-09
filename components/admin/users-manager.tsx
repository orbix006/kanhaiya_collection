"use client";

import { useState } from "react";
import Image from "next/image";
import { ShieldCheck, UserCheck, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { AdminDataTable, Column } from "./data-table";
import { updateUserRoleAction } from "@/app/(admin)/admin/users/actions";

export interface UserProfileItem {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: "admin" | "user";
  created_at: string;
  updated_at?: string;
}

interface UsersManagerProps {
  initialProfiles: UserProfileItem[];
  currentUserId?: string;
}

export function UsersManager({
  initialProfiles,
  currentUserId,
}: UsersManagerProps) {
  const [profiles, setProfiles] = useState<UserProfileItem[]>(initialProfiles);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleRoleChange = async (
    targetUserId: string,
    targetName: string,
    newRole: "admin" | "user"
  ) => {
    const confirmMessage =
      newRole === "admin"
        ? `Grant Administrator privileges to ${targetName}? They will have full access to manage store data and users.`
        : `Demote ${targetName} to standard User role? They will lose all administrative dashboard access.`;

    if (!window.confirm(confirmMessage)) return;

    setUpdatingId(targetUserId);
    setActionError(null);
    setActionSuccess(null);

    const res = await updateUserRoleAction(targetUserId, newRole);

    setUpdatingId(null);

    if (res.error) {
      setActionError(res.error);
    } else {
      setActionSuccess(res.message || `Role updated successfully to '${newRole}'.`);
      setProfiles((prev) =>
        prev.map((p) => (p.id === targetUserId ? { ...p, role: newRole } : p))
      );
    }
  };

  const columns: Column<UserProfileItem>[] = [
    {
      key: "user",
      header: "User Profile",
      sortable: true,
      render: (item) => {
        const name = item.full_name || "Unnamed User";
        return (
          <div className="flex items-center gap-3">
            {item.avatar_url ? (
              <div className="relative h-9 w-9 rounded-full overflow-hidden border border-border shrink-0">
                <Image
                  src={item.avatar_url}
                  alt={name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-foreground text-xs truncate">
                {name}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[150px]">
                {item.id}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      header: "Current Role",
      sortable: true,
      render: (item) => (
        <div>
          {item.role === "admin" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300/50 shadow-2xs">
              <ShieldCheck className="h-3 w-3" />
              <span>Admin</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
              <UserCheck className="h-3 w-3" />
              <span>User</span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Contact Phone",
      render: (item) => (
        <span className="text-muted-foreground text-xs">
          {item.phone || "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Registered On",
      sortable: true,
      render: (item) => {
        const date = new Date(item.created_at);
        return (
          <span className="text-muted-foreground text-xs">
            {isNaN(date.getTime())
              ? item.created_at
              : date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (item) => {
        const isSelf = item.id === currentUserId;
        const isUpdating = updatingId === item.id;
        const targetName = item.full_name || "User";

        if (item.role === "admin") {
          return (
            <div className="flex items-center justify-end">
              <button
                type="button"
                disabled={isUpdating || isSelf}
                onClick={() => handleRoleChange(item.id, targetName, "user")}
                title={isSelf ? "You cannot demote yourself" : "Demote to standard user"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>{isUpdating ? "Updating..." : "Demote to User"}</span>
              </button>
            </div>
          );
        }

        return (
          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleRoleChange(item.id, targetName, "admin")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-2xs hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{isUpdating ? "Updating..." : "Promote to Admin"}</span>
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Reusable Data Table */}
      <AdminDataTable
        columns={columns}
        data={profiles}
        searchPlaceholder="Search users by name, ID, or role..."
        searchKeys={["full_name", "id", "role", "phone"]}
        defaultPageSize={10}
        emptyMessage="No user profiles found."
      />
    </div>
  );
}
