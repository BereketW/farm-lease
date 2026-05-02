"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  Loader2,
  MapPin,
  Plus,
  Sprout,
  Wheat,
} from "lucide-react";
import { getCluster } from "@/features/cluster/datasource/clusters";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  EditorialButton,
  EditorialEmpty,
  HorizonRule,
  Masthead,
  Metric,
  NameAvatar,
  Ornament,
  PaperGrain,
  SectionHeader,
} from "@/components/editorial";

export function ClusterDetailScreen({
  idPromise,
}: {
  idPromise: Promise<{ id: string }>;
}) {
  const { id } = use(idPromise);
  const { isInvestor } = useAuth();

  const query = useQuery({
    queryKey: ["cluster", id],
    queryFn: () => getCluster(id),
  });

  if (query.isLoading) {
    return (
      <div className="relative flex flex-1 items-center justify-center py-20">
        <PaperGrain />
        <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
      </div>
    );
  }

  if (query.error || !query.data) {
    return (
      <div className="relative flex flex-1 items-center justify-center py-20">
        <PaperGrain />
        <EditorialEmpty
          icon={<Wheat className="h-6 w-6" />}
          title="Cluster not found."
          description={
            (query.error as Error)?.message ??
            "This cluster may have been removed or is not yet verified."
          }
          action={
            <Link href="/clusters">
              <EditorialButton variant="secondary">
                <ArrowLeft className="h-3 w-3" />
                Back to the Registry
              </EditorialButton>
            </Link>
          }
        />
      </div>
    );
  }

  const cluster = query.data.cluster;
  const primaryRep =
    cluster.representatives?.find((r) => r.isPrimary) ??
    cluster.representatives?.[0];

  return (
    <div className="relative flex flex-1 flex-col bg-stone-50/60 dark:bg-stone-950/60">
      <PaperGrain />

      {/* Masthead */}
      <header className="relative border-b border-emerald-950/15 bg-gradient-to-b from-stone-50/90 to-transparent px-6 pb-10 pt-8 dark:border-emerald-400/15 dark:from-stone-950/80 sm:px-10 lg:px-14">
        <div className="relative mx-auto w-full max-w-[1200px]">
          <Link
            href="/clusters"
            className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-800/80 transition-colors hover:text-emerald-900 dark:text-emerald-300/80 dark:hover:text-emerald-200"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to the Registry
          </Link>

          <div className="mt-5">
            <Masthead
              publication="FarmLease · Cluster Profile"
              kicker="A verified cluster"
              title={cluster.name}
              italicWord={cluster.name}
              lede={cluster.description ?? undefined}
              cta={
                isInvestor ? (
                  <Link href={`/proposals/new?clusterId=${cluster.id}`}>
                    <EditorialButton variant="primary" size="lg" shimmer>
                      <Plus className="h-3.5 w-3.5" />
                      Submit a proposal
                    </EditorialButton>
                  </Link>
                ) : null
              }
            />
          </div>

          {/* Location strip */}
          {cluster.location || cluster.region ? (
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-serif text-[13px] italic text-stone-600 dark:text-stone-400">
              {cluster.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-700/70 dark:text-emerald-400/70" />
                  {cluster.location}
                </span>
              ) : null}
              {cluster.location && cluster.region ? <Ornament /> : null}
              {cluster.region ? (
                <span className="not-italic text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-800/80 dark:text-emerald-300/80">
                  {cluster.region}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-[1200px] px-6 py-10 sm:px-10 lg:px-14">
        {/* Almanac of metrics */}
        <section>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-emerald-950/15 bg-emerald-950/10 dark:border-emerald-400/15 dark:bg-emerald-400/10 sm:grid-cols-4">
            <Metric
              label="Farmers"
              value={String(cluster.farmers?.length ?? cluster._count?.farmers ?? 0)}
              hint="Member growers"
              tone="emerald"
              index="i"
              className="rounded-none border-0"
            />
            <Metric
              label="Representatives"
              value={String(cluster.representatives?.length ?? 0)}
              hint="Authorised agents"
              tone="lime"
              index="ii"
              className="rounded-none border-0"
            />
            <Metric
              label="Total area"
              value={
                cluster.totalArea != null
                  ? `${Number(cluster.totalArea).toLocaleString()} ha`
                  : "—"
              }
              hint="Stewarded land"
              tone="amber"
              index="iii"
              className="rounded-none border-0"
            />
            <Metric
              label="Proposals"
              value={String(cluster._count?.proposals ?? 0)}
              hint="Past & present"
              index="iv"
              className="rounded-none border-0"
            />
          </div>
        </section>

        {/* Crops & representative */}
        <section className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          {/* Crops */}
          <div>
            <SectionHeader
              title="Cultivated crops"
              eyebrow="What is grown here"
              meta={
                cluster.cropTypes?.length
                  ? `${String(cluster.cropTypes.length).padStart(2, "0")} varieties`
                  : undefined
              }
            />
            <HorizonRule className="mt-3" />
            {cluster.cropTypes && cluster.cropTypes.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {cluster.cropTypes.map((c) => (
                  <li
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-emerald-800/25 bg-emerald-50/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-900 dark:border-emerald-400/25 dark:bg-emerald-950/30 dark:text-emerald-200"
                  >
                    <Sprout className="h-3 w-3 text-emerald-700/70 dark:text-emerald-400/70" />
                    {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 font-serif text-[13px] italic text-stone-500 dark:text-stone-500">
                No crop types listed.
              </p>
            )}
          </div>

          {/* Primary representative */}
          <div>
            <SectionHeader
              title="Primary representative"
              eyebrow="Authorised agent"
            />
            <HorizonRule className="mt-3" />
            {primaryRep?.user ? (
              <div className="mt-5 flex items-center gap-4 rounded-sm border border-emerald-950/10 bg-white/70 p-4 dark:border-emerald-400/10 dark:bg-stone-950/40">
                <NameAvatar
                  size="lg"
                  id={primaryRep.user.id}
                  name={primaryRep.user.name}
                />
                <div className="min-w-0">
                  <p
                    className="truncate font-serif text-lg italic text-emerald-950 dark:text-emerald-50"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                  >
                    {primaryRep.user.name ?? "Representative"}
                  </p>
                  <p
                    className="truncate font-mono text-[11px] text-stone-600 dark:text-stone-400"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {primaryRep.user.email}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-5 font-serif text-[13px] italic text-stone-500 dark:text-stone-500">
                No representative assigned.
              </p>
            )}
          </div>
        </section>

        {/* Farmers ledger */}
        <section className="mt-10">
          <SectionHeader
            title="Farmers in this cluster"
            eyebrow="The members"
            meta={
              cluster.farmers?.length
                ? `${String(cluster.farmers.length).padStart(2, "0")} listed`
                : undefined
            }
          />
          <HorizonRule className="mt-3" />

          {cluster.farmers?.length ? (
            <ul className="mt-5 grid gap-px overflow-hidden rounded-sm border border-emerald-950/10 bg-emerald-950/5 dark:border-emerald-400/10 dark:bg-emerald-400/5 sm:grid-cols-2">
              {cluster.farmers.map((f, i) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 bg-stone-50/70 px-4 py-3 dark:bg-stone-900/30"
                >
                  <span
                    className="select-none font-serif text-[13px] italic tabular-nums text-emerald-700/60 dark:text-emerald-400/60"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                    aria-hidden
                  >
                    Nº {String(i + 1).padStart(2, "0")}
                  </span>
                  <NameAvatar
                    size="sm"
                    id={f.user.id}
                    name={f.user.name}
                  />
                  <div className="min-w-0">
                    <p
                      className="truncate font-serif text-[15px] leading-tight text-emerald-950 dark:text-emerald-50"
                      style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                      {f.user.name ?? "Anonymous farmer"}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500">
                      {f.user.role.toLowerCase()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 font-serif text-[13px] italic text-stone-500 dark:text-stone-500">
              No farmers registered with this cluster yet.
            </p>
          )}
        </section>

        {/* Proposals hint */}
        {cluster._count?.proposals ? (
          <section className="mt-10">
            <div className="flex items-center gap-3 border-l-2 border-emerald-800/60 bg-emerald-50/40 p-4 dark:border-emerald-300/60 dark:bg-emerald-950/30">
              <FileText className="h-4 w-4 shrink-0 text-emerald-800 dark:text-emerald-300" />
              <p
                className="font-serif text-[14px] italic text-emerald-900 dark:text-emerald-200"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                {cluster._count.proposals} existing proposal
                {cluster._count.proposals > 1 ? "s" : ""} on this cluster.
              </p>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

