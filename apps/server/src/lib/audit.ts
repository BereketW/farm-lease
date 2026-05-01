import { prisma } from "@farm-lease/db";
import type { Prisma } from "@prisma/client";

export type AuditTargetType =
  | "Proposal"
  | "Agreement"
  | "PaymentReceipt"
  | "User"
  | "Cluster";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "STATE_CHANGE"
  | "SIGN"
  | "VERIFY"
  | "REJECT"
  | "CANCEL"
  | "ACTIVATE"
  | "COMPLETE"
  | "AGREEMENT_COMPLETED"
  | "TERMS_EDITED";

/**
 * Fire-and-forget audit logger. Failures are logged to console but never throw.
 */
export function logAudit(entry: {
  actorId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  details?: Prisma.InputJsonValue;
}): void {
  void prisma.auditLog
    .create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        details: entry.details,
      },
    })
    .catch((error) => {
      console.warn("[audit] failed to write log", error);
    });
}
