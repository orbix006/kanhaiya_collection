"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  badge?: string;
  variant?: "default" | "success" | "warning" | "danger" | "purple" | "blue" | "amber";
  href?: string;
  onClick?: () => void;
}

const variantStyles: Record<
  NonNullable<StatCardProps["variant"]>,
  { iconBg: string; iconColor: string; hoverBorder: string }
> = {
  default: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    hoverBorder: "hover:border-primary/40",
  },
  success: {
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    hoverBorder: "hover:border-emerald-500/40",
  },
  warning: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    hoverBorder: "hover:border-amber-500/40",
  },
  danger: {
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    hoverBorder: "hover:border-rose-500/40",
  },
  purple: {
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-600 dark:text-purple-400",
    hoverBorder: "hover:border-purple-500/40",
  },
  blue: {
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    hoverBorder: "hover:border-blue-500/40",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-700 dark:text-amber-300",
    hoverBorder: "hover:border-amber-500/40",
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  badge,
  variant = "default",
  href,
  onClick,
}: StatCardProps) {
  const styles = variantStyles[variant] || variantStyles.default;

  const content = (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-border/80 bg-card p-5 shadow-xs relative overflow-hidden transition-all duration-200 group ${
        styles.hoverBorder
      } ${href || onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${styles.iconBg} ${styles.iconColor}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
          {value}
        </span>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {badge}
          </span>
        )}
      </div>

      {(trend || description) && (
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          {trend && (
            <span
              className={`inline-flex items-center font-bold ${
                trend.isPositive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {trend.value}
            </span>
          )}
          {trend?.label && <span>{trend.label}</span>}
          {!trend && description && <span>{description}</span>}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
