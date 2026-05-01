import { prisma } from "@farm-lease/db";
import { logAudit } from "../lib/audit";
import { agreementCompletedEvent } from "../modules/notifications/service";
import { loadAgreementContext } from "../modules/agreements/access";

/**
 * Scan every ACTIVE agreement whose `endDate` has passed and flip it to
 * COMPLETED. Runs once on startup and then daily. Idempotent — running
 * it many times is harmless because the `status=ACTIVE` filter excludes
 * anything already completed.
 */
async function completeExpiredAgreements(): Promise<number> {
  const now = new Date();

  const due = await prisma.agreement.findMany({
    where: {
      status: "ACTIVE",
      endDate: { lte: now },
    },
    select: { id: true },
  });

  if (due.length === 0) return 0;

  for (const { id } of due) {
    try {
      // Update status
      await prisma.agreement.update({
        where: { id },
        data: { status: "COMPLETED" },
      });

      // Gather recipient ids (investor + all reps on that cluster)
      const ctx = await loadAgreementContext(id);
      if (!ctx) continue;

      const investorId = ctx.proposal.investorId;
      const repIds = ctx.proposal.cluster.representatives.map((r) => r.userId);
      const recipientIds = Array.from(new Set([investorId, ...repIds]));

      // Audit — attributed to investor as a deterministic party; the
      // `action` + `details` make the system origin clear.
      await logAudit({
        actorId: investorId,
        action: "AGREEMENT_COMPLETED",
        targetType: "Agreement",
        targetId: id,
        details: {
          endDate: ctx.endDate.toISOString(),
          reason: "lease_term_ended",
          triggeredBy: "system_cron",
        },
      });

      // Notify
      await agreementCompletedEvent({
        recipientIds,
        agreementId: id,
      });
    } catch (error) {
      console.warn(`[agreement-lifecycle] failed to complete ${id}:`, error);
    }
  }

  return due.length;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Starts the lifecycle scheduler. Runs immediately on boot (to catch
 * anything that expired while the server was down) and then every 24h.
 */
export function startAgreementLifecycleJob() {
  const run = async () => {
    try {
      const count = await completeExpiredAgreements();
      if (count > 0) {
        console.log(
          `[agreement-lifecycle] completed ${count} agreement(s) past endDate`
        );
      }
    } catch (error) {
      console.warn("[agreement-lifecycle] run failed:", error);
    }
  };

  // Defer the first run to avoid blocking server startup
  setTimeout(() => {
    void run();
  }, 5_000);

  const interval = setInterval(() => {
    void run();
  }, DAY_MS);

  // Let node exit even if only this interval remains
  interval.unref?.();

  return () => clearInterval(interval);
}
