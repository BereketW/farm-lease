import { prisma } from "@farm-lease/db";
import { ProposalStatus, Role } from "@prisma/client";

export type ProposalActor = {
  id: string;
  role?: Role | string;
};

export type ProposalContext = Awaited<ReturnType<typeof loadProposalContext>>;

export async function loadProposalContext(proposalId: string) {
  return prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      cluster: {
        select: {
          id: true,
          name: true,
          representatives: { select: { userId: true, isPrimary: true } },
        },
      },
      investor: { select: { id: true, name: true, email: true } },
    },
  });
}

export function isInvestor(proposal: NonNullable<ProposalContext>, actor: ProposalActor) {
  return proposal.investorId === actor.id;
}

export function isRepresentative(
  proposal: NonNullable<ProposalContext>,
  actor: ProposalActor
) {
  return proposal.cluster.representatives.some((r) => r.userId === actor.id);
}

/** Returns the primary representative's userId, falling back to the first one. */
export function getPrimaryRepId(proposal: NonNullable<ProposalContext>): string | null {
  const reps = proposal.cluster.representatives;
  return (reps.find((r) => r.isPrimary) ?? reps[0])?.userId ?? null;
}

export function canViewProposal(
  proposal: NonNullable<ProposalContext>,
  actor: ProposalActor
) {
  return (
    isInvestor(proposal, actor) ||
    isRepresentative(proposal, actor) ||
    actor.role === Role.ADMIN
  );
}

const TERMINAL: ProposalStatus[] = [
  ProposalStatus.ACCEPTED,
  ProposalStatus.REJECTED,
  ProposalStatus.WITHDRAWN,
];

export function isOpen(status: ProposalStatus) {
  return !TERMINAL.includes(status);
}

export function canBeDecided(status: ProposalStatus) {
  return (
    status === ProposalStatus.SUBMITTED ||
    status === ProposalStatus.UNDER_NEGOTIATION
  );
}
