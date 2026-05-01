"use client";

import { StatusPill, statusGroup } from "../_design/status-pill";
import type { ProposalStatus } from "@/lib/api/types";

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return <StatusPill status={status} />;
}

export { statusGroup };
