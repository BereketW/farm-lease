"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, X, Plus, Trash2, AlertTriangle } from "lucide-react";
import { editAgreementTerms } from "@/features/agreement/datasource/agreements";
import type { AgreementClause } from "@/lib/api/types";
import { Button } from "@farm-lease/ui/components/button";
import { Input } from "@farm-lease/ui/components/input";
import { Label } from "@farm-lease/ui/components/label";
import { Textarea } from "@farm-lease/ui/components/textarea";

type Props = {
  agreementId: string;
  initialClauses: AgreementClause[];
  open: boolean;
  onClose: () => void;
};

export function EditTermsDialog({
  agreementId,
  initialClauses,
  open,
  onClose,
}: Props) {
  const queryClient = useQueryClient();
  const [clauses, setClauses] = useState<AgreementClause[]>(() =>
    initialClauses.map((c) => ({ ...c }))
  );
  const [note, setNote] = useState("");

  // Reset local state whenever the dialog reopens
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setClauses(initialClauses.map((c) => ({ ...c })));
      setNote("");
    }
  }

  const submit = useMutation({
    mutationFn: () =>
      editAgreementTerms(agreementId, {
        clauses,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Agreement updated — signatures cleared, both parties must re-sign.");
      void queryClient.invalidateQueries({ queryKey: ["agreement", agreementId] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateClause = (
    idx: number,
    field: "title" | "body",
    value: string
  ) => {
    setClauses((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );
  };

  const addClause = () => {
    setClauses((prev) => [
      ...prev,
      { title: `${prev.length + 1}. Untitled clause`, body: "" },
    ]);
  };

  const removeClause = (idx: number) => {
    setClauses((prev) => prev.filter((_, i) => i !== idx));
  };

  const canSubmit =
    clauses.length > 0 &&
    clauses.every((c) => c.title.trim() && c.body.trim()) &&
    !submit.isPending;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-card shadow-xl ring-1 ring-border">
        <header className="flex items-start justify-between border-b border-border p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Edit agreement terms
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Revise the clauses below. Saving will clear all existing
              signatures — both parties must re-sign after your change.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Editing terms resets this agreement to <strong>DRAFT</strong>{" "}
              status. All previous signatures will be discarded and the other
              party will be notified to review and re-sign.
            </p>
          </div>

          <div className="space-y-4">
            {clauses.map((c, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="mb-2 flex items-start gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor={`clause-title-${idx}`} className="text-xs">
                      Clause title
                    </Label>
                    <Input
                      id={`clause-title-${idx}`}
                      value={c.title}
                      onChange={(e) => updateClause(idx, "title", e.target.value)}
                      maxLength={200}
                    />
                  </div>
                  {clauses.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeClause(idx)}
                      className="mt-6 rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-700"
                      aria-label="Remove clause"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`clause-body-${idx}`} className="text-xs">
                    Body
                  </Label>
                  <Textarea
                    id={`clause-body-${idx}`}
                    value={c.body}
                    onChange={(e) => updateClause(idx, "body", e.target.value)}
                    rows={3}
                    maxLength={5000}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addClause}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Add clause
          </button>

          <div className="mt-6 space-y-1.5">
            <Label htmlFor="edit-note" className="text-xs">
              Reason for edit (optional, shown in audit log)
            </Label>
            <Textarea
              id="edit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="e.g. Clarified payment schedule in clause 3"
            />
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border p-4">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            onClick={() => submit.mutate()}
            disabled={!canSubmit}
            type="button"
          >
            {submit.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Save & reset signatures
          </Button>
        </footer>
      </div>
    </div>
  );
}
