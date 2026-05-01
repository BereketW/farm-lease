"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadReceipt } from "@/lib/api/client";
import { Button } from "@farm-lease/ui/components/button";
import { Input } from "@farm-lease/ui/components/input";
import { Label } from "@farm-lease/ui/components/label";
import { Textarea } from "@farm-lease/ui/components/textarea";

export function ReceiptUploadDialog({
  agreementId,
  open,
  onClose,
}: {
  agreementId: string;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [datePaid, setDatePaid] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const submit = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please attach a receipt image or PDF");
      return uploadReceipt({
        agreementId,
        amount: Number(amount),
        datePaid,
        notes: notes || undefined,
        file,
      });
    },
    onSuccess: () => {
      toast.success("Receipt uploaded for verification");
      void queryClient.invalidateQueries({ queryKey: ["agreement", agreementId] });
      setAmount("");
      setDatePaid("");
      setNotes("");
      setFile(null);
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Upload payment receipt</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              After making the offline payment, upload the proof here for verification.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (ETB)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="datePaid">Date paid</Label>
            <Input
              id="datePaid"
              type="date"
              value={datePaid}
              onChange={(e) => setDatePaid(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Bank transfer reference, mobile money TX id, etc."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="receipt">Receipt (image or PDF)</Label>
            <label
              htmlFor="receipt"
              className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-background px-3 py-4 text-sm text-muted-foreground hover:bg-accent"
            >
              <Upload className="size-4" />
              {file ? file.name : "Click to choose file…"}
              <input
                id="receipt"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submit.isPending}>
              {submit.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Upload
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
