"use client";

import { cn } from "@farm-lease/ui/lib/utils";
import type { ProposalStatus } from "@/lib/api/types";

const META: Record<
  ProposalStatus,
  { label: string; bg: string; text: string; dot: string; pulse?: boolean }
> = {
  DRAFT: {
    label: "Draft",
    bg: "bg-zinc-100",
    text: "text-zinc-700",
    dot: "bg-zinc-400",
  },
  SUBMITTED: {
    label: "Awaiting review",
    bg: "bg-amber-100",
    text: "text-amber-900",
    dot: "bg-amber-500",
    pulse: true,
  },
  UNDER_NEGOTIATION: {
    label: "Negotiating",
    bg: "bg-lime-100",
    text: "text-lime-900",
    dot: "bg-lime-600",
    pulse: true,
  },
  ACCEPTED: {
    label: "Accepted",
    bg: "bg-emerald-100",
    text: "text-emerald-900",
    dot: "bg-emerald-600",
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-rose-100",
    text: "text-rose-900",
    dot: "bg-rose-500",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    bg: "bg-zinc-100",
    text: "text-zinc-700",
    dot: "bg-zinc-400",
  },
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
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        meta.bg,
        meta.text,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className="relative inline-flex h-2 w-2">
        {meta.pulse ? (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
              meta.dot
            )}
          />
        ) : null}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", meta.dot)} />
      </span>
      {meta.label}
    </span>
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
