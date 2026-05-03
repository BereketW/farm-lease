import { apiFetch, uploadDocuments } from "@/lib/api/client";
// import { ProposalStatus } from "@/lib/api/types";
import type {
  AuditLog,
  NegotiationMessage,
  ProposalDetail,
  ProposalStatus,
  ProposalSummary,
  ProposalViewer,
} from "@/lib/api/types";

export type CreateProposalInput = {
  clusterId: string;
  budget: number;
  durationMonths: number;
  startDate?: string;
  cropIntended?: string;
  documents?: string[];
  terms: Record<string, unknown>;
};

export function listProposals(params?: {
  status?: ProposalStatus;
}): Promise<{ proposals: ProposalSummary[] }> {
  const qs = params?.status ? `?status=${params.status}` : "";
  return apiFetch(`/api/proposals${qs}`);
}

export function getProposal(id: string): Promise<{ proposal: ProposalDetail; viewer: ProposalViewer }> {
  return apiFetch(`/api/proposals/${id}`);
}

export function createProposal(
  input: CreateProposalInput
): Promise<{ proposal: ProposalSummary }> {
  return apiFetch(`/api/proposals`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---------- DRAFTS ----------

export type DraftProposalInput = {
  clusterId: string;
  budget?: number;
  durationMonths?: number;
  startDate?: string | null;
  cropIntended?: string | null;
  terms?: Record<string, unknown>;
  documents?: string[];
};

export function createProposalDraft(
  input: DraftProposalInput
): Promise<{ proposal: ProposalSummary }> {
  return apiFetch(`/api/proposals/drafts`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProposalDraft(
  id: string,
  input: Partial<DraftProposalInput>
): Promise<{ proposal: ProposalSummary }> {
  return apiFetch(`/api/proposals/drafts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteProposalDraft(id: string): Promise<void> {
  return apiFetch(`/api/proposals/drafts/${id}`, { method: "DELETE" });
}

export function submitProposalDraft(
  id: string
): Promise<{ proposal: ProposalSummary }> {
  return apiFetch(`/api/proposals/${id}/submit`, { method: "POST" });
}

export function listDraftProposals(): Promise<{ proposals: ProposalSummary[] }> {
  return apiFetch(`/api/proposals?status=DRAFT`);
}

export function decideProposal(
  id: string,
  decision: "ACCEPT" | "REJECT",
  reason?: string
): Promise<{ proposal: ProposalSummary }> {
  return apiFetch(`/api/proposals/${id}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision, reason }),
  });
}

export function withdrawProposal(
  id: string
): Promise<{ proposal: ProposalSummary }> {
  return apiFetch(`/api/proposals/${id}/withdraw`, { method: "POST" });
}

export function createRevision(
  id: string,
  input: {
    budget: number;
    durationMonths: number;
    terms: Record<string, unknown>;
    note?: string;
  }
): Promise<{ proposal: ProposalSummary }> {
  return apiFetch(`/api/proposals/${id}/revisions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listMessages(
  id: string,
  opts?: { before?: string; limit?: number }
): Promise<{ messages: NegotiationMessage[]; hasMore: boolean }> {
  const params = new URLSearchParams();
  if (opts?.before) params.set("before", opts.before);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.size > 0 ? `?${params.toString()}` : "";
  return apiFetch(`/api/proposals/${id}/messages${qs}`);
}

export function postMessage(
  id: string,
  message: string,
  opts?: { counterTerms?: Record<string, unknown>; attachments?: string[] }
): Promise<{ message: NegotiationMessage }> {
  return apiFetch(`/api/proposals/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({
      message,
      counterTerms: opts?.counterTerms,
      attachments: opts?.attachments,
    }),
  });
}

export function markMessagesRead(
  id: string,
  ids: string[]
): Promise<{ ids: string[] }> {
  return apiFetch(`/api/proposals/${id}/messages/read`, {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

export function fetchProposalAuditLogs(
  id: string
): Promise<{ logs: AuditLog[] }> {
  return apiFetch(`/api/proposals/${id}/audit-logs`);
}

export { uploadDocuments };
