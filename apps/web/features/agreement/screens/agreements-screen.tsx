"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileSignature, MapPin, Users, Calendar } from "lucide-react";
import { listAgreements } from "@/features/agreement/datasource/agreements";
import type { AgreementStatus } from "@/lib/api/types";
import { cn } from "@farm-lease/ui/lib/utils";

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

  const query = useQuery({
    queryKey: ["agreements", filter],
    queryFn: () =>
      listAgreements(filter === "ALL" ? undefined : { status: filter }),
  });

  return (
    <div className="mx-auto w-full max-w-[1600px] px-6 py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Agreements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Digital lease contracts between investors and farmer clusters.
          </p>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              filter === f.value
                ? "bg-emerald-600 text-white"
                : "bg-accent text-muted-foreground hover:bg-emerald-100 hover:text-emerald-900"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading agreements…
        </div>
      ) : query.error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          {(query.error as Error).message}
        </div>
      ) : !query.data?.agreements.length ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <FileSignature className="mx-auto size-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium text-foreground">No agreements yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Agreements appear here once a proposal is accepted.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {query.data.agreements.map((a) => (
            <li key={a.id}>
              <Link
                href={`/agreements/${a.id}`}
                className="group block rounded-xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {a.proposal.cluster.name}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1",
                          STATUS_STYLES[a.status]
                        )}
                      >
                        {a.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" />
                        {a.proposal.investor.name ?? "Investor"}
                      </span>
                      {a.proposal.cluster.region ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {a.proposal.cluster.region}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {new Date(a.startDate).toLocaleDateString()} →{" "}
                        {new Date(a.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Budget
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      ETB {Number(a.proposal.budget).toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {a.signatures.length} / 2 signed
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
