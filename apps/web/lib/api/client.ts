import { getDevUserId } from "../dev-user";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export const API_BASE_URL = API_BASE;

function devHeaders(): HeadersInit {
  // Only send impersonation headers if specifically requested for local testing
  const devUserId =
    process.env.NEXT_PUBLIC_ALLOW_DEV_IMPERSONATION === "true" 
      ? getDevUserId() 
      : null;
  return devUserId ? { "x-dev-user-id": devUserId } : {};
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...devHeaders(),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

/**
 * Upload documents as multipart/form-data. Returns public URLs.
 */
export async function uploadDocuments(files: File[]): Promise<{ urls: string[] }> {
  if (files.length === 0) return { urls: [] };
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));

  const response = await fetch(`${API_BASE}/api/uploads/documents`, {
    method: "POST",
    credentials: "include",
    headers: devHeaders(),
    body: fd,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Upload failed: ${response.status}`);
  }
  return (await response.json()) as { urls: string[] };
}

/**
 * Upload a single receipt (multipart). Returns the created receipt record.
 */
export async function uploadReceipt(data: {
  agreementId: string;
  amount: number;
  datePaid: string;
  notes?: string;
  file: File;
}) {
  const fd = new FormData();
  fd.append("agreementId", data.agreementId);
  fd.append("amount", String(data.amount));
  fd.append("datePaid", data.datePaid);
  if (data.notes) fd.append("notes", data.notes);
  fd.append("receipt", data.file);

  const response = await fetch(`${API_BASE}/api/receipts`, {
    method: "POST",
    credentials: "include",
    headers: devHeaders(),
    body: fd,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Receipt upload failed: ${response.status}`);
  }
  return (await response.json()) as { receipt: import("./types").PaymentReceipt };
}
