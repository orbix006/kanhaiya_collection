"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  Package,
  Plus,
  Minus,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { adjustProductStockAction } from "@/app/(admin)/admin/products/actions";

export interface InventoryItem {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  batch_no: string | null;
  hsn_code: string | null;
  price: number;
  stock: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  category_name?: string | null;
  primary_image?: string | null;
}

interface InventoryManagerProps {
  initialItems: InventoryItem[];
}

export function InventoryManager({ initialItems }: InventoryManagerProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "low_stock" | "out_of_stock">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Stats calculation
  const stats = useMemo(() => {
    const total = items.length;
    const lowStock = items.filter((i) => i.is_low_stock && i.stock > 0).length;
    const outOfStock = items.filter((i) => i.stock <= 0).length;
    const totalUnits = items.reduce((sum, i) => sum + (i.stock || 0), 0);
    return { total, lowStock, outOfStock, totalUnits };
  }, [items]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterMode === "low_stock" && (!item.is_low_stock || item.stock <= 0)) {
        return false;
      }
      if (filterMode === "out_of_stock" && item.stock > 0) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const nameMatch = item.name.toLowerCase().includes(q);
        const skuMatch = (item.sku || "").toLowerCase().includes(q);
        const batchMatch = (item.batch_no || "").toLowerCase().includes(q);
        const hsnMatch = (item.hsn_code || "").toLowerCase().includes(q);
        const catMatch = (item.category_name || "").toLowerCase().includes(q);
        return nameMatch || skuMatch || batchMatch || hsnMatch || catMatch;
      }
      return true;
    });
  }, [items, filterMode, searchTerm]);

  // Handle relative stock change
  const handleStockAdjust = async (productId: string, delta: number) => {
    setUpdatingId(productId);
    try {
      const res = await adjustProductStockAction(productId, delta);
      if (res.success) {
        setItems((prev) =>
          prev.map((it) => {
            if (it.id === productId) {
              const newStock = typeof res.stock === "number" ? res.stock : Math.max(0, it.stock + delta);
              return {
                ...it,
                stock: newStock,
                is_low_stock: newStock <= it.low_stock_threshold,
              };
            }
            return it;
          })
        );
        setFeedback({
          type: "success",
          message: res.message || `Stock updated by ${delta > 0 ? `+${delta}` : delta}.`,
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to adjust stock.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "An unexpected error occurred.",
      });
    } finally {
      setUpdatingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-semibold animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs hover:underline cursor-pointer font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKUs */}
        <div
          onClick={() => setFilterMode("all")}
          className={`cursor-pointer rounded-2xl border ${
            filterMode === "all"
              ? "border-primary/60 bg-primary/5 ring-1 ring-primary/40"
              : "border-border/80 bg-card hover:border-border"
          } p-5 shadow-xs transition-all`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Catalog SKUs
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Boxes className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
              {stats.total}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Across all categories
            </p>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={() => setFilterMode("low_stock")}
          className={`cursor-pointer rounded-2xl border ${
            filterMode === "low_stock"
              ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40"
              : stats.lowStock > 0
              ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
              : "border-border/80 bg-card hover:border-border"
          } p-5 shadow-xs transition-all`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Low Stock Warnings
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 font-mono">
              {stats.lowStock}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Stock ≤ threshold
            </p>
          </div>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => setFilterMode("out_of_stock")}
          className={`cursor-pointer rounded-2xl border ${
            filterMode === "out_of_stock"
              ? "border-rose-500 bg-rose-500/10 ring-1 ring-rose-500/40"
              : stats.outOfStock > 0
              ? "border-rose-500/40 bg-rose-500/5 hover:border-rose-500/60"
              : "border-border/80 bg-card hover:border-border"
          } p-5 shadow-xs transition-all`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Depleted / Out of Stock
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-rose-700 dark:text-rose-400 font-mono">
              {stats.outOfStock}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Requires immediate restock
            </p>
          </div>
        </div>

        {/* Total Available Units */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Units In Stock
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Package className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
              {stats.totalUnits.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Available warehouse inventory
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Product name, SKU, Batch #, HSN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterMode === "all"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setFilterMode("low_stock")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterMode === "low_stock"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
              }`}
            >
              Low Stock ({stats.lowStock})
            </button>
            <button
              onClick={() => setFilterMode("out_of_stock")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterMode === "out_of_stock"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20"
              }`}
            >
              Depleted ({stats.outOfStock})
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No inventory records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-3">SKU</th>
                  <th className="py-3.5 px-3">Batch #</th>
                  <th className="py-3.5 px-3">HSN Code</th>
                  <th className="py-3.5 px-3">Price</th>
                  <th className="py-3.5 px-3 text-center">Available Stock</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Quick Stock Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredItems.map((item) => {
                  const isUpdating = updatingId === item.id;
                  const isDepleted = item.stock <= 0;
                  const isLow = item.is_low_stock && !isDepleted;

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      {/* Product Name & Image */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.primary_image ? (
                            <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
                              <Image
                                src={item.primary_image}
                                alt={item.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Package className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground truncate block max-w-xs" title={item.name}>
                              {item.name}
                            </span>
                            {item.category_name && (
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {item.category_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-3 font-mono text-muted-foreground text-xs whitespace-nowrap">
                        {item.sku || "—"}
                      </td>

                      {/* Batch No */}
                      <td className="py-3 px-3 font-mono text-muted-foreground text-xs whitespace-nowrap">
                        {item.batch_no || "—"}
                      </td>

                      {/* HSN Code */}
                      <td className="py-3 px-3 font-mono text-muted-foreground text-xs whitespace-nowrap">
                        {item.hsn_code || "—"}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 font-mono font-bold text-foreground whitespace-nowrap">
                        ₹{(item.price || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`font-mono font-black text-sm px-2.5 py-1 rounded-lg ${
                            isDepleted
                              ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                              : isLow
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {item.stock}
                        </span>
                        <span className="block text-[10px] text-muted-foreground mt-0.5">
                          Threshold: {item.low_stock_threshold}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isDepleted ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Quick Adjust Buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            disabled={isUpdating || item.stock <= 0}
                            onClick={() => handleStockAdjust(item.id, -1)}
                            className="h-7 w-7 rounded-lg border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Decrement 1"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <button
                            disabled={isUpdating}
                            onClick={() => handleStockAdjust(item.id, 1)}
                            className="h-7 w-7 rounded-lg border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors disabled:opacity-40"
                            title="Increment 1"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            disabled={isUpdating}
                            onClick={() => handleStockAdjust(item.id, 10)}
                            className="px-2 py-1 rounded-lg border border-border bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold transition-colors disabled:opacity-40"
                            title="Add 10 units"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
