import { Router } from "express";
import { z } from "zod";
import { prisma } from "@farm-lease/db";
import { AgreementStatus, Prisma, Role } from "@prisma/client";
import { requireActive, requireRole, requireSession } from "../../lib/auth";
import { logAudit } from "../../lib/audit";
import { realtime } from "../../realtime/io";
import {
  agreementCancelledEvent,
  agreementSignedEvent,
  dispatchNotification,
} from "../notifications/service";
import {
  canViewAgreement,
  getPrimaryRepId,
  isInvestorOnAgreement,
  isRepOnAgreement,
  loadAgreementContext,
} from "./access";

const router = Router();
router.use(requireSession);
router.use(requireActive);

// ---------- LIST ----------

const listQuerySchema = z.object({
  status: z.nativeEnum(AgreementStatus).optional(),
  clusterId: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_QUERY", issues: parsed.error.issues });
    }
    const { status, clusterId } = parsed.data;
    const actor = req.user!;

    const where: Prisma.AgreementWhereInput = {
      status,
      proposal:
        clusterId || actor.role !== Role.ADMIN
          ? {
              clusterId: clusterId ?? undefined,
              ...(actor.role === Role.INVESTOR
                ? { investorId: actor.id }
                : actor.role === Role.REPRESENTATIVE
                  ? { cluster: { representatives: { some: { userId: actor.id } } } }
                  : {}),
            }
          : undefined,
    };

    const agreements = await prisma.agreement.findMany({
      where,
      include: {
        proposal: {
          select: {
            id: true,
            budget: true,
            durationMonths: true,
            cluster: { select: { id: true, name: true, region: true } },
            investor: { select: { id: true, name: true } },
          },
        },
        signatures: { select: { signerId: true, role: true, signedAt: true } },
        _count: { select: { receipts: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return res.json({ agreements });
  } catch (error) {
    next(error);
  }
});

// ---------- DETAIL ----------

router.get("/:id", async (req, res, next) => {
  try {
    const agreement = await loadAgreementContext(req.params.id);
    if (!agreement) return res.status(404).json({ error: "NOT_FOUND" });
    if (!canViewAgreement(agreement, req.user!)) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    const receipts = await prisma.paymentReceipt.findMany({
      where: { agreementId: agreement.id },
      orderBy: { createdAt: "desc" },
      include: {
        uploader: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
    });

    return res.json({ agreement, receipts });
  } catch (error) {
    next(error);
  }
});

// ---------- SIGN ----------

router.post("/:id/sign", async (req, res, next) => {
  try {
    const agreement = await loadAgreementContext(req.params.id);
    if (!agreement) return res.status(404).json({ error: "NOT_FOUND" });

    const actor = req.user!;
    const isInvestor = isInvestorOnAgreement(agreement, actor.id);
    const isRep = isRepOnAgreement(agreement, actor.id);
    if (!isInvestor && !isRep) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    if (
      agreement.status !== AgreementStatus.DRAFT &&
      agreement.status !== AgreementStatus.PENDING_SIGNATURES
    ) {
      return res.status(409).json({ error: "INVALID_STATE", status: agreement.status });
    }

    // Prevent duplicate signatures
    const already = agreement.signatures.some((s) => s.signerId === actor.id);
    if (already) {
      return res.status(409).json({ error: "ALREADY_SIGNED" });
    }

    const signerRole = isInvestor ? Role.INVESTOR : Role.REPRESENTATIVE;

    const signature = await prisma.agreementSignature.create({
      data: {
        agreementId: agreement.id,
        signerId: actor.id,
        role: signerRole,
      },
    });

    logAudit({
      actorId: actor.id,
      action: "SIGN",
      targetType: "Agreement",
      targetId: agreement.id,
      details: { role: signerRole },
    });

    // Compute new status and check signature status
    const allSignerIds = [...agreement.signatures.map((s) => s.signerId), actor.id];
    const hasInvestorSig = allSignerIds.includes(agreement.proposal.investorId);
    const hasRepSig = agreement.proposal.cluster.representatives.some((r) =>
      allSignerIds.includes(r.userId)
    );
    const newStatus =
      hasInvestorSig && hasRepSig ? AgreementStatus.PENDING_SIGNATURES : AgreementStatus.DRAFT;

    const updated = await prisma.agreement.update({
      where: { id: agreement.id },
      data: { status: newStatus },
    });

    // Notify parties
    const signer = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { name: true },
    });
    
    if (hasInvestorSig && hasRepSig) {
      // Both signed
      const recipients = [agreement.proposal.investorId, getPrimaryRepId(agreement)].filter(
        (id): id is string => !!id
      );
      await dispatchNotification({
        type: "AGREEMENT_FULLY_SIGNED",
        recipients,
        title: "Agreement fully signed",
        message: "Both parties have signed the agreement. Investor can now upload payment receipts.",
        metadata: { agreementId: agreement.id, url: `/agreements/${agreement.id}` },
      });
    } else {
      // Partial sign - notify the other party it is their turn
      const counterpartyId = isInvestor ? getPrimaryRepId(agreement) : agreement.proposal.investorId;
      if (counterpartyId && counterpartyId !== actor.id) {
        await dispatchNotification({
          type: "AGREEMENT_YOUR_TURN",
          recipients: [counterpartyId],
          title: "Your turn to sign",
          message: `${signer?.name ?? "Counterparty"} signed the agreement. It is now your turn to review and sign.`,
          metadata: { agreementId: agreement.id, url: `/agreements/${agreement.id}` },
        });
      }
    }

    realtime.toAgreement(agreement.id, "agreement:signed", {
      agreementId: agreement.id,
      signature,
      status: updated.status,
    });

    return res.status(201).json({ signature, agreement: updated });
  } catch (error) {
    next(error);
  }
});

// ---------- CANCEL ----------

const cancelSchema = z.object({ reason: z.string().max(500).optional() });

router.post("/:id/cancel", requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const parsed = cancelSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
    }
    const agreement = await loadAgreementContext(req.params.id);
    if (!agreement) return res.status(404).json({ error: "NOT_FOUND" });

    const actor = req.user!;
    // Admin override for cancellation:
    if (agreement.status === AgreementStatus.COMPLETED || agreement.status === AgreementStatus.CANCELLED) {
      return res.status(409).json({ error: "INVALID_STATE", status: agreement.status });
    }

    const updated = await prisma.agreement.update({
      where: { id: agreement.id },
      data: { status: AgreementStatus.CANCELLED },
    });

    logAudit({
      actorId: actor.id,
      action: "CANCEL",
      targetType: "Agreement",
      targetId: agreement.id,
      details: { reason: parsed.data.reason },
    });

    const repId = getPrimaryRepId(agreement);
    const recipients = [agreement.proposal.investorId, repId].filter(
      (id): id is string => !!id
    );
    
    await agreementCancelledEvent({
      recipientIds: recipients,
      agreementId: agreement.id,
      reason: parsed.data.reason,
    });

    realtime.toAgreement(agreement.id, "agreement:cancelled", {
      agreementId: agreement.id,
      status: updated.status,
    });

    return res.json({ agreement: updated });
  } catch (error) {
    next(error);
  }
});

// ---------- EDIT TERMS ----------

const clauseSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
});

const editTermsSchema = z
  .object({
    terms: z.record(z.unknown()).optional(),
    clauses: z.array(clauseSchema).min(1).max(30).optional(),
    note: z.string().max(500).optional(),
  })
  .refine(
    (data) => data.terms !== undefined || data.clauses !== undefined,
    { message: "Provide at least `terms` or `clauses` to edit." }
  );

/**
 * Edit the terms / clauses of an agreement. Allowed only while the agreement
 * is still DRAFT or PENDING_SIGNATURES (i.e. not yet ACTIVE). Because the
 * signed contract has changed, all existing signatures are cleared and the
 * status is reset to DRAFT — both parties must re-sign.
 */
router.patch("/:id/terms", async (req, res, next) => {
  try {
    const parsed = editTermsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "INVALID_BODY", issues: parsed.error.issues });
    }

    const agreement = await loadAgreementContext(req.params.id);
    if (!agreement) return res.status(404).json({ error: "NOT_FOUND" });

    const actor = req.user!;
    const isInvestor = isInvestorOnAgreement(agreement, actor.id);
    const isRep = isRepOnAgreement(agreement, actor.id);
    if (!isInvestor && !isRep && actor.role !== Role.ADMIN) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    if (
      agreement.status !== AgreementStatus.DRAFT &&
      agreement.status !== AgreementStatus.PENDING_SIGNATURES
    ) {
      return res
        .status(409)
        .json({ error: "INVALID_STATE", status: agreement.status });
    }

    const { terms, clauses, note } = parsed.data;

    // Perform the mutation atomically: update fields, wipe signatures,
    // reset status to DRAFT so both parties must re-sign.
    const updated = await prisma.$transaction(async (tx) => {
      const data: Prisma.AgreementUpdateInput = {
        status: AgreementStatus.DRAFT,
      };
      if (terms !== undefined) {
        data.terms = terms as Prisma.InputJsonValue;
      }
      if (clauses !== undefined) {
        data.clauses = clauses as unknown as Prisma.InputJsonValue;
      }

      await tx.agreementSignature.deleteMany({
        where: { agreementId: agreement.id },
      });

      return tx.agreement.update({
        where: { id: agreement.id },
        data,
      });
    });

    logAudit({
      actorId: actor.id,
      action: "TERMS_EDITED",
      targetType: "Agreement",
      targetId: agreement.id,
      details: {
        editedTerms: terms !== undefined,
        editedClauses: clauses !== undefined,
        note: note ?? null,
        signaturesCleared: agreement.signatures.length,
      },
    });

    // Notify the other party (and all reps on the cluster)
    const editor = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { name: true },
    });
    const repIds = agreement.proposal.cluster.representatives.map((r) => r.userId);
    const recipientIds = Array.from(
      new Set([agreement.proposal.investorId, ...repIds])
    ).filter((id) => id !== actor.id);

    if (recipientIds.length > 0) {
      await dispatchNotification({
        type: "AGREEMENT_TERMS_EDITED",
        recipients: recipientIds,
        title: "Agreement terms updated",
        message: `${editor?.name ?? "A counterparty"} revised the agreement. All previous signatures were cleared — please review and re-sign.`,
        metadata: {
          agreementId: agreement.id,
          url: `/agreements/${agreement.id}`,
          note: note ?? undefined,
        },
      });
    }

    realtime.toAgreement(agreement.id, "agreement:terms-edited", {
      agreementId: agreement.id,
      status: updated.status,
    });

    return res.json({ agreement: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
