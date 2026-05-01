"use client";

import { useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  createProposalDraft,
  deleteProposalDraft,
  updateProposalDraft,
} from "@/features/proposal/datasource/proposals";
import type { ProposalDetail } from "@/lib/api/types";
import type { ProposalFormValues } from "../entity/form";

const STORAGE_KEY = "farmlease:proposal-draft-id:v2";
const SAVE_DELAY_MS = 1500;

function readDraftId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeDraftId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function clearDraft() {
  writeDraftId(null);
}

/**
 * Marshal form values into the server's Proposal + terms shape. Only the
 * `clusterId` is required; everything else is best-effort (server stores
 * zeros/empty strings for missing fields).
 */
function toDraftPayload(values: Partial<ProposalFormValues>) {
  return {
    clusterId: values.clusterId ?? "",
    budget:
      typeof values.budget === "number" && !Number.isNaN(values.budget)
        ? Number(values.budget)
        : undefined,
    durationMonths:
      typeof values.durationMonths === "number" && !Number.isNaN(values.durationMonths)
        ? Number(values.durationMonths)
        : undefined,
    startDate: values.startDate
      ? new Date(values.startDate).toISOString()
      : undefined,
    cropIntended: values.cropType || undefined,
    terms: {
      title: values.title ?? "",
      summary: values.summary ?? "",
      currency: values.currency ?? "ETB",
      cropType: values.cropType ?? "",
      conditions: values.conditions ?? "",
    } as Record<string, unknown>,
  };
}

/**
 * Reverse-marshal a server-side DRAFT proposal back into form field values.
 */
function fromDraftPayload(proposal: ProposalDetail): Partial<ProposalFormValues> {
  const terms = (proposal.terms ?? {}) as Record<string, unknown>;
  return {
    clusterId: proposal.cluster.id,
    budget: Number(proposal.budget) || (undefined as unknown as number),
    durationMonths: proposal.durationMonths || 12,
    startDate: proposal.startDate
      ? new Date(proposal.startDate).toISOString().slice(0, 10)
      : "",
    cropType:
      (typeof terms.cropType === "string" && terms.cropType) ||
      proposal.cropIntended ||
      "",
    title: typeof terms.title === "string" ? terms.title : "",
    summary: typeof terms.summary === "string" ? terms.summary : "",
    currency: typeof terms.currency === "string" ? terms.currency : "ETB",
    conditions: typeof terms.conditions === "string" ? terms.conditions : "",
  };
}

type UseDraftApi = {
  savedAt: number | null;
  restored: boolean;
  saving: boolean;
  error: string | null;
  draftId: string | null;
  discard: () => Promise<void>;
};

/**
 * Server-backed draft auto-save. On first field change it POSTs a new DRAFT
 * proposal, then PATCHes it on every change (debounced). The `draftId` is
 * mirrored to localStorage so reloads resume the same row.
 *
 * Note: the hook never throws. Network failures surface via `error`; the
 * form remains usable in offline mode and the next debounced save retries.
 */
export function useProposalDraft(
  form: UseFormReturn<ProposalFormValues>,
  options?: { initialDraft?: ProposalDetail | null }
): UseDraftApi {
  const [draftId, setDraftId] = useState<string | null>(() => readDraftId());
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [restored, setRestored] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard against writing to the server before we've attempted a restore.
  const bootstrapped = useRef(false);
  const mounted = useRef(true);

  // One-time restore from `options.initialDraft` (fetched by parent) if present.
  useEffect(() => {
    if (!options?.initialDraft) {
      bootstrapped.current = true;
      return;
    }
    const values = fromDraftPayload(options.initialDraft);
    form.reset({ ...form.getValues(), ...values });
    setDraftId(options.initialDraft.id);
    writeDraftId(options.initialDraft.id);
    setSavedAt(Date.now());
    setRestored(true);
    bootstrapped.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Debounced save on form changes.
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (!bootstrapped.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        const payload = toDraftPayload(values as Partial<ProposalFormValues>);
        // Cannot create a draft server-side without a cluster chosen.
        if (!payload.clusterId) return;

        setSaving(true);
        setError(null);
        try {
          if (!draftId) {
            const res = await createProposalDraft(payload);
            if (!mounted.current) return;
            setDraftId(res.proposal.id);
            writeDraftId(res.proposal.id);
          } else {
            await updateProposalDraft(draftId, payload);
          }
          if (!mounted.current) return;
          setSavedAt(Date.now());
        } catch (e) {
          if (!mounted.current) return;
          setError(e instanceof Error ? e.message : "Draft save failed");
        } finally {
          if (mounted.current) setSaving(false);
        }
      }, SAVE_DELAY_MS);
    });
    return () => subscription.unsubscribe();
    // Intentionally depend on draftId so the inner closure always sees the
    // latest id (otherwise the first PATCH would still try to POST).
  }, [form, draftId]);

  const discard = async () => {
    if (draftId) {
      try {
        await deleteProposalDraft(draftId);
      } catch {
        /* ignore — still clear client state */
      }
    }
    writeDraftId(null);
    setDraftId(null);
    setSavedAt(null);
    setRestored(false);
    setError(null);
    form.reset({
      clusterId: "",
      title: "",
      summary: "",
      durationMonths: 12,
      startDate: "",
      budget: undefined as unknown as number,
      currency: "ETB",
      cropType: "",
      conditions: "",
    });
  };

  return { savedAt, restored, saving, error, draftId, discard };
}
