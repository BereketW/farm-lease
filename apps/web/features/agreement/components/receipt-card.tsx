"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, XCircle, FileText, Loader2, ExternalLink } from "lucide-react";
import { decideReceipt } from "@/features/agreement/datasource/agreements";
import type { PaymentReceipt } from "@/lib/api/types";
import { Button } from "@farm-lease/ui/components/button";
import { Textarea } from "@farm-lease/ui/components/textarea";
import { cn } from "@farm-lease/ui/lib/utils";

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  VERIFIED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  REJECTED: "bg-rose-50 text-rose-800 ring-rose-200",
} as const;

export function ReceiptCard({
  receipt,
  canVerify,
  agreementId,
}: {
  receipt: PaymentReceipt;
  canVerify: boolean;
  agreementId: string;
}) {
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const decide = useMutation({
    mutationFn: (decision: "VERIFY" | "REJECT") =>
      decideReceipt(receipt.id, decision, decision === "REJECT" ? reason : undefined),
    onSuccess: (_, decision) => {
      toast.success(decision === "VERIFY" ? "Receipt verified — agreement activated" : "Receipt rejected");
      void queryClient.invalidateQueries({ queryKey: ["agreement", agreementId] });
      setRejecting(false);
      setReason("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-emerald-600" />
            <p className="text-sm font-semibold text-foreground">
              ETB {Number(receipt.amount).toLocaleString()}
            </p>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1",
                STATUS_STYLES[receipt.verificationStatus]
              )}
            >
              {receipt.verificationStatus}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Paid {new Date(receipt.datePaid).toLocaleDateString()} · Uploaded by{" "}
            {receipt.uploader?.name ?? "Investor"} ·{" "}
            {new Date(receipt.createdAt).toLocaleString()}
          </p>
          {receipt.notes ? (
            <p className="mt-2 text-xs text-foreground/80">{receipt.notes}</p>
          ) : null}
          {receipt.rejectionReason ? (
            <p className="mt-2 rounded bg-rose-50 px-2 py-1 text-xs text-rose-900">
              Rejected: {receipt.rejectionReason}
            </p>
          ) : null}
        </div>
        <a
          href={receipt.imageUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          View
          <ExternalLink className="size-3" />
        </a>
      </header>

      {canVerify && receipt.verificationStatus === "PENDING" ? (
        <div className="mt-3 border-t border-border pt-3">
          {rejecting ? (
            <div className="space-y-2">
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for rejection"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setRejecting(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={decide.isPending || !reason.trim()}
                  onClick={() => decide.mutate("REJECT")}
                >
                  {decide.isPending && <Loader2 className="mr-1 size-3 animate-spin" />}
                  Confirm reject
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRejecting(true)}>
                <XCircle className="mr-1 size-3.5" />
                Reject
              </Button>
              <Button
                size="sm"
                disabled={decide.isPending}
                onClick={() => decide.mutate("VERIFY")}
              >
                {decide.isPending ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1 size-3.5" />
                )}
                Verify & activate
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}
