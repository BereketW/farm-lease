"use client";

import { use } from "react";
import { useProposalDetail } from "@/features/proposal/hooks/use-proposal-detail";
import { ProposalHero } from "@/features/proposal/components/detail/proposal-hero";
import { ProposalTerms } from "@/features/proposal/components/detail/proposal-terms";
import { NegotiationChat } from "@/features/proposal/components/detail/negotiation-chat";
import { RevisionForm } from "@/features/proposal/components/detail/revision-form";
import { DecisionActions } from "@/features/proposal/components/detail/decision-actions";

export function ProposalDetailScreen({
  idPromise,
}: {
  idPromise: Promise<string>;
}) {
  const id = use(idPromise);
  const { prependMessages, ...query } = useProposalDetail(id);

  if (query.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-emerald-50/30 dark:bg-zinc-950 py-10">
        <p className="rounded-full bg-white dark:bg-zinc-900 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-100 dark:ring-emerald-900">
          Loading proposal…
        </p>
      </div>
    );
  }
  if (query.error || !query.data) {
    return (
      <div className="flex flex-1 items-center justify-center bg-rose-50/40 dark:bg-zinc-950 py-10">
        <p className="rounded-full bg-white dark:bg-zinc-900 px-4 py-2 text-sm text-rose-700 dark:text-rose-400 shadow-sm ring-1 ring-rose-100 dark:ring-rose-900">
          {(query.error as Error)?.message ?? "Proposal not found"}
        </p>
      </div>
    );
  }

  const proposal = query.data.proposal;
  const { id: currentUserId, isInvestor, isRepresentative } = query.data.viewer;
  const isClosed =
    proposal.status === "ACCEPTED" ||
    proposal.status === "REJECTED" ||
    proposal.status === "WITHDRAWN";
  const firstMessageId = proposal.messages[0]?.id;

  return (
    <div className="flex flex-1 justify-center bg-linear-to-b from-emerald-50/30 to-white dark:from-zinc-950 dark:to-zinc-950 px-4 py-8">
      <div className="grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <ProposalHero proposal={proposal} />
          <DecisionActions
            proposal={proposal}
            isInvestor={isInvestor}
            isRepresentative={isRepresentative}
          />
          <ProposalTerms proposal={proposal} />
          {!isClosed && (isInvestor || isRepresentative) ? (
            <RevisionForm proposal={proposal} />
          ) : null}
        </div>
        <aside className="lg:sticky lg:top-5 lg:self-start">
          <NegotiationChat
            proposalId={proposal.id}
            currentUserId={currentUserId}
            messages={proposal.messages}
            isClosed={isClosed}
            canParticipate={isInvestor || isRepresentative}
            firstMessageId={firstMessageId}
            onLoadEarlier={prependMessages}
          />
        </aside>
      </div>
    </div>
  );
}
