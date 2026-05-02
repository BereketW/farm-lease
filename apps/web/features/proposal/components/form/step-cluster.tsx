"use client";

import type { UseFormReturn } from "react-hook-form";
import type { ProposalFormValues } from "../../entity/form";
import { StepShell } from "./step-shell";
import { ClusterPicker } from "./cluster-picker";

export function StepCluster({ form }: { form: UseFormReturn<ProposalFormValues> }) {
  const value = form.watch("clusterId");
  const error = form.formState.errors.clusterId;

  return (
    <StepShell
      eyebrow="Chapter I"
      title="Choose a cluster"
      description="Search, filter and pick a verified cluster — your proposal will land on its representative's desk."
    >
      <ClusterPicker
        value={value}
        onChange={(id) =>
          form.setValue("clusterId", id, { shouldValidate: true })
        }
        invalid={!!error}
      />
      {error ? (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-700 dark:text-rose-400">
          <span
            aria-hidden
            className="h-1 w-1 rotate-45 bg-rose-600 dark:bg-rose-400"
          />
          {error.message}
        </p>
      ) : null}
    </StepShell>
  );
}
