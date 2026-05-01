"use client";

import Link from "next/link";
import { Sprout } from "lucide-react";
import type { ProposalSummary } from "@/lib/api/types";
import { ProposalRow } from "./proposal-row";

type Props = {
  proposals: ProposalSummary[];
  isLoading: boolean;
  emptyHint?: string;
};

export function ProposalsTable({ proposals, isLoading, emptyHint }: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-emerald-100 bg-emerald-50/40"
          />
        ))}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 px-6 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-emerald-700 ring-1 ring-emerald-200">
          <Sprout className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-emerald-950">
          {emptyHint ?? "No proposals yet."}
        </p>
        <Link
          href="/proposals/new"
          className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Create your first proposal
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {proposals.map((proposal) => (
        <ProposalRow key={proposal.id} proposal={proposal} />
      ))}
    </div>
  );
}
