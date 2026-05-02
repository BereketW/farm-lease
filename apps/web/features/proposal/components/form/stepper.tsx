"use client";

import { Check } from "lucide-react";
import { cn } from "@farm-lease/ui/lib/utils";
import { FORM_STEPS } from "../../entity/form";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function FormStepper({ stepIndex }: { stepIndex: number }) {
  const total = FORM_STEPS.length;
  const progress = ((stepIndex + 1) / total) * 100;

  return (
    <div className="space-y-6">
      {/* Eyebrow */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-emerald-800/80 dark:text-emerald-300/80">
          The Composer
        </p>
        <h2
          className="mt-2 font-serif text-2xl font-light leading-none text-emerald-950 dark:text-emerald-50"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Chapter{" "}
          <span
            className="italic tabular-nums text-emerald-800 dark:text-emerald-300"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {ROMAN[stepIndex] ?? stepIndex + 1}
          </span>
        </h2>
        <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-500">
          of {total} — {Math.round(progress)}% complete
        </p>

        {/* Thin progress bar */}
        <div className="mt-3 h-px bg-emerald-950/10 dark:bg-emerald-400/15">
          <div
            className="h-px bg-emerald-800 transition-all duration-500 dark:bg-emerald-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Table of Contents */}
      <ol className="flex flex-col">
        {FORM_STEPS.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <li
              key={s.id}
              className={cn(
                "group relative grid grid-cols-[28px_minmax(0,1fr)] items-baseline gap-3 border-l-2 py-2.5 pl-3 pr-2 transition-colors",
                active
                  ? "border-emerald-800 bg-emerald-50/50 dark:border-emerald-300 dark:bg-emerald-950/30"
                  : done
                  ? "border-emerald-800/40 dark:border-emerald-300/40"
                  : "border-stone-300/60 dark:border-stone-700/60"
              )}
            >
              <span
                className={cn(
                  "font-serif text-[11px] italic tabular-nums leading-none transition-colors",
                  active
                    ? "text-emerald-800 dark:text-emerald-300"
                    : done
                    ? "text-emerald-700/70 dark:text-emerald-400/70"
                    : "text-stone-400 dark:text-stone-600"
                )}
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                {done ? (
                  <Check
                    className={cn(
                      "h-3 w-3",
                      active
                        ? "text-emerald-800"
                        : "text-emerald-700/70 dark:text-emerald-400/70"
                    )}
                  />
                ) : (
                  ROMAN[i] ?? i + 1
                )}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "font-serif text-sm leading-tight transition-colors",
                    active
                      ? "italic text-emerald-950 dark:text-emerald-50"
                      : done
                      ? "text-emerald-900/80 dark:text-emerald-200/80"
                      : "text-stone-600 dark:text-stone-400"
                  )}
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {s.label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Foot ornament */}
      <div className="flex items-center gap-2 pt-2 text-emerald-800/50 dark:text-emerald-300/40" aria-hidden>
        <span className="h-px flex-1 bg-current" />
        <span className="h-1 w-1 rotate-45 bg-current" />
        <span className="h-px flex-1 bg-current" />
      </div>
    </div>
  );
}
