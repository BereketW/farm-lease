"use client";

import { useQuery } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import { Check, MapPin, Users } from "lucide-react";
import { cn } from "@farm-lease/ui/lib/utils";
import { listClusters } from "@/lib/api/clusters";
import type { ProposalFormValues } from "./types";
import { StepShell } from "./step-shell";

export function StepCluster({ form }: { form: UseFormReturn<ProposalFormValues> }) {
  const clustersQuery = useQuery({
    queryKey: ["clusters"],
    queryFn: () => listClusters(),
  });
  const value = form.watch("clusterId");
  const error = form.formState.errors.clusterId;
  const clusters = clustersQuery.data ?? [];

  return (
    <StepShell
      eyebrow="Step 1"
      title="Pick a verified cluster"
      description="Your proposal goes to the cluster's representative for review."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {clusters.map((cluster) => {
          const selected = value === cluster.id;
          return (
            <button
              type="button"
              key={cluster.id}
              onClick={() =>
                form.setValue("clusterId", cluster.id, { shouldValidate: true })
              }
              className={cn(
                "group flex flex-col gap-2 rounded-2xl border p-4 text-left transition",
                selected
                  ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200"
                  : "border-zinc-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-emerald-950">
                  {cluster.name}
                </h3>
                {selected ? (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                ) : null}
              </div>
              {cluster.region ? (
                <p className="inline-flex items-center gap-1 text-xs text-zinc-600">
                  <MapPin className="h-3 w-3" /> {cluster.region}
                </p>
              ) : null}
              {cluster.description ? (
                <p className="line-clamp-2 text-xs text-zinc-600">
                  {cluster.description}
                </p>
              ) : null}
              {cluster._count ? (
                <p className="mt-auto inline-flex items-center gap-1 text-[11px] text-zinc-500">
                  <Users className="h-3 w-3" /> {cluster._count.farmers} farmers ·{" "}
                  {cluster._count.proposals} proposals
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
      {error ? <p className="text-xs text-rose-600">{error.message}</p> : null}
    </StepShell>
  );
}
