"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ShopPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

export function ShopPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
}: ShopPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const navigateToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === currentPage) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (targetPage === 1) {
      params.delete("page");
    } else {
      params.set("page", String(targetPage));
    }

    const queryStr = params.toString();
    router.push(`/shop${queryStr ? `?${queryStr}` : ""}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Generate page numbers window
  const pages: number[] = [];
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 border-t border-border/70 mt-10">
      {/* Product count indicator */}
      <span className="text-xs font-medium text-muted-foreground">
        Showing <span className="font-bold text-foreground">{startItem}</span> to{" "}
        <span className="font-bold text-foreground">{endItem}</span> of{" "}
        <span className="font-bold text-foreground">{totalCount}</span> products
      </span>

      {/* Pagination Controls */}
      <nav aria-label="Catalog Pagination" className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => navigateToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex h-9 items-center gap-1 px-3 rounded-xl border border-border/80 bg-card text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* First page jump if not in window */}
        {startPage > 1 && (
          <>
            <button
              type="button"
              onClick={() => navigateToPage(1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              1
            </button>
            {startPage > 2 && (
              <span className="px-1 text-xs text-muted-foreground">…</span>
            )}
          </>
        )}

        {/* Page Number Buttons */}
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => navigateToPage(p)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
              p === currentPage
                ? "bg-primary text-primary-foreground shadow-xs"
                : "border border-border/80 bg-card text-foreground hover:bg-muted"
            }`}
          >
            {p}
          </button>
        ))}

        {/* Last page jump if not in window */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-1 text-xs text-muted-foreground">…</span>
            )}
            <button
              type="button"
              onClick={() => navigateToPage(totalPages)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => navigateToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex h-9 items-center gap-1 px-3 rounded-xl border border-border/80 bg-card text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          aria-label="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </nav>
    </div>
  );
}
