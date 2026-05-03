"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRightCircle, Loader2, Pencil } from "lucide-react";
import {
  EditorialButton,
  EditorialField,
  EditorialInput,
  EditorialTextarea,
  HorizonRule,
  SectionHeader,
} from "@/components/editorial";
import { createRevision } from "@/features/proposal/datasource/proposals";
import type { ProposalDetail } from "@/lib/api/types";
import { proposalDetailKey } from "../../hooks/use-proposal-detail";

export function RevisionForm({ proposal }: { proposal: ProposalDetail }) {
  const queryClient = useQueryClient();
  const [budget, setBudget] = useState(String(proposal.budget));
  const [duration, setDuration] = useState(String(proposal.durationMonths));
  const [note, setNote] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      createRevision(proposal.id, {
        budget: Number(budget),
        durationMonths: Number(duration),
        terms: proposal.terms,
        note: note || undefined,
      }),
    onSuccess: () => {
      toast.success("Counter-offer dispatched");
      setNote("");
      void queryClient.invalidateQueries({
        queryKey: proposalDetailKey(proposal.id),
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const budgetChanged = Number(budget) !== Number(proposal.budget);
  const durationChanged = Number(duration) !== Number(proposal.durationMonths);
  const dirty = budgetChanged || durationChanged || note.trim().length > 0;

  return (
    <section>
      <SectionHeader
        title="Counter-offer"
        eyebrow="Draft revision"
        meta={dirty ? "Unsent" : "No changes"}
      />
      <form
        className="mt-3 overflow-hidden rounded-sm border border-emerald-950/15 bg-white/80 shadow-[0_1px_0_rgba(0,0,0,0.02)] dark:border-emerald-400/15 dark:bg-stone-900/60"
        onSubmit={(e) => {
          e.preventDefault();
          submit.mutate();
        }}
      >
        <header className="flex items-center gap-2 border-b border-emerald-950/10 bg-emerald-50/40 px-5 py-3 dark:border-emerald-400/10 dark:bg-emerald-950/20">
          <Pencil className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300">
            Adjust the Terms
          </p>
        </header>

        <div className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <EditorialField
              id="rev-budget"
              label="Budget (ETB)"
              hint={
                budgetChanged
                  ? `Was ${Number(proposal.budget).toLocaleString()}`
                  : "Total commitment"
              }
            >
              <EditorialInput
                id="rev-budget"
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </EditorialField>
            <EditorialField
              id="rev-duration"
              label="Duration (months)"
              hint={
                durationChanged
                  ? `Was ${proposal.durationMonths} months`
                  : "Lease span"
              }
            >
              <EditorialInput
                id="rev-duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </EditorialField>
          </div>

          <EditorialField
            id="rev-note"
            label="Note to counterparty"
            optional
            hint="Explain the rationale for these revised terms."
          >
            <EditorialTextarea
              id="rev-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why these terms…"
            />
          </EditorialField>
        </div>

        <HorizonRule className="mx-6" />

        <footer className="flex items-center justify-between gap-3 px-6 py-4">
          <p
            className="font-serif text-[11px] italic text-stone-500 dark:text-stone-500"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Sent as a negotiation revision — both parties will see the change.
          </p>
          <EditorialButton
            type="submit"
            variant="primary"
            size="md"
            shimmer
            disabled={submit.isPending || !dirty}
          >
            {submit.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                Send counter-offer
                <ArrowRightCircle className="h-3.5 w-3.5" />
              </>
            )}
          </EditorialButton>
        </footer>
      </form>
    </section>
  );
}
