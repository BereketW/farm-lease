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
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total" value={counts.all} />
        <Metric label="In flight" value={counts.pending} tone="amber" />
        <Metric label="Accepted" value={counts.approved} tone="emerald" />
        <Metric label="Closed" value={counts.rejected} tone="rose" />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/50 bg-muted/30 p-1.5 backdrop-blur-sm w-fit">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "relative rounded-xl px-5 py-2 text-sm font-medium transition-all duration-200 ease-in-out",
                active
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <ProposalsTable proposals={visible} isLoading={query.isLoading} />
    </div>
  );
}
