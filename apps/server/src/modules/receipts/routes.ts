import { Router } from "express";
import { z } from "zod";
import { prisma } from "@farm-lease/db";
import {
  AgreementStatus,
  Prisma,
  ReceiptStatus,
  Role,
} from "@prisma/client";
import { requireSession } from "../../lib/auth";
import { receiptUpload, fileToPublicUrl } from "../../lib/storage";
import { logAudit } from "../../lib/audit";
import { realtime } from "../../realtime/io";
import {
  agreementActivatedEvent,
  paymentRejectedEvent,
  paymentSubmittedEvent,
  paymentVerifiedEvent,
} from "../notifications/service";
import {
  canViewAgreement,
  getPrimaryRepId,
  isInvestorOnAgreement,
  isRepOnAgreement,
  loadAgreementContext,
} from "../agreements/access";

const router = Router();
router.use(requireSession);

// ---------- UPLOAD ----------

const uploadBodySchema = z.object({
  agreementId: z.string().min(1),
  amount: z.coerce.number().positive(),
  datePaid: z.string().min(1),
  notes: z.string().max(1000).optional(),
});

router.post("/", receiptUpload.single("receipt"), async (req, res, next) => {
  try {
    const parsed = uploadBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "RECEIPT_FILE_REQUIRED" });
    }

    const actor = req.user!;
    const agreement = await loadAgreementContext(parsed.data.agreementId);
    if (!agreement) return res.status(404).json({ error: "AGREEMENT_NOT_FOUND" });
    if (!isInvestorOnAgreement(agreement, actor.id)) {
      return res.status(403).json({ error: "ONLY_INVESTOR_CAN_UPLOAD" });
    }
    if (agreement.status !== AgreementStatus.PENDING_SIGNATURES) {
      return res.status(409).json({ error: "INVALID_STATE", status: agreement.status });
    }

    const imageUrl = fileToPublicUrl("receipts", file.filename);

    const receipt = await prisma.paymentReceipt.create({
      data: {
        agreementId: agreement.id,
        uploaderId: actor.id,
        amount: new Prisma.Decimal(parsed.data.amount),
        datePaid: new Date(parsed.data.datePaid),
        imageUrl,
        notes: parsed.data.notes,
        verificationStatus: ReceiptStatus.PENDING,
      },
    });

    logAudit({
      actorId: actor.id,
      action: "CREATE",
      targetType: "PaymentReceipt",
      targetId: receipt.id,
      details: { agreementId: agreement.id, amount: parsed.data.amount },
    });

    const investor = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { name: true },
    });

    const repId = getPrimaryRepId(agreement);
    if (repId) {
      await paymentSubmittedEvent({
        recipientIds: [repId],
        agreementId: agreement.id,
        receiptId: receipt.id,
        investorName: investor?.name ?? "Investor",
      });
    }

    realtime.toAgreement(agreement.id, "receipt:uploaded", {
      agreementId: agreement.id,
      receipt,
    });

    return res.status(201).json({ receipt });
  } catch (error) {
    next(error);
  }
});

// ---------- GET ONE ----------

router.get("/:id", async (req, res, next) => {
  try {
    const receipt = await prisma.paymentReceipt.findUnique({
      where: { id: req.params.id },
      include: {
        uploader: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
    });
    if (!receipt) return res.status(404).json({ error: "NOT_FOUND" });

    const agreement = await loadAgreementContext(receipt.agreementId);
    if (!agreement || !canViewAgreement(agreement, req.user!)) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    return res.json({ receipt });
  } catch (error) {
    next(error);
  }
});

// ---------- VERIFY / REJECT ----------

const decisionSchema = z.object({
  decision: z.enum(["VERIFY", "REJECT"]),
  reason: z.string().max(500).optional(),
});

router.post("/:id/decision", async (req, res, next) => {
  try {
    const parsed = decisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
    }

    const actor = req.user!;
    const receipt = await prisma.paymentReceipt.findUnique({
      where: { id: req.params.id },
    });
    if (!receipt) return res.status(404).json({ error: "NOT_FOUND" });

    const agreement = await loadAgreementContext(receipt.agreementId);
    if (!agreement) return res.status(404).json({ error: "AGREEMENT_NOT_FOUND" });
    if (!isRepOnAgreement(agreement, actor.id) && actor.role !== Role.ADMIN) {
      return res.status(403).json({ error: "ONLY_REP_OR_ADMIN" });
    }
    if (receipt.verificationStatus !== ReceiptStatus.PENDING) {
      return res.status(409).json({ error: "INVALID_STATE", status: receipt.verificationStatus });
    }

    const isVerify = parsed.data.decision === "VERIFY";

    const updatedReceipt = await prisma.paymentReceipt.update({
      where: { id: receipt.id },
      data: {
        verificationStatus: isVerify ? ReceiptStatus.VERIFIED : ReceiptStatus.REJECTED,
        verifiedById: actor.id,
        verifiedAt: new Date(),
        rejectionReason: isVerify ? null : (parsed.data.reason ?? null),
      },
    });

    logAudit({
      actorId: actor.id,
      action: isVerify ? "VERIFY" : "REJECT",
      targetType: "PaymentReceipt",
      targetId: receipt.id,
      details: { reason: parsed.data.reason },
    });

    if (isVerify) {
      // Activate the agreement
      const activatedAgreement = await prisma.agreement.update({
        where: { id: agreement.id },
        data: { status: AgreementStatus.ACTIVE },
      });

      logAudit({
        actorId: actor.id,
        action: "ACTIVATE",
        targetType: "Agreement",
        targetId: agreement.id,
        details: { receiptId: receipt.id },
      });

      await paymentVerifiedEvent({
        investorId: receipt.uploaderId,
        agreementId: agreement.id,
      });

      const recipients = [
        receipt.uploaderId,
        ...agreement.proposal.cluster.representatives.map((r) => r.userId),
      ].filter((id, i, arr) => id !== actor.id && arr.indexOf(id) === i);
      if (recipients.length > 0) {
        await agreementActivatedEvent({
          recipientIds: recipients,
          agreementId: agreement.id,
        });
      }

      realtime.toAgreement(agreement.id, "agreement:activated", {
        agreementId: agreement.id,
        status: activatedAgreement.status,
      });
    } else {
      await paymentRejectedEvent({
        investorId: receipt.uploaderId,
        agreementId: agreement.id,
        receiptId: receipt.id,
        reason: parsed.data.reason,
      });
      realtime.toAgreement(agreement.id, "receipt:rejected", {
        agreementId: agreement.id,
        receiptId: receipt.id,
      });
    }

    return res.json({ receipt: updatedReceipt });
  } catch (error) {
    next(error);
  }
});

export default router;
