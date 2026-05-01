import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardTabs } from "@/features/proposal/components/dashboard/dashboard-tabs";

export function ProposalsScreen() {
  return (
    <div className="flex flex-1 justify-center bg-gradient-to-b from-emerald-50/30 to-white dark:from-zinc-950 dark:to-zinc-950 px-4 py-8">
      <div className="w-full max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-500">
              FarmLease · Dashboard
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-emerald-950 dark:text-emerald-100">
              Proposals
            </h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
              Track every lease conversation you&apos;re part of. Realtime updates from
              your counterparty appear here automatically.
            </p>
          </div>
          <Link
            href="/proposals/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" />
            New proposal
          </Link>
        </header>
        <DashboardTabs />
      </div>
    </div>
  );
}
