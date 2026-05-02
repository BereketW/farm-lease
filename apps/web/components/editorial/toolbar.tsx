"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@farm-lease/ui/lib/utils";

/** Underlined editorial search input with icon and clear button. */
export function EditorialSearch({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "group flex items-center gap-2 border-b-2 border-emerald-950/15 bg-transparent py-1.5 transition-colors focus-within:border-emerald-800 dark:border-emerald-400/20 dark:focus-within:border-emerald-300",
        className,
      )}
    >
      <Search className="h-3.5 w-3.5 text-emerald-800/60 dark:text-emerald-300/60" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[13px] text-emerald-950 placeholder:font-serif placeholder:italic placeholder:text-stone-400 focus:outline-none dark:text-emerald-50 dark:placeholder:text-stone-500"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </label>
  );
}

/** Editorial segmented toggle (e.g., view mode: Cards / Table). */
export function EditorialToggle<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center overflow-hidden rounded-sm border border-emerald-950/15 bg-stone-50/60 dark:border-emerald-400/15 dark:bg-stone-900/40",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] transition-colors",
              active
                ? "bg-emerald-900 text-stone-50 dark:bg-emerald-300 dark:text-emerald-950"
                : "text-stone-600 hover:bg-stone-100/70 dark:text-stone-400 dark:hover:bg-stone-800/50",
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Editorial select (for filters). Hairline underline, native select dropdown. */
export function EditorialSelect({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  className?: string;
}) {
  return (
    <label className={cn("inline-flex items-center gap-2", className)}>
      {label ? (
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-500">
          {label}
        </span>
      ) : null}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-b-2 border-emerald-950/15 bg-transparent py-1.5 pr-6 text-[13px] text-emerald-950 focus:border-emerald-800 focus:outline-none dark:border-emerald-400/20 dark:text-emerald-50 dark:focus:border-emerald-300"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-white dark:bg-stone-900">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
