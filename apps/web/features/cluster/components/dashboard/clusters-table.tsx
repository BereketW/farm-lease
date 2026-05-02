"use client";

import { useMemo, useState } from "react";
import { Sprout } from "lucide-react";
import type { ClusterSummary } from "@/lib/api/types";
import { ClusterRow } from "./cluster-row";
import {
  EditorialEmpty,
  EditorialPagination,
  EditorialSearch,
  EditorialTable,
} from "@/components/editorial";

const PAGE_SIZE = 12;

type Props = {
  clusters: ClusterSummary[];
  isLoading: boolean;
  emptyHint?: string;
};

export function ClustersTable({ clusters, isLoading, emptyHint }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clusters;
    return clusters.filter((c) => {
      const region = c.region ?? "";
      return (
        c.name.toLowerCase().includes(q) ||
        region.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [clusters, search]);

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
      <EditorialTable title="The Ledger" eyebrow="Registered clusters" footer={false}>
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

  /* ── empty (no clusters at all) ── */
  if (clusters.length === 0) {
    return (
      <EditorialEmpty
        icon={<Sprout className="h-6 w-6" />}
        title={emptyHint ?? "The registry is empty."}
        description="No farmer clusters have been verified or registered yet."
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
          placeholder="Search by cluster name, region, description…"
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
          icon={<Sprout className="h-6 w-6" />}
          title="No clusters match your search."
          description="Try a different term, or clear the search to see everything."
        />
      ) : (
        <EditorialTable
          title="The Ledger"
          eyebrow="Registered clusters"
          count={filtered.length}
          footer={false}
        >
          {paged.map((cluster, i) => (
            <ClusterRow
              key={cluster.id}
              cluster={cluster}
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
