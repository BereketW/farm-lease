"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileSignature, MapPin, Users, Calendar, ArrowUpRight } from "lucide-react";
import { listAgreements } from "@/features/agreement/datasource/agreements";
import type { AgreementStatus } from "@/lib/api/types";
import { cn } from "@farm-lease/ui/lib/utils";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Masthead, PaperGrain } from "@/components/editorial";

const STATUS_FILTERS: Array<{ label: string; value: AgreementStatus | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Pending Signatures", value: "PENDING_SIGNATURES" },
  { label: "Active", value: "ACTIVE" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const STATUS_STYLES: Record<AgreementStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  PENDING_SIGNATURES: "bg-amber-50 text-amber-800 ring-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  COMPLETED: "bg-blue-50 text-blue-800 ring-blue-200",
  CANCELLED: "bg-rose-50 text-rose-800 ring-rose-200",
};

export function AgreementsScreen() {
  const [filter, setFilter] = useState<AgreementStatus | "ALL">("ALL");
  const { isAdmin, isRepresentative } = useAuth();

  const query = useQuery({
    queryKey: ["agreements", filter],
    queryFn: () =>
      listAgreements(filter === "ALL" ? undefined : { status: filter }),
  });

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

  return (
    <div className="relative flex flex-1 flex-col bg-stone-50/60 dark:bg-stone-950/60">
      <PaperGrain />

      <header className="relative border-b border-emerald-950/15 bg-gradient-to-b from-stone-50/90 to-transparent px-6 pb-10 pt-10 dark:border-emerald-400/15 dark:from-stone-950/80 sm:px-10 lg:px-14">
        <div className="relative mx-auto w-full max-w-[1400px]">
          <Masthead
            publication="FarmLease · Agreement Ledger"
            kicker={role.kicker}
            title={role.title}
            lede={lede}
          />
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-[1400px] px-6 py-10 sm:px-10 lg:px-14">
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border/50 bg-muted/30 p-1.5 backdrop-blur-sm w-fit">
          {STATUS_FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
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

        {query.isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl border border-border/50 bg-muted/30"
              />
            ))}
          </div>
        ) : query.error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
            {(query.error as Error).message}
          </div>
        ) : !query.data?.agreements.length ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/50 bg-card/50 px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-muted/50 text-muted-foreground ring-1 ring-border/50">
              <FileSignature className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-foreground">No agreements found.</p>
            <p className="text-xs text-muted-foreground">
              Agreements will appear here once a proposal is accepted.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {query.data.agreements.map((a) => (
              <Link
                key={a.id}
                href={`/agreements/${a.id}`}
                className="group relative flex flex-col gap-4 sm:flex-row sm:items-center rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/50 hover:shadow-lg dark:hover:border-emerald-800/50"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 opacity-0 transition-opacity duration-300 group-hover:from-emerald-500/5 group-hover:to-transparent group-hover:opacity-100" />
                
                <div className="min-w-0 flex-1 relative">
                  <div className="flex items-center gap-3">
                    <h3 className="truncate text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                      {a.proposal.cluster.name}
                    </h3>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1",
                        STATUS_STYLES[a.status]
                      )}
                    >
                      {a.status.replace("_", " ")}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap items-center gap-3 truncate text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                      <Users className="size-3.5" />
                      {a.proposal.investor.name ?? "Investor"}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    {a.proposal.cluster.region ? (
                      <>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3.5" />
                          {a.proposal.cluster.region}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                      </>
                    ) : null}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      {new Date(a.startDate).toLocaleDateString()} →{" "}
                      {new Date(a.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex shrink-0 items-center justify-between sm:flex-col sm:items-end sm:justify-center relative">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Budget
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-foreground">
                      ETB {Number(a.proposal.budget).toLocaleString()}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {a.signatures.length} / 2 signed
                    </p>
                  </div>
                  
                  <div className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/50 transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 sm:hidden">
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                  </div>
                </div>

                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted/50 transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 sm:flex relative">
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
