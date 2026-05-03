"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  FileSignature,
  CheckCircle2,
  Loader2,
  MapPin,
  ArrowLeft,
  Upload,
  XCircle,
  Download,
  Pencil,
  ScrollText,
  Receipt,
  Users,
} from "lucide-react";
import {
  getAgreement,
  signAgreement,
  cancelAgreement,
} from "@/features/agreement/datasource/agreements";
import { useCurrentUserId } from "@/lib/use-current-user";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@farm-lease/ui/lib/utils";
import { ReceiptUploadDialog } from "@/features/agreement/components/receipt-upload-dialog";
import { ReceiptCard } from "@/features/agreement/components/receipt-card";
import { EditTermsDialog } from "@/features/agreement/components/edit-terms-dialog";
import { ResourceSuggestions } from "@/features/agreement/components/resource-suggestions";
import type { AgreementStatus, PaymentReceipt } from "@/lib/api/types";
import {
  EditorialPagination,
  HorizonRule,
  Metric,
  NameAvatar,
  PaperGrain,
  SectionHeader,
  StatusPill,
  usePagination,
  type StatusTone,
} from "@/components/editorial";
import { DashboardContent } from "@/components/layout/dashboard-content";

const STATUS_TONE: Record<AgreementStatus, StatusTone> = {
  DRAFT: "neutral",
  PENDING_SIGNATURES: "amber",
  ACTIVE: "emerald",
  COMPLETED: "sky",
  CANCELLED: "rose",
};

function formatBudget(value: number | string, currency = "ETB") {
  const n = Number(value);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ${currency}`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k ${currency}`;
  return `${n.toLocaleString()} ${currency}`;
}

export function AgreementDetailScreen({
  idPromise,
}: {
  idPromise: Promise<string>;
}) {
  const id = use(idPromise);
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  const { isAdmin } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const query = useQuery({
    queryKey: ["agreement", id],
    queryFn: () => getAgreement(id),
  });

  const sign = useMutation({
    mutationFn: () => signAgreement(id),
    onSuccess: () => {
      toast.success("Agreement signed");
      void queryClient.invalidateQueries({ queryKey: ["agreement", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const cancel = useMutation({
    mutationFn: () => cancelAgreement(id),
    onSuccess: () => {
      toast.success("Agreement cancelled");
      void queryClient.invalidateQueries({ queryKey: ["agreement", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (query.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-stone-50/60 py-24 dark:bg-stone-950/60">
        <Loader2 className="size-6 animate-spin text-emerald-700" />
      </div>
    );
  }

  if (query.error || !query.data) {
    return (
      <div className="flex flex-1 items-center justify-center bg-stone-50/60 py-24 dark:bg-stone-950/60">
        <p
          className="rounded-sm border border-rose-200 bg-white px-4 py-2 font-serif text-sm italic text-rose-700"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {(query.error as Error)?.message ?? "Agreement not found"}
        </p>
      </div>
    );
  }

  const { agreement, receipts } = query.data;
  const investorId = agreement.proposal.investor.id;
  const repIds = agreement.proposal.cluster.representatives.map((r) => r.userId);

  const isInvestor = userId === investorId;
  const isRep = !!userId && repIds.includes(userId);
  const canCancel = isAdmin;
  const alreadySigned = agreement.signatures.some((s) => s.signerId === userId);
  const canSign =
    (isInvestor || isRep) &&
    !alreadySigned &&
    (agreement.status === "DRAFT" || agreement.status === "PENDING_SIGNATURES");
  const canUploadReceipt = isInvestor && agreement.status === "PENDING_SIGNATURES";
  const canEditTerms =
    (isInvestor || isRep) &&
    (agreement.status === "DRAFT" || agreement.status === "PENDING_SIGNATURES");

  return (
    <div className="relative flex flex-1 flex-col bg-stone-50/60 dark:bg-stone-950/60">
      <PaperGrain />

      <DashboardContent>
        <Link
          href="/agreements"
          className="mb-6 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-800/80 transition-colors hover:text-emerald-900 dark:text-emerald-300/80 dark:hover:text-emerald-200"
        >
          <ArrowLeft className="size-3" />
          Back to ledger
        </Link>

        {/* Hero */}
        <section className="overflow-hidden rounded-sm border border-emerald-950/15 bg-white/80 shadow-[0_1px_0_rgba(0,0,0,0.02)] dark:border-emerald-400/15 dark:bg-stone-900/60">
          <div className="border-b border-emerald-950/10 bg-linear-to-br from-emerald-50/70 via-white to-lime-50/30 px-6 py-6 dark:border-emerald-400/10 dark:from-emerald-950/30 dark:via-stone-900/60 dark:to-stone-900/60">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-800/80 dark:text-emerald-300/80">
                  <FileSignature className="h-3 w-3" />
                  Lease Agreement · Nº{" "}
                  <span className="font-mono">{agreement.id.slice(0, 8)}</span>
                </p>
                <h1
                  className="mt-2 font-serif text-4xl font-light leading-none tracking-tight text-emerald-950 dark:text-emerald-50 sm:text-5xl"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {agreement.proposal.cluster.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 dark:text-stone-400">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    {agreement.proposal.cluster.region ??
                      agreement.proposal.cluster.location ??
                      "Region unknown"}
                  </span>
                  <span className="text-emerald-700/30">◆</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(agreement.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    →{" "}
                    {new Date(agreement.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <StatusPill
                label={agreement.status.replace("_", " ")}
                tone={STATUS_TONE[agreement.status]}
                pulse={agreement.status === "PENDING_SIGNATURES"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-emerald-950/10 dark:bg-emerald-400/10 sm:grid-cols-4">
            <Metric
              label="Budget"
              value={formatBudget(agreement.proposal.budget)}
              tone="emerald"
              hint="Total commitment"
              index="i"
              className="rounded-none border-0"
            />
            <Metric
              label="Duration"
              value={`${agreement.proposal.durationMonths} mo`}
              tone="lime"
              hint="Lease span"
              index="ii"
              className="rounded-none border-0"
            />
            <Metric
              label="Investor"
              value={agreement.proposal.investor.name ?? "—"}
              hint="Counterparty"
              index="iii"
              className="rounded-none border-0"
            />
            <Metric
              label="Signatures"
              value={`${agreement.signatures.length} / 2`}
              tone={agreement.signatures.length === 2 ? "emerald" : "amber"}
              hint={
                agreement.signatures.length === 2 ? "Fully executed" : "Pending"
              }
              index="iv"
              className="rounded-none border-0"
            />
          </div>
        </section>

        {/* Actions Toolbar */}
        <section className="mt-6 flex flex-wrap items-center gap-2 rounded-sm border border-emerald-950/10 bg-white/80 px-4 py-3 dark:border-emerald-400/10 dark:bg-stone-900/60">
          {canSign ? (
            <ToolbarButton
              tone="emerald"
              primary
              onClick={() => sign.mutate()}
              disabled={sign.isPending}
              icon={
                sign.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )
              }
            >
              Sign Agreement
            </ToolbarButton>
          ) : null}

          {canUploadReceipt ? (
            <ToolbarButton
              tone="emerald"
              onClick={() => setUploadOpen(true)}
              icon={<Upload className="h-3.5 w-3.5" />}
            >
              Upload Receipt
            </ToolbarButton>
          ) : null}

          {alreadySigned ? (
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-emerald-700/30 bg-emerald-50/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              You signed{" "}
              {new Date(
                agreement.signatures.find((s) => s.signerId === userId)!.signedAt
              ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          ) : null}

          <div className="flex-1" />

          {canEditTerms ? (
            <ToolbarButton
              tone="neutral"
              onClick={() => setEditOpen(true)}
              icon={<Pencil className="h-3 w-3" />}
            >
              Edit Terms
            </ToolbarButton>
          ) : null}

          <Link
            href={`/agreements/${agreement.id}/print`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-sm border border-emerald-950/15 bg-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-700 transition-colors hover:border-emerald-700/40 hover:bg-emerald-50/40 dark:border-emerald-400/15 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <Download className="h-3 w-3" />
            Download PDF
          </Link>

          {canCancel &&
          agreement.status !== "COMPLETED" &&
          agreement.status !== "CANCELLED" ? (
            <ToolbarButton
              tone="rose"
              onClick={() => {
                if (confirm("Cancel this agreement? This cannot be undone.")) {
                  cancel.mutate();
                }
              }}
              disabled={cancel.isPending}
              icon={<XCircle className="h-3 w-3" />}
            >
              Cancel
            </ToolbarButton>
          ) : null}
        </section>

        {/* Signatories */}
        <section className="mt-8">
          <SectionHeader
            title="The Signatories"
            eyebrow="Executed parties"
            meta={`${agreement.signatures.length} of 2`}
          />
          <div className="mt-3 overflow-hidden rounded-sm border border-emerald-950/15 bg-white/80 dark:border-emerald-400/15 dark:bg-stone-900/60">
            {agreement.signatures.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Users className="mx-auto h-5 w-5 text-stone-400" />
                <p
                  className="mt-2 font-serif text-sm italic text-stone-500"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  No signatures yet — awaiting parties to sign.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-emerald-950/10 dark:divide-emerald-400/10">
                {agreement.signatures.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <NameAvatar
                        size="sm"
                        id={s.signerId}
                        name={s.signer?.name}
                      />
                      <div>
                        <p
                          className="font-serif text-sm text-stone-900 dark:text-stone-50"
                          style={{ fontFamily: "var(--font-fraunces)" }}
                        >
                          {s.signer?.name ?? s.signerId.slice(0, 8)}
                        </p>
                        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500">
                          {s.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] tabular-nums text-stone-500">
                        {new Date(s.signedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Clauses */}
        <section className="mt-8">
          <SectionHeader
            title="Terms & Clauses"
            eyebrow="The covenant"
            meta={`Nº ${String(agreement.clauses.length).padStart(2, "0")}`}
          />
          <div className="mt-3 overflow-hidden rounded-sm border border-emerald-950/15 bg-white/80 dark:border-emerald-400/15 dark:bg-stone-900/60">
            <div className="space-y-0">
              {agreement.clauses.map((c, idx) => (
                <article
                  key={c.title}
                  className={cn(
                    "px-6 py-5",
                    idx > 0 && "border-t border-emerald-950/10 dark:border-emerald-400/10"
                  )}
                >
                  <div className="flex items-baseline gap-3">
                    <span
                      className="font-serif text-xs italic tabular-nums text-emerald-700/60 dark:text-emerald-400/60"
                      style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h3
                      className="font-serif text-base text-stone-900 dark:text-stone-50"
                      style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                      {c.title}
                    </h3>
                  </div>
                  <HorizonRule className="my-2.5" />
                  <p className="font-serif text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                    {c.body}
                  </p>
                </article>
              ))}
              {agreement.clauses.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <ScrollText className="mx-auto h-5 w-5 text-stone-400" />
                  <p
                    className="mt-2 font-serif text-sm italic text-stone-500"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                  >
                    No clauses recorded.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* Receipts */}
        <section className="mt-8">
          <SectionHeader
            title="Payment Receipts"
            eyebrow="Treasury record"
            meta={
              canUploadReceipt ? (
                <button
                  type="button"
                  onClick={() => setUploadOpen(true)}
                  className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-900 dark:text-emerald-300"
                >
                  <Upload className="h-3 w-3" />
                  Upload
                </button>
              ) : (
                `${receipts.length} on file`
              )
            }
          />
          <div className="mt-3">
            {receipts.length === 0 ? (
              <div className="rounded-sm border border-dashed border-emerald-950/15 bg-white/60 px-5 py-10 text-center dark:border-emerald-400/15 dark:bg-stone-900/40">
                <Receipt className="mx-auto h-5 w-5 text-stone-400" />
                <p
                  className="mt-2 font-serif text-sm italic text-stone-500"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  No receipts yet.
                  {canUploadReceipt
                    ? " Upload one to activate this agreement."
                    : ""}
                </p>
              </div>
            ) : (
              <ReceiptsList
                receipts={receipts}
                agreementId={agreement.id}
                canVerify={isRep || isAdmin}
              />
            )}
          </div>
        </section>

        {(agreement.status === "ACTIVE" || agreement.status === "COMPLETED") && (
          <section className="mt-8">
            <ResourceSuggestions agreementId={agreement.id} />
          </section>
        )}
      </DashboardContent>

      <ReceiptUploadDialog
        agreementId={agreement.id}
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />

      <EditTermsDialog
        agreementId={agreement.id}
        initialClauses={agreement.clauses}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}

function ReceiptsList({
  receipts,
  agreementId,
  canVerify,
}: {
  receipts: PaymentReceipt[];
  agreementId: string;
  canVerify: boolean;
}) {
  const { items, page, pageCount, setPage } = usePagination(receipts, 6);
  return (
    <div className="space-y-3">
      {items.map((r) => (
        <ReceiptCard
          key={r.id}
          receipt={r}
          canVerify={canVerify}
          agreementId={agreementId}
        />
      ))}
      {pageCount > 1 ? (
        <div className="overflow-hidden rounded-sm border border-emerald-950/10 bg-white/60 dark:border-emerald-400/10 dark:bg-stone-900/40">
          <EditorialPagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </div>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  children,
  icon,
  onClick,
  disabled,
  tone,
  primary,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone: "emerald" | "rose" | "neutral";
  primary?: boolean;
}) {
  const TONE_CLASS: Record<string, string> = {
    emerald: primary
      ? "bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800"
      : "bg-white text-emerald-800 border-emerald-700/30 hover:bg-emerald-50 dark:bg-stone-900 dark:text-emerald-300 dark:border-emerald-400/30 dark:hover:bg-emerald-950/40",
    rose: "bg-white text-rose-800 border-rose-700/30 hover:bg-rose-50 dark:bg-stone-900 dark:text-rose-300 dark:border-rose-400/30 dark:hover:bg-rose-950/40",
    neutral:
      "bg-white text-stone-700 border-emerald-950/15 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-300 dark:border-emerald-400/15 dark:hover:bg-stone-800",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors disabled:opacity-50",
        TONE_CLASS[tone]
      )}
    >
      {icon}
      {children}
    </button>
  );
}
