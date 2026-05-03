"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Gavel, Loader2, Undo2, X } from "lucide-react";
import { cn } from "@farm-lease/ui/lib/utils";
import {
  decideProposal,
  withdrawProposal,
} from "@/features/proposal/datasource/proposals";
import type { ProposalDetail } from "@/lib/api/types";
import { proposalDetailKey } from "../../hooks/use-proposal-detail";

type Props = {
  proposal: ProposalDetail;
  isInvestor: boolean;
  isRepresentative: boolean;
};

export function DecisionActions({
  proposal,
  isInvestor,
  isRepresentative,
}: Props) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: proposalDetailKey(proposal.id) });

  const decide = useMutation({
    mutationFn: (decision: "ACCEPT" | "REJECT") =>
      decideProposal(proposal.id, decision),
    onSuccess: (_, decision) => {
      toast.success(
        decision === "ACCEPT" ? "Proposal accepted" : "Proposal rejected"
      );
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
    proposal.status === "SUBMITTED" ||
    proposal.status === "UNDER_NEGOTIATION";

  if (!isOpen) return null;
  if (!isInvestor && !isRepresentative) return null;

  const pending = decide.isPending || withdraw.isPending;

  return (
    <section className="overflow-hidden rounded-sm border border-emerald-950/15 bg-linear-to-br from-emerald-50/70 via-white to-lime-50/30 shadow-[0_1px_0_rgba(0,0,0,0.02)] dark:border-emerald-400/15 dark:from-emerald-950/30 dark:via-stone-900/60 dark:to-stone-900/60">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-700/30 bg-white text-emerald-700 dark:border-emerald-400/30 dark:bg-stone-900 dark:text-emerald-300"
          >
            <Gavel className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-800/80 dark:text-emerald-300/80">
              {isRepresentative ? "Awaiting your decision" : "Pending review"}
            </p>
            <p
              className="mt-0.5 font-serif text-sm italic text-stone-700 dark:text-stone-300"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {isRepresentative
                ? "Accept the terms, reject, or dispatch a counter-offer below."
                : "You may withdraw this proposal at any time before a decision."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isRepresentative ? (
            <>
              <DecisionButton
                tone="rose"
                onClick={() => decide.mutate("REJECT")}
                disabled={pending}
                pending={decide.isPending && decide.variables === "REJECT"}
                icon={<X className="h-3.5 w-3.5" />}
              >
                Reject
              </DecisionButton>
              <DecisionButton
                tone="emerald"
                primary
                onClick={() => decide.mutate("ACCEPT")}
                disabled={pending}
                pending={decide.isPending && decide.variables === "ACCEPT"}
                icon={<Check className="h-3.5 w-3.5" />}
              >
                Accept
              </DecisionButton>
            </>
          ) : null}
          {isInvestor ? (
            <DecisionButton
              tone="neutral"
              onClick={() => withdraw.mutate()}
              disabled={pending}
              pending={withdraw.isPending}
              icon={<Undo2 className="h-3.5 w-3.5" />}
            >
              Withdraw
            </DecisionButton>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function DecisionButton({
  children,
  onClick,
  disabled,
  pending,
  icon,
  tone,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  pending?: boolean;
  icon: React.ReactNode;
  tone: "emerald" | "rose" | "neutral";
  primary?: boolean;
}) {
  const TONE: Record<string, string> = {
    emerald: primary
      ? "border-emerald-900 bg-emerald-950 text-stone-50 hover:bg-emerald-900 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200"
      : "border-emerald-700/40 bg-white text-emerald-900 hover:bg-emerald-50 dark:border-emerald-400/40 dark:bg-stone-900 dark:text-emerald-200",
    rose: "border-rose-700/40 bg-white text-rose-800 hover:bg-rose-50 dark:border-rose-400/40 dark:bg-stone-900 dark:text-rose-300",
    neutral:
      "border-stone-400/40 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-500/40 dark:bg-stone-900 dark:text-stone-300",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-all hover:-translate-y-[1px] hover:shadow-[0_3px_0_rgba(0,0,0,0.06)] disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0",
        TONE[tone]
      )}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {children}
    </button>
  );
}
