"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  LayoutGrid,
  MapPin,
  Plus,
  Rows3,
  Sprout,
  Users,
  Wheat,
} from "lucide-react";
import { listClusters } from "@/features/cluster/datasource/clusters";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ClusterRow } from "@/features/cluster/components/dashboard/cluster-row";
import {
  EditorialButton,
  EditorialEmpty,
  EditorialPagination,
  EditorialSearch,
  EditorialSelect,
  EditorialTable,
  EditorialToggle,
  Masthead,
  NameAvatar,
  PaperGrain,
} from "@/components/editorial";
import { cn } from "@farm-lease/ui/lib/utils";

const PAGE_SIZE = 12;

const SIZE_BUCKETS = [
  { value: "any", label: "Any size" },
  { value: "small", label: "< 50 ha", max: 50 },
  { value: "medium", label: "50 – 200 ha", min: 50, max: 200 },
  { value: "large", label: "200+ ha", min: 200 },
] as const;

type ViewMode = "cards" | "table";

export function ClustersScreen() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [cropType, setCropType] = useState("all");
  const [sizeBucket, setSizeBucket] = useState<(typeof SIZE_BUCKETS)[number]["value"]>("any");
  const [view, setView] = useState<ViewMode>("cards");
  const [page, setPage] = useState(1);

  const { isAdmin, isRepresentative } = useAuth();

  const bucket = SIZE_BUCKETS.find((b) => b.value === sizeBucket)!;

  const query = useQuery({
    queryKey: ["clusters", { region, cropType, sizeBucket }],
    queryFn: () =>
      listClusters({
        region: region !== "all" ? region : undefined,
        cropType: cropType !== "all" ? cropType : undefined,
        minSize: "min" in bucket ? bucket.min : undefined,
        maxSize: "max" in bucket ? bucket.max : undefined,
      }),
  });

  const clusters = query.data ?? [];

  // Derive filter options from loaded data
  const regions = useMemo(() => {
    const all = clusters.map((c) => c.region).filter((r): r is string => !!r);
    const unique = Array.from(new Set(all)).sort();
    return [
      { value: "all", label: "All regions" },
      ...unique.map((r) => ({ value: r, label: r })),
    ];
  }, [clusters]);

  const cropOptions = useMemo(() => {
    const all = clusters.flatMap((c) => c.cropTypes ?? []);
    const unique = Array.from(new Set(all)).sort();
    return [
      { value: "all", label: "All crops" },
      ...unique.map((c) => ({ value: c, label: c })),
    ];
  }, [clusters]);

  // Client-side text search over loaded + server-filtered set
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clusters;
    return clusters.filter((c) => {
      const hay = `${c.name} ${c.description ?? ""} ${c.region ?? ""} ${(c.cropTypes ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [clusters, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const handleFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const role = isAdmin
    ? { kicker: "Global oversight", title: "All clusters" }
    : isRepresentative
    ? { kicker: "Cluster desk", title: "Your clusters" }
    : { kicker: "Investment opportunities", title: "Verified clusters" };

  const lede = isAdmin
    ? "Review pending registrations, verify land documentation, and oversee every active farming cluster on the platform."
    : isRepresentative
    ? "Manage the clusters you represent — update boundaries, track farmer membership, and respond to incoming proposals."
    : "Browse government-verified farmer clusters — each one a parcel of stewarded land awaiting a lease partner.";

  return (
    <div className="relative flex flex-1 flex-col bg-stone-50/60 dark:bg-stone-950/60">
      <PaperGrain />

      {/* Masthead */}
      <header className="relative border-b border-emerald-950/15 bg-gradient-to-b from-stone-50/90 to-transparent px-6 pb-10 pt-10 dark:border-emerald-400/15 dark:from-stone-950/80 sm:px-10 lg:px-14">
        <div className="relative mx-auto w-full max-w-[1400px]">
          <Masthead
            publication="FarmLease · Land Registry"
            kicker={role.kicker}
            title={role.title}
            lede={lede}
            cta={
              isRepresentative ? (
                <Link href="/clusters/register">
                  <EditorialButton variant="primary" size="lg" shimmer>
                    <Plus className="h-3.5 w-3.5" />
                    Register cluster
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </EditorialButton>
                </Link>
              ) : null
            }
          />
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-[1400px] px-6 py-10 sm:px-10 lg:px-14">
        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <EditorialSearch
              value={search}
              onChange={handleFilter(setSearch)}
              placeholder="Search by name, region, description, crop…"
              className="w-full sm:max-w-md"
            />
            <EditorialToggle<ViewMode>
              value={view}
              onChange={setView}
              options={[
                {
                  value: "cards",
                  label: "Cards",
                  icon: <LayoutGrid className="h-3 w-3" />,
                },
                {
                  value: "table",
                  label: "Table",
                  icon: <Rows3 className="h-3 w-3" />,
                },
              ]}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <EditorialSelect
              label="Region"
              value={region}
              onChange={handleFilter(setRegion)}
              options={regions}
            />
            <EditorialSelect
              label="Crop"
              value={cropType}
              onChange={handleFilter(setCropType)}
              options={cropOptions}
            />
            <EditorialSelect
              label="Size"
              value={sizeBucket}
              onChange={handleFilter(
                setSizeBucket as (v: string) => void,
              )}
              options={SIZE_BUCKETS.map((b) => ({
                value: b.value,
                label: b.label,
              }))}
            />
          </div>
        </div>

        {/* Result meta */}
        <div className="mb-4 flex items-baseline justify-between text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-500">
          <span>
            <span
              className="font-mono tabular-nums tracking-[0.18em] text-emerald-800 dark:text-emerald-300"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {String(filtered.length).padStart(2, "0")}
            </span>{" "}
            {filtered.length === 1 ? "cluster" : "clusters"}
            {search || region !== "all" || cropType !== "all" || sizeBucket !== "any"
              ? " match"
              : " available"}
          </span>
        </div>

        {/* Body */}
        {query.isLoading ? (
          <Skeleton view={view} />
        ) : filtered.length === 0 ? (
          <EditorialEmpty
            icon={<Wheat className="h-6 w-6" />}
            title={
              clusters.length === 0
                ? "The registry is empty."
                : "No clusters match your filters."
            }
            description={
              clusters.length === 0
                ? "No farmer clusters have been verified or registered yet."
                : "Try a different search term or clear the filters."
            }
          />
        ) : view === "cards" ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paged.map((cluster, i) => (
                <ClusterCard
                  key={cluster.id}
                  cluster={cluster}
                  indexLabel={(safePage - 1) * PAGE_SIZE + i + 1}
                />
              ))}
            </div>
            <div className="mt-4 overflow-hidden rounded-sm border border-emerald-950/10 dark:border-emerald-400/10">
              <EditorialPagination
                page={safePage}
                pageCount={pageCount}
                onPageChange={setPage}
              />
            </div>
          </>
        ) : (
          <EditorialTable
            title="The Registry"
            eyebrow="Verified clusters"
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
      </main>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Card view                                                   */
/* ──────────────────────────────────────────────────────────── */

function ClusterCard({
  cluster,
  indexLabel,
}: {
  cluster: import("@/lib/api/types").ClusterSummary;
  indexLabel: number;
}) {
  const primaryRep =
    cluster.representatives?.find((r) => r.isPrimary) ??
    cluster.representatives?.[0];

  return (
    <Link
      href={`/clusters/${cluster.id}`}
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-sm border border-emerald-950/10 bg-white/80 p-5 backdrop-blur-[1px] transition-all",
        "hover:-translate-y-[2px] hover:border-emerald-800/40 hover:shadow-[0_6px_0_-3px_rgba(0,0,0,0.08)]",
        "dark:border-emerald-400/10 dark:bg-stone-950/50 dark:hover:border-emerald-300/40",
      )}
    >
      {/* Paper edge accent */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-800/30 to-transparent dark:via-emerald-300/30"
      />

      {/* Header: index + title + arrow */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className="font-serif text-[11px] italic tabular-nums text-emerald-700/60 dark:text-emerald-400/60"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Nº {String(indexLabel).padStart(2, "0")}
          </span>
          <h3
            className="mt-1 line-clamp-2 font-serif text-xl font-light leading-tight tracking-tight text-emerald-950 transition-colors group-hover:italic group-hover:text-emerald-800 dark:text-emerald-50 dark:group-hover:text-emerald-200"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {cluster.name}
          </h3>
        </div>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-emerald-950/10 text-emerald-900/70 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:border-emerald-700/40 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:border-emerald-300/20 dark:text-emerald-300/70 dark:group-hover:border-emerald-300/40 dark:group-hover:bg-emerald-950/40 dark:group-hover:text-emerald-200">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-600 dark:text-stone-400">
        {cluster.region ? (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3 text-emerald-700/70 dark:text-emerald-400/70" />
            <span className="font-medium text-stone-800 dark:text-stone-200">
              {cluster.region}
            </span>
          </span>
        ) : null}
        {cluster.location && cluster.location !== cluster.region ? (
          <span className="italic text-stone-500 dark:text-stone-500">
            {cluster.location}
          </span>
        ) : null}
      </div>

      {cluster.description ? (
        <p
          className="line-clamp-2 font-serif text-[13px] italic leading-relaxed text-stone-700 dark:text-stone-300"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {cluster.description}
        </p>
      ) : null}

      {/* Crop tags */}
      {cluster.cropTypes && cluster.cropTypes.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {cluster.cropTypes.slice(0, 3).map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-sm border border-emerald-800/20 bg-emerald-50/60 px-1.5 py-[2px] text-[9px] font-medium uppercase tracking-[0.14em] text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-950/30 dark:text-emerald-200"
            >
              <Sprout className="h-2.5 w-2.5" />
              {c}
            </span>
          ))}
          {cluster.cropTypes.length > 3 ? (
            <span className="inline-flex items-center rounded-sm border border-stone-300/50 bg-stone-50/60 px-1.5 py-[2px] text-[9px] font-medium uppercase tracking-[0.14em] text-stone-600 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-400">
              +{cluster.cropTypes.length - 3}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Footer: stats + rep */}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-emerald-950/10 pt-3 dark:border-emerald-400/10">
        <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span className="tabular-nums text-stone-700 dark:text-stone-300">
              {cluster._count?.farmers ?? 0}
            </span>
            farmers
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="tabular-nums text-stone-700 dark:text-stone-300">
              {cluster._count?.proposals ?? 0}
            </span>
            proposals
          </span>
        </div>
        {primaryRep?.user?.name ? (
          <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
            <NameAvatar
              size="xs"
              id={primaryRep.user.id}
              name={primaryRep.user.name}
            />
            <span
              className="truncate font-serif text-[11px] italic text-stone-600 dark:text-stone-400"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {primaryRep.user.name}
            </span>
          </span>
        ) : null}
      </div>
    </Link>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Skeleton                                                    */
/* ──────────────────────────────────────────────────────────── */

function Skeleton({ view }: { view: ViewMode }) {
  if (view === "cards") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-52 animate-pulse rounded-sm border border-emerald-950/10 bg-stone-50/50 dark:border-emerald-400/10 dark:bg-stone-900/30"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-sm border border-emerald-950/10 dark:border-emerald-400/10">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse border-b border-emerald-950/5 bg-stone-50/50 last:border-b-0 dark:border-emerald-400/5 dark:bg-stone-900/30"
        />
      ))}
    </div>
  );
}
