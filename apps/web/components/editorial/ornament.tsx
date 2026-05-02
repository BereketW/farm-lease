"use client";

import { cn } from "@farm-lease/ui/lib/utils";

/** Small editorial separator: two pips and a diamond. */
export function Ornament({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center gap-1 text-emerald-700/60 dark:text-emerald-400/50",
        className
      )}
    >
      <span className="h-[3px] w-[3px] rounded-full bg-current" />
      <span className="h-[5px] w-[5px] rotate-45 bg-current" />
      <span className="h-[3px] w-[3px] rounded-full bg-current" />
    </span>
  );
}

/** Horizontal horizon rule with centered diamond. */
export function HorizonRule({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-900/20 to-emerald-900/20 dark:via-emerald-400/20 dark:to-emerald-400/20" />
      <span className="h-1.5 w-1.5 rotate-45 bg-emerald-700 dark:bg-emerald-400" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-emerald-900/20 to-emerald-900/20 dark:via-emerald-400/20 dark:to-emerald-400/20" />
    </div>
  );
}

/** Section number tag: "Nº 01" in serif italic. */
export function SectionNumber({
  n,
  total,
  className,
}: {
  n: number | string;
  total?: number | string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 font-serif text-[13px] italic tracking-tight text-emerald-900/80 dark:text-emerald-300/80",
        className
      )}
      style={{ fontFamily: "var(--font-fraunces)" }}
    >
      <span className="text-[10px] not-italic uppercase tracking-[0.24em] text-emerald-700/70 dark:text-emerald-400/70">
        Nº
      </span>
      <span className="tabular-nums">
        {String(n).padStart(2, "0")}
      </span>
      {total != null ? (
        <span className="text-[11px] not-italic text-emerald-700/50 dark:text-emerald-500/50">
          /{String(total).padStart(2, "0")}
        </span>
      ) : null}
    </span>
  );
}

/** Tiny grain overlay for cards (CSS only). */
export function GrainOverlay({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply dark:opacity-[0.06] dark:mix-blend-screen",
        className
      )}
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(20,50,30,0.9) 0.5px, transparent 0.5px)",
        backgroundSize: "4px 4px",
      }}
    />
  );
}

/** A very small ascending mini-bar chart (5 bars). */
export function MiniBars({
  values,
  className,
  tone = "emerald",
}: {
  values: number[];
  className?: string;
  tone?: "emerald" | "amber" | "rose" | "stone";
}) {
  const max = Math.max(1, ...values);
  const palette: Record<string, string> = {
    emerald: "bg-emerald-700 dark:bg-emerald-400",
    amber: "bg-amber-600 dark:bg-amber-400",
    rose: "bg-rose-600 dark:bg-rose-400",
    stone: "bg-stone-500 dark:bg-stone-400",
  };
  return (
    <div className={cn("flex items-end gap-[2px] h-6", className)} aria-hidden>
      {values.map((v, i) => (
        <span
          key={i}
          className={cn("w-1 rounded-[1px] opacity-70", palette[tone])}
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
