import { apiFetch } from "@/lib/api/client";
import type {
  AgreementDetail,
  AgreementSignature,
  AgreementStatus,
  AgreementSummary,
  PaymentReceipt,
} from "@/lib/api/types";

export function listAgreements(params?: {
  status?: AgreementStatus;
  clusterId?: string;
}): Promise<{ agreements: AgreementSummary[] }> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.clusterId) qs.set("clusterId", params.clusterId);
  const query = qs.toString();
  return apiFetch(`/api/agreements${query ? `?${query}` : ""}`);
}

export function getAgreement(
  id: string
): Promise<{ agreement: AgreementDetail; receipts: PaymentReceipt[] }> {
  return apiFetch(`/api/agreements/${id}`);
}

export function signAgreement(
  id: string
): Promise<{ signature: AgreementSignature; agreement: AgreementSummary }> {
  return apiFetch(`/api/agreements/${id}/sign`, { method: "POST" });
}

export function cancelAgreement(
  id: string,
  reason?: string
): Promise<{ agreement: AgreementSummary }> {
  return apiFetch(`/api/agreements/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function editAgreementTerms(
  id: string,
  input: {
    terms?: Record<string, unknown>;
    clauses?: Array<{ title: string; body: string }>;
    note?: string;
  }
): Promise<{ agreement: AgreementSummary }> {
  return apiFetch(`/api/agreements/${id}/terms`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function decideReceipt(
  receiptId: string,
  decision: "VERIFY" | "REJECT",
  reason?: string
): Promise<{ receipt: PaymentReceipt }> {
  return apiFetch(`/api/receipts/${receiptId}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision, reason }),
  });
}
