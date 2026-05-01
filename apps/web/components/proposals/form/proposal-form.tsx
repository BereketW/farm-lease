"use client";

import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Sparkles, Save, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { FORM_STEPS } from "./types";
import { useProposalForm } from "./use-proposal-form";
import { StepCluster } from "./step-cluster";
import { StepTerms } from "./step-terms";
import { StepConditions } from "./step-conditions";
import { StepDocuments } from "./step-documents";
import { StepReview } from "./step-review";
import { FormStepper } from "./stepper";
import { useProposalDraft } from "./use-proposal-draft";

function relativeSince(ts: number): string {
  const diff = Math.round((Date.now() - ts) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const m = Math.round(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

export function ProposalForm({ defaultClusterId }: { defaultClusterId?: string }) {
  const { form, submit, stepIndex, stepId, next, back, pendingFiles, setPendingFiles } =
    useProposalForm(defaultClusterId);
  const { savedAt, restored, saving, error, draftId, discard } = useProposalDraft(form);
  const isLast = stepIndex === FORM_STEPS.length - 1;

  return (
    <form
      className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"
      onSubmit={form.handleSubmit(
        (values) => submit.mutate({ values, draftId }),
        (errors) => {
          const first = Object.values(errors)[0];
          const message =
            (first && "message" in first && (first.message as string)) ||
            "Please fix the highlighted fields";
          toast.error(message);
        }
      )}
    >
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <FormStepper stepIndex={stepIndex} />
      </aside>

      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        {savedAt !== null || saving || error ? (
          <div
            className={
              error
                ? "mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs"
                : "mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs"
            }
          >
            <span
              className={
                error
                  ? "inline-flex items-center gap-1.5 text-amber-900"
                  : "inline-flex items-center gap-1.5 text-emerald-800"
              }
            >
              {error ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Draft save failed: {error}
                </>
              ) : saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving draft…
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  {restored ? "Draft restored" : "Draft saved"} ·{" "}
                  {savedAt ? relativeSince(savedAt) : "just now"}
                </>
              )}
            </span>
            {draftId ? (
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm("Discard this draft? It will be removed from the server.")
                  ) {
                    void discard();
                  }
                }}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="h-3 w-3" />
                Discard
              </button>
            ) : null}
          </div>
        ) : null}

        {stepId === "cluster" ? <StepCluster form={form} /> : null}
        {stepId === "terms" ? <StepTerms form={form} /> : null}
        {stepId === "conditions" ? <StepConditions form={form} /> : null}
        {stepId === "documents" ? (
          <StepDocuments files={pendingFiles} onChange={setPendingFiles} />
        ) : null}
        {stepId === "review" ? <StepReview form={form} /> : null}

        <div className="mt-8 flex items-center justify-between border-t border-zinc-100 pt-5">
          <button
            type="button"
            onClick={back}
            disabled={stepIndex === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          {isLast ? (
            <button
              type="submit"
              disabled={submit.isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {submit.isPending ? "Submitting…" : "Submit proposal"}
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
