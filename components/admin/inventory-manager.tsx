"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Save,
  Loader2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import type { Product, Category } from "@/lib/store";
import { updateProductStockAction } from "@/lib/actions/admin";

interface InventoryManagerProps {
  initialProducts: Product[];
  categories: Category[];
}

export function InventoryManager({
  initialProducts,
  categories,
}: InventoryManagerProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out" | "healthy">("all");
  const [editingStock, setEditingStock] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const showToast = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const getStockValue = (product: Product) => {
    if (editingStock[product.id] !== undefined) {
      return editingStock[product.id];
    }
    return product.stock_quantity ?? 0;
  };

  const handleStockChange = (productId: string, val: number) => {
    setEditingStock((prev) => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const handleAdjust = (productId: string, delta: number) => {
    const current = getStockValue(products.find((p) => p.id === productId)!);
    handleStockChange(productId, current + delta);
  };

  const handleSaveStock = async (product: Product) => {
    const newStock = getStockValue(product);
    setSavingId(product.id);
    try {
      const res = await updateProductStockAction(product.id, newStock);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, stock_quantity: newStock } : p))
        );
        setEditingStock((prev) => {
          const next = { ...prev };
          delete next[product.id];
          return next;
        });
        showToast("success", `Updated ${product.name} stock to ${newStock} units`);
      } else {
        showToast("error", res.error || "Failed to update stock");
      }
    } catch {
      showToast("error", "Error connecting to local storage");
    } finally {
      setSavingId(null);
    }
  };

  // Filtered dataset
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.slug && p.slug.toLowerCase().includes(search.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" || p.category_id === selectedCategory;

    const stock = p.stock_quantity ?? 0;
    let matchesStock = true;
    if (stockFilter === "out") matchesStock = stock === 0;
    if (stockFilter === "low") matchesStock = stock > 0 && stock <= 15;
    if (stockFilter === "healthy") matchesStock = stock > 15;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalCount = products.length;
  const outOfStockCount = products.filter((p) => (p.stock_quantity ?? 0) === 0).length;
  const lowStockCount = products.filter(
    (p) => (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) <= 15
  ).length;
  const healthyCount = products.filter((p) => (p.stock_quantity ?? 0) > 15).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 1. Header with Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total SKUs
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-1">
            {totalCount}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Catalog items</div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Healthy Stock (&gt;15)
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
            {healthyCount}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Fully stocked</div>
        </div>

        <div className="rounded-2xl border border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Low Stock (&le;15)</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-800 dark:text-amber-300 mt-1">
            {lowStockCount}
          </div>
          <div className="text-[11px] text-amber-700/80 mt-1">Needs reordering</div>
        </div>

        <div className="rounded-2xl border border-red-300/60 bg-red-50/50 dark:bg-red-950/20 p-4 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5" />
            <span>Out of Stock</span>
          </div>
          <div className="text-2xl font-extrabold text-red-700 dark:text-red-400 mt-1">
            {outOfStockCount}
          </div>
          <div className="text-[11px] text-red-600/80 mt-1">Immediate action</div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, SKU, or brand..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-background text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Stock Status Pills */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "low", label: "Low Stock" },
                  { id: "out", label: "Out of Stock" },
                  { id: "healthy", label: "Healthy" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStockFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    stockFilter === tab.id
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Products Stock Inventory Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4">Quick Adjust</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No products found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const currentStock = getStockValue(product);
                  const isDirty =
                    editingStock[product.id] !== undefined &&
                    editingStock[product.id] !== product.stock_quantity;
                  const isSaving = savingId === product.id;

                  const categoryName =
                    categories.find((c) => c.id === product.category_id)?.name || "General";

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-muted/20 transition-colors ${
                        isDirty ? "bg-amber-50/30 dark:bg-amber-950/10" : ""
                      }`}
                    >
                      {/* Product Name & Image */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                            <Image
                              src={product.image_url || "/images/preview-murti.jpg"}
                              alt={product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div>
                            <div className="font-bold text-foreground max-w-[240px] truncate">
                              {product.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                              <span>{categoryName}</span>
                              <span>•</span>
                              <span className="font-mono">{product.slug}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-bold text-foreground">
                        ₹{Number(product.base_price).toLocaleString("en-IN")}
                      </td>

                      {/* Stock Value & Progress Bar */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-foreground">
                              {currentStock} units
                            </span>
                          </div>
                          {/* Visual stock bar */}
                          <div className="h-1.5 w-28 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full transition-all rounded-full ${
                                currentStock === 0
                                  ? "w-0 bg-red-600"
                                  : currentStock <= 5
                                  ? "bg-red-500"
                                  : currentStock <= 15
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{
                                width: `${Math.min(100, Math.max(5, (currentStock / 50) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        {currentStock === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300">
                            <XCircle className="h-3 w-3" /> Out of Stock
                          </span>
                        ) : currentStock <= 5 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                            <AlertTriangle className="h-3 w-3" /> Critical Low
                          </span>
                        ) : currentStock <= 15 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="h-3 w-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> In Stock
                          </span>
                        )}
                      </td>

                      {/* Quick Adjust Buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAdjust(product.id, -5)}
                            disabled={currentStock <= 0}
                            className="px-2 py-1 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold disabled:opacity-30"
                            title="Decrease 5"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjust(product.id, -1)}
                            disabled={currentStock <= 0}
                            className="px-2 py-1 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold disabled:opacity-30"
                            title="Decrease 1"
                          >
                            -1
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={currentStock}
                            onChange={(e) =>
                              handleStockChange(product.id, parseInt(e.target.value || "0", 10))
                            }
                            className="w-14 h-7 text-center rounded-md border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <button
                            type="button"
                            onClick={() => handleAdjust(product.id, 1)}
                            className="px-2 py-1 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold"
                            title="Increase 1"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjust(product.id, 10)}
                            className="px-2 py-1 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold"
                            title="Increase 10"
                          >
                            +10
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSaveStock(product)}
                          disabled={!isDirty || isSaving}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            isDirty
                              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
                              : "bg-muted text-muted-foreground/60 cursor-not-allowed"
                          }`}
                        >
                          {isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          <span>Save</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
