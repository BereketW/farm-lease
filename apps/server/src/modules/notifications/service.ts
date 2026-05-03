import { prisma } from "@farm-lease/db";
import type { Prisma } from "@prisma/client";
import { realtime } from "../../realtime/io";
import { sendEmailWithRetry } from "./mailer";
import { buildEmailTemplate } from "./templates";

export type NotificationEvent = {
  type: string;
  recipients: string[];
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
  sendEmail?: boolean;
};

export async function dispatchNotification(event: NotificationEvent) {
  const uniqueRecipients = [...new Set(event.recipients)];

  await Promise.all(
    uniqueRecipients.map(async (recipientId) => {
      const notification = await prisma.notification.create({
        data: {
          userId: recipientId,
          type: event.type,
          title: event.title,
          message: event.message,
          metadata: event.metadata,
        },
      });

      realtime.toUser(recipientId, "notification:new", {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.message,
        data: notification.metadata,
        createdAt: notification.createdAt,
      });

      if (event.sendEmail !== false) {
        const recipient = await prisma.user.findUnique({
          where: { id: recipientId },
          select: { email: true },
        });

        if (!recipient?.email) return;

        const actionUrl =
          typeof event.metadata === "object" &&
          event.metadata !== null &&
          "url" in event.metadata &&
          typeof (event.metadata as { url?: unknown }).url === "string"
            ? (event.metadata as { url: string }).url
            : undefined;

        const content = buildEmailTemplate({
          title: event.title,
          body: event.message,
          actionUrl,
        });

        await sendEmailWithRetry({
          to: recipient.email,
          subject: event.title,
          html: content.html,
          text: content.text,
          notifType: event.type,
        });
      }
    })
  );
}

export function proposalSubmittedEvent(input: {
  representativeIds: string[];
  proposalId: string;
  investorName: string;
  clusterName: string;
}) {
  return dispatchNotification({
    type: "PROPOSAL_SUBMITTED",
    recipients: input.representativeIds,
    title: "New proposal submitted",
    message: `${input.investorName} submitted a proposal to ${input.clusterName}.`,
    metadata: { proposalId: input.proposalId, url: `/proposals/${input.proposalId}` },
  });
}

export function proposalTermsChangedEvent(input: {
  recipientIds: string[];
  proposalId: string;
  changedByName: string;
}) {
  return dispatchNotification({
    type: "PROPOSAL_REVISED",
    recipients: input.recipientIds,
    title: "Proposal terms updated",
    message: `${input.changedByName} sent updated terms for this proposal.`,
    metadata: { proposalId: input.proposalId, url: `/proposals/${input.proposalId}` },
  });
}

export function agreementSignedEvent(input: {
  recipientIds: string[];
  agreementId: string;
  signedByName: string;
}) {
  return dispatchNotification({
    type: "AGREEMENT_SIGNED",
    recipients: input.recipientIds,
    title: "Agreement signed",
    message: `${input.signedByName} signed the agreement.`,
    metadata: { agreementId: input.agreementId, url: `/agreements/${input.agreementId}` },
  });
}

export function paymentVerifiedEvent(input: {
  investorId: string;
  agreementId: string;
}) {
  return dispatchNotification({
    type: "PAYMENT_VERIFIED",
    recipients: [input.investorId],
    title: "Payment verified",
    message: "Your payment receipt is verified. Agreement is now active.",
    metadata: { agreementId: input.agreementId, url: `/agreements/${input.agreementId}` },
  });
}

export function proposalAcceptedEvent(input: {
  investorId: string;
  proposalId: string;
  clusterName: string;
}) {
  return dispatchNotification({
    type: "PROPOSAL_ACCEPTED",
    recipients: [input.investorId],
    title: "Proposal accepted",
    message: `Your proposal for ${input.clusterName} has been accepted.`,
    metadata: { proposalId: input.proposalId, url: `/proposals/${input.proposalId}` },
  });
}

export function proposalRejectedEvent(input: {
  investorId: string;
  proposalId: string;
  reason?: string;
}) {
  return dispatchNotification({
    type: "PROPOSAL_REJECTED",
    recipients: [input.investorId],
    title: "Proposal rejected",
    message: input.reason
      ? `Your proposal was rejected: ${input.reason}`
      : "Your proposal was rejected.",
    metadata: { proposalId: input.proposalId, url: `/proposals/${input.proposalId}` },
  });
}

export function proposalWithdrawnEvent(input: {
  representativeIds: string[];
  proposalId: string;
  investorName: string;
}) {
  return dispatchNotification({
    type: "PROPOSAL_WITHDRAWN",
    recipients: input.representativeIds,
    title: "Proposal withdrawn",
    message: `${input.investorName} withdrew their proposal.`,
    metadata: { proposalId: input.proposalId, url: `/proposals/${input.proposalId}` },
    sendEmail: false,
  });
}

export function negotiationMessageEvent(input: {
  recipientIds: string[];
  proposalId: string;
  senderName: string;
  preview: string;
  isCounterOffer?: boolean;
}) {
  return dispatchNotification({
    type: "NEGOTIATION_MESSAGE",
    recipients: input.recipientIds,
    title: input.isCounterOffer ? `Counter-offer from ${input.senderName}` : `New message from ${input.senderName}`,
    message: input.preview,
    metadata: { proposalId: input.proposalId, url: `/proposals/${input.proposalId}` },
    sendEmail: input.isCounterOffer ? true : false,
  });
}

export function agreementCreatedEvent(input: {
  recipientIds: string[];
  agreementId: string;
}) {
  return dispatchNotification({
    type: "AGREEMENT_CREATED",
    recipients: input.recipientIds,
    title: "Agreement draft generated",
    message: "An agreement draft is ready for your review and signature.",
    metadata: { agreementId: input.agreementId, url: `/agreements/${input.agreementId}` },
  });
}

export function agreementActivatedEvent(input: {
  recipientIds: string[];
  agreementId: string;
}) {
  return dispatchNotification({
    type: "AGREEMENT_ACTIVATED",
    recipients: input.recipientIds,
    title: "Agreement activated",
    message: "Payment verified. Your agreement is now active.",
    metadata: { agreementId: input.agreementId, url: `/agreements/${input.agreementId}` },
  });
}

export function agreementCompletedEvent(input: {
  recipientIds: string[];
  agreementId: string;
}) {
  return dispatchNotification({
    type: "AGREEMENT_COMPLETED",
    recipients: input.recipientIds,
    title: "Agreement completed",
    message:
      "The lease term has ended. Your agreement is now marked as completed.",
    metadata: {
      agreementId: input.agreementId,
      url: `/agreements/${input.agreementId}`,
    },
  });
}

export function agreementCancelledEvent(input: {
  recipientIds: string[];
  agreementId: string;
  reason?: string;
}) {
  return dispatchNotification({
    type: "AGREEMENT_CANCELLED",
    recipients: input.recipientIds,
    title: "Agreement cancelled",
    message: input.reason ? `Agreement cancelled: ${input.reason}` : "The agreement has been cancelled.",
    metadata: { agreementId: input.agreementId, url: `/agreements/${input.agreementId}` },
  });
}

export function paymentSubmittedEvent(input: {
  recipientIds: string[];
  agreementId: string;
  receiptId: string;
  investorName: string;
}) {
  return dispatchNotification({
    type: "PAYMENT_SUBMITTED",
    recipients: input.recipientIds,
    title: "Payment receipt submitted",
    message: `${input.investorName} uploaded a payment receipt for review.`,
    metadata: { agreementId: input.agreementId, receiptId: input.receiptId, url: `/agreements/${input.agreementId}#receipts` },
  });
}

export function paymentRejectedEvent(input: {
  investorId: string;
  agreementId: string;
  receiptId: string;
  reason?: string;
}) {
  return dispatchNotification({
    type: "PAYMENT_REJECTED",
    recipients: [input.investorId],
    title: "Payment receipt rejected",
    message: input.reason
      ? `Your receipt was rejected: ${input.reason}`
      : "Your payment receipt was rejected. Please re-upload.",
    metadata: { agreementId: input.agreementId, receiptId: input.receiptId, url: `/agreements/${input.agreementId}#receipts` },
  });
}
