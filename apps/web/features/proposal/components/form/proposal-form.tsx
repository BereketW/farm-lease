"use client";

import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Sparkles, Save, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { FORM_STEPS } from "../../entity/form";
import { useProposalForm } from "../../hooks/use-proposal-form";
import { StepCluster } from "./step-cluster";
import { StepTerms } from "./step-terms";
import { StepConditions } from "./step-conditions";
import { StepDocuments } from "./step-documents";
import { StepReview } from "./step-review";
import { FormStepper } from "./stepper";
import { useProposalDraft } from "../../hooks/use-proposal-draft";
import { EditorialButton } from "@/components/editorial";

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
      // Prevent implicit Enter-key submission from earlier steps. Only the
      // explicit "Submit proposal" button on the review step should submit.
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          !isLast &&
          (event.target as HTMLElement).tagName !== "TEXTAREA"
        ) {
          event.preventDefault();
        }
      }}
      onSubmit={form.handleSubmit(
        (values) => {
          if (!isLast) return; // Safety: only submit from review step.
          submit.mutate({ values, draftId });
        },
        (errors) => {
          if (!isLast) return; // Don't surface validation errors mid-wizard.
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

      <div className="relative overflow-hidden rounded-sm border border-emerald-950/15 bg-white/80 p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur-[1px] dark:border-emerald-400/15 dark:bg-stone-950/50 sm:p-8">
        {/* Paper edge accents */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-800/30 to-transparent dark:via-emerald-300/30"
        />

        {savedAt !== null || saving || error ? (
          <div
            className={
              error
                ? "mb-5 flex flex-wrap items-center justify-between gap-2 border-l-2 border-amber-600 bg-amber-50/60 px-3 py-2 text-[11px] dark:border-amber-400 dark:bg-amber-950/30"
                : "mb-5 flex flex-wrap items-center justify-between gap-2 border-l-2 border-emerald-700 bg-emerald-50/40 px-3 py-2 text-[11px] dark:border-emerald-400 dark:bg-emerald-950/30"
            }
          >
            <span
              className={
                error
                  ? "inline-flex items-center gap-1.5 uppercase tracking-[0.14em] text-amber-900 dark:text-amber-200"
                  : "inline-flex items-center gap-1.5 uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-200"
              }
            >
              {error ? (
                <>
                  <AlertTriangle className="h-3 w-3" />
                  Draft save failed · {error}
                </>
              ) : saving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving draft…
                </>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  {restored ? "Draft restored" : "Draft saved"} ·{" "}
                  <span
                    className="font-mono normal-case tracking-normal"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {savedAt ? relativeSince(savedAt) : "just now"}
                  </span>
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
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-rose-700 transition-colors hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-200"
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

        <div className="mt-10 flex items-center justify-between border-t border-emerald-950/10 pt-5 dark:border-emerald-400/10">
          <EditorialButton
            type="button"
            variant="ghost"
            onClick={back}
            disabled={stepIndex === 0}
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
            Back
          </EditorialButton>
          {isLast ? (
            <EditorialButton
              type="submit"
              variant="primary"
              size="lg"
              shimmer
              disabled={submit.isPending}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {submit.isPending ? "Submitting…" : "Submit proposal"}
            </EditorialButton>
          ) : (
            <EditorialButton type="button" variant="primary" onClick={next}>
              Next chapter
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </EditorialButton>
          )}
        </div>
      </div>
    </form>
  );
}
