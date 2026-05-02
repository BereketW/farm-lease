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
} from "lucide-react";
import { getAgreement, signAgreement, cancelAgreement } from "@/features/agreement/datasource/agreements";
import { useCurrentUserId } from "@/lib/use-current-user";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@farm-lease/ui/lib/utils";
import { Button } from "@farm-lease/ui/components/button";
import { ReceiptUploadDialog } from "@/features/agreement/components/receipt-upload-dialog";
import { ReceiptCard } from "@/features/agreement/components/receipt-card";
import { EditTermsDialog } from "@/features/agreement/components/edit-terms-dialog";
import type { AgreementStatus } from "@/lib/api/types";
import { DashboardContent } from "@/components/layout/dashboard-content";

const STATUS_STYLES: Record<AgreementStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  PENDING_SIGNATURES: "bg-amber-50 text-amber-800 ring-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  COMPLETED: "bg-blue-50 text-blue-800 ring-blue-200",
  CANCELLED: "bg-rose-50 text-rose-800 ring-rose-200",
};

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
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (query.error || !query.data) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <p className="text-sm text-rose-700">
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
  const canCancel = isAdmin; // Only admins can cancel agreements
  const alreadySigned = agreement.signatures.some((s) => s.signerId === userId);
  const canSign =
    (isInvestor || isRep) &&
    !alreadySigned &&
    (agreement.status === "DRAFT" || agreement.status === "PENDING_SIGNATURES");
  const canUploadReceipt = isInvestor && agreement.status === "PENDING_SIGNATURES";
  const canEditTerms =
    (isInvestor || isRep || isAdmin) &&
    (agreement.status === "DRAFT" || agreement.status === "PENDING_SIGNATURES");

  return (
    <DashboardContent>
      <Link
        href="/agreements"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to agreements
      </Link>

      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-gradient-to-br from-emerald-50 to-white p-6 dark:from-emerald-950/20 dark:to-transparent">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-700">
              <FileSignature className="size-3.5" />
              Lease agreement
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {agreement.proposal.cluster.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {agreement.proposal.cluster.region ?? agreement.proposal.cluster.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" />
                {new Date(agreement.startDate).toLocaleDateString()} →{" "}
                {new Date(agreement.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1",
              STATUS_STYLES[agreement.status]
            )}
          >
            {agreement.status.replace("_", " ")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-4">
          <Metric
            label="Budget"
            value={`ETB ${Number(agreement.proposal.budget).toLocaleString()}`}
          />
          <Metric label="Duration" value={`${agreement.proposal.durationMonths} mo`} />
          <Metric
            label="Investor"
            value={agreement.proposal.investor.name ?? "—"}
          />
          <Metric
            label="Signatures"
            value={`${agreement.signatures.length} / 2`}
          />
        </div>
      </section>

      {/* Actions */}
      <section className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
        {canSign ? (
          <Button onClick={() => sign.mutate()} disabled={sign.isPending}>
            {sign.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 size-4" />
            )}
            Sign agreement
          </Button>
        ) : null}

        {canUploadReceipt ? (
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 size-4" />
            Upload payment receipt
          </Button>
        ) : null}

        {alreadySigned ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="size-3.5" />
            You signed on{" "}
            {new Date(
              agreement.signatures.find((s) => s.signerId === userId)!.signedAt
            ).toLocaleDateString()}
          </span>
        ) : null}

        <div className="flex-1" />

        {canEditTerms ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="mr-1 size-3.5" />
            Edit terms
          </Button>
        ) : null}

        <Link
          href={`/agreements/${agreement.id}/print`}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-accent"
        >
          <Download className="size-3.5" />
          Download PDF
        </Link>

        {canCancel &&
        agreement.status !== "COMPLETED" &&
        agreement.status !== "CANCELLED" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Cancel this agreement? This cannot be undone.")) {
                cancel.mutate();
              }
            }}
            disabled={cancel.isPending}
            className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
          >
            <XCircle className="mr-1 size-3.5" />
            Cancel
          </Button>
        ) : null}
      </section>

      {/* Signatures */}
      <section className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Signatories
        </h2>
        {agreement.signatures.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nobody has signed yet.</p>
        ) : (
          <ul className="space-y-2">
            {agreement.signatures.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span className="font-medium text-foreground">
                    {s.signer?.name ?? s.signerId}
                  </span>
                  <span className="text-xs text-muted-foreground">({s.role})</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.signedAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Clauses */}
      <section className="mt-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Terms & Clauses
        </h2>
        <div className="space-y-4 text-sm">
          {agreement.clauses.map((c) => (
            <div key={c.title}>
              <h3 className="font-semibold text-foreground">{c.title}</h3>
              <p className="mt-1 text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Receipts */}
      <section className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Payment Receipts
          </h2>
          {canUploadReceipt ? (
            <Button variant="ghost" size="sm" onClick={() => setUploadOpen(true)}>
              <Upload className="mr-1 size-3.5" />
              Upload
            </Button>
          ) : null}
        </div>
        {receipts.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No receipts yet. {canUploadReceipt ? "Upload one to activate this agreement." : ""}
          </p>
        ) : (
          <div className="space-y-3">
            {receipts.map((r) => (
              <ReceiptCard
                key={r.id}
                receipt={r}
                canVerify={isRep || isAdmin}
                agreementId={agreement.id}
              />
            ))}
          </div>
        )}
      </section>

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
    </DashboardContent>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
