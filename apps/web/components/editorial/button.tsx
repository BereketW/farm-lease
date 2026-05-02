"use client";

import * as React from "react";
import { cn } from "@farm-lease/ui/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "link";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "border border-emerald-900 bg-emerald-950 text-stone-50 shadow-[0_1px_0_rgba(0,0,0,0.3)] hover:-translate-y-[1px] hover:bg-emerald-900 hover:shadow-[0_3px_0_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:translate-y-0 disabled:shadow-[0_1px_0_rgba(0,0,0,0.3)] dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200",
  secondary:
    "border border-emerald-800/40 bg-white text-emerald-900 shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:-translate-y-[1px] hover:border-emerald-800 hover:bg-stone-50 hover:shadow-[0_3px_0_rgba(0,0,0,0.06)] dark:border-emerald-400/40 dark:bg-stone-950 dark:text-emerald-100 dark:hover:border-emerald-400",
  ghost:
    "border border-transparent text-stone-600 hover:border-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:border-stone-400 dark:hover:text-stone-100",
  link:
    "border-0 border-b border-transparent px-0 py-1 text-emerald-800 hover:border-emerald-800 hover:text-emerald-900 dark:text-emerald-300 dark:hover:border-emerald-300 dark:hover:text-emerald-200",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[10px]",
  md: "px-4 py-2 text-[11px]",
  lg: "px-6 py-3 text-[11px]",
};

/** Editorial CTA button. Small-caps tracked, press-down shadow, shimmer on primary. */
export const EditorialButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    shimmer?: boolean;
  }
>(function EditorialButton(
  { variant = "secondary", size = "md", shimmer, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      {...props}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-sm font-medium uppercase tracking-[0.22em] transition-all disabled:cursor-not-allowed",
        variant !== "link" && SIZES[size],
        VARIANTS[variant],
        className,
      )}
    >
      {shimmer && variant === "primary" ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />
      ) : null}
      {children}
    </button>
  );
});
