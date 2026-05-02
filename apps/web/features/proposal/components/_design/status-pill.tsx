"use client";

import {
  StatusPill as BaseStatusPill,
  type StatusTone,
} from "@/components/editorial/status-pill";
import type { ProposalStatus } from "@/lib/api/types";

const META: Record<
  ProposalStatus,
  { label: string; tone: StatusTone; pulse?: boolean }
> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  SUBMITTED: { label: "Awaiting review", tone: "amber", pulse: true },
  UNDER_NEGOTIATION: { label: "In negotiation", tone: "lime", pulse: true },
  ACCEPTED: { label: "Accepted", tone: "emerald" },
  REJECTED: { label: "Rejected", tone: "rose" },
  WITHDRAWN: { label: "Withdrawn", tone: "neutral" },
};

export function StatusPill({
  status,
  size = "md",
}: {
  status: ProposalStatus;
  size?: "sm" | "md";
}) {
  const meta = META[status];
  return (
    <BaseStatusPill
      label={meta.label}
      tone={meta.tone}
      pulse={meta.pulse}
      size={size}
    />
  );
}

export function statusGroup(
  status: ProposalStatus
): "pending" | "approved" | "rejected" | "other" {
  if (status === "SUBMITTED" || status === "UNDER_NEGOTIATION") return "pending";
  if (status === "ACCEPTED") return "approved";
  if (status === "REJECTED" || status === "WITHDRAWN") return "rejected";
  return "other";
}
