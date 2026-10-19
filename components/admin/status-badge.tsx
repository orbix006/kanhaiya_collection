"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  UserCheck,
  UserX,
  Mail,
  CheckCircle,
} from "lucide-react";

export interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md";
  showDot?: boolean;
}

export function StatusBadge({
  status,
  label,
  size = "sm",
  showDot = false,
}: StatusBadgeProps) {
  const norm = status.toLowerCase().trim();

  // Determine styles & icon
  let colorClasses = "bg-muted text-muted-foreground border-border";
  let Icon = HelpCircle;
  let defaultLabel = norm;

  switch (norm) {
    // Orders
    case "delivered":
      colorClasses =
        "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
      Icon = CheckCircle2;
      defaultLabel = "Delivered";
      break;
    case "shipped":
      colorClasses =
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";
      Icon = Truck;
      defaultLabel = "Shipped";
      break;
    case "processing":
    case "confirmed":
      colorClasses =
        "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800";
      Icon = Clock;
      defaultLabel = norm === "confirmed" ? "Confirmed" : "In Prep";
      break;
    case "pending":
      colorClasses =
        "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
      Icon = Clock;
      defaultLabel = "Pending";
      break;
    case "cancelled":
      colorClasses =
        "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
      Icon = XCircle;
      defaultLabel = "Cancelled";
      break;

    // Inventory
    case "in_stock":
      colorClasses =
        "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300";
      Icon = CheckCircle2;
      defaultLabel = "In Stock";
      break;
    case "low_stock":
      colorClasses =
        "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300";
      Icon = AlertTriangle;
      defaultLabel = "Low Stock";
      break;
    case "out_of_stock":
      colorClasses =
        "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300";
      Icon = XCircle;
      defaultLabel = "Out of Stock";
      break;

    // Customers / Status
    case "active":
      colorClasses =
        "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300";
      Icon = UserCheck;
      defaultLabel = "Active";
      break;
    case "inactive":
      colorClasses =
        "bg-muted text-muted-foreground border-border";
      Icon = UserX;
      defaultLabel = "Inactive";
      break;

    // Inbox / Leads
    case "new":
      colorClasses =
        "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300";
      Icon = Mail;
      defaultLabel = "New";
      break;
    case "in_progress":
    case "contacted":
      colorClasses =
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300";
      Icon = Clock;
      defaultLabel = norm === "contacted" ? "Contacted" : "In Progress";
      break;
    case "resolved":
    case "converted":
      colorClasses =
        "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300";
      Icon = CheckCircle;
      defaultLabel = norm === "converted" ? "Converted" : "Resolved";
      break;

    default:
      defaultLabel = norm.charAt(0).toUpperCase() + norm.slice(1);
      break;
  }

  const displayText = label || defaultLabel;
  const paddingClass = size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  const iconSizeClass = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${paddingClass} ${colorClasses}`}
    >
      {showDot ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      ) : (
        <Icon className={`${iconSizeClass} shrink-0`} />
      )}
      <span>{displayText}</span>
    </span>
  );
}
