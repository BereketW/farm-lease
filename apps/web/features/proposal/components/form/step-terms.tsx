"use client";

import type { UseFormReturn } from "react-hook-form";
import type { ProposalFormValues } from "../../entity/form";
import { StepShell } from "./step-shell";
import { EditorialField, EditorialInput } from "./editorial-fields";

export function StepTerms({ form }: { form: UseFormReturn<ProposalFormValues> }) {
  const errors = form.formState.errors;
  return (
    <StepShell
      eyebrow="Chapter II"
      title="Lease terms"
      description="The headline numbers — these appear on the proposal's front page."
    >
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
        <EditorialField
          id="title"
          label="Proposal title"
          error={errors.title?.message}
          hint="A short, descriptive headline."
          className="sm:col-span-2"
        >
          <EditorialInput
            id="title"
            {...form.register("title")}
            placeholder="Two-year teff lease in Amhara"
            invalid={!!errors.title}
          />
        </EditorialField>

        <EditorialField
          id="cropType"
          label="Crop type"
          error={errors.cropType?.message}
        >
          <EditorialInput
            id="cropType"
            {...form.register("cropType")}
            placeholder="Teff, maize, sorghum…"
            invalid={!!errors.cropType}
          />
        </EditorialField>

        <EditorialField
          id="durationMonths"
          label="Duration · months"
          error={errors.durationMonths?.message}
        >
          <EditorialInput
            id="durationMonths"
            type="number"
            min={1}
            placeholder="24"
            {...form.register("durationMonths")}
            invalid={!!errors.durationMonths}
          />
        </EditorialField>

        <EditorialField
          id="startDate"
          label="Start date"
          error={errors.startDate?.message}
        >
          <EditorialInput
            id="startDate"
            type="date"
            {...form.register("startDate")}
            invalid={!!errors.startDate}
          />
        </EditorialField>

        <EditorialField
          id="budget"
          label="Budget · offered"
          error={errors.budget?.message}
        >
          <div className="relative flex items-baseline gap-3 border-b-2 border-emerald-950/15 focus-within:border-emerald-800 dark:border-emerald-400/20 dark:focus-within:border-emerald-300">
            <span
              className="pointer-events-none font-serif text-[13px] italic text-stone-500 dark:text-stone-500"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {form.watch("currency") || "ETB"}
            </span>
            <EditorialInput
              id="budget"
              type="number"
              step="0.01"
              placeholder="250000"
              {...form.register("budget")}
              invalid={!!errors.budget}
              className="border-0 focus:border-0 pl-0"
            />
          </div>
        </EditorialField>

        <EditorialField
          id="currency"
          label="Currency"
          error={errors.currency?.message}
        >
          <EditorialInput
            id="currency"
            {...form.register("currency")}
            placeholder="ETB"
            invalid={!!errors.currency}
            className="uppercase tracking-[0.12em]"
          />
        </EditorialField>
      </div>
    </StepShell>
  );
}
