"use client";

import type { UseFormReturn } from "react-hook-form";
import type { ProposalFormValues } from "./types";
import { StepShell } from "./step-shell";
import { Metric } from "../_design/metric";

export function StepReview({ form }: { form: UseFormReturn<ProposalFormValues> }) {
  const v = form.getValues();
  return (
    <StepShell
      eyebrow="Step 5"
      title="Review & submit"
      description="One last look. The representative will be notified instantly on submit."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          label="Budget"
          value={`${v.currency} ${Number(v.budget || 0).toLocaleString()}`}
          tone="emerald"
        />
        <Metric label="Duration" value={`${v.durationMonths || 0} mo`} tone="lime" />
        <Metric label="Start" value={v.startDate || "—"} />
        <Metric label="Crop" value={v.cropType || "—"} />
      </div>

      <dl className="mt-5 space-y-3 rounded-2xl border border-emerald-100 bg-white p-4 text-sm">
        <Row label="Title" value={v.title || "—"} />
        <Row label="Cluster" value={v.clusterId || "—"} mono />
        <Row label="Summary" value={v.summary || "—"} multiline />
        <Row label="Conditions" value={v.conditions || "—"} multiline />
      </dl>
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
  value: string;
  multiline?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-dashed border-zinc-100 pb-2 last:border-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </dt>
      <dd
        className={`${multiline ? "whitespace-pre-wrap" : "truncate"} ${
          mono ? "font-mono text-[11px]" : ""
        } text-zinc-900`}
      >
        {value}
      </dd>
    </div>
  );
}
