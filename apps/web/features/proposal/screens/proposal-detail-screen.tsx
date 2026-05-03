"use client";

import { use } from "react";
import { Loader2 } from "lucide-react";
import { useProposalDetail } from "@/features/proposal/hooks/use-proposal-detail";
import { ProposalHero } from "@/features/proposal/components/detail/proposal-hero";
import { ProposalTerms } from "@/features/proposal/components/detail/proposal-terms";
import { NegotiationChat } from "@/features/proposal/components/detail/negotiation-chat";
import { RevisionForm } from "@/features/proposal/components/detail/revision-form";
import { DecisionActions } from "@/features/proposal/components/detail/decision-actions";
import { AuditTrail } from "@/features/proposal/components/detail/audit-trail";
import { DashboardContent } from "@/components/layout/dashboard-content";
import { PaperGrain } from "@/components/editorial";

export function ProposalDetailScreen({
  idPromise,
}: {
  idPromise: Promise<string>;
}) {
  const id = use(idPromise);
  const { prependMessages, ...query } = useProposalDetail(id);

  if (query.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-stone-50/60 py-24 dark:bg-stone-950/60">
        <Loader2 className="size-6 animate-spin text-emerald-700" />
      </div>
    );
  }
  if (query.error || !query.data) {
    return (
      <div className="flex flex-1 items-center justify-center bg-stone-50/60 py-24 dark:bg-stone-950/60">
        <p
          className="rounded-sm border border-rose-200 bg-white px-4 py-2 font-serif text-sm italic text-rose-700"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {(query.error as Error)?.message ?? "Proposal not found"}
        </p>
      </div>
    );
  }

  const proposal = query.data.proposal;
  const {
    id: currentUserId,
    isInvestor,
    isRepresentative,
    isAdmin,
  } = query.data.viewer;
  const isClosed =
    proposal.status === "ACCEPTED" ||
    proposal.status === "REJECTED" ||
    proposal.status === "WITHDRAWN";
  const firstMessageId = proposal.messages[0]?.id;

  return (
    <div className="relative flex flex-1 flex-col bg-stone-50/60 dark:bg-stone-950/60">
      <PaperGrain />
      <DashboardContent>
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
          <div className="flex flex-col gap-6">
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
            {isAdmin && <AuditTrail proposalId={proposal.id} />}
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
      </DashboardContent>
    </div>
  );
}
