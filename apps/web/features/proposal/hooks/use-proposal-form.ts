"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createProposal,
  submitProposalDraft,
  updateProposalDraft,
  uploadDocuments,
} from "@/features/proposal/datasource/proposals";
import {
  FORM_STEPS,
  proposalFormSchema,
  type ProposalFormValues,
  type StepId,
} from "../entity/form";
import { clearDraft } from "./use-proposal-draft";

export function useProposalForm(defaultClusterId?: string) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      clusterId: defaultClusterId ?? "",
      title: "",
      summary: "",
      durationMonths: 12,
      startDate: "",
      budget: undefined as unknown as number,
      currency: "ETB",
      cropType: "",
      conditions: "",
    },
    mode: "onChange",
  });

  const submit = useMutation({
    mutationFn: async (input: {
      values: ProposalFormValues;
      draftId: string | null;
    }) => {
      const { values, draftId } = input;

      // 1. Upload documents first (if any)
      let documentUrls: string[] = [];
      if (pendingFiles.length > 0) {
        const result = await uploadDocuments(pendingFiles);
        documentUrls = result.urls;
      }

      const terms = {
        title: values.title,
        summary: values.summary ?? "",
        currency: values.currency,
        cropType: values.cropType,
        conditions: values.conditions ?? "",
      };

      if (draftId) {
        // Flush the final values to the DRAFT row first (debounced saves
        // may not have flushed), then promote it to SUBMITTED.
        await updateProposalDraft(draftId, {
          clusterId: values.clusterId,
          budget: values.budget,
          durationMonths: values.durationMonths,
          startDate: values.startDate
            ? new Date(values.startDate).toISOString()
            : undefined,
          cropIntended: values.cropType,
          documents: documentUrls.length > 0 ? documentUrls : undefined,
          terms,
        });
        return submitProposalDraft(draftId);
      }

      // No draft yet — one-shot create + submit.
      return createProposal({
        clusterId: values.clusterId,
        budget: values.budget,
        durationMonths: values.durationMonths,
        startDate: values.startDate
          ? new Date(values.startDate).toISOString()
          : undefined,
        cropIntended: values.cropType,
        documents: documentUrls,
        terms,
      });
    },
    onSuccess: ({ proposal }) => {
      clearDraft();
      toast.success("Proposal submitted");
      router.push(`/proposals/${proposal.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const stepId: StepId = FORM_STEPS[stepIndex].id;
  const next = () => setStepIndex((i) => Math.min(i + 1, FORM_STEPS.length - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  return { form, submit, stepIndex, stepId, next, back, pendingFiles, setPendingFiles };
}
