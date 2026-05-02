"use client";

import type { UseFormReturn } from "react-hook-form";
import type { ProposalFormValues } from "../../entity/form";
import { StepShell } from "./step-shell";
import { Metric } from "../_design/metric";

export function StepReview({ form }: { form: UseFormReturn<ProposalFormValues> }) {
  const v = form.getValues();
  const currency = v.currency || "ETB";
  return (
    <StepShell
      eyebrow="Chapter V"
      title="Review & submit"
      description="One last look. The representative is notified the moment you submit."
    >
      {/* Masthead figures — almanac block */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-emerald-950/15 bg-emerald-950/10 dark:border-emerald-400/15 dark:bg-emerald-400/10 sm:grid-cols-4">
        <Metric
          label="Budget"
          value={`${currency} ${Number(v.budget || 0).toLocaleString()}`}
          tone="emerald"
          hint="Offered to the cluster"
          index="i"
          className="rounded-none border-0"
        />
        <Metric
          label="Duration"
          value={`${v.durationMonths || 0} mo`}
          tone="lime"
          hint="Lease term"
          index="ii"
          className="rounded-none border-0"
        />
        <Metric
          label="Start"
          value={v.startDate || "—"}
          hint="When work begins"
          index="iii"
          className="rounded-none border-0"
        />
        <Metric
          label="Crop"
          value={v.cropType || "—"}
          tone="amber"
          hint="Intended harvest"
          index="iv"
          className="rounded-none border-0"
        />
      </div>

      {/* Manuscript details */}
      <section className="relative mt-8 border-l-2 border-emerald-800/60 pl-5 dark:border-emerald-300/60">
        <span
          className="absolute -left-[5px] top-0 h-2 w-2 rotate-45 bg-emerald-800 dark:bg-emerald-300"
          aria-hidden
        />
        <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-emerald-800/80 dark:text-emerald-300/80">
          The manuscript
        </p>
        <dl className="mt-4 space-y-5">
          <Row label="Title" value={v.title} />
          <Row label="Cluster" value={v.clusterId} mono />
          <Row label="Summary" value={v.summary} multiline />
          <Row label="Conditions" value={v.conditions} multiline />
        </dl>
      </section>
    </StepShell>
  );
}

function Row({
  label,
  value,
  multiline,
  mono,
}: {
  label: string;
  value?: string;
  multiline?: boolean;
  mono?: boolean;
}) {
  const empty = !value;
  return (
    <div className="grid gap-1 border-b border-dashed border-emerald-950/10 pb-4 last:border-0 dark:border-emerald-400/10 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-6">
      <dt className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-500">
        {label}
      </dt>
      <dd
        className={[
          multiline ? "whitespace-pre-wrap" : "truncate",
          mono
            ? "font-mono text-[11px] text-stone-700 dark:text-stone-400"
            : "font-serif text-[15px] leading-relaxed text-emerald-950 dark:text-emerald-50",
          empty ? "italic text-stone-400 dark:text-stone-500" : "",
        ].join(" ")}
        style={
          !mono
            ? { fontFamily: "var(--font-fraunces)" }
            : { fontFamily: "var(--font-geist-mono)" }
        }
      >
        {empty ? "— not set" : value}
      </dd>
    </div>
  );
}
