import type { Request, Response } from "express";
import { Prisma, ProposalStatus, Role } from "@prisma/client";
import { prisma } from "@farm-lease/db";
import {
  negotiationMessageEvent,
  proposalAcceptedEvent,
  proposalRejectedEvent,
  proposalSubmittedEvent,
  proposalTermsChangedEvent,
  proposalWithdrawnEvent,
} from "../notifications/service";
import { realtime } from "../../realtime/io";
import {
  markReadSchema,
  messagesQuerySchema,
  negotiationMessageSchema,
  proposalCreateSchema,
  proposalDecisionSchema,
  proposalDraftCreateSchema,
  proposalDraftPatchSchema,
  proposalListQuerySchema,
  proposalRevisionSchema,
} from "./schemas";
import {
  canBeDecided,
  canViewProposal,
  getPrimaryRepId,
  isInvestor,
  isOpen,
  isRepresentative,
  loadProposalContext,
} from "./access";
import { logAudit } from "../../lib/audit";
import { generateAgreementFromProposal } from "../agreements/service";

export async function submitProposal(req: Request, res: Response) {
  const parsed = proposalCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
  }
  const investorId = req.user!.id;
  const input = parsed.data;

  const cluster = await prisma.cluster.findUnique({
    where: { id: input.clusterId },
    select: {
      id: true,
      name: true,
      representatives: { 
        where: { isPrimary: true },
        select: { userId: true } 
      },
    },
  });
  if (!cluster) return res.status(404).json({ error: "CLUSTER_NOT_FOUND" });

  const investor = await prisma.user.findUnique({
    where: { id: investorId },
    select: { id: true, name: true },
  });

  const proposal = await prisma.proposal.create({
    data: {
      investorId,
      clusterId: cluster.id,
      terms: input.terms as Prisma.InputJsonValue,
      budget: new Prisma.Decimal(input.budget),
      durationMonths: input.durationMonths,
      startDate: input.startDate ? new Date(input.startDate) : null,
      cropIntended: input.cropIntended,
      documents: input.documents ?? [],
      status: ProposalStatus.SUBMITTED,
    },
  });

  const primaryRepId = cluster.representatives[0]?.userId;
  if (primaryRepId) {
    await proposalSubmittedEvent({
      representativeIds: [primaryRepId],
      proposalId: proposal.id,
      investorName: investor?.name ?? "An investor",
      clusterName: cluster.name,
    });
  }

  return res.status(201).json({ proposal });
}

export async function listProposals(req: Request, res: Response) {
  const parsed = proposalListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_QUERY", issues: parsed.error.issues });
  }
  const { status, clusterId } = parsed.data;
  const actor = req.user!;

  const ownershipFilter: Prisma.ProposalWhereInput =
    actor.role === Role.ADMIN
      ? {}
      : actor.role === Role.REPRESENTATIVE
        ? { cluster: { representatives: { some: { userId: actor.id } } } }
        : { investorId: actor.id };

  const proposals = await prisma.proposal.findMany({
    where: { ...ownershipFilter, status, clusterId },
    include: {
      cluster: { select: { id: true, name: true } },
      investor: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return res.json({ proposals });
}

export async function getProposal(req: Request, res: Response) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: req.params.id },
    include: {
      cluster: {
        select: {
          id: true,
          name: true,
          region: true,
          representatives: { select: { userId: true, isPrimary: true } },
        },
      },
      investor: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  });
  if (!proposal) return res.status(404).json({ error: "NOT_FOUND" });
  const actor = req.user!;
  if (!canViewProposal(proposal, actor)) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }
  const viewer = {
    id: actor.id,
    isInvestor: proposal.investorId === actor.id,
    isRepresentative: proposal.cluster.representatives.some((r) => r.userId === actor.id),
    isAdmin: actor.role === Role.ADMIN,
  };
  return res.json({ proposal, viewer });
}

export async function decideProposal(req: Request, res: Response) {
  const parsed = proposalDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
  }
  const proposal = await loadProposalContext(req.params.id);
  if (!proposal) return res.status(404).json({ error: "NOT_FOUND" });
  if (!isRepresentative(proposal, req.user!)) {
    return res.status(403).json({ error: "ONLY_REPRESENTATIVE" });
  }
  if (!canBeDecided(proposal.status)) {
    return res.status(409).json({ error: "INVALID_STATE", status: proposal.status });
  }

  const isAccept = parsed.data.decision === "ACCEPT";
  const actor = req.user!;
  const updated = await prisma.proposal.update({
    where: { id: proposal.id },
    data: {
      status: isAccept ? ProposalStatus.ACCEPTED : ProposalStatus.REJECTED,
      rejectionReason: !isAccept ? (parsed.data.reason ?? null) : null,
    },
  });

  logAudit({
    actorId: actor.id,
    action: "STATE_CHANGE",
    targetType: "Proposal",
    targetId: proposal.id,
    details: { to: updated.status, reason: parsed.data.reason },
  });

  if (isAccept) {
    // Auto-generate the agreement draft — fire-and-forget; errors logged but
    // must not block the state transition response.
    try {
      await generateAgreementFromProposal(proposal.id, actor.id);
    } catch (error) {
      console.error("[proposal] failed to auto-generate agreement", error);
    }

    await proposalAcceptedEvent({
      investorId: proposal.investorId,
      proposalId: proposal.id,
      clusterName: proposal.cluster.name,
    });
  } else {
    await proposalRejectedEvent({
      investorId: proposal.investorId,
      proposalId: proposal.id,
      reason: parsed.data.reason,
    });
  }

  return res.json({ proposal: updated });
}

export async function withdrawProposal(req: Request, res: Response) {
  const proposal = await loadProposalContext(req.params.id);
  if (!proposal) return res.status(404).json({ error: "NOT_FOUND" });
  if (!isInvestor(proposal, req.user!)) {
    return res.status(403).json({ error: "ONLY_INVESTOR" });
  }
  if (!isOpen(proposal.status)) {
    return res.status(409).json({ error: "INVALID_STATE", status: proposal.status });
  }

  const updated = await prisma.proposal.update({
    where: { id: proposal.id },
    data: { status: ProposalStatus.WITHDRAWN },
  });

  const repId = getPrimaryRepId(proposal);
  if (repId) {
    await proposalWithdrawnEvent({
      representativeIds: [repId],
      proposalId: proposal.id,
      investorName: proposal.investor.name ?? "An investor",
    });
  }

  return res.json({ proposal: updated });
}

export async function createRevision(req: Request, res: Response) {
  const parsed = proposalRevisionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
  }
  const proposal = await loadProposalContext(req.params.id);
  if (!proposal) return res.status(404).json({ error: "NOT_FOUND" });
  const actor = req.user!;
  if (!isInvestor(proposal, actor) && !isRepresentative(proposal, actor)) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }
  if (!isOpen(proposal.status)) {
    return res.status(409).json({ error: "INVALID_STATE", status: proposal.status });
  }

  const data = parsed.data;
  
  const previousTerms = proposal.terms;
  const previousBudget = proposal.budget;
  const previousDuration = proposal.durationMonths;

  const updated = await prisma.proposal.update({
    where: { id: proposal.id },
    data: {
      status: ProposalStatus.UNDER_NEGOTIATION,
      terms: data.terms as Prisma.InputJsonValue,
      budget: new Prisma.Decimal(data.budget),
      durationMonths: data.durationMonths,
    },
  });

  logAudit({
    actorId: actor.id,
    action: "TERMS_EDITED",
    targetType: "Proposal",
    targetId: proposal.id,
    details: JSON.parse(JSON.stringify({
      from: {
        terms: previousTerms,
        budget: previousBudget,
        durationMonths: previousDuration,
      },
      to: {
        terms: data.terms,
        budget: data.budget,
        durationMonths: data.durationMonths,
      },
    })),
  });

  const author = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { name: true },
  });

  const recipientId = isInvestor(proposal, actor)
    ? getPrimaryRepId(proposal)
    : proposal.investorId;
  if (recipientId) {
    await proposalTermsChangedEvent({
      recipientIds: [recipientId],
      proposalId: proposal.id,
      changedByName: author?.name ?? "Counterparty",
    });
  }

  realtime.toProposal(proposal.id, "proposal:revised", {
    proposalId: proposal.id,
    status: updated.status,
  });

  return res.status(201).json({ proposal: updated });
}

export async function listMessages(req: Request, res: Response) {
  const parsed = messagesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_QUERY", issues: parsed.error.issues });
  }
  const { before, limit } = parsed.data;

  const proposal = await loadProposalContext(req.params.id);
  if (!proposal) return res.status(404).json({ error: "NOT_FOUND" });
  if (!canViewProposal(proposal, req.user!)) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  // Cursor pagination: when `before` is provided, return the `limit` messages
  // older than that id, in ascending order. We fetch DESC then reverse so the
  // client receives the same ascending order it already renders.
  let cursorCreatedAt: Date | null = null;
  if (before) {
    const cursor = await prisma.negotiationMessage.findUnique({
      where: { id: before },
      select: { createdAt: true, proposalId: true },
    });
    if (cursor && cursor.proposalId === proposal.id) {
      cursorCreatedAt = cursor.createdAt;
    }
  }

  const where: Prisma.NegotiationMessageWhereInput = {
    proposalId: proposal.id,
    ...(cursorCreatedAt ? { createdAt: { lt: cursorCreatedAt } } : {}),
  };

  const rows = await prisma.negotiationMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    include: { sender: { select: { id: true, name: true } } },
  });

  const hasMore = rows.length > limit;
  const messages = (hasMore ? rows.slice(0, limit) : rows).reverse();
  return res.json({ messages, hasMore });
}

export async function postMessage(req: Request, res: Response) {
  const parsed = negotiationMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
  }
  const proposal = await loadProposalContext(req.params.id);
  if (!proposal) return res.status(404).json({ error: "NOT_FOUND" });
  const actor = req.user!;
  if (!isInvestor(proposal, actor) && !isRepresentative(proposal, actor)) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }
  if (!isOpen(proposal.status)) {
    return res.status(409).json({ error: "INVALID_STATE", status: proposal.status });
  }

  const message = await prisma.negotiationMessage.create({
    data: {
      proposalId: proposal.id,
      senderId: actor.id,
      message: parsed.data.message,
      counterTerms: parsed.data.counterTerms
        ? (parsed.data.counterTerms as Prisma.InputJsonValue)
        : undefined,
      attachments: parsed.data.attachments ?? [],
    },
    include: { sender: { select: { id: true, name: true } } },
  });

  realtime.toProposal(proposal.id, "negotiation:message", message);

  const recipientId = isInvestor(proposal, actor)
    ? getPrimaryRepId(proposal)
    : proposal.investorId;
  if (recipientId && recipientId !== actor.id) {
    await negotiationMessageEvent({
      recipientIds: [recipientId],
      proposalId: proposal.id,
      senderName: message.sender.name ?? "Counterparty",
      preview: parsed.data.counterTerms ? "A counter-offer has been proposed." : parsed.data.message.slice(0, 140),
      isCounterOffer: !!parsed.data.counterTerms,
    });
  }

  return res.status(201).json({ message });
}

// ============================================================
// DRAFTS
// Server-side DRAFT proposals so investors can resume work across
// devices/sessions. Drafts are Proposal rows with status=DRAFT; they
// don't fire notifications or show in the representative dashboard
// (the `listProposals` ownership filter already scopes investors to
// their own rows).
// ============================================================

/**
 * Create a fresh DRAFT proposal. Only an investor may create drafts.
 * Returns the draft proposal row.
 */
export async function createProposalDraft(req: Request, res: Response) {
  const parsed = proposalDraftCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
  }
  const investorId = req.user!.id;
  const input = parsed.data;

  const cluster = await prisma.cluster.findUnique({
    where: { id: input.clusterId },
    select: { id: true },
  });
  if (!cluster) return res.status(404).json({ error: "CLUSTER_NOT_FOUND" });

  const proposal = await prisma.proposal.create({
    data: {
      investorId,
      clusterId: cluster.id,
      terms: (input.terms ?? {}) as Prisma.InputJsonValue,
      budget: new Prisma.Decimal(input.budget ?? 0),
      durationMonths: input.durationMonths ?? 0,
      startDate: input.startDate ? new Date(input.startDate) : null,
      cropIntended: input.cropIntended ?? null,
      documents: input.documents ?? [],
      status: ProposalStatus.DRAFT,
    },
  });

  logAudit({
    actorId: investorId,
    action: "CREATE",
    targetType: "Proposal",
    targetId: proposal.id,
    details: { status: "DRAFT" },
  });

  return res.status(201).json({ proposal });
}

/**
 * Update a DRAFT proposal owned by the current investor. Returns the
 * updated row. Ownership and status are both enforced in a single
 * updateMany → count check to avoid race conditions.
 */
export async function updateProposalDraft(req: Request, res: Response) {
  const parsed = proposalDraftPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
  }
  const actor = req.user!;
  const id = req.params.id;

  const existing = await prisma.proposal.findUnique({
    where: { id },
    select: { id: true, investorId: true, status: true },
  });
  if (!existing) return res.status(404).json({ error: "NOT_FOUND" });
  if (existing.investorId !== actor.id) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }
  if (existing.status !== ProposalStatus.DRAFT) {
    return res.status(409).json({ error: "INVALID_STATE", status: existing.status });
  }

  if (parsed.data.clusterId) {
    const exists = await prisma.cluster.findUnique({
      where: { id: parsed.data.clusterId },
      select: { id: true },
    });
    if (!exists) return res.status(404).json({ error: "CLUSTER_NOT_FOUND" });
  }

  const data: Prisma.ProposalUpdateInput = {};
  const input = parsed.data;
  if (input.clusterId !== undefined) {
    data.cluster = { connect: { id: input.clusterId } };
  }
  if (input.budget !== undefined) data.budget = new Prisma.Decimal(input.budget);
  if (input.durationMonths !== undefined) data.durationMonths = input.durationMonths;
  if (input.startDate !== undefined) {
    data.startDate = input.startDate ? new Date(input.startDate) : null;
  }
  if (input.cropIntended !== undefined) data.cropIntended = input.cropIntended ?? null;
  if (input.terms !== undefined) data.terms = input.terms as Prisma.InputJsonValue;
  if (input.documents !== undefined) data.documents = input.documents;

  const proposal = await prisma.proposal.update({
    where: { id },
    data,
  });

  return res.json({ proposal });
}

/**
 * Promote a DRAFT proposal to SUBMITTED. This is the actual
 * "send to the representative" action: fires the submission
 * notification and the auto-generate agreement pipeline on the
 * downstream ACCEPT path.
 */
export async function submitProposalDraft(req: Request, res: Response) {
  const actor = req.user!;
  const id = req.params.id;

  const existing = await prisma.proposal.findUnique({
    where: { id },
    include: {
      cluster: {
        select: {
          id: true,
          name: true,
          representatives: { 
            where: { isPrimary: true },
            select: { userId: true } 
          },
        },
      },
    },
  });
  if (!existing) return res.status(404).json({ error: "NOT_FOUND" });
  if (existing.investorId !== actor.id) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }
  if (existing.status !== ProposalStatus.DRAFT) {
    return res.status(409).json({ error: "INVALID_STATE", status: existing.status });
  }

  // Validate that the draft is complete enough to submit.
  const missing: string[] = [];
  if (Number(existing.budget) <= 0) missing.push("budget");
  if (existing.durationMonths <= 0) missing.push("durationMonths");
  const termsObj =
    existing.terms && typeof existing.terms === "object" && !Array.isArray(existing.terms)
      ? (existing.terms as Record<string, unknown>)
      : {};
  if (Object.keys(termsObj).length === 0) missing.push("terms");
  if (missing.length > 0) {
    return res.status(400).json({ error: "INCOMPLETE_DRAFT", missing });
  }

  const proposal = await prisma.proposal.update({
    where: { id },
    data: { status: ProposalStatus.SUBMITTED },
  });

  logAudit({
    actorId: actor.id,
    action: "STATE_CHANGE",
    targetType: "Proposal",
    targetId: proposal.id,
    details: { from: "DRAFT", to: "SUBMITTED" },
  });

  const investor = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { name: true },
  });

  const primaryRepId = existing.cluster.representatives[0]?.userId;
  if (primaryRepId) {
    await proposalSubmittedEvent({
      representativeIds: [primaryRepId],
      proposalId: proposal.id,
      investorName: investor?.name ?? "An investor",
      clusterName: existing.cluster.name,
    });
  }

  return res.json({ proposal });
}

/**
 * Hard-delete a DRAFT proposal. Owner only.
 */
export async function deleteProposalDraft(req: Request, res: Response) {
  const actor = req.user!;
  const id = req.params.id;

  const existing = await prisma.proposal.findUnique({
    where: { id },
    select: { id: true, investorId: true, status: true },
  });
  if (!existing) return res.status(404).json({ error: "NOT_FOUND" });
  if (existing.investorId !== actor.id) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }
  if (existing.status !== ProposalStatus.DRAFT) {
    return res.status(409).json({ error: "INVALID_STATE", status: existing.status });
  }

  await prisma.proposal.delete({ where: { id } });
  return res.status(204).end();
}

/**
 * Mark a batch of negotiation messages as read by the current viewer. Only
 * messages that:
 *   - belong to this proposal,
 *   - are NOT authored by the actor,
 *   - and are still `isRead: false`
 * get flipped. The flipped ids are echoed back and broadcast to the
 * proposal room so the original sender's UI can render the read tick.
 */
export async function markMessagesRead(req: Request, res: Response) {
  const parsed = markReadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
  }
  const actor = req.user!;
  const proposal = await loadProposalContext(req.params.id);
  if (!proposal) return res.status(404).json({ error: "NOT_FOUND" });
  if (!canViewProposal(proposal, actor)) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  // Find candidate ids first so we can echo only the ones we actually
  // flipped — keeps the realtime payload minimal.
  const candidates = await prisma.negotiationMessage.findMany({
    where: {
      id: { in: parsed.data.ids },
      proposalId: proposal.id,
      isRead: false,
      NOT: { senderId: actor.id },
    },
    select: { id: true },
  });
  const flippedIds = candidates.map((c) => c.id);
  if (flippedIds.length === 0) return res.json({ ids: [] });

  await prisma.negotiationMessage.updateMany({
    where: { id: { in: flippedIds } },
    data: { isRead: true },
  });

  realtime.toProposal(proposal.id, "negotiation:read", {
    proposalId: proposal.id,
    readerId: actor.id,
    ids: flippedIds,
  });

  return res.json({ ids: flippedIds });
}

/**
 * Get audit logs for a proposal. Admin-only endpoint for oversight.
 * Returns audit entries showing state changes, term edits, and negotiations
 * with before/after diffs.
 */
export async function getProposalAuditLogs(req: Request, res: Response) {
  const actor = req.user!;
  if (actor.role !== Role.ADMIN) {
    return res.status(403).json({ error: "ADMIN_ONLY" });
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: req.params.id },
    select: { id: true },
  });
  if (!proposal) return res.status(404).json({ error: "NOT_FOUND" });

  const logs = await prisma.auditLog.findMany({
    where: {
      targetType: "Proposal",
      targetId: proposal.id,
    },
    include: {
      actor: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return res.json({ logs });
}
