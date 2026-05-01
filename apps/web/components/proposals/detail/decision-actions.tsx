"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Undo2, X } from "lucide-react";
import { decideProposal, withdrawProposal } from "@/lib/api/proposals";
import type { ProposalDetail } from "@/lib/api/types";
import { proposalDetailKey } from "./use-proposal-detail";

type Props = {
  proposal: ProposalDetail;
  isInvestor: boolean;
  isRepresentative: boolean;
};

export function DecisionActions({ proposal, isInvestor, isRepresentative }: Props) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: proposalDetailKey(proposal.id) });

  const decide = useMutation({
    mutationFn: (decision: "ACCEPT" | "REJECT") =>
      decideProposal(proposal.id, decision),
    onSuccess: (_, decision) => {
      toast.success(decision === "ACCEPT" ? "Proposal accepted" : "Proposal rejected");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const withdraw = useMutation({
    mutationFn: () => withdrawProposal(proposal.id),
    onSuccess: () => {
      toast.success("Proposal withdrawn");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const isOpen =
    proposal.status === "SUBMITTED" || proposal.status === "UNDER_NEGOTIATION";

  if (!isOpen) return null;
  if (!isInvestor && !isRepresentative) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
          {isRepresentative ? "Awaiting your decision" : "Pending review"}
        </p>
        <p className="text-sm text-zinc-700">
          {isRepresentative
            ? "Accept the terms, reject, or send a counter-offer below."
            : "You can withdraw the proposal at any time before a decision."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {isRepresentative ? (
          <>
            <button
              type="button"
              onClick={() => decide.mutate("REJECT")}
              disabled={decide.isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
            <button
              type="button"
              onClick={() => decide.mutate("ACCEPT")}
              disabled={decide.isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Accept
            </button>
          </>
        ) : null}
        {isInvestor ? (
          <button
            type="button"
            onClick={() => withdraw.mutate()}
            disabled={withdraw.isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Withdraw
          </button>
        ) : null}
      </div>
    </div>
  );
}
