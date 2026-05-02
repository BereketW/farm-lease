"use client";

import { cn } from "@farm-lease/ui/lib/utils";
import { GrainOverlay, MiniBars, Ornament } from "./ornament";

type Tone = "default" | "emerald" | "amber" | "rose" | "lime";

const TONE: Record<
  Tone,
  {
    card: string;
    border: string;
    label: string;
    value: string;
    hint: string;
    index: string;
    bars: "emerald" | "amber" | "rose" | "stone";
  }
> = {
  default: {
    card: "bg-stone-50/70 dark:bg-stone-900/40",
    border: "border-stone-300/70 dark:border-stone-700/60",
    label: "text-stone-600 dark:text-stone-400",
    value: "text-stone-900 dark:text-stone-50",
    hint: "text-stone-500 dark:text-stone-500",
    index: "text-stone-400 dark:text-stone-600",
    bars: "stone",
  },
  emerald: {
    card: "bg-emerald-50/60 dark:bg-emerald-950/30",
    border: "border-emerald-800/25 dark:border-emerald-500/25",
    label: "text-emerald-800/80 dark:text-emerald-400",
    value: "text-emerald-950 dark:text-emerald-50",
    hint: "text-emerald-800/60 dark:text-emerald-400/70",
    index: "text-emerald-700/40 dark:text-emerald-500/30",
    bars: "emerald",
  },
  amber: {
    card: "bg-amber-50/70 dark:bg-amber-950/25",
    border: "border-amber-800/25 dark:border-amber-500/25",
    label: "text-amber-800 dark:text-amber-400",
    value: "text-amber-950 dark:text-amber-50",
    hint: "text-amber-800/60 dark:text-amber-400/70",
    index: "text-amber-700/40 dark:text-amber-500/30",
    bars: "amber",
  },
  rose: {
    card: "bg-rose-50/60 dark:bg-rose-950/25",
    border: "border-rose-800/25 dark:border-rose-500/25",
    label: "text-rose-800 dark:text-rose-400",
    value: "text-rose-950 dark:text-rose-50",
    hint: "text-rose-800/60 dark:text-rose-400/70",
    index: "text-rose-700/40 dark:text-rose-500/30",
    bars: "rose",
  },
  lime: {
    card: "bg-lime-50/70 dark:bg-lime-950/25",
    border: "border-lime-800/25 dark:border-lime-500/25",
    label: "text-lime-800 dark:text-lime-400",
    value: "text-lime-950 dark:text-lime-50",
    hint: "text-lime-800/60 dark:text-lime-400/70",
    index: "text-lime-700/40 dark:text-lime-500/30",
    bars: "emerald",
  },
};

export function Metric({
  label,
  value,
  hint,
  tone = "default",
  className,
  index,
  bars,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: Tone;
  className?: string;
  /** Tiny almanac index shown in the corner, e.g. "i" or "01". */
  index?: string;
  /** Optional mini-bar chart values for visual interest. */
  bars?: number[];
}) {
  const t = TONE[tone];
  // Generate stable "decorative" bars from the value string if not provided.
  const decorativeBars =
    bars ??
    (typeof value === "number"
      ? [2, 4, 3, 5, Math.max(1, Math.min(7, Number(value)))]
      : [3, 5, 4, 6, 5]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-sm border bg-clip-padding px-4 pb-4 pt-3 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-colors",
        t.card,
        t.border,
        className
      )}
    >
      <GrainOverlay />
      {/* Corner index — roman-numeral-esque */}
      {index ? (
        <span
          className={cn(
            "absolute right-3 top-2 font-serif text-[11px] italic tabular-nums",
            t.index
          )}
          style={{ fontFamily: "var(--font-fraunces)" }}
          aria-hidden
        >
          {index}
        </span>
      ) : null}

      {/* Label row */}
      <div className="flex items-center gap-2">
        <Ornament className={t.label} />
        <p
          className={cn(
            "text-[10px] font-medium uppercase tracking-[0.22em]",
            t.label
          )}
        >
          {label}
        </p>
      </div>

      {/* Big figure — Fraunces italic for serif editorial feel */}
      <p
        className={cn(
          "mt-3 font-serif text-[34px] font-light leading-none tracking-tight tabular-nums",
          t.value
        )}
        style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 144" }}
      >
        {value}
      </p>

      {/* Hint + sparkline row */}
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className={cn("text-[11px] leading-snug", t.hint)}>
          {hint ?? <span className="tracking-wide">—</span>}
        </p>
        <MiniBars values={decorativeBars} tone={t.bars} className="shrink-0" />
      </div>
    </div>
  );
}
