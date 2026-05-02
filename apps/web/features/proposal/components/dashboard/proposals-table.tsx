"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sprout, Wheat } from "lucide-react";
import type { ProposalSummary } from "@/lib/api/types";
import { ProposalRow } from "./proposal-row";
import {
  EditorialButton,
  EditorialEmpty,
  EditorialPagination,
  EditorialSearch,
  EditorialTable,
} from "@/components/editorial";

const PAGE_SIZE = 12;

type Props = {
  proposals: ProposalSummary[];
  isLoading: boolean;
  emptyHint?: string;
};

export function ProposalsTable({ proposals, isLoading, emptyHint }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return proposals;
    return proposals.filter((p) => {
      const title = p.terms?.title ?? p.cluster.name;
      const crop = (p.terms as { cropType?: string } | undefined)?.cropType ?? "";
      return (
        title.toLowerCase().includes(q) ||
        p.cluster.name.toLowerCase().includes(q) ||
        (p.investor.name ?? "").toLowerCase().includes(q) ||
        crop.toLowerCase().includes(q)
      );
    });
  }, [proposals, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  /* ── loading ── */
  if (isLoading) {
    return (
      <EditorialTable title="The Ledger" eyebrow="Active proposals" footer={false}>
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

  /* ── empty (no proposals at all) ── */
  if (proposals.length === 0) {
    return (
      <EditorialEmpty
        icon={<Wheat className="h-6 w-6" />}
        title={emptyHint ?? "The ledger is empty."}
        description="Draft your first proposal to begin a negotiation with a verified cluster representative."
        action={
          <Link href="/proposals/new">
            <EditorialButton variant="primary" shimmer>
              <Sprout className="h-3.5 w-3.5" />
              Draft a proposal
            </EditorialButton>
          </Link>
        }
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
          onChange={handleSearch}
          placeholder="Search by title, cluster, investor, crop…"
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
          icon={<Wheat className="h-6 w-6" />}
          title="No proposals match your search."
          description="Try a different term, or clear the search to see everything."
        />
      ) : (
        <EditorialTable
          title="The Ledger"
          eyebrow="Active proposals"
          count={filtered.length}
          footer={false}
        >
          {paged.map((proposal, i) => (
            <ProposalRow
              key={proposal.id}
              proposal={proposal}
              index={(safePage - 1) * PAGE_SIZE + i}
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
