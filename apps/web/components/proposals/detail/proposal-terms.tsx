"use client";

import type { ProposalDetail } from "@/lib/api/types";

export function ProposalTerms({ proposal }: { proposal: ProposalDetail }) {
  const entries = Object.entries(proposal.terms ?? {});
  if (entries.length === 0) return null;

  return (
    <section className="rounded-2xl border border-emerald-100 bg-white shadow-sm">
      <header className="border-b border-emerald-100 px-5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Lease terms
        </p>
        <h2 className="text-sm font-semibold text-emerald-950">Negotiated conditions</h2>
      </header>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 px-5 py-4 text-sm sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="border-b border-dashed border-zinc-100 pb-2 last:border-0">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              {humanize(key)}
            </dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-zinc-900">
              {renderValue(value)}
            </dd>
          </div>
        ))}
      </dl>
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
