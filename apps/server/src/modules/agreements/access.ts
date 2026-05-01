import { prisma } from "@farm-lease/db";
import { Role } from "@prisma/client";

export async function loadAgreementContext(agreementId: string) {
  return prisma.agreement.findUnique({
    where: { id: agreementId },
    include: {
      proposal: {
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
      },
      signatures: {
        include: { signer: { select: { id: true, name: true, role: true } } },
      },
    },
  });
}

export type AgreementContext = NonNullable<
  Awaited<ReturnType<typeof loadAgreementContext>>
>;

export function isInvestorOnAgreement(a: AgreementContext, actorId: string) {
  return a.proposal.investorId === actorId;
}

export function isRepOnAgreement(a: AgreementContext, actorId: string) {
  return a.proposal.cluster.representatives.some((r) => r.userId === actorId);
}

export function canViewAgreement(
  a: AgreementContext,
  actor: { id: string; role?: Role | string }
) {
  return (
    isInvestorOnAgreement(a, actor.id) ||
    isRepOnAgreement(a, actor.id) ||
    actor.role === Role.ADMIN
  );
}

export function getPrimaryRepId(a: AgreementContext): string | null {
  const reps = a.proposal.cluster.representatives;
  return (reps.find((r) => r.isPrimary) ?? reps[0])?.userId ?? null;
}
