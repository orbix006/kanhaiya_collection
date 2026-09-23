"use client";

import { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface AdminFormProps {
  title?: string;
  subtitle?: string;
  error?: string | null;
  success?: string | null;
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

export function AdminForm({
  title,
  subtitle,
  error,
  success,
  children,
  onSubmit,
  className = "",
}: AdminFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={`flex flex-col space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-xs ${className}`}
    >
      {(title || subtitle) && (
        <div className="border-b border-border/50 pb-4">
          {title && (
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      )}

      {error && <FormError message={error} />}
      {success && <FormSuccess message={success} />}

      <div className="space-y-4">{children}</div>
    </form>
  );
}

export function FormField({
  label,
  required,
  error,
  helperText,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      <label className="text-xs font-semibold text-foreground flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-destructive font-bold">*</span>}
      </label>

      {children}

      {error && (
        <p className="text-[11px] font-semibold text-destructive flex items-center gap-1 mt-0.5">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {!error && helperText && (
        <p className="text-[11px] text-muted-foreground mt-0.5">{helperText}</p>
      )}
    </div>
  );
}

export function FormInput({
  hasError,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return (
    <input
      {...props}
      className={`h-9.5 w-full rounded-xl border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 transition-all ${
        hasError
          ? "border-destructive focus:border-destructive focus:ring-destructive"
          : "border-border focus:border-primary focus:ring-primary"
      } ${className}`}
    />
  );
}

export function FormTextarea({
  hasError,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 transition-all ${
        hasError
          ? "border-destructive focus:border-destructive focus:ring-destructive"
          : "border-border focus:border-primary focus:ring-primary"
      } ${className}`}
    />
  );
}

export function FormSelect({
  hasError,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }) {
  return (
    <select
      {...props}
      className={`h-9.5 w-full rounded-xl border bg-background px-3 text-xs text-foreground focus:outline-hidden focus:ring-1 transition-all ${
        hasError
          ? "border-destructive focus:border-destructive focus:ring-destructive"
          : "border-border focus:border-primary focus:ring-primary"
      } ${className}`}
    >
      {children}
    </select>
  );
}

export function FormSwitch({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded-md border-border text-primary focus:ring-primary accent-primary"
      />
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        {description && (
          <span className="text-[11px] text-muted-foreground">
            {description}
          </span>
        )}
      </div>
    </label>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span className="font-medium leading-relaxed">{message}</span>
    </div>
  );
}

export function FormSuccess({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs text-emerald-800 dark:text-emerald-300">
      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
      <span className="font-medium leading-relaxed">{message}</span>
    </div>
  );
}

export function FormActions({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-end gap-3 pt-4 border-t border-border/60 ${className}`}>
      {children}
    </div>
  );
}

export function FormButton({
  children,
  variant = "primary",
  disabled,
  type = "button",
  onClick,
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "outline" | "destructive";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
}) {
  const variantStyles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs",
    outline: "border border-border bg-card text-foreground hover:bg-muted",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs",
  }[variant];

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer ${variantStyles} ${className}`}
    >
      {children}
    </button>
  );
}

