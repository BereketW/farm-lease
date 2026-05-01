"use client";

import type { UseFormReturn } from "react-hook-form";
import { Input } from "@farm-lease/ui/components/input";
import { Label } from "@farm-lease/ui/components/label";
import type { ProposalFormValues } from "./types";
import { StepShell } from "./step-shell";

export function StepTerms({ form }: { form: UseFormReturn<ProposalFormValues> }) {
  const errors = form.formState.errors;
  return (
    <StepShell
      eyebrow="Step 2"
      title="Lease terms"
      description="The headline numbers shown on the proposal hero."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title" id="title" error={errors.title?.message}>
          <Input id="title" {...form.register("title")} placeholder="2-year teff lease" />
        </Field>
        <Field label="Crop type" id="cropType" error={errors.cropType?.message}>
          <Input id="cropType" {...form.register("cropType")} placeholder="Teff, maize…" />
        </Field>
        <Field
          label="Duration (months)"
          id="durationMonths"
          error={errors.durationMonths?.message}
        >
          <Input id="durationMonths" type="number" {...form.register("durationMonths")} />
        </Field>
        <Field label="Start date" id="startDate" error={errors.startDate?.message}>
          <Input id="startDate" type="date" {...form.register("startDate")} />
        </Field>
        <Field label="Budget" id="budget" error={errors.budget?.message}>
          <Input id="budget" type="number" step="0.01" {...form.register("budget")} />
        </Field>
        <Field label="Currency" id="currency" error={errors.currency?.message}>
          <Input id="currency" {...form.register("currency")} />
        </Field>
      </div>
    </StepShell>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-zinc-700">
        {label}
      </Label>
      {children}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
