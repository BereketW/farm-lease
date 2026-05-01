"use client";

import type { UseFormReturn } from "react-hook-form";
import { Label } from "@farm-lease/ui/components/label";
import { Textarea } from "@farm-lease/ui/components/textarea";
import type { ProposalFormValues } from "./types";
import { StepShell } from "./step-shell";

export function StepConditions({
  form,
}: {
  form: UseFormReturn<ProposalFormValues>;
}) {
  return (
    <StepShell
      eyebrow="Step 3"
      title="Summary & conditions"
      description="Set context and any custom clauses to help the rep evaluate."
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="summary" className="text-xs">Summary (optional)</Label>
          <Textarea
            id="summary"
            rows={3}
            placeholder="A one-paragraph pitch the representative sees first."
            {...form.register("summary")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="conditions" className="text-xs">Custom conditions</Label>
          <Textarea
            id="conditions"
            rows={6}
            placeholder="Profit-sharing terms, equipment provided, irrigation, etc."
            {...form.register("conditions")}
          />
        </div>
      </div>
    </StepShell>
  );
}
