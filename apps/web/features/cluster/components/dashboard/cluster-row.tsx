"use client";

import Link from "next/link";
import { ArrowUpRight, MapPin, Sprout, Users } from "lucide-react";
import type { ClusterSummary } from "@/lib/api/types";
import { StatusPill } from "@/components/editorial/status-pill";
import { NameAvatar } from "@/components/editorial";
import { cn } from "@farm-lease/ui/lib/utils";

export function ClusterRow({
  cluster,
  index,
}: {
  cluster: ClusterSummary;
  index?: number;
}) {
  const primaryRep = cluster.representatives?.find((r) => r.isPrimary) ?? cluster.representatives?.[0];

  return (
    <Link
      href={`/clusters/${cluster.id}`}
      className="group relative grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 border-b border-emerald-950/10 px-4 py-5 transition-colors hover:bg-stone-50/60 dark:border-emerald-400/10 dark:hover:bg-stone-900/20 sm:grid-cols-[56px_minmax(0,1fr)_auto_auto] sm:gap-6 sm:px-6"
    >
      <span
        className="select-none font-serif text-2xl italic leading-none tabular-nums text-emerald-900/35 transition-colors group-hover:text-emerald-700 dark:text-emerald-300/25 dark:group-hover:text-emerald-300 sm:text-3xl"
        style={{ fontFamily: "var(--font-fraunces)" }}
        aria-hidden
      >
        {String(typeof index === "number" ? index + 1 : 0).padStart(2, "0")}
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3
            className="truncate font-serif text-lg font-medium leading-tight tracking-tight text-emerald-950 transition-colors group-hover:text-emerald-800 dark:text-emerald-50 dark:group-hover:text-emerald-200"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {cluster.name}
          </h3>
        </div>
        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-stone-600 dark:text-stone-400">
          <span className="inline-flex items-center gap-2">
            <NameAvatar
              size="xs"
              id={primaryRep?.user?.id}
              name={primaryRep?.user?.name}
            />
            <span className="italic">
              {primaryRep?.user?.name ?? "Representative"}
            </span>
          </span>
          {cluster.region ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-emerald-700/70 dark:text-emerald-400/70" />
              <span className="font-medium text-stone-800 dark:text-stone-200">
                {cluster.region}
              </span>
            </span>
          ) : null}
          {cluster.cropTypes && cluster.cropTypes.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Sprout className="h-3 w-3 text-emerald-700/70 dark:text-emerald-400/70" />
              <span>{cluster.cropTypes[0]} {cluster.cropTypes.length > 1 ? `+${cluster.cropTypes.length - 1}` : ''}</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-500">
          Total Area
        </p>
        <p
          className="mt-0.5 font-serif text-xl font-light tabular-nums tracking-tight text-emerald-950 dark:text-emerald-50"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {Number(cluster.totalArea).toLocaleString()}{" "}
          <span className="text-[11px] not-italic align-top text-stone-500">
            ha
          </span>
        </p>
        <p className="mt-0.5 text-[10px] text-stone-500 dark:text-stone-500">
          <span className="tabular-nums">{cluster._count?.farmers ?? 0}</span> farmers
        </p>
      </div>

      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-950/10 text-emerald-900/70 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:border-emerald-700/40 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:border-emerald-300/20 dark:text-emerald-300/70 dark:group-hover:border-emerald-300/40 dark:group-hover:bg-emerald-950/40 dark:group-hover:text-emerald-200">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
