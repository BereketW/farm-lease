"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Users, Tractor, BriefcaseBusiness, Sparkles } from "lucide-react";
import { listAgreementResources } from "@/features/agreement/datasource/agreements";
import type { ResourceCategory } from "@/lib/api/types";
import { cn } from "@farm-lease/ui/lib/utils";

const CATEGORY_LABELS: Record<ResourceCategory | "ALL", string> = {
  ALL: "All",
  INSURANCE: "Insurance",
  LABOR_UNION: "Labor Unions",
  WORKER_GROUP: "Worker Groups",
  EQUIPMENT: "Equipment",
  ADVISORY: "Advisory",
};

const CATEGORY_ICONS: Record<ResourceCategory, typeof ShieldCheck> = {
  INSURANCE: ShieldCheck,
  LABOR_UNION: Users,
  WORKER_GROUP: Users,
  EQUIPMENT: Tractor,
  ADVISORY: BriefcaseBusiness,
};

export function ResourceSuggestions({ agreementId }: { agreementId: string }) {
  const [filter, setFilter] = useState<ResourceCategory | "ALL">("ALL");

  const query = useQuery({
    queryKey: ["agreement-resources", agreementId, filter],
    queryFn: () =>
      listAgreementResources(agreementId, {
        category: filter === "ALL" ? undefined : filter,
        take: 12,
      }),
  });

  const resources = useMemo(() => query.data?.resources ?? [], [query.data]);

  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recommended Resources
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Matched to this agreement’s region and crop profile.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
          <Sparkles className="size-3" />
          Post-agreement support
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(CATEGORY_LABELS) as Array<ResourceCategory | "ALL">).map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
              filter === category
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-border bg-background text-muted-foreground hover:bg-accent"
            )}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No matching resources found yet for this agreement profile.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {resources.map((resource) => {
            const Icon = CATEGORY_ICONS[resource.category];
            return (
              <article key={resource.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                      {CATEGORY_LABELS[resource.category]}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-foreground">{resource.title}</h3>
                  </div>
                  <Icon className="size-4 shrink-0 text-emerald-700" />
                </div>

                {resource.description ? (
                  <p className="mt-2 text-xs text-muted-foreground">{resource.description}</p>
                ) : null}

                <div className="mt-2 space-y-1 text-xs">
                  {resource.providerName ? (
                    <p>
                      <span className="font-medium text-foreground">Provider:</span> {resource.providerName}
                    </p>
                  ) : null}
                  {resource.estimatedCost ? (
                    <p>
                      <span className="font-medium text-foreground">Estimated cost:</span>{" "}
                      {resource.estimatedCost}
                    </p>
                  ) : null}
                  {resource.contactInfo?.phone ? (
                    <p>
                      <span className="font-medium text-foreground">Phone:</span> {resource.contactInfo.phone}
                    </p>
                  ) : null}
                  {resource.contactInfo?.email ? (
                    <p>
                      <span className="font-medium text-foreground">Email:</span> {resource.contactInfo.email}
                    </p>
                  ) : null}
                </div>

                {resource.isRecommended ? (
                  <span className="mt-2 inline-flex rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                    Recommended
                  </span>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
