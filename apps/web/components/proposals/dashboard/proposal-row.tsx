"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProposalSummary } from "@/lib/api/types";
import { StatusPill } from "../_design/status-pill";
import { NameAvatar } from "../_design/avatar";

function relativeTime(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function ProposalRow({ proposal }: { proposal: ProposalSummary }) {
  return (
    <Link
      href={`/proposals/${proposal.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
    >
      <NameAvatar
        size="md"
        id={proposal.investor.id}
        name={proposal.investor.name}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-emerald-950">
            {proposal.terms?.title ?? proposal.cluster.name}
          </h3>
          <StatusPill status={proposal.status} size="sm" />
        </div>
        <p className="mt-0.5 truncate text-xs text-zinc-600">
          {proposal.cluster.name} · {proposal.investor.name ?? "Investor"} ·{" "}
          {relativeTime(proposal.updatedAt)}
        </p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Budget
        </p>
        <p className="text-sm font-semibold tabular-nums text-emerald-900">
          ETB {Number(proposal.budget).toLocaleString()}
        </p>
      </div>
      <ArrowUpRight className="hidden h-4 w-4 text-zinc-400 transition group-hover:text-emerald-700 sm:block" />
    </Link>
  );
}
