"use client";

import Link from "next/link";
import { ArrowUpRight, MapPin, Sprout } from "lucide-react";
import type { ProposalSummary } from "@/lib/api/types";
import { StatusPill } from "../_design/status-pill";
import { NameAvatar } from "@/components/editorial";

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

/**
 * Editorial ledger row for a proposal. Anchored as a Next link.
 * Shape mirrors the shared EditorialRow grid (index | content | budget | arrow)
 * but composes its own column layout because the budget cell is custom.
 */
export function ProposalRow({
  proposal,
  index,
}: {
  proposal: ProposalSummary;
  index?: number;
}) {
  const title = proposal.terms?.title ?? proposal.cluster.name;
  const crop = (proposal.terms as { cropType?: string } | undefined)?.cropType;
  const duration = (proposal.terms as { durationMonths?: number } | undefined)
    ?.durationMonths;

  return (
    <Link
      href={`/proposals/${proposal.id}`}
      className="group relative grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 border-b border-emerald-950/10 px-4 py-5 transition-colors hover:bg-stone-50/60 dark:border-emerald-400/10 dark:hover:bg-stone-900/20 sm:grid-cols-[56px_minmax(0,1fr)_auto_auto] sm:gap-6 sm:px-6"
    >
      <span
        className="select-none font-serif text-2xl italic leading-none tabular-nums text-emerald-900/35 transition-colors group-hover:text-emerald-700 dark:text-emerald-300/25 dark:group-hover:text-emerald-300 sm:text-3xl"
        style={{ fontFamily: "var(--font-fraunces)" }}
        aria-hidden
      >
        {String(typeof index === "number" ? index + 1 : 0).padStart(2, "0")}
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3
            className="truncate font-serif text-lg font-medium leading-tight tracking-tight text-emerald-950 transition-colors group-hover:text-emerald-800 dark:text-emerald-50 dark:group-hover:text-emerald-200"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {title}
          </h3>
          <StatusPill status={proposal.status} size="sm" />
        </div>
        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-stone-600 dark:text-stone-400">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3 text-emerald-700/70 dark:text-emerald-400/70" />
            <span className="font-medium text-stone-800 dark:text-stone-200">
              {proposal.cluster.name}
            </span>
          </span>
          {crop ? (
            <span className="inline-flex items-center gap-1">
              <Sprout className="h-3 w-3 text-emerald-700/70 dark:text-emerald-400/70" />
              <span>{crop}</span>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2">
            <NameAvatar
              size="xs"
              id={proposal.investor.id}
              name={proposal.investor.name}
            />
            <span className="italic">
              {proposal.investor.name ?? "Investor"}
            </span>
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500 dark:text-stone-500"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {relativeTime(proposal.updatedAt)}
          </span>
        </div>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-500">
          Offer
        </p>
        <p
          className="mt-0.5 font-serif text-xl font-light tabular-nums tracking-tight text-emerald-950 dark:text-emerald-50"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          <span className="text-[11px] not-italic align-top text-stone-500">
            ETB{" "}
          </span>
          {Number(proposal.budget).toLocaleString()}
        </p>
        {duration ? (
          <p className="mt-0.5 text-[10px] text-stone-500 dark:text-stone-500">
            over <span className="tabular-nums">{duration}</span> months
          </p>
        ) : null}
      </div>

      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-950/10 text-emerald-900/70 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:border-emerald-700/40 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:border-emerald-300/20 dark:text-emerald-300/70 dark:group-hover:border-emerald-300/40 dark:group-hover:bg-emerald-950/40 dark:group-hover:text-emerald-200">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
