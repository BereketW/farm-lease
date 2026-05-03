"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, FileText, ShieldCheck } from "lucide-react";
import { cn } from "@farm-lease/ui/lib/utils";
import { fetchProposalAuditLogs } from "@/features/proposal/datasource/proposals";
import {
  EditorialPagination,
  HorizonRule,
  SectionHeader,
  StatusPill,
  usePagination,
  type StatusTone,
} from "@/components/editorial";
import type { AuditLog } from "@/lib/api/types";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  STATE_CHANGE: "Status Changed",
  SIGN: "Signed",
  VERIFY: "Verified",
  REJECT: "Rejected",
  CANCEL: "Cancelled",
  ACTIVATE: "Activated",
  COMPLETE: "Completed",
  AGREEMENT_COMPLETED: "Agreement Completed",
  TERMS_EDITED: "Terms Edited",
};

const ACTION_TONE: Record<string, StatusTone> = {
  CREATE: "emerald",
  UPDATE: "sky",
  STATE_CHANGE: "amber",
  SIGN: "violet",
  VERIFY: "sky",
  REJECT: "rose",
  CANCEL: "neutral",
  ACTIVATE: "emerald",
  COMPLETE: "emerald",
  AGREEMENT_COMPLETED: "emerald",
  TERMS_EDITED: "violet",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateStr));
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  if (typeof val === "boolean") return val ? "Yes" : "No";
  return String(val);
}

function DiffView({
  from,
  to,
}: {
  from?: Record<string, unknown>;
  to?: Record<string, unknown>;
}) {
  if (!from && !to) return null;
  const allKeys = new Set([
    ...Object.keys(from || {}),
    ...Object.keys(to || {}),
  ]);
  const changes = Array.from(allKeys).map((key) => ({
    key,
    from: from?.[key],
    to: to?.[key],
    changed: JSON.stringify(from?.[key]) !== JSON.stringify(to?.[key]),
  }));

  return (
    <div className="mt-3 space-y-3 rounded-sm border border-emerald-950/10 bg-stone-50/50 px-4 py-3 dark:border-emerald-400/10 dark:bg-stone-900/40">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-800/80 dark:text-emerald-300/80">
        Before · After
      </p>
      <div className="space-y-2.5">
        {changes.map(({ key, from: f, to: t, changed }) => (
          <div key={key} className="space-y-1">
            <p
              className="font-serif text-[11px] italic text-emerald-900/80 dark:text-emerald-200/80"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {humanize(key)}
              {changed ? (
                <span className="ml-2 text-[9px] not-italic uppercase tracking-[0.18em] text-amber-700">
                  modified
                </span>
              ) : null}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-sm border border-rose-200 bg-rose-50/60 px-2.5 py-1.5 dark:border-rose-500/30 dark:bg-rose-950/30">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-rose-700/80 dark:text-rose-300/80">
                  From
                </p>
                <pre className="mt-0.5 whitespace-pre-wrap break-all font-mono text-[11px] leading-snug text-rose-900 dark:text-rose-200">
                  {formatValue(f)}
                </pre>
              </div>
              <div className="rounded-sm border border-emerald-200 bg-emerald-50/60 px-2.5 py-1.5 dark:border-emerald-500/30 dark:bg-emerald-950/30">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80 dark:text-emerald-300/80">
                  To
                </p>
                <pre className="mt-0.5 whitespace-pre-wrap break-all font-mono text-[11px] leading-snug text-emerald-900 dark:text-emerald-200">
                  {formatValue(t)}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditLogItem({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const hasDiff = log.details?.from || log.details?.to;
  const tone = ACTION_TONE[log.action] ?? "neutral";

  return (
    <li className="relative pb-5 last:pb-0">
      <span
        className="absolute left-[-7px] top-1.5 h-2.5 w-2.5 rotate-45 bg-emerald-700 dark:bg-emerald-400"
        aria-hidden
      />
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              label={ACTION_LABELS[log.action] ?? log.action}
              tone={tone}
              size="sm"
            />
            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              by{" "}
              <span className="font-medium text-stone-800 dark:text-stone-200">
                {log.actor.name ?? "Unknown"}
              </span>
              <span className="ml-1 text-[9px] uppercase tracking-[0.14em] text-stone-400">
                ({log.actor.role})
              </span>
            </span>
          </div>
          <time className="font-mono text-[10px] tabular-nums text-stone-400">
            {formatDate(log.createdAt)} · {formatTime(log.createdAt)}
          </time>
        </div>

        {log.details?.reason ? (
          <p
            className="font-serif text-sm italic text-stone-600 dark:text-stone-400"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            “{log.details.reason}”
          </p>
        ) : null}

        {hasDiff && expanded ? (
          <DiffView from={log.details?.from} to={log.details?.to} />
        ) : null}

        {hasDiff ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors",
              "text-emerald-800 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200"
            )}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Hide changes
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                View before · after
              </>
            )}
          </button>
        ) : null}
      </div>
    </li>
  );
}

export function AuditTrail({ proposalId }: { proposalId: string }) {
  const query = useQuery({
    queryKey: ["proposals", proposalId, "audit-logs"],
    queryFn: () => fetchProposalAuditLogs(proposalId),
  });

  const logs = query.data?.logs ?? [];

  const {
    items: pagedLogs,
    page,
    pageCount,
    setPage,
  } = usePagination(logs, 8);

  return (
    <section>
      <SectionHeader
        title="Guardian Ledger"
        eyebrow="Steward oversight"
        meta={
          query.isLoading
            ? "Loading…"
            : `Nº ${String(logs.length).padStart(2, "0")} entries`
        }
      />
      <div className="mt-3 overflow-hidden rounded-sm border border-emerald-950/15 bg-white/80 dark:border-emerald-400/15 dark:bg-stone-900/60">
        <header className="flex items-center gap-2 border-b border-emerald-950/10 bg-emerald-50/40 px-5 py-3 dark:border-emerald-400/10 dark:bg-emerald-950/20">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300">
            Admin-only · Read-only
          </p>
        </header>

        <div className="px-6 py-5">
          {query.isLoading ? (
            <p
              className="py-4 text-center font-serif text-sm italic text-stone-500"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Reading the ledger…
            </p>
          ) : query.error ? (
            <p className="py-4 text-center text-sm text-rose-700">
              Failed to load audit logs.
            </p>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <FileText className="h-5 w-5 text-stone-400" />
              <p
                className="font-serif text-sm italic text-stone-500"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                No entries on file for this proposal.
              </p>
            </div>
          ) : (
            <ol className="relative border-l border-emerald-950/15 pl-5 dark:border-emerald-400/15">
              {pagedLogs.map((log) => (
                <AuditLogItem key={log.id} log={log} />
              ))}
            </ol>
          )}
        </div>

        {pageCount > 1 ? (
          <EditorialPagination page={page} pageCount={pageCount} onPageChange={setPage} />
        ) : null}

        <HorizonRule className="mx-6 mb-4" />
        <p
          className="px-6 pb-4 text-center font-serif text-[11px] italic text-stone-500 dark:text-stone-500"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Every footstep upon this proposal — preserved for the record.
        </p>
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
