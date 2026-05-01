"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRightCircle } from "lucide-react";
import { Input } from "@farm-lease/ui/components/input";
import { Label } from "@farm-lease/ui/components/label";
import { Textarea } from "@farm-lease/ui/components/textarea";
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
      toast.success("Counter-offer sent");
      setNote("");
      void queryClient.invalidateQueries({ queryKey: proposalDetailKey(proposal.id) });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <form
      className="space-y-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        submit.mutate();
      }}
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Counter-offer
        </p>
        <h3 className="text-sm font-semibold text-emerald-950">Adjust the terms</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="rev-budget" className="text-xs">Budget (ETB)</Label>
          <Input
            id="rev-budget"
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="rounded-lg border-emerald-200 bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rev-duration" className="text-xs">Duration (months)</Label>
          <Input
            id="rev-duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="rounded-lg border-emerald-200 bg-white"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rev-note" className="text-xs">Note</Label>
        <Textarea
          id="rev-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why these terms…"
          className="rounded-lg border-emerald-200 bg-white"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submit.isPending}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {submit.isPending ? "Sending…" : "Send counter-offer"}
          <ArrowRightCircle className="h-3.5 w-3.5" />
        </button>
      </div>
    </form>
  );
}
