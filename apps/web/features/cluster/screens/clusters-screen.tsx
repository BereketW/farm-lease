"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search, Sprout, Users, ArrowUpRight, SlidersHorizontal, Plus } from "lucide-react";
import { listClusters } from "@/features/cluster/datasource/clusters";
import { Input } from "@farm-lease/ui/components/input";
import { cn } from "@farm-lease/ui/lib/utils";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@farm-lease/ui/components/button";

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

  const { isAdmin, isRepresentative, isInvestor } = useAuth();
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

  const role = isAdmin
    ? { kicker: "Global oversight", title: "All clusters" }
    : isRepresentative
    ? { kicker: "Cluster desk", title: "Your clusters" }
    : { kicker: "Investment opportunities", title: "Verified clusters" };

  const lede = isAdmin
    ? "Review pending registrations, verify land documentation, and oversee all active farming clusters."
    : isRepresentative
    ? "Manage your registered clusters, update boundaries, and track member farmers."
    : "Browse government-verified farmer clusters available for lease investment.";

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
          {isRepresentative && (
            <div className="flex items-center gap-3">
              <Link href="/clusters/register">
                <Button className="gap-2 bg-emerald-800 dark:bg-emerald-300 text-white dark:text-black">
                  <Plus className="h-4 w-4" />
                  Register cluster
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-[1400px] px-6 py-10 sm:px-10 lg:px-14">
        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search clusters by name, region…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 rounded-xl border-border/50 bg-card shadow-sm"
            />
          </div>
        </div>

        {/* Filter rows */}
        <div className="mb-8 space-y-3">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl border border-border/50 bg-muted/30"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/50 bg-card/50 px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-muted/50 text-muted-foreground ring-1 ring-border/50">
              <Sprout className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-foreground">No clusters match your filters</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((cluster) => {
              const primaryRep = cluster.representatives?.find((r) => r.isPrimary) ?? cluster.representatives?.[0];
              return (
                <Link
                  key={cluster.id}
                  href={`/clusters/${cluster.id}`}
                  className="group relative flex flex-col gap-3 rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/50 hover:shadow-lg dark:hover:border-emerald-800/50"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 opacity-0 transition-opacity duration-300 group-hover:from-emerald-500/5 group-hover:to-emerald-500/10 group-hover:opacity-100" />
                  
                  <div className="flex items-start justify-between gap-3 relative">
                    <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                      {cluster.name}
                    </h3>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50 transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50">
                      <ArrowUpRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground relative">
                    {cluster.region ? (
                      <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                        <MapPin className="size-3.5" />
                        {cluster.region}
                      </span>
                    ) : null}
                  </div>

                  {cluster.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground/90 relative">
                      {cluster.description}
                    </p>
                  ) : null}

                  {cluster.cropTypes && cluster.cropTypes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 relative">
                      {cluster.cropTypes.slice(0, 3).map((c) => (
                        <span
                          key={c}
                          className="rounded-lg bg-emerald-50/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 ring-1 ring-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/50"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3 text-[11px] font-medium text-muted-foreground relative">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      {cluster._count?.farmers ?? 0} farmers
                      <span className="h-1 w-1 rounded-full bg-border" />
                      {cluster._count?.proposals ?? 0} proposals
                    </span>
                    {primaryRep?.user?.name ? (
                      <span className="truncate max-w-[40%] text-foreground/70">
                        {primaryRep.user.name}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
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
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 min-w-[70px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/50 bg-muted/20 p-1 backdrop-blur-sm">
        {children}
      </div>
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
        "relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ease-in-out",
        active
          ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
