"use client";

import { ScrollText } from "lucide-react";
import { HorizonRule, SectionHeader } from "@/components/editorial";
import type { ProposalDetail } from "@/lib/api/types";

export function ProposalTerms({ proposal }: { proposal: ProposalDetail }) {
  const entries = Object.entries(proposal.terms ?? {});
  if (entries.length === 0) return null;

  return (
    <section>
      <SectionHeader
        title="Negotiated conditions"
        eyebrow="Lease terms"
        meta={`Nº ${String(entries.length).padStart(2, "0")} clauses`}
      />
      <div className="mt-3 overflow-hidden rounded-sm border border-emerald-950/15 bg-white/80 dark:border-emerald-400/15 dark:bg-stone-900/60">
        <header className="flex items-center gap-2 border-b border-emerald-950/10 bg-emerald-50/40 px-5 py-3 dark:border-emerald-400/10 dark:bg-emerald-950/20">
          <ScrollText className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300">
            The Covenant
          </p>
        </header>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 px-6 py-5 text-sm sm:grid-cols-2">
          {entries.map(([key, value], idx) => (
            <div
              key={key}
              className="border-b border-dashed border-emerald-950/10 pb-3 last:border-0 dark:border-emerald-400/10"
            >
              <div className="flex items-baseline gap-2">
                <span
                  className="font-serif text-[10px] italic tabular-nums text-emerald-700/60 dark:text-emerald-400/60"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800/80 dark:text-emerald-300/80">
                  {humanize(key)}
                </dt>
              </div>
              <dd
                className="mt-1.5 whitespace-pre-wrap font-serif text-sm leading-relaxed text-stone-800 dark:text-stone-200"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                {renderValue(value)}
              </dd>
            </div>
          ))}
        </dl>
        <HorizonRule className="mx-6 mb-4" />
      </div>
    </section>
  );
}

function humanize(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
    return String(v);
  return JSON.stringify(v, null, 2);
}
