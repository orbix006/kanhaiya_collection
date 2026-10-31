import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  message?: string;
}

export function LoadingSpinner({
  size = "md",
  className = "",
  message,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      role="status"
      aria-label={message || "Loading..."}
      className={`flex flex-col items-center justify-center p-6 text-center ${className}`}
    >
      <Loader2
        className={`animate-spin text-[#C8891A] ${sizeClasses[size]}`}
      />
      {message && (
        <p className="mt-3 text-sm font-medium text-[#806B57]">{message}</p>
      )}
      <span className="sr-only">{message || "Loading..."}</span>
    </div>
  );
}

