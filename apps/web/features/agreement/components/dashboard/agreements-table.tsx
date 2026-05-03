"use client";

import { useMemo, useState } from "react";
import { FileSignature } from "lucide-react";
import type { AgreementSummary } from "@/lib/api/types";
import { AgreementRow } from "./agreement-row";
import {
  EditorialEmpty,
  EditorialPagination,
  EditorialSearch,
  EditorialTable,
  usePagination,
} from "@/components/editorial";

const PAGE_SIZE = 12;

type Props = {
  agreements: AgreementSummary[];
  isLoading: boolean;
  emptyHint?: string;
};

export function AgreementsTable({ agreements, isLoading, emptyHint }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return agreements;
    return agreements.filter((a) => {
      const title = a.proposal.cluster.name;
      const investor = a.proposal.investor.name ?? "";
      const region = a.proposal.cluster.region ?? "";
      return (
        title.toLowerCase().includes(q) ||
        investor.toLowerCase().includes(q) ||
        region.toLowerCase().includes(q)
      );
    });
  }, [agreements, search]);

  const {
    items: paged,
    page: safePage,
    pageCount,
    setPage,
    indexOffset,
  } = usePagination(filtered, PAGE_SIZE);

  /* ── loading ── */
  if (isLoading) {
    return (
      <EditorialTable title="The Ledger" eyebrow="Active agreements" footer={false}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 border-b border-emerald-950/10 px-4 py-5 last:border-b-0 dark:border-emerald-400/10 sm:grid-cols-[56px_minmax(0,1fr)_auto_auto] sm:gap-6 sm:px-6"
          >
            <div className="h-6 w-6 animate-pulse rounded-sm bg-stone-200/70 dark:bg-stone-800/70" />
            <div className="space-y-2">
              <div className="h-4 w-2/5 animate-pulse rounded-sm bg-stone-200/70 dark:bg-stone-800/70" />
              <div className="h-3 w-3/5 animate-pulse rounded-sm bg-stone-200/50 dark:bg-stone-800/50" />
            </div>
            <div className="hidden h-6 w-24 animate-pulse rounded-sm bg-stone-200/70 dark:bg-stone-800/70 sm:block" />
            <div className="h-9 w-9 animate-pulse rounded-full bg-stone-200/70 dark:bg-stone-800/70" />
          </div>
        ))}
      </EditorialTable>
    );
  }

  /* ── empty (no agreements at all) ── */
  if (agreements.length === 0) {
    return (
      <EditorialEmpty
        icon={<FileSignature className="h-6 w-6" />}
        title={emptyHint ?? "The ledger is empty."}
        description="No agreements found. Agreements will appear here once a proposal is accepted."
      />
    );
  }

  /* ── populated ── */
  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <EditorialSearch
          value={search}
          onChange={setSearch}
          placeholder="Search by cluster, investor, region…"
          className="w-full sm:max-w-md"
        />
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {String(filtered.length).padStart(2, "0")}{" "}
          {filtered.length === 1 ? "entry" : "entries"}
          {search ? " match" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EditorialEmpty
          icon={<FileSignature className="h-6 w-6" />}
          title="No agreements match your search."
          description="Try a different term, or clear the search to see everything."
        />
      ) : (
        <EditorialTable
          title="The Ledger"
          eyebrow="Active agreements"
          count={filtered.length}
          footer={false}
        >
          {paged.map((agreement, i) => (
            <AgreementRow
              key={agreement.id}
              agreement={agreement}
              index={indexOffset + i}
            />
          ))}
          <EditorialPagination
            page={safePage}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </EditorialTable>
      )}
    </div>
  );
}
