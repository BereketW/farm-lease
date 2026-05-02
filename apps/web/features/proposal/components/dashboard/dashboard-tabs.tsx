"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@farm-lease/ui/lib/utils";
import { listProposals } from "@/features/proposal/datasource/proposals";
import type { ProposalSummary } from "@/lib/api/types";
import { ProposalsTable } from "./proposals-table";
import { statusGroup } from "../_design/status-pill";
import { Metric } from "../_design/metric";

const FILTERS = [
  { id: "all", label: "All", tone: "default" as const },
  { id: "pending", label: "In flight", tone: "amber" as const },
  { id: "approved", label: "Accepted", tone: "emerald" as const },
  { id: "rejected", label: "Closed", tone: "rose" as const },
];

export function DashboardTabs() {
  const [filter, setFilter] = useState<string>("all");
  const query = useQuery({
    queryKey: ["proposals"],
    queryFn: () => listProposals(),
  });

  const proposals = useMemo<ProposalSummary[]>(
    () => query.data?.proposals ?? [],
    [query.data]
  );

  const counts = useMemo(() => {
    const c = { all: proposals.length, pending: 0, approved: 0, rejected: 0 };
    for (const p of proposals) {
      const g = statusGroup(p.status);
      if (g === "pending") c.pending += 1;
      else if (g === "approved") c.approved += 1;
      else if (g === "rejected") c.rejected += 1;
    }
    return c;
  }, [proposals]);

  const visible = useMemo(() => {
    if (filter === "all") return proposals;
    return proposals.filter((p) => statusGroup(p.status) === filter);
  }, [proposals, filter]);

  return (
    <div className="space-y-8">
      {/* Almanac / Metrics */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2
            className="font-serif text-[13px] italic text-emerald-800 dark:text-emerald-300"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            The Almanac
          </h2>
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-500">
            Season summary
          </span>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-emerald-950/10 bg-emerald-950/10 dark:border-emerald-400/10 dark:bg-emerald-400/10 sm:grid-cols-4">
          <Metric
            label="All entries"
            value={counts.all}
            hint="Total in the ledger"
            index="i"
            className="rounded-none border-0"
          />
          <Metric
            label="In flight"
            value={counts.pending}
            tone="amber"
            hint="Awaiting review or in negotiation"
            index="ii"
            className="rounded-none border-0"
          />
          <Metric
            label="Accepted"
            value={counts.approved}
            tone="emerald"
            hint="Converted to agreement"
            index="iii"
            className="rounded-none border-0"
          />
          <Metric
            label="Closed"
            value={counts.rejected}
            tone="rose"
            hint="Rejected or withdrawn"
            index="iv"
            className="rounded-none border-0"
          />
        </div>
      </section>

      {/* Filter: underlined editorial tabs */}
      <nav
        className="flex flex-wrap items-end gap-x-6 gap-y-2 border-b border-emerald-950/10 dark:border-emerald-400/10"
        aria-label="Filter proposals"
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const countByTab: Record<string, number> = counts;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "group relative -mb-px flex items-baseline gap-2 border-b-2 pb-3 pt-1 transition-colors",
                active
                  ? "border-emerald-800 dark:border-emerald-300"
                  : "border-transparent hover:border-emerald-800/30 dark:hover:border-emerald-400/30"
              )}
            >
              <span
                className={cn(
                  "font-serif text-[15px] italic tracking-tight transition-colors",
                  active
                    ? "text-emerald-900 dark:text-emerald-100"
                    : "text-stone-500 group-hover:text-emerald-900 dark:text-stone-400 dark:group-hover:text-emerald-200"
                )}
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                {f.label}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] tabular-nums transition-colors",
                  active
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-stone-400 dark:text-stone-500"
                )}
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {String(countByTab[f.id] ?? 0).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </nav>

      <ProposalsTable proposals={visible} isLoading={query.isLoading} />
    </div>
  );
}
