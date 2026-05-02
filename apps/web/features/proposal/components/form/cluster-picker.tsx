"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, LayoutGrid, MapPin, Rows3, Users, Wheat } from "lucide-react";
import { cn } from "@farm-lease/ui/lib/utils";
import { listClusters } from "@/features/cluster/datasource/clusters";
import type { ClusterSummary } from "@/lib/api/types";
import {
  EditorialEmpty,
  EditorialPagination,
  EditorialSearch,
  EditorialSelect,
  EditorialToggle,
} from "@/components/editorial";

const PAGE_SIZE = 8;

type ViewMode = "cards" | "table";

export function ClusterPicker({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (id: string) => void;
  invalid?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [view, setView] = useState<ViewMode>("cards");
  const [page, setPage] = useState(1);

  const clustersQuery = useQuery({
    queryKey: ["clusters"],
    queryFn: () => listClusters(),
  });
  const clusters = clustersQuery.data ?? [];

  // Derive region options from data
  const regions = useMemo(() => {
    const set = new Set<string>();
    clusters.forEach((c) => {
      if (c.region) set.add(c.region);
    });
    return [
      { value: "all", label: "All regions" },
      ...Array.from(set)
        .sort()
        .map((r) => ({ value: r, label: r })),
    ];
  }, [clusters]);

  // Filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clusters.filter((c) => {
      if (region !== "all" && c.region !== region) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.region ?? "").toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [clusters, search, region]);

  // Reset page when filters change
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleRegionChange = (v: string) => {
    setRegion(v);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <EditorialSearch
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, region, description…"
            className="flex-1"
          />
          <EditorialSelect
            label="Region"
            value={region}
            onChange={handleRegionChange}
            options={regions}
          />
        </div>
        <EditorialToggle<ViewMode>
          value={view}
          onChange={setView}
          options={[
            { value: "cards", label: "Cards", icon: <LayoutGrid className="h-3 w-3" /> },
            { value: "table", label: "Table", icon: <Rows3 className="h-3 w-3" /> },
          ]}
        />
      </div>

      {/* Result meta */}
      <div className="flex items-baseline justify-between text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-500">
        <span>
          <span
            className="font-mono tabular-nums tracking-[0.18em] text-emerald-800 dark:text-emerald-300"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {String(filtered.length).padStart(2, "0")}
          </span>{" "}
          {filtered.length === 1 ? "cluster" : "clusters"}
          {search || region !== "all" ? " match" : " available"}
        </span>
        {value ? (
          <span
            className="font-serif text-[12px] italic text-emerald-800 dark:text-emerald-300"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            ✓ selected
          </span>
        ) : null}
      </div>

      {/* Body */}
      {clustersQuery.isLoading ? (
        <Skeleton view={view} />
      ) : filtered.length === 0 ? (
        <EditorialEmpty
          icon={<Wheat className="h-6 w-6" />}
          title={
            clusters.length === 0
              ? "No verified clusters just yet."
              : "No clusters match your search."
          }
          description={
            clusters.length === 0
              ? "Come back once a representative registers land on the platform."
              : "Try a different search term or clear the region filter."
          }
        />
      ) : view === "cards" ? (
        <div
          className={cn(
            "grid gap-px overflow-hidden rounded-sm border bg-emerald-950/10 dark:bg-emerald-400/10 sm:grid-cols-2",
            invalid
              ? "border-rose-500/60 dark:border-rose-500/60"
              : "border-emerald-950/15 dark:border-emerald-400/15",
          )}
        >
          {paged.map((cluster) => (
            <ClusterCard
              key={cluster.id}
              cluster={cluster}
              selected={value === cluster.id}
              onSelect={() => onChange(cluster.id)}
              indexLabel={absoluteIndex(filtered, cluster, safePage)}
            />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "overflow-hidden rounded-sm border",
            invalid
              ? "border-rose-500/60 dark:border-rose-500/60"
              : "border-emerald-950/15 dark:border-emerald-400/15",
          )}
        >
          <ClusterTableHead />
          {paged.map((cluster) => (
            <ClusterTableRow
              key={cluster.id}
              cluster={cluster}
              selected={value === cluster.id}
              onSelect={() => onChange(cluster.id)}
              indexLabel={absoluteIndex(filtered, cluster, safePage)}
            />
          ))}
        </div>
      )}

      <EditorialPagination
        page={safePage}
        pageCount={pageCount}
        onPageChange={setPage}
        className="rounded-sm border border-t-0 border-emerald-950/15 dark:border-emerald-400/15"
      />
    </div>
  );
}

function absoluteIndex(
  filtered: ClusterSummary[],
  cluster: ClusterSummary,
  _page: number,
) {
  return filtered.findIndex((c) => c.id === cluster.id) + 1;
}

/* ──────────────────────────────────────────────────────────── */
/*  Card view                                                   */
/* ──────────────────────────────────────────────────────────── */

function ClusterCard({
  cluster,
  selected,
  onSelect,
  indexLabel,
}: {
  cluster: ClusterSummary;
  selected: boolean;
  onSelect: () => void;
  indexLabel: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col gap-2 p-5 text-left transition-colors",
        selected
          ? "bg-emerald-50 dark:bg-emerald-950/50"
          : "bg-stone-50/70 hover:bg-stone-100/70 dark:bg-stone-900/30 dark:hover:bg-stone-900/60",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-[3px] transition-colors",
          selected ? "bg-emerald-800 dark:bg-emerald-300" : "bg-transparent",
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className="font-serif text-[11px] italic tabular-nums text-emerald-700/60 dark:text-emerald-400/60"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Nº {String(indexLabel).padStart(2, "0")}
          </span>
          <h3
            className={cn(
              "mt-1 font-serif text-lg font-light leading-tight tracking-tight",
              selected
                ? "italic text-emerald-900 dark:text-emerald-50"
                : "text-emerald-950 dark:text-emerald-100",
            )}
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {cluster.name}
          </h3>
        </div>
        <span
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-all",
            selected
              ? "border-emerald-800 bg-emerald-800 text-emerald-50 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950"
              : "border-stone-300 bg-transparent text-transparent group-hover:border-emerald-700/50 dark:border-stone-700",
          )}
        >
          <Check className="h-3 w-3" />
        </span>
      </div>

      {cluster.region ? (
        <p className="inline-flex items-center gap-1 text-[11px] text-stone-600 dark:text-stone-400">
          <MapPin className="h-3 w-3 text-emerald-700/70 dark:text-emerald-400/70" />
          {cluster.region}
        </p>
      ) : null}

      {cluster.description ? (
        <p
          className="line-clamp-2 font-serif text-[13px] italic leading-relaxed text-stone-700 dark:text-stone-300"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {cluster.description}
        </p>
      ) : null}

      {cluster._count ? (
        <div className="mt-auto flex items-center gap-4 pt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span className="tabular-nums text-stone-700 dark:text-stone-300">
              {cluster._count.farmers}
            </span>
            farmers
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="tabular-nums text-stone-700 dark:text-stone-300">
              {cluster._count.proposals}
            </span>
            proposals
          </span>
        </div>
      ) : null}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Table view                                                  */
/* ──────────────────────────────────────────────────────────── */

function ClusterTableHead() {
  return (
    <div className="hidden grid-cols-[40px_minmax(0,1.6fr)_minmax(0,1fr)_auto_24px] gap-4 border-b border-emerald-950/10 bg-stone-50/60 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:border-emerald-400/10 dark:bg-stone-900/30 dark:text-stone-500 sm:grid sm:px-5">
      <span>Nº</span>
      <span>Cluster</span>
      <span>Region</span>
      <span className="text-right">Activity</span>
      <span></span>
    </div>
  );
}

function ClusterTableRow({
  cluster,
  selected,
  onSelect,
  indexLabel,
}: {
  cluster: ClusterSummary;
  selected: boolean;
  onSelect: () => void;
  indexLabel: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative grid w-full grid-cols-[32px_minmax(0,1.6fr)_minmax(0,1fr)_auto_24px] items-center gap-4 border-b border-emerald-950/10 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-emerald-400/10 sm:px-5",
        selected
          ? "bg-emerald-50 dark:bg-emerald-950/40"
          : "bg-white/60 hover:bg-stone-50 dark:bg-stone-950/30 dark:hover:bg-stone-900/40",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-[2px] transition-colors",
          selected ? "bg-emerald-800 dark:bg-emerald-300" : "bg-transparent",
        )}
      />
      <span
        className="font-serif text-[12px] italic tabular-nums text-emerald-700/60 dark:text-emerald-400/60"
        style={{ fontFamily: "var(--font-fraunces)" }}
        aria-hidden
      >
        {String(indexLabel).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-serif text-[15px] leading-tight tracking-tight",
            selected
              ? "italic text-emerald-900 dark:text-emerald-50"
              : "text-emerald-950 dark:text-emerald-100",
          )}
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {cluster.name}
        </p>
        {cluster.description ? (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-stone-500 dark:text-stone-500">
            {cluster.description}
          </p>
        ) : null}
      </div>
      <span className="inline-flex items-center gap-1 truncate text-[12px] text-stone-700 dark:text-stone-300">
        {cluster.region ? (
          <>
            <MapPin className="h-3 w-3 text-emerald-700/70 dark:text-emerald-400/70" />
            {cluster.region}
          </>
        ) : (
          <span className="text-stone-400 italic">—</span>
        )}
      </span>
      <span
        className="justify-self-end text-right font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500 dark:text-stone-500"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {cluster._count ? (
          <>
            <span className="tabular-nums text-stone-700 dark:text-stone-300">
              {cluster._count.farmers}
            </span>{" "}
            f ·{" "}
            <span className="tabular-nums text-stone-700 dark:text-stone-300">
              {cluster._count.proposals}
            </span>{" "}
            p
          </>
        ) : (
          "—"
        )}
      </span>
      <span
        className={cn(
          "grid h-5 w-5 place-items-center rounded-full border transition-all",
          selected
            ? "border-emerald-800 bg-emerald-800 text-emerald-50 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950"
            : "border-stone-300 text-transparent group-hover:border-emerald-700/50 dark:border-stone-700",
        )}
      >
        <Check className="h-3 w-3" />
      </span>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Skeleton                                                    */
/* ──────────────────────────────────────────────────────────── */

function Skeleton({ view }: { view: ViewMode }) {
  if (view === "cards") {
    return (
      <div className="grid gap-px overflow-hidden rounded-sm border border-emerald-950/10 bg-emerald-950/10 dark:border-emerald-400/10 dark:bg-emerald-400/10 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse bg-stone-50/50 dark:bg-stone-900/30"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-sm border border-emerald-950/10 dark:border-emerald-400/10">
      <ClusterTableHead />
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-12 animate-pulse border-b border-emerald-950/5 bg-stone-50/50 last:border-b-0 dark:border-emerald-400/5 dark:bg-stone-900/30"
        />
      ))}
    </div>
  );
}
