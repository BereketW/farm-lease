"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAgreements } from "@/features/agreement/datasource/agreements";
import type { AgreementStatus } from "@/lib/api/types";
import { cn } from "@farm-lease/ui/lib/utils";
import { useAuth } from "@/features/auth/hooks/use-auth";

import { Metric } from "@/components/editorial";
import { AgreementsTable } from "../components/dashboard/agreements-table";

const STATUS_FILTERS: Array<{ id: AgreementStatus | "ALL", label: string }> = [
  { id: "ALL", label: "All" },
  { id: "DRAFT", label: "Drafts" },
  { id: "PENDING_SIGNATURES", label: "Awaiting Signatures" },
  { id: "ACTIVE", label: "Active" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELLED", label: "Cancelled" },
];

export function AgreementsScreen() {
  const [filter, setFilter] = useState<AgreementStatus | "ALL">("ALL");
  const { isAdmin, isRepresentative } = useAuth();

  const query = useQuery({
    queryKey: ["agreements"],
    queryFn: () => listAgreements(),
  });

  const agreements = useMemo(
    () => query.data?.agreements ?? [],
    [query.data]
  );

  const visible = useMemo(() => {
    if (filter === "ALL") return agreements;
    return agreements.filter((a) => a.status === filter);
  }, [agreements, filter]);

  const counts = useMemo(() => {
    const c = { all: agreements.length, pending: 0, active: 0, closed: 0 };
    for (const a of agreements) {
      if (a.status === "DRAFT" || a.status === "PENDING_SIGNATURES") c.pending += 1;
      else if (a.status === "ACTIVE") c.active += 1;
      else if (a.status === "COMPLETED" || a.status === "CANCELLED") c.closed += 1;
    }
    return c;
  }, [agreements]);

  const role = isAdmin
    ? { kicker: "Global oversight", title: "All agreements" }
    : isRepresentative
    ? { kicker: "Cluster desk", title: "Active contracts" }
    : { kicker: "Investor desk", title: "Your contracts" };

  const lede = isAdmin
    ? "Monitor executed contracts, pending signatures, and payments across all clusters globally."
    : isRepresentative
    ? "Manage your active cluster lease contracts and verify offline payment receipts."
    : "Track your active lease agreements, manage signatures, and upload payment receipts.";

  const titleParts = role.title.split(" ");
  const firstWord = titleParts[0];
  const restOfTitle = titleParts.slice(1).join(" ");

  return (
    <div className="relative flex flex-1 flex-col bg-stone-50/60 dark:bg-stone-950/60">
      <header className="border-b border-emerald-950/15 bg-white px-6 py-8 dark:border-emerald-400/15 dark:bg-stone-950 sm:px-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
              {firstWord}{" "}
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                {restOfTitle}
              </span>
            </h1>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              {lede}
            </p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-[1400px] px-6 py-10 sm:px-10 lg:px-14">
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
                Contract summary
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
                label="Pending"
                value={counts.pending}
                tone="amber"
                hint="Drafts or awaiting signatures"
                index="ii"
                className="rounded-none border-0"
              />
              <Metric
                label="Active"
                value={counts.active}
                tone="emerald"
                hint="Currently active leases"
                index="iii"
                className="rounded-none border-0"
              />
              <Metric
                label="Closed"
                value={counts.closed}
                tone="default"
                hint="Completed or cancelled"
                index="iv"
                className="rounded-none border-0"
              />
            </div>
          </section>

          {/* Filter: underlined editorial tabs */}
          <nav
            className="flex flex-wrap items-end gap-x-6 gap-y-2 border-b border-emerald-950/10 dark:border-emerald-400/10"
            aria-label="Filter agreements"
          >
            {STATUS_FILTERS.map((f) => {
              const active = filter === f.id;
              
              // Compute dynamic counts per tab
              let tabCount = 0;
              if (f.id === "ALL") tabCount = counts.all;
              else if (f.id === "DRAFT" || f.id === "PENDING_SIGNATURES") {
                 tabCount = agreements.filter(a => a.status === f.id).length;
              } else if (f.id === "ACTIVE") tabCount = counts.active;
              else if (f.id === "COMPLETED" || f.id === "CANCELLED") {
                 tabCount = agreements.filter(a => a.status === f.id).length;
              }

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
                    {String(tabCount).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </nav>

          <AgreementsTable agreements={visible} isLoading={query.isLoading} />
        </div>
      </main>
    </div>
  );
}
