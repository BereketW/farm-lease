"use client";

import * as React from "react";
import { cn } from "@farm-lease/ui/lib/utils";
import { HorizonRule } from "./ornament";

/** Ledger table container with editorial header and footer rule. */
export function EditorialTable({
  title,
  eyebrow,
  count,
  children,
  className,
  footer = true,
  tableHead,
}: {
  title?: string;
  eyebrow?: string;
  count?: number;
  children: React.ReactNode;
  className?: string;
  footer?: boolean;
  /** Optional column-header row (for table-mode views). */
  tableHead?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-sm border border-emerald-950/10 bg-white/60 backdrop-blur-[1px] dark:border-emerald-400/10 dark:bg-stone-950/40",
        className,
      )}
    >
      {title || eyebrow || count != null ? (
        <div className="flex items-baseline justify-between border-b border-emerald-950/10 bg-stone-50/60 px-4 py-3 dark:border-emerald-400/10 dark:bg-stone-900/30 sm:px-6">
          <div className="flex items-baseline gap-3">
            {title ? (
              <span
                className="font-serif text-[13px] italic text-emerald-800 dark:text-emerald-300"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                {title}
              </span>
            ) : null}
            {eyebrow ? (
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-500">
                {eyebrow}
              </span>
            ) : null}
          </div>
          {count != null ? (
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {String(count).padStart(2, "0")} entries
            </span>
          ) : null}
        </div>
      ) : null}
      {tableHead}
      <div>{children}</div>
      {footer ? (
        <div className="border-t border-emerald-950/10 bg-stone-50/40 px-6 py-3 dark:border-emerald-400/10 dark:bg-stone-900/30">
          <HorizonRule />
        </div>
      ) : null}
    </div>
  );
}

/** Editorial column header row, for table-mode views. */
export function EditorialTableHead({
  columns,
  className,
}: {
  columns: { label: string; className?: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "hidden border-b border-emerald-950/10 bg-stone-50/40 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:border-emerald-400/10 dark:bg-stone-900/20 dark:text-stone-500 sm:grid sm:px-6",
        className,
      )}
    >
      {columns.map((c, i) => (
        <span key={i} className={c.className}>
          {c.label}
        </span>
      ))}
    </div>
  );
}

/** Reusable editorial ledger row. Composable: pass children in desired column layout. */
export function EditorialRow({
  href,
  onClick,
  index,
  children,
  className,
  as = "div",
}: {
  href?: string;
  onClick?: () => void;
  /** Numeric index rendered in Fraunces italic at left. */
  index?: number | string;
  children: React.ReactNode;
  className?: string;
  /** Render as div, or as anchor via Next `<Link>` via href. */
  as?: "div" | "button";
}) {
  const content = (
    <>
      {index != null ? (
        <span
          className="select-none font-serif text-2xl italic leading-none tabular-nums text-emerald-900/35 transition-colors group-hover:text-emerald-700 dark:text-emerald-300/25 dark:group-hover:text-emerald-300 sm:text-3xl"
          style={{ fontFamily: "var(--font-fraunces)" }}
          aria-hidden
        >
          {typeof index === "number"
            ? String(index).padStart(2, "0")
            : index}
        </span>
      ) : null}
      {children}
    </>
  );

  const baseClass = cn(
    "group relative grid items-center gap-4 border-b border-emerald-950/10 px-4 py-5 transition-colors first:border-t-0 hover:bg-stone-50/60 dark:border-emerald-400/10 dark:hover:bg-stone-900/20 sm:gap-6 sm:px-6 text-left",
    index != null
      ? "grid-cols-[48px_minmax(0,1fr)_auto] sm:grid-cols-[56px_minmax(0,1fr)_auto_auto]"
      : "grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_auto_auto]",
    className,
  );

  if (href) {
    // Dynamically import Link lazily — but keep static for RSC-friendliness.
    // Consumers prefer to wrap in Link themselves via `as="div"` + outer Link.
    return (
      <a href={href} className={baseClass}>
        {content}
      </a>
    );
  }

  if (as === "button") {
    return (
      <button type="button" onClick={onClick} className={baseClass}>
        {content}
      </button>
    );
  }

  return (
    <div className={baseClass} onClick={onClick}>
      {content}
    </div>
  );
}

/** Skeleton row matching the ledger layout. */
export function EditorialRowSkeleton() {
  return (
    <div className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 border-b border-emerald-950/10 px-4 py-5 last:border-b-0 dark:border-emerald-400/10 sm:grid-cols-[56px_minmax(0,1fr)_auto_auto] sm:gap-6 sm:px-6">
      <div className="h-6 w-6 animate-pulse rounded-sm bg-stone-200/70 dark:bg-stone-800/70" />
      <div className="space-y-2">
        <div className="h-4 w-2/5 animate-pulse rounded-sm bg-stone-200/70 dark:bg-stone-800/70" />
        <div className="h-3 w-3/5 animate-pulse rounded-sm bg-stone-200/50 dark:bg-stone-800/50" />
      </div>
      <div className="hidden h-6 w-24 animate-pulse rounded-sm bg-stone-200/70 dark:bg-stone-800/70 sm:block" />
      <div className="h-9 w-9 animate-pulse rounded-full bg-stone-200/70 dark:bg-stone-800/70" />
    </div>
  );
}

/** Editorial empty-state card. */
export function EditorialEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-sm border border-dashed border-emerald-800/25 bg-stone-50/50 px-6 py-14 text-center dark:border-emerald-400/25 dark:bg-stone-900/30">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-800/30 to-transparent" />
      {icon ? (
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-emerald-800/25 bg-white text-emerald-800 dark:border-emerald-400/25 dark:bg-stone-950 dark:text-emerald-300">
          {icon}
        </span>
      ) : null}
      <p
        className="mt-4 font-serif text-xl italic text-emerald-950 dark:text-emerald-100"
        style={{ fontFamily: "var(--font-fraunces)" }}
      >
        {title}
      </p>
      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-stone-600 dark:text-stone-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Editorial pagination (prev / next / page indicator). */
export function EditorialPagination({
  page,
  pageCount,
  onPageChange,
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange: (p: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-emerald-950/10 bg-stone-50/40 px-6 py-3 dark:border-emerald-400/10 dark:bg-stone-900/30",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="border-b border-transparent py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-stone-600 transition-colors hover:border-stone-600 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-30 dark:text-stone-400 dark:hover:border-stone-400 dark:hover:text-stone-100"
      >
        ← Prev
      </button>
      <span
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        Page {String(page).padStart(2, "0")}{" "}
        <span className="text-stone-400 dark:text-stone-600">
          / {String(pageCount).padStart(2, "0")}
        </span>
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page >= pageCount}
        className="border-b border-transparent py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-stone-600 transition-colors hover:border-stone-600 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-30 dark:text-stone-400 dark:hover:border-stone-400 dark:hover:text-stone-100"
      >
        Next →
      </button>
    </div>
  );
}
