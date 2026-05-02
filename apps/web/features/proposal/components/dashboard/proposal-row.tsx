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
      className="group relative flex items-center gap-5 rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/50 hover:shadow-lg dark:hover:border-emerald-800/50"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 opacity-0 transition-opacity duration-300 group-hover:from-emerald-500/5 group-hover:to-transparent group-hover:opacity-100" />
      
      <NameAvatar
        size="md"
        id={proposal.investor.id}
        name={proposal.investor.name}
      />
      
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h3 className="truncate text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
            {proposal.terms?.title ?? proposal.cluster.name}
          </h3>
          <StatusPill status={proposal.status} size="sm" />
        </div>
        <div className="mt-1 flex items-center gap-2 truncate text-sm text-muted-foreground">
          <span className="font-medium text-foreground/80">{proposal.cluster.name}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{proposal.investor.name ?? "Investor"}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{relativeTime(proposal.updatedAt)}</span>
        </div>
      </div>
      
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Investment Budget
        </p>
        <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-foreground">
          ETB {Number(proposal.budget).toLocaleString()}
        </p>
      </div>
      
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/50 transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 sm:h-12 sm:w-12">
        <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
      </div>
    </Link>
  );
}
