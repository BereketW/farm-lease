"use client";

import { cn } from "@farm-lease/ui/lib/utils";

export type StatusTone =
  | "neutral"
  | "emerald"
  | "lime"
  | "amber"
  | "rose"
  | "sky"
  | "violet";

const TONES: Record<
  StatusTone,
  { bg: string; text: string; border: string; dot: string }
> = {
  neutral: {
    bg: "bg-stone-100/80 dark:bg-stone-800/50",
    text: "text-stone-700 dark:text-stone-300",
    border: "border-stone-300/70 dark:border-stone-700",
    dot: "bg-stone-400",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-900 dark:text-emerald-200",
    border: "border-emerald-700/30 dark:border-emerald-500/30",
    dot: "bg-emerald-600",
  },
  lime: {
    bg: "bg-lime-50 dark:bg-lime-950/40",
    text: "text-lime-900 dark:text-lime-200",
    border: "border-lime-700/30 dark:border-lime-500/30",
    dot: "bg-lime-600",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-900 dark:text-amber-200",
    border: "border-amber-700/30 dark:border-amber-500/30",
    dot: "bg-amber-600",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-900 dark:text-rose-200",
    border: "border-rose-700/30 dark:border-rose-500/30",
    dot: "bg-rose-500",
  },
  sky: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-900 dark:text-sky-200",
    border: "border-sky-700/30 dark:border-sky-500/30",
    dot: "bg-sky-600",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-900 dark:text-violet-200",
    border: "border-violet-700/30 dark:border-violet-500/30",
    dot: "bg-violet-600",
  },
};

/** Generic editorial status tag. Small caps tracked, bordered, optional pulse. */
export function StatusPill({
  label,
  tone = "neutral",
  pulse,
  size = "md",
  className,
}: {
  label: string;
  tone?: StatusTone;
  pulse?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border font-medium uppercase tracking-[0.12em]",
        t.bg,
        t.text,
        t.border,
        size === "sm" ? "px-1.5 py-[2px] text-[9px]" : "px-2 py-[3px] text-[10px]",
        className
      )}
    >
      <span className="relative inline-flex h-[6px] w-[6px]">
        {pulse ? (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
              t.dot
            )}
          />
        ) : null}
        <span className={cn("relative inline-flex h-[6px] w-[6px] rounded-full", t.dot)} />
      </span>
      {label}
    </span>
  );
}
