"use client";

import { CalendarDays, Clock, MapPin, Sprout } from "lucide-react";
import {
  Metric,
  NameAvatar,
  StatusPill,
  type StatusTone,
} from "@/components/editorial";
import type { ProposalDetail, ProposalStatus } from "@/lib/api/types";

const STATUS_TONE: Record<ProposalStatus, StatusTone> = {
  DRAFT: "neutral",
  SUBMITTED: "sky",
  UNDER_NEGOTIATION: "amber",
  ACCEPTED: "emerald",
  REJECTED: "rose",
  WITHDRAWN: "neutral",
};

function formatBudget(value: number | string, currency = "ETB") {
  const n = Number(value);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ${currency}`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k ${currency}`;
  return `${n.toLocaleString()} ${currency}`;
}

export function ProposalHero({ proposal }: { proposal: ProposalDetail }) {
  return (
    <section className="overflow-hidden rounded-sm border border-emerald-950/15 bg-white/80 shadow-[0_1px_0_rgba(0,0,0,0.02)] dark:border-emerald-400/15 dark:bg-stone-900/60">
      <div className="border-b border-emerald-950/10 bg-linear-to-br from-emerald-50/70 via-white to-lime-50/30 px-6 py-6 dark:border-emerald-400/10 dark:from-emerald-950/30 dark:via-stone-900/60 dark:to-stone-900/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-800/80 dark:text-emerald-300/80">
              <Sprout className="h-3 w-3" />
              Lease Proposal · Nº{" "}
              <span className="font-mono">{proposal.id.slice(0, 8)}</span>
            </p>
            <h1
              className="mt-2 font-serif text-4xl font-light leading-none tracking-tight text-emerald-950 dark:text-emerald-50 sm:text-5xl"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {proposal.terms?.title ?? proposal.cluster.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 dark:text-stone-400">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                {proposal.cluster.name}
                {proposal.cluster.region ? ` · ${proposal.cluster.region}` : ""}
              </span>
              <span className="text-emerald-700/30">◆</span>
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
          <StatusPill
            label={proposal.status.replace("_", " ")}
            tone={STATUS_TONE[proposal.status]}
            pulse={proposal.status === "UNDER_NEGOTIATION"}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-emerald-950/10 dark:bg-emerald-400/10 sm:grid-cols-4">
        <Metric
          label="Budget"
          value={formatBudget(proposal.budget)}
          tone="emerald"
          hint="Total commitment"
          index="i"
          className="rounded-none border-0"
        />
        <Metric
          label="Duration"
          value={`${proposal.durationMonths} mo`}
          tone="lime"
          hint="Lease span"
          index="ii"
          className="rounded-none border-0"
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
          hint={proposal.startDate ? "Proposed" : "Not set"}
          index="iii"
          className="rounded-none border-0"
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
          index="iv"
          className="rounded-none border-0"
        />
      </div>

      {proposal.terms?.summary ? (
        <div className="border-t border-emerald-950/10 bg-stone-50/40 px-6 py-4 dark:border-emerald-400/10 dark:bg-stone-900/40">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
            <p
              className="font-serif text-sm italic leading-relaxed text-stone-700 dark:text-stone-300"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {proposal.terms.summary}
            </p>
          </div>
          <div className="sr-only" aria-hidden>
            <CalendarDays />
          </div>
        </div>
      ) : null}
    </section>
  );
}
