"use client";

import * as React from "react";
import { cn } from "@farm-lease/ui/lib/utils";

/** Editorial field wrapper: label + description + input + error. */
export function EditorialField({
  id,
  label,
  hint,
  error,
  children,
  className,
  optional,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  optional?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className="flex items-baseline justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-stone-600 dark:text-stone-400"
      >
        <span>{label}</span>
        {optional ? (
          <span
            className="font-serif text-[11px] italic normal-case tracking-normal text-stone-400 dark:text-stone-500"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            optional
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-[11px] text-rose-700 dark:text-rose-400">
          <span
            aria-hidden
            className="h-1 w-1 rotate-45 bg-rose-600 dark:bg-rose-400"
          />
          {error}
        </p>
      ) : hint ? (
        <p
          className="font-serif text-[11px] italic text-stone-500 dark:text-stone-500"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Editorial input: underlined, parchment bg, serif feel on focus. */
export const EditorialInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function EditorialInput({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={cn(
        "w-full border-0 border-b-2 bg-transparent px-0 py-2 text-[15px] text-emerald-950 placeholder:font-serif placeholder:italic placeholder:text-stone-400 focus:outline-none focus:ring-0 dark:text-emerald-50 dark:placeholder:text-stone-500",
        "transition-colors",
        invalid
          ? "border-rose-500 focus:border-rose-700 dark:border-rose-500 dark:focus:border-rose-400"
          : "border-emerald-950/15 focus:border-emerald-800 dark:border-emerald-400/20 dark:focus:border-emerald-300",
        // Number inputs: tabular
        "tabular-nums",
        className
      )}
    />
  );
});

/** Editorial textarea: bordered paper card, serif placeholder. */
export const EditorialTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function EditorialTextarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      {...props}
      className={cn(
        "block w-full resize-y rounded-sm border bg-stone-50/60 px-3 py-2.5 text-[14px] leading-relaxed text-emerald-950 placeholder:font-serif placeholder:italic placeholder:text-stone-400 focus:outline-none focus:ring-0 dark:bg-stone-900/40 dark:text-emerald-50 dark:placeholder:text-stone-500",
        "transition-colors",
        invalid
          ? "border-rose-500 focus:border-rose-700 dark:border-rose-500"
          : "border-emerald-950/15 focus:border-emerald-800 dark:border-emerald-400/20 dark:focus:border-emerald-300",
        className
      )}
    />
  );
});
