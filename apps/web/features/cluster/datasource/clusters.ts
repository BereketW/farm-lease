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
