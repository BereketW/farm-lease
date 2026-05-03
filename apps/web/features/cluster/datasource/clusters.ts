import { apiFetch } from "@/lib/api/client";
import { MOCK_CLUSTERS } from "./mock-clusters";
import type { ClusterDetail, ClusterSummary } from "@/lib/api/types";

export async function listClusters(params?: {
  region?: string;
  search?: string;
  cropType?: string;
  minSize?: number;
  maxSize?: number;
}): Promise<ClusterSummary[]> {
  const qs = new URLSearchParams();
  if (params?.region) qs.set("region", params.region);
  if (params?.search) qs.set("search", params.search);
  if (params?.cropType) qs.set("cropType", params.cropType);
  if (typeof params?.minSize === "number") qs.set("minSize", String(params.minSize));
  if (typeof params?.maxSize === "number") qs.set("maxSize", String(params.maxSize));
  const query = qs.toString();
  try {
    const data = await apiFetch<{ clusters: ClusterSummary[] }>(
      `/api/clusters${query ? `?${query}` : ""}`
    );
    if (!data.clusters?.length) return MOCK_CLUSTERS;
    return data.clusters;
  } catch {
    return MOCK_CLUSTERS;
  }
}

export function getCluster(id: string): Promise<{ cluster: ClusterDetail }> {
  return apiFetch(`/api/clusters/${id}`);
}

export type AvailableFarmer = {
  id: string;
  name: string | null;
  email: string;
};

export function listAvailableFarmers(
  search?: string
): Promise<{ farmers: AvailableFarmer[] }> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/api/clusters/farmers/available${qs}`);
}

export type ClusterRegistrationPayload = {
  name: string;
  description?: string;
  location: string;
  region: string;
  totalArea: number;
  cropTypes: string[];
  geodata: string;
  coordinates: string;
  farmers: { userId: string; landShare: number }[];
  documents: File[];
};

export async function registerCluster(payload: ClusterRegistrationPayload) {
  const fd = new FormData();
  fd.append("name", payload.name);
  if (payload.description) fd.append("description", payload.description);
  fd.append("location", payload.location);
  fd.append("region", payload.region);
  fd.append("totalArea", String(payload.totalArea));
  fd.append("cropTypes", JSON.stringify(payload.cropTypes));
  fd.append("geodata", payload.geodata);
  fd.append("coordinates", payload.coordinates);
  fd.append("farmers", JSON.stringify(payload.farmers));
  payload.documents.forEach((f) => fd.append("documents", f));

  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/clusters`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to register cluster");
  }
  return res.json() as Promise<{ cluster: ClusterDetail }>;
}
