"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search, Sprout, Users, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { listClusters } from "@/features/cluster/datasource/clusters";
import { Input } from "@farm-lease/ui/components/input";
import { cn } from "@farm-lease/ui/lib/utils";

const SIZE_BUCKETS: Array<{
  label: string;
  min?: number;
  max?: number;
}> = [
  { label: "Any size" },
  { label: "< 50 ha", max: 50 },
  { label: "50–200 ha", min: 50, max: 200 },
  { label: "200+ ha", min: 200 },
];

export function ClustersScreen() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<string | null>(null);
  const [cropType, setCropType] = useState<string | null>(null);
  const [sizeIdx, setSizeIdx] = useState(0);

  const sizeRange = SIZE_BUCKETS[sizeIdx];

  const query = useQuery({
    queryKey: ["clusters", { region, search, cropType, sizeIdx }],
    queryFn: () =>
      listClusters({
        region: region ?? undefined,
        search: search || undefined,
        cropType: cropType ?? undefined,
        minSize: sizeRange.min,
        maxSize: sizeRange.max,
      }),
  });

  const clusters = query.data ?? [];
  const regions = useMemo(() => {
    const all = clusters.map((c) => c.region).filter((r): r is string => !!r);
    return Array.from(new Set(all)).sort();
  }, [clusters]);

  const cropTypes = useMemo(() => {
    const all = clusters.flatMap((c) => c.cropTypes ?? []);
    return Array.from(new Set(all)).sort();
  }, [clusters]);

  const filtered = clusters.filter((c) => {
    if (!search) return true;
    const haystack = `${c.name} ${c.description ?? ""} ${c.region ?? ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Clusters
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified farmer clusters open to investment.
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clusters by name, region…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filter rows */}
      <div className="mb-5 space-y-2">
        {regions.length > 0 ? (
          <FilterRow
            icon={<SlidersHorizontal className="size-3.5 text-muted-foreground" />}
            label="Region"
          >
            <FilterChip active={!region} onClick={() => setRegion(null)}>
              All
            </FilterChip>
            {regions.map((r) => (
              <FilterChip
                key={r}
                active={region === r}
                onClick={() => setRegion(r === region ? null : r)}
              >
                {r}
              </FilterChip>
            ))}
          </FilterRow>
        ) : null}

        {cropTypes.length > 0 ? (
          <FilterRow icon={<Sprout className="size-3.5 text-muted-foreground" />} label="Crop">
            <FilterChip active={!cropType} onClick={() => setCropType(null)}>
              All crops
            </FilterChip>
            {cropTypes.map((c) => (
              <FilterChip
                key={c}
                active={cropType === c}
                onClick={() => setCropType(c === cropType ? null : c)}
              >
                {c}
              </FilterChip>
            ))}
          </FilterRow>
        ) : null}

        <FilterRow icon={<Users className="size-3.5 text-muted-foreground" />} label="Size">
          {SIZE_BUCKETS.map((b, i) => (
            <FilterChip
              key={b.label}
              active={sizeIdx === i}
              onClick={() => setSizeIdx(i)}
            >
              {b.label}
            </FilterChip>
          ))}
        </FilterRow>
      </div>

      {query.isLoading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading clusters…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Sprout className="mx-auto size-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium text-foreground">No clusters match your filters</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cluster) => {
            const primaryRep = cluster.representatives?.find((r) => r.isPrimary) ?? cluster.representatives?.[0];
            return (
              <Link
                key={cluster.id}
                href={`/clusters/${cluster.id}`}
                className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                    {cluster.name}
                  </h3>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-emerald-700" />
                </div>
                {cluster.region ? (
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {cluster.region}
                  </p>
                ) : null}
                {cluster.description ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground/90">
                    {cluster.description}
                  </p>
                ) : null}
                {cluster.cropTypes && cluster.cropTypes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {cluster.cropTypes.slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 ring-1 ring-emerald-100"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-auto flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3" />
                    {cluster._count?.farmers ?? 0} farmers · {cluster._count?.proposals ?? 0} proposals
                  </span>
                  {primaryRep?.user?.name ? (
                    <span className="truncate max-w-[50%]">
                      {primaryRep.user.name}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium transition",
        active
          ? "bg-emerald-600 text-white"
          : "bg-accent text-muted-foreground hover:bg-emerald-100 hover:text-emerald-900"
      )}
    >
      {children}
    </button>
  );
}
