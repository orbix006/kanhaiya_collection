"use client";

import React from "react";

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3.5 w-24 bg-muted rounded-md" />
        <div className="h-10 w-10 bg-muted rounded-xl" />
      </div>
      <div className="h-8 w-32 bg-muted rounded-lg mb-2" />
      <div className="h-3 w-40 bg-muted/70 rounded-md" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs overflow-hidden animate-pulse">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
        <div className="h-5 w-48 bg-muted rounded-md" />
        <div className="h-8 w-28 bg-muted rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center gap-4 py-2">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-4 bg-muted/60 rounded"
                style={{ width: `${Math.max(15, 100 / cols - 5)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20"
        >
          <div className="h-9 w-9 bg-muted rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-40 bg-muted rounded" />
            <div className="h-2.5 w-24 bg-muted/60 rounded" />
          </div>
          <div className="h-4 w-12 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-center pb-6 border-b border-border/70">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-muted rounded-md" />
          <div className="h-8 w-64 bg-muted rounded-lg" />
          <div className="h-3.5 w-80 bg-muted/60 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-muted rounded-xl" />
          <div className="h-9 w-28 bg-muted rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <TableSkeleton rows={4} cols={5} />
          <TableSkeleton rows={3} cols={4} />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <ListSkeleton count={5} />
        </div>
      </div>
    </div>
  );
}
