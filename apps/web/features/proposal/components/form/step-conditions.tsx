"use client";

import type { UseFormReturn } from "react-hook-form";
import type { ProposalFormValues } from "../../entity/form";
import { StepShell } from "./step-shell";
import { EditorialField, EditorialTextarea } from "./editorial-fields";

export function StepConditions({
  form,
}: {
  form: UseFormReturn<ProposalFormValues>;
}) {
  return (
    <StepShell
      eyebrow="Chapter III"
      title="Summary & conditions"
      description="Give the representative the context and any custom clauses you want considered."
    >
      <div className="space-y-8">
        <EditorialField
          id="summary"
          label="Summary"
          optional
          hint="A one-paragraph pitch the representative sees first."
        >
          <EditorialTextarea
            id="summary"
            rows={3}
            placeholder="Begin with the why — the story of the land and your intent for it…"
            {...form.register("summary")}
          />
        </EditorialField>

        <EditorialField
          id="conditions"
          label="Custom conditions"
          optional
          hint="Profit-sharing, equipment provided, irrigation, payment milestones — anything beyond the headline terms."
        >
          <EditorialTextarea
            id="conditions"
            rows={7}
            placeholder="One clause per line. Example:&#10;• 70/30 profit split in favour of the cluster&#10;• Investor to provide irrigation pipeline&#10;• Payment in two tranches, sowing and harvest"
            {...form.register("conditions")}
          />
        </EditorialField>
      </div>
    </StepShell>
  );
}
