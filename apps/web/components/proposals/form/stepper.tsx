"use client";

import { Check } from "lucide-react";
import { cn } from "@farm-lease/ui/lib/utils";
import { FORM_STEPS } from "./types";

export function FormStepper({ stepIndex }: { stepIndex: number }) {
  const total = FORM_STEPS.length;
  const progress = ((stepIndex + 1) / total) * 100;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
          New proposal
        </p>
        <h2 className="text-lg font-semibold tracking-tight text-emerald-950">
          Step {stepIndex + 1} of {total}
        </h2>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-100">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ol className="flex flex-col gap-1">
        {FORM_STEPS.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <li
              key={s.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition",
                active && "bg-emerald-50"
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                  done && "bg-emerald-600 text-white",
                  active && "bg-white text-emerald-700 ring-2 ring-emerald-500",
                  !done && !active && "bg-zinc-100 text-zinc-500"
                )}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  "font-medium",
                  active ? "text-emerald-950" : done ? "text-emerald-700" : "text-zinc-500"
                )}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
