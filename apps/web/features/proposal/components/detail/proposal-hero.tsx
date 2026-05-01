"use client";

import { CalendarDays, Clock, MapPin, Sprout } from "lucide-react";
import { NameAvatar } from "../_design/avatar";
import { StatusPill } from "../_design/status-pill";
import { Metric } from "../_design/metric";
import type { ProposalDetail } from "@/lib/api/types";

function formatBudget(value: number | string, currency = "ETB") {
  const n = Number(value);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ${currency}`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k ${currency}`;
  return `${n.toLocaleString()} ${currency}`;
}

export function ProposalHero({ proposal }: { proposal: ProposalDetail }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50/40 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-700">
            <Sprout className="h-3.5 w-3.5" />
            Lease proposal
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-emerald-950">
            {proposal.terms?.title ?? proposal.cluster.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-emerald-900/70">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {proposal.cluster.name}
              {proposal.cluster.region ? ` · ${proposal.cluster.region}` : ""}
            </span>
            <span className="text-emerald-200">•</span>
            <span className="inline-flex items-center gap-2">
              <NameAvatar
                size="xs"
                id={proposal.investor.id}
                name={proposal.investor.name}
                email={proposal.investor.email}
              />
              <span>{proposal.investor.name ?? proposal.investor.email}</span>
            </span>
          </div>
        </div>
        <StatusPill status={proposal.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 px-6 pb-6 pt-5 sm:grid-cols-4">
        <Metric
          label="Budget"
          value={formatBudget(proposal.budget)}
          tone="emerald"
        />
        <Metric
          label="Duration"
          value={`${proposal.durationMonths} mo`}
          tone="lime"
        />
        <Metric
          label="Start"
          value={
            proposal.startDate
              ? new Date(proposal.startDate).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                  year: "2-digit",
                })
              : "—"
          }
          hint={proposal.startDate ? undefined : "Not set"}
        />
        <Metric
          label="Submitted"
          value={new Date(proposal.createdAt).toLocaleDateString([], {
            month: "short",
            day: "numeric",
          })}
          hint={new Date(proposal.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
      </div>

      {proposal.terms?.summary ? (
        <div className="border-t border-emerald-100 bg-white/60 px-6 py-4">
          <div className="flex items-start gap-2 text-sm text-emerald-950/90">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="leading-relaxed">{proposal.terms.summary}</p>
          </div>
          <div className="sr-only" aria-hidden>
            <CalendarDays />
          </div>
        </div>
      ) : null}
    </section>
  );
}
