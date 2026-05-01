"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Sprout,
  Users,
  FileText,
  UserCheck,
  Plus,
} from "lucide-react";
import { getCluster } from "@/features/cluster/datasource/clusters";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@farm-lease/ui/lib/utils";

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
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (query.error || !query.data) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <p className="text-sm text-rose-700">
          {(query.error as Error)?.message ?? "Cluster not found"}
        </p>
      </div>
    );
  }

  const cluster = query.data.cluster;
  const primaryRep =
    cluster.representatives?.find((r) => r.isPrimary) ??
    cluster.representatives?.[0];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <Link
        href="/clusters"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to clusters
      </Link>

      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-gradient-to-br from-emerald-50 to-white p-6 dark:from-emerald-950/20 dark:to-transparent">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-700">
              <Sprout className="size-3.5" />
              Farmer cluster
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {cluster.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {cluster.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {cluster.location}
                </span>
              ) : null}
              {cluster.region ? (
                <span className="inline-flex items-center gap-1">
                  {cluster.region}
                </span>
              ) : null}
            </div>
            {cluster.description ? (
              <p className="mt-3 max-w-2xl text-sm text-foreground/80">
                {cluster.description}
              </p>
            ) : null}
          </div>

          {isInvestor ? (
            <Link
              href={`/proposals/new?clusterId=${cluster.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Plus className="size-3.5" />
              Submit proposal
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-4">
          <Metric label="Farmers" value={String(cluster.farmers?.length ?? 0)} icon={Users} />
          <Metric
            label="Representatives"
            value={String(cluster.representatives?.length ?? 0)}
            icon={UserCheck}
          />
          <Metric
            label="Crop Types"
            value={cluster.cropTypes?.length ? cluster.cropTypes.join(", ") : "—"}
            icon={Sprout}
          />
          <Metric
            label="Region"
            value={cluster.region ?? "—"}
            icon={MapPin}
          />
        </div>
      </section>

      {/* Primary representative spotlight */}
      {primaryRep?.user ? (
        <section className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Primary representative
          </h2>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
              {(primaryRep.user.name ?? primaryRep.user.email ?? "?").slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                {primaryRep.user.name ?? "Representative"}
              </p>
              <p className="text-xs text-muted-foreground">{primaryRep.user.email}</p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Farmers */}
      <section className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Farmers in this cluster
        </h2>
        {cluster.farmers?.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {cluster.farmers.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm"
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold",
                    "bg-emerald-100 text-emerald-800"
                  )}
                >
                  {(f.user.name ?? "?").slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {f.user.name ?? "Anonymous farmer"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{f.user.role}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No farmers listed.</p>
        )}
      </section>

      {/* Existing proposals hint */}
      {cluster._count?.proposals ? (
        <section className="mt-4 rounded-xl border border-border bg-card p-4 text-sm shadow-sm">
          <p className="inline-flex items-center gap-2 text-muted-foreground">
            <FileText className="size-4 text-emerald-600" />
            {cluster._count.proposals} existing proposal
            {cluster._count.proposals > 1 ? "s" : ""} on this cluster
          </p>
        </section>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground line-clamp-2">{value}</p>
    </div>
  );
}
