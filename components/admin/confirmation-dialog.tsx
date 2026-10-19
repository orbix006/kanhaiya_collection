"use client";

import React, { useEffect } from "react";
import { AlertTriangle, X, Check, Loader2 } from "lucide-react";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmationDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getButtonStyles = () => {
    switch (variant) {
      case "danger":
        return "bg-rose-600 hover:bg-rose-700 text-white shadow-xs";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white shadow-xs";
      case "primary":
      default:
        return "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs";
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case "danger":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
      case "warning":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "primary":
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs transition-opacity duration-200"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getIconColor()}`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground font-serif">
                {title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              type="button"
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              type="button"
              className="px-4 py-2 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted text-xs font-semibold text-foreground transition-colors disabled:opacity-50 cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              type="button"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer ${getButtonStyles()}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
