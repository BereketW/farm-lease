"use client";

import { cn } from "@farm-lease/ui/lib/utils";

type Tone = "default" | "emerald" | "amber" | "rose" | "lime";

const TONE: Record<Tone, { ring: string; label: string; value: string }> = {
  default: {
    ring: "ring-zinc-200",
    label: "text-zinc-500",
    value: "text-zinc-900",
  },
  emerald: {
    ring: "ring-emerald-200",
    label: "text-emerald-700",
    value: "text-emerald-900",
  },
  amber: {
    ring: "ring-amber-200",
    label: "text-amber-700",
    value: "text-amber-900",
  },
  rose: {
    ring: "ring-rose-200",
    label: "text-rose-700",
    value: "text-rose-900",
  },
  lime: {
    ring: "ring-lime-200",
    label: "text-lime-700",
    value: "text-lime-900",
  },
};

export function Metric({
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: Tone;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <div
      className={cn(
        "rounded-2xl bg-white px-4 py-3 ring-1 shadow-sm",
        t.ring,
        className
      )}
    >
      <p className={cn("text-[10px] font-semibold uppercase tracking-[0.14em]", t.label)}>
        {label}
      </p>
      <p className={cn("mt-1 font-semibold tabular-nums", t.value)}>{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
