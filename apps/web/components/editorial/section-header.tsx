"use client";

import { cn } from "@farm-lease/ui/lib/utils";

/** Editorial section header: italic serif title + tracked-caps eyebrow + optional meta. */
export function SectionHeader({
  title,
  eyebrow,
  meta,
  className,
}: {
  title: string;
  eyebrow?: string;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3 flex-wrap",
        className,
      )}
    >
      <div className="flex items-baseline gap-3">
        <h2
          className="font-serif text-[13px] italic text-emerald-800 dark:text-emerald-300"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {title}
        </h2>
        {eyebrow ? (
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-500">
            {eyebrow}
          </span>
        ) : null}
      </div>
      {meta ? (
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {meta}
        </span>
      ) : null}
    </div>
  );
}
